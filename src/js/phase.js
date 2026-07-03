/**
 * phase.js
 * Diagrama de fase: dT/dt vs T.
 * Muestra el punto de equilibrio y la dirección del sistema.
 */

import { buildPhasePoints, equilibriumTemp } from './solver.js';

function buildDatasets(params) {
  const { T0, Tamb, k, qdot } = params;
  const phasePoints = buildPhasePoints(params);
  const Teq = equilibriumTemp(Tamb, k, qdot);
  const dT0 = +(qdot - k * (T0 - Tamb)).toFixed(4);

  return [
    {
      type: 'line',
      label: 'dT/dt vs T',
      data: phasePoints,
      borderColor: '#2ac4eb',
      borderWidth: 2.5,
      pointRadius: 0,
      tension: 0,
      showLine: true,
    },
    {
      type: 'scatter',
      label: `Equilibrio T* = ${Teq.toFixed(1)} °C`,
      data: [{ x: Teq, y: 0 }],
      borderColor: '#35c99a',
      backgroundColor: '#35c99a',
      pointRadius: 9,
      pointStyle: 'circle',
    },
    {
      type: 'scatter',
      label: `Condición inicial T₀ = ${T0} °C`,
      data: [{ x: T0, y: dT0 }],
      borderColor: '#f99040',
      backgroundColor: '#f99040',
      pointRadius: 9,
      pointStyle: 'triangle',
    },
  ];
}

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 200 },
    plugins: {
      legend: { labels: { color: '#7a8498', font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: ctx => ` T = ${ctx.parsed.x.toFixed(1)} °C   dT/dt = ${ctx.parsed.y.toFixed(3)} °C/min`,
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        title: { display: true, text: 'Temperatura T (°C)', color: '#7a8498' },
        ticks: { color: '#7a8498' },
        grid: { color: '#252c3c' },
      },
      y: {
        title: { display: true, text: 'dT/dt (°C/min)', color: '#7a8498' },
        ticks: { color: '#7a8498' },
        grid: { color: '#252c3c' },
      },
    },
  };
}

export function initPhaseChart(canvasId) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  return new Chart(ctx, {
    type: 'scatter',
    data: { datasets: [] },
    options: chartOptions(),
  });
}

export function updatePhaseChart(chart, params) {
  chart.data.datasets = buildDatasets(params);
  chart.update();
}
