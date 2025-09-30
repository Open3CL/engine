const chartsByBranch = {};
const dataByBranch = {};

let branchChartInstance;

function createDatasetAndLabels(data, branch) {
  let labels = Object.keys(data.checks).sort();
  const dataset = [];
  labels = labels.map((label) => {
    const check = data.checks[label];
    const percentage = Math.round((Number(check.nbBelowThreshold) / data.nbValidDpe) * 100);
    if (branch !== 'main') {
      const previousCheck = dataByBranch['main'].checks[label];
      const previousPercentage = Math.round(
        (Number(previousCheck.nbBelowThreshold) / data.nbValidDpe) * 100
      );
      const diffPercentage = percentage - previousPercentage;
      if (diffPercentage !== 0) {
        label = `${label} (${percentage}%) => ${percentage - previousPercentage > 0 ? '+' : ''} ${percentage - previousPercentage}%`;
      } else {
        label = `${label} (${percentage}%)`;
      }
    } else {
      label = `${label} (${percentage}%)`;
    }

    dataset.push(percentage);
    return label;
  });

  return { labels, dataset };
}

/**
 * @param branch {string}
 * @param dataReport {object}
 */
function updateDetailedChart(branch, data) {
  dataByBranch[branch] = data;
  chartsByBranch[branch].data.labels = [];
  chartsByBranch[branch].data.datasets[0].labels = [];
  chartsByBranch[branch].update();

  let legendText = `${data.nbValidDpe}/${data.totalDpesInFile} DPE analysés (${data.nbAllChecksBelowThreshold} sous le seuil de ${data.threshold}, ratio: ${data.successRatio}`;
  if (branch !== 'main') {
    const diffNbAllChecksBelowThreshold =
      data.nbAllChecksBelowThreshold - dataByBranch['main'].nbAllChecksBelowThreshold;
    legendText += `, ${diffNbAllChecksBelowThreshold > 0 ? '+' : ''} ${diffNbAllChecksBelowThreshold} DPE)`;
  } else {
    legendText += ')';
  }

  chartsByBranch[branch].options.plugins.title.text = legendText;

  const { dataset, labels } = createDatasetAndLabels(data, branch);

  chartsByBranch[branch].data.labels = labels;
  chartsByBranch[branch].data.datasets[0].data = dataset;
  chartsByBranch[branch].options.plugins.legend.labels.filter = (item, chart) => {
    if (showOnlyDifferentValues && branch !== 'main') {
      const property = item.text.split(' ').shift();
      const value = data.checks[property].nbBelowThreshold;
      const previousValue = dataByBranch['main'].checks[property].nbBelowThreshold;
      return value !== previousValue;
    }
    return true;
  };
  chartsByBranch[branch].update();
}

function loadDetailReportData(corpus, branch, chartId, showOnlyDifferentValues) {
  return new Promise((resolve, reject) => {
    const reportFile = `${corpus}/corpus_global_report_${branch}.json`;
    $.get(reportFile, (data) => {
      if (!chartsByBranch[branch]) {
        dataByBranch[branch] = data;

        const { dataset, labels } = createDatasetAndLabels(data, branch);

        let legendText = `${data.nbValidDpe}/${data.totalDpesInFile} DPE analysés (${data.nbAllChecksBelowThreshold} sous le seuil de ${data.threshold}, ratio: ${data.successRatio}`;
        if (branch !== 'main') {
          const diffNbAllChecksBelowThreshold =
            data.nbAllChecksBelowThreshold - dataByBranch['main'].nbAllChecksBelowThreshold;
          legendText += `,${diffNbAllChecksBelowThreshold > 0 ? '+' : ''} ${diffNbAllChecksBelowThreshold} DPE)`;
        } else {
          legendText += ')';
        }

        if (branchChartInstance) {
          branchChartInstance.destroy();
          Object.keys(dataByBranch)
            .filter((b) => b !== 'main' && b !== branch)
            .forEach((b) => {
              chartsByBranch[b] = undefined;
            });
        }

        chartsByBranch[branch] = new Chart(document.getElementById(chartId), {
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
                labels: {
                  filter: (item, chart) => {
                    if (showOnlyDifferentValues && branch !== 'main') {
                      const property = item.text.split(' ').shift();
                      const value = data.checks[property].nbBelowThreshold;
                      const previousValue = dataByBranch['main'].checks[property].nbBelowThreshold;
                      return value !== previousValue;
                    }
                    return true;
                  }
                },
                title: {
                  display: true,
                  text: 'Valeurs du DPE testés'
                },
                position: 'left'
              },
              title: {
                display: true,
                text: legendText
              }
            }
          }
        });
        if (branch !== 'main') {
          branchChartInstance = chartsByBranch[branch];
        }
        resolve();
      } else {
        updateDetailedChart(branch, data);
        resolve();
      }
    });
  });
}
