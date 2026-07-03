/**
 * convergence.js
 * Análisis de convergencia: error global vs paso h para Euler y RK4.
 * Verifica empíricamente el orden de convergencia O(h) y O(h⁴).
 */

import { buildConvergenceData } from './solver.js';

const H_VALUES = [5, 4, 3, 2, 1.5, 1, 0.75, 0.5, 0.25, 0.1];

function buildDatasets(data) {
  return [
    {
      label: 'Error Euler — O(h)',
      data: data.map(d => d.eulerErr),
      borderColor: '#f99040',
      backgroundColor: '#f9904022',
      borderWidth: 2,
      pointRadius: 5,
      tension: 0.2,
    },
    {
      label: 'Error RK4 — O(h⁴)',
      data: data.map(d => d.rk4Err),
      borderColor: '#35c99a',
      backgroundColor: '#35c99a22',
      borderWidth: 2,
      pointRadius: 5,
      tension: 0.2,
    },
  ];
}

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 200 },
    plugins: {
      legend: { labels: { color: '#7a8498', font: { size: 12 } } },
      tooltip: {
        callbacks: {
          label: ctx => ` h=${H_VALUES[ctx.dataIndex]} min → Error: ${ctx.parsed.y.toExponential(3)} °C`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Paso de integración h (min)', color: '#7a8498' },
        ticks: { color: '#7a8498', callback: (_, i) => `h=${H_VALUES[i]}` },
        grid: { color: '#252c3c' },
      },
      y: {
        type: 'logarithmic',
        title: { display: true, text: 'Error absoluto en t_max (°C) — escala log', color: '#7a8498' },
        ticks: { color: '#7a8498' },
        grid: { color: '#252c3c' },
      },
    },
  };
}

export function initConvergenceChart(canvasId) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: { labels: H_VALUES.map(h => `h=${h}`), datasets: [] },
    options: chartOptions(),
  });
}

export function updateConvergenceChart(chart, params) {
  const data = buildConvergenceData(params, H_VALUES);
  chart.data.datasets = buildDatasets(data);
  chart.update();
}
