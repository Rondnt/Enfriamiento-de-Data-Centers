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
      borderColor: '#4f9cf9',
      borderWidth: 2.5,
      pointRadius: 0,
      tension: 0,
      showLine: true,
    },
    {
      type: 'scatter',
      label: `Equilibrio T* = ${Teq.toFixed(1)} °C`,
      data: [{ x: Teq, y: 0 }],
      borderColor: '#4fc98e',
      backgroundColor: '#4fc98e',
      pointRadius: 9,
      pointStyle: 'circle',
    },
    {
      type: 'scatter',
      label: `Condición inicial T₀ = ${T0} °C`,
      data: [{ x: T0, y: dT0 }],
      borderColor: '#f97b4f',
      backgroundColor: '#f97b4f',
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
      legend: { labels: { color: '#8892a4', font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: ctx => ` T = ${ctx.parsed.x.toFixed(1)} °C   dT/dt = ${ctx.parsed.y.toFixed(3)} °C/min`,
        },
      },
    },
    scales: {
      x: {
        type: 'linear',
        title: { display: true, text: 'Temperatura T (°C)', color: '#8892a4' },
        ticks: { color: '#8892a4' },
        grid: { color: '#2e3250' },
      },
      y: {
        title: { display: true, text: 'dT/dt (°C/min)', color: '#8892a4' },
        ticks: { color: '#8892a4' },
        grid: { color: '#2e3250' },
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
