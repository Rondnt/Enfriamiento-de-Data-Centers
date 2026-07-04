/**
 * sensitivity.js
 * Muestra una curva de enfriamiento por cada servidor registrado con k conocida.
 */

import { buildTimeArray, solveAnalytical } from './solver.js';

const COLORS = [
  '#2ac4eb', // ice-blue
  '#f07040', // naranja
  '#35c99a', // teal
  '#e8c040', // amarillo
  '#a78bfa', // violeta
  '#f472b6', // rosa
  '#e84444', // rojo
  '#60d4a0', // menta
];

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 200 },
    plugins: {
      legend: { labels: { color: '#7a8498', font: { size: 11 } } },
      tooltip: {
        callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} °C` },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Tiempo (min)', color: '#7a8498' },
        ticks: { color: '#7a8498', maxTicksLimit: 12 },
        grid: { color: '#252c3c' },
      },
      y: {
        title: { display: true, text: 'Temperatura (°C)', color: '#7a8498' },
        ticks: { color: '#7a8498' },
        grid: { color: '#252c3c' },
      },
    },
  };
}

export function initSensitivityChart(canvasId) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: chartOptions(),
  });
}

export function updateSensitivityChart(chart, servers, tmax, h) {
  const withK = (servers ?? []).filter(s => s.k_value != null);

  if (!withK.length) {
    chart.data.labels   = [];
    chart.data.datasets = [];
    chart.update();
    return;
  }

  const times = buildTimeArray({ tmax, h });

  chart.data.labels   = times.map(t => t.toFixed(1));
  chart.data.datasets = withK.map((server, i) => {
    const T0    = parseFloat(server.max_temp_c);
    const Tamb  = parseFloat(server.tamb_default);
    const k     = parseFloat(server.k_value);
    const temps = solveAnalytical({ T0, Tamb, k, times });
    const color = COLORS[i % COLORS.length];

    return {
      label:       `${server.name}  k=${k.toFixed(3)}`,
      data:        temps,
      borderColor: color,
      borderWidth: 1.8,
      pointRadius: 0,
      tension:     0.3,
    };
  });

  chart.update();
}
