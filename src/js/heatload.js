/**
 * heatload.js
 * Gráfica del modelo extendido con generación de calor (ODE no homogénea).
 */

import { solveAnalytical, solveAnalyticalWithLoad, equilibriumTemp, buildTimeArray } from './solver.js';

const COLORS = {
  cooling:   '#4f9cf9',
  heatload:  '#f97b4f',
  teq:       '#4fc98e',
};

function buildDatasets(times, tempsCooling, tempsLoad, Teq) {
  const n = times.length;
  return [
    {
      label: 'Solo enfriamiento (sin carga)',
      data: tempsCooling,
      borderColor: COLORS.cooling,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.3,
    },
    {
      label: 'Con generación de calor Q',
      data: tempsLoad,
      borderColor: COLORS.heatload,
      borderWidth: 2,
      pointRadius: 0,
      tension: 0.3,
      borderDash: [5, 3],
    },
    {
      label: `Temperatura de equilibrio T* = ${Teq.toFixed(1)} °C`,
      data: Array(n).fill(Teq),
      borderColor: COLORS.teq,
      borderWidth: 1,
      pointRadius: 0,
      tension: 0,
      borderDash: [4, 4],
    },
  ];
}

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 200 },
    plugins: {
      legend: { labels: { color: '#8892a4', font: { size: 12 } } },
      tooltip: {
        callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} °C` },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Tiempo (min)', color: '#8892a4' },
        ticks: { color: '#8892a4', maxTicksLimit: 12 },
        grid: { color: '#2e3250' },
      },
      y: {
        title: { display: true, text: 'Temperatura (°C)', color: '#8892a4' },
        ticks: { color: '#8892a4' },
        grid: { color: '#2e3250' },
      },
    },
  };
}

export function initHeatLoadChart(canvasId) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: chartOptions(),
  });
}

export function updateHeatLoadChart(chart, params) {
  const { T0, Tamb, k, qdot, tmax, h } = params;
  const times = buildTimeArray({ tmax, h });
  const tempsCooling = solveAnalytical({ T0, Tamb, k, times });
  const tempsLoad    = solveAnalyticalWithLoad({ T0, Tamb, k, qdot, times });
  const Teq          = equilibriumTemp(Tamb, k, qdot);

  chart.data.labels   = times.map(t => t.toFixed(1));
  chart.data.datasets = buildDatasets(times, tempsCooling, tempsLoad, Teq);
  chart.update();
}
