/**
 * charts.js
 * Inicialización y actualización de las dos gráficas: temperatura y error.
 */

const COLORS = {
  analytical: '#2ac4eb',
  euler:      '#f99040',
  rk4:        '#35c99a',
  eulerError: '#f99040',
  rk4Error:   '#35c99a',
};

const BASE_DATASET_CONFIG = {
  pointRadius: 0,
  borderWidth: 2,
  tension: 0.3,
};

function buildThresholdDataset(label, value, color, tmax) {
  return {
    label,
    data: [{ x: 0, y: value }, { x: tmax, y: value }],
    borderColor: color,
    borderWidth: 1,
    borderDash: [4, 4],
    pointRadius: 0,
    tension: 0,
  };
}

function buildMainDatasets(times, analytical, thresholds, euler, eulerTimes) {
  const tmax = times.length ? times[times.length - 1] : 0;
  const datasets = [
    buildThresholdDataset(thresholds.critical.label, thresholds.critical.value, thresholds.critical.color, tmax),
    buildThresholdDataset(thresholds.warning.label,  thresholds.warning.value,  thresholds.warning.color,  tmax),
    buildThresholdDataset(thresholds.ashrae.label,   thresholds.ashrae.value,   thresholds.ashrae.color,   tmax),
    {
      ...BASE_DATASET_CONFIG,
      label: 'T(t) — Solución analítica',
      data: times.map((t, i) => ({ x: t, y: analytical[i] })),
      borderColor: COLORS.analytical,
      borderWidth: 2.5,
    },
  ];

  // Curva de Euler (opcional): solo si se proporcionó un paso h válido
  if (euler && eulerTimes) {
    datasets.push({
      ...BASE_DATASET_CONFIG,
      label: `Euler — paso h=${(eulerTimes[1] - eulerTimes[0] || 0).toFixed(2)} min`,
      data: eulerTimes.map((t, i) => ({ x: t, y: euler[i] })),
      borderColor: COLORS.euler,
      borderWidth: 2,
      borderDash: [6, 3],
      pointRadius: 2.5,
      tension: 0,
    });
  }

  return datasets;
}

function chartDefaults(xLabel, yLabel) {
  const muted = '#7a8498';
  const grid  = '#252c3c';
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 200 },
    plugins: {
      legend: {
        labels: { color: muted, font: { size: 11, family: 'ui-monospace, Consolas, monospace' } },
      },
      tooltip: {
        backgroundColor: '#161a24',
        borderColor: '#252c3c',
        borderWidth: 1,
        titleColor: '#c8d0dc',
        bodyColor: muted,
        padding: 10,
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(3)}`,
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        title: { display: true, text: xLabel, color: muted, font: { size: 11 } },
        ticks: {
          color: muted, maxTicksLimit: 12, font: { size: 11 },
          callback: v => Number(v).toFixed(1),
        },
        grid: { color: grid },
        border: { color: grid },
      },
      y: {
        title: { display: true, text: yLabel, color: muted, font: { size: 11 } },
        ticks: { color: muted, font: { size: 11 } },
        grid: { color: grid },
        border: { color: grid },
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

export function updateMainChart(chart, times, analytical, thresholds, euler = null, eulerTimes = null) {
  chart.data.datasets = buildMainDatasets(times, analytical, thresholds, euler, eulerTimes);
  chart.update();
}
