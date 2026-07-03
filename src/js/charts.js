/**
 * charts.js
 * Inicialización y actualización de las dos gráficas: temperatura y error.
 */

const COLORS = {
  analytical: '#4f9cf9',
  euler: '#f97b4f',
  rk4: '#4fc98e',
  eulerError: '#f97b4f',
  rk4Error: '#4fc98e',
};

const BASE_DATASET_CONFIG = {
  pointRadius: 0,
  borderWidth: 2,
  tension: 0.3,
};

function buildThresholdDataset(label, value, color, count) {
  return {
    label,
    data: Array(count).fill(value),
    borderColor: color,
    borderWidth: 1,
    borderDash: [4, 4],
    pointRadius: 0,
    tension: 0,
  };
}

function buildMainDatasets(times, analytical, euler, rk4, visibility, thresholds) {
  const n = times.length;
  return [
    buildThresholdDataset(thresholds.critical.label, thresholds.critical.value, thresholds.critical.color, n),
    buildThresholdDataset(thresholds.warning.label,  thresholds.warning.value,  thresholds.warning.color,  n),
    buildThresholdDataset(thresholds.ashrae.label,   thresholds.ashrae.value,   thresholds.ashrae.color,   n),
    {
      ...BASE_DATASET_CONFIG,
      label: 'Analítica',
      data: analytical,
      borderColor: COLORS.analytical,
      hidden: !visibility.analytical,
      borderWidth: 2.5,
    },
    {
      ...BASE_DATASET_CONFIG,
      label: 'Euler',
      data: euler,
      borderColor: COLORS.euler,
      hidden: !visibility.euler,
      borderDash: [6, 3],
    },
    {
      ...BASE_DATASET_CONFIG,
      label: 'Runge-Kutta 4',
      data: rk4,
      borderColor: COLORS.rk4,
      hidden: !visibility.rk4,
      borderDash: [2, 2],
    },
  ];
}

function buildErrorDatasets(eulerError, rk4Error, visibility) {
  return [
    {
      ...BASE_DATASET_CONFIG,
      label: 'Error Euler',
      data: eulerError,
      borderColor: COLORS.eulerError,
      hidden: !visibility.euler,
    },
    {
      ...BASE_DATASET_CONFIG,
      label: 'Error RK4',
      data: rk4Error,
      borderColor: COLORS.rk4Error,
      hidden: !visibility.rk4,
    },
  ];
}

function chartDefaults(xLabel, yLabel) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 250 },
    plugins: {
      legend: {
        labels: { color: '#8892a4', font: { size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(3)}`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: xLabel, color: '#8892a4' },
        ticks: { color: '#8892a4', maxTicksLimit: 12 },
        grid: { color: '#2e3250' },
      },
      y: {
        title: { display: true, text: yLabel, color: '#8892a4' },
        ticks: { color: '#8892a4' },
        grid: { color: '#2e3250' },
      },
    },
  };
}

export function initMainChart(canvasId) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: chartDefaults('Tiempo (min)', 'Temperatura (°C)'),
  });
}

export function initErrorChart(canvasId) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: chartDefaults('Tiempo (min)', 'Error absoluto (°C)'),
  });
}

export function updateMainChart(chart, times, analytical, euler, rk4, visibility, thresholds) {
  chart.data.labels = times.map(t => t.toFixed(1));
  chart.data.datasets = buildMainDatasets(times, analytical, euler, rk4, visibility, thresholds);
  chart.update();
}

export function updateErrorChart(chart, times, eulerError, rk4Error, visibility) {
  chart.data.labels = times.map(t => t.toFixed(1));
  chart.data.datasets = buildErrorDatasets(eulerError, rk4Error, visibility);
  chart.update();
}
