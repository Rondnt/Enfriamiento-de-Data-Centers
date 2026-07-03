/**
 * sensitivity.js
 * Análisis de sensibilidad: familia de curvas T(t) para distintos valores de k.
 * Permite comparar visualmente el efecto del tipo de sistema de enfriamiento.
 */

import { buildSensitivityCurves } from './solver.js';

const K_PROFILES = [
  { k: 0.03, label: 'k=0.03 — Fallo CRAC',          color: '#ff5f6d' },
  { k: 0.06, label: 'k=0.06 — Aire deficiente',       color: '#f97b4f' },
  { k: 0.08, label: 'k=0.08 — Aire estándar',         color: '#f9c74f' },
  { k: 0.15, label: 'k=0.15 — Aire mejorado',         color: '#4f9cf9' },
  { k: 0.25, label: 'k=0.25 — Enfriamiento híbrido',  color: '#a78bfa' },
  { k: 0.35, label: 'k=0.35 — Enfriamiento líquido',  color: '#4fc98e' },
];

function buildDatasets(curves) {
  return curves.map(c => ({
    label: c.label,
    data: c.temps,
    borderColor: c.color,
    borderWidth: 1.8,
    pointRadius: 0,
    tension: 0.3,
  }));
}

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 200 },
    plugins: {
      legend: { labels: { color: '#8892a4', font: { size: 11 } } },
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

export function initSensitivityChart(canvasId) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: chartOptions(),
  });
}

export function updateSensitivityChart(chart, params) {
  const curves = buildSensitivityCurves(params, K_PROFILES);
  chart.data.labels   = curves[0].times.map(t => t.toFixed(1));
  chart.data.datasets = buildDatasets(curves);
  chart.update();
}
