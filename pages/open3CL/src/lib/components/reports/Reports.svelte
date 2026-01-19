<script lang="ts">
    import { Chart } from "@flowbite-svelte-plugins/chart";
    import { Select, Label } from "flowbite-svelte";
    import { onMount } from 'svelte';

    /** @type {Partial<import('apexcharts').ApexOptions>} **/
    let options;

    let selected = CORPUS_LIST.files[0];
    let reports = CORPUS_LIST.files.map(name => ({name, value: name}));

    /**
     * @param reportData {object}
     * @param propertyName {string}
     * @return {boolean}
     */
    const isMandatoryProperty = (reportData, propertyName) => {
        return reportData.checks[propertyName].mandatory;
    }

    const selectReport = () => {
        const folder = selected.replace('.csv', '');
        const reportData = CORPUS_REPORTS_MAP[folder];
        options = undefined;
        renderChart(reportData);
    }

    const renderChart = (reportData) => {
        const checks = Object.keys(reportData.checks);
        const series = [];
        checks.forEach((checkName) => {
            const check = reportData.checks[checkName];
            const percentage = Math.round((Number(check.nbBelowThreshold) / reportData.nbValidDpe) * 100);
            series.push(percentage);
        });

        /** @type {Partial<import('apexcharts').ApexOptions>} **/
        options = {
            theme: {
                palette: 'palette4'
            },
            series,
            chart: {
                type: "polarArea",
                animations: {
                    enabled: true
                },
                toolbar: {
                    show: false
                }
            },
            tooltip: {
                shared: true,
                custom: ({series, seriesIndex, dataPointIndex, w}) => {
                    return `<span class="p-2">${w.config.labels[seriesIndex]}: ${w.globals.series[seriesIndex]} %</span>`;
                }
            },
            states: {
                hover: {
                    filter: {
                        type: "darken"
                    }
                }
            },
            labels: checks,
            dataLabels: {
                enabled: true,
                formatter: function (val, opts) {
                    return `${opts.w.globals.series[opts.seriesIndex]} %`
                }
            },
            legend: {
                show: true,
                formatter: (seriesName, opts) => {
                    const legend = `${seriesName} (${opts.w.globals.series[opts.seriesIndex]}%)`;
                    if (isMandatoryProperty(reportData, seriesName)) {
                        return `<b>${legend}</b>`;
                    }
                    return legend
                }
            },
            xaxis: {
                floating: true,
                labels: {
                    show: true
                }
            },
            yaxis: {
                show: false
            },
            fill: {
                opacity: 1
            },
            title: {
                text: 'Rapport d\'analyse corpus: ' + selected,
                align: 'center'
            }
        };
    }

    onMount(() => {
        renderChart(CORPUS_REPORTS_MAP['corpus_dpe']);
    })


</script>

<div>
    <Label>
        Rapport à analyser
        <Select class="mt-2" items={reports}
                onchange={selectReport}
                bind:value={selected} placeholder="Sélectionner un rapport" />
    </Label>
</div>

<div class="w-1/2">
    {#if options}
        <Chart {options} class="py-6" />
    {/if}
</div>
