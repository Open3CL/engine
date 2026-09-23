# @flowbite-svelte-plugins/chart

[Documentation](https://flowbite-svelte.com/docs/plugins/charts)

Use the chart and graph components from flowbite-svelte built with Tailwind CSS and ApexCharts to choose from line, area, bar, column, pie, and radial charts

## Installation

```bash
pnpm i -D @flowbite-svelte-plugins/chart
```

Update `app.css`:

```css
@source "../node_modules/@flowbite-svelte-plugins/chart/dist";
```

## Example

### Area chart

```svelte
<script lang="ts">
  import type { ApexOptions } from 'apexcharts';
  import { Chart } from '@flowbite-svelte-plugins/chart';
  import { Card, A, Button, Dropdown, DropdownItem } from 'flowbite-svelte';
  import { ChevronRightOutline, ChevronDownOutline } from 'flowbite-svelte-icons';

  let options: ApexOptions = {
    chart: {
      height: '400px',
      type: 'area',
      fontFamily: 'Inter, sans-serif',
      dropShadow: {
        enabled: false
      },
      toolbar: {
        show: false
      }
    },
    tooltip: {
      enabled: true,
      x: {
        show: false
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
        shade: '#1C64F2',
        gradientToColors: ['#1C64F2']
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 6
    },
    grid: {
      show: false,
      strokeDashArray: 4,
      padding: {
        left: 2,
        right: 2,
        top: 0
      }
    },
    series: [
      {
        name: 'New users',
        data: [6500, 6418, 6456, 6526, 6356, 6456],
        color: '#1A56DB'
      }
    ],
    xaxis: {
      categories: ['01 February', '02 February', '03 February', '04 February', '05 February', '06 February', '07 February'],
      labels: {
        show: false
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      show: false
    }
  };
</script>

<Card class="p-4 md:p-6">
  <div class="flex justify-between">
    <div>
      <h5 class="pb-2 text-3xl leading-none font-bold text-gray-900 dark:text-white">32.4k</h5>
      <p class="text-base font-normal text-gray-500 dark:text-gray-400">Users this week</p>
    </div>
    <div class="flex items-center px-2.5 py-0.5 text-center text-base font-semibold text-green-500 dark:text-green-500">
      12%
      <ChevronRightOutline class="ms-1 h-6 w-6" />
    </div>
  </div>
  <Chart {options} />
  <div class="grid grid-cols-1 items-center justify-between border-t border-gray-200 dark:border-gray-700">
    <div class="flex items-center justify-between pt-5">
      <Button
        class="inline-flex items-center bg-transparent py-0 text-center text-sm font-medium text-gray-500 hover:bg-transparent hover:text-gray-900 focus:ring-transparent dark:bg-transparent dark:text-gray-400 dark:hover:bg-transparent dark:hover:text-white dark:focus:ring-transparent"
        >Last 7 days<ChevronDownOutline class="m-2.5 ms-1.5 w-2.5" /></Button
      >
      <Dropdown simple class="w-40" offset={-6}>
        <DropdownItem>Yesterday</DropdownItem>
        <DropdownItem>Today</DropdownItem>
        <DropdownItem>Last 7 days</DropdownItem>
        <DropdownItem>Last 30 days</DropdownItem>
        <DropdownItem>Last 90 days</DropdownItem>
      </Dropdown>
      <A
        href="/"
        class="hover:text-primary-700 dark:hover:text-primary-500 rounded-lg px-3 py-2 text-sm font-semibold uppercase hover:bg-gray-100 hover:no-underline dark:border-gray-700 dark:hover:bg-gray-700 dark:focus:ring-gray-700"
      >
        Users Report
        <ChevronRightOutline class="ms-1.5 h-2.5 w-2.5" />
      </A>
    </div>
  </div>
</Card>
```
