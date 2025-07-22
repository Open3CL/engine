let detailedReportData;
let detailedReportChart;

/**
 * @param dataReport {object}
 */
function updateDetailedChart(dataReport) {
  detailedReportChart.data.labels = [];
  detailedReportChart.data.datasets[0].labels = [];
  detailedReportChart.update();

  const labels = Object.keys(dataReport.checks);
  const dataset = Object.values(dataReport.checks).flatMap((check) => {
    return Math.round((Number(check.nbBelowThreshold) / dataReport.nbValidDpe) * 100);
  });

  detailedReportChart.data.labels = labels;
  detailedReportChart.data.datasets[0].data = dataset;
  detailedReportChart.update();
}

function loadDetailReportData(corpus) {
  const reportFile = `${corpus}/corpus_global_report_main.json`;
  $.get(reportFile, (data) => {
    if (!detailedReportData) {
      detailedReportData = data;

      const labels = Object.keys(data.checks);
      const dataset = Object.values(data.checks).flatMap((check) => {
        return Math.round((Number(check.nbBelowThreshold) / data.nbValidDpe) * 100);
      });

      detailedReportChart = new Chart(document.getElementById('detailedChart'), {
        type: 'polarArea',
        data: {
          labels,
          datasets: [
            {
              data: dataset
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              title: {
                display: true,
                text: 'Valeurs du DPE testés'
              },
              position: 'bottom'
            },
            title: {
              display: true,
              text: `Résultats détaillés sur ${data.nbValidDpe} DPE analysés`
            }
          }
        }
      });
    } else {
      updateDetailedChart(data);
    }
  });
}
