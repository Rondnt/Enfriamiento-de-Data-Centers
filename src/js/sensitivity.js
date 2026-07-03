/**
 * sensitivity.js
 * Análisis de sensibilidad: familia de curvas T(t) para distintos valores de k.
 * Permite comparar visualmente el efecto del tipo de sistema de enfriamiento.
 */

import { buildSensitivityCurves } from './solver.js';

const K_PROFILES = [
  { k: 0.03, label: 'k=0.03 — Fallo CRAC',          color: '#e84444' },
  { k: 0.06, label: 'k=0.06 — Aire deficiente',       color: '#f99040' },
  { k: 0.08, label: 'k=0.08 — Aire estándar',         color: '#e8c040' },
  { k: 0.15, label: 'k=0.15 — Aire mejorado',         color: '#2ac4eb' },
  { k: 0.25, label: 'k=0.25 — Enfriamiento híbrido',  color: '#a78bfa' },
  { k: 0.35, label: 'k=0.35 — Enfriamiento líquido',  color: '#35c99a' },
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

export function updateSensitivityChart(chart, params) {
  const curves = buildSensitivityCurves(params, K_PROFILES);
  chart.data.labels   = curves[0].times.map(t => t.toFixed(1));
  chart.data.datasets = buildDatasets(curves);
  chart.update();
}
