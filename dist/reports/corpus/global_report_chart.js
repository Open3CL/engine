let globalReportData;
let globalReportChart;

function getLabels(data) {
  const nbFailed = data.total - data.nbAllChecksBelowThreshold;
  const validPercentage = Math.round(Number((data.nbAllChecksBelowThreshold / data.total) * 100));
  const invalidPercentage = Math.round(Number((nbFailed / data.total) * 100));
  const excludedPercentage = Math.round(Number((data.nbExcludedDpe / data.total) * 100));
  return [
    `Validés ${validPercentage}%`,
    `En erreur ${invalidPercentage}%`,
    `Exclus ${excludedPercentage}%`
  ];
}

function getDataset(data) {
  const nbFailed = data.total - data.nbAllChecksBelowThreshold;
  const labels = getLabels(data);
  return [
    { label: labels[0], value: data.nbAllChecksBelowThreshold },
    { label: labels[1], value: nbFailed }
  ];
}

/**
 * @param dataReport {object}
 */
function updateChart(dataReport) {
  /** @type {{label: string, value: number}[]}} **/
  const data = getDataset(dataReport);
  globalReportChart.data.labels = [];
  globalReportChart.data.datasets.forEach((dataset) => {
    dataset.data = [];
  });
  globalReportChart.update();

  data.forEach((d) => {
    globalReportChart.data.labels.push(d.label);
    globalReportChart.data.datasets.forEach((dataset) => {
      dataset.data.push(d.value);
    });
  });
  globalReportChart.update();
}

function loadGlobalReportData() {
  const reportFile = `corpus_global_report${showStatsCompat ? '_compatibility' : ''}_threshold_${threshold}.json`;
  $.get(reportFile, (data) => {
    if (!globalReportData) {
      const nbFailed = data.total - data.nbAllChecksBelowThreshold;
      globalReportData = data;
      globalReportChart = new Chart(document.getElementById('globalChart'), {
        type: 'pie',
        data: {
          labels: getLabels(data),
          datasets: [
            {
              data: [data.nbAllChecksBelowThreshold, nbFailed, data.nbExcludedDpe],
              backgroundColor: ['green', 'red', 'orange']
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' },
            title: { display: true, text: `Résultat global sur ${data.nbDpe} analysés` }
          }
        }
      });
    } else {
      updateChart(data);
    }
  });
}
