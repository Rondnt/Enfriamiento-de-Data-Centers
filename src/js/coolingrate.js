/**
 * coolingrate.js
 * dT/dt vs Tiempo — velocidad de enfriamiento del servidor seleccionado.
 * dT/dt = -k·(T₀ - Tamb)·e^(-kt)
 */

export function initCoolingRateChart(canvasId) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 200 },
      plugins: {
        legend: { labels: { color: '#7a8498', font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: ctx => ` dT/dt = ${ctx.parsed.y.toFixed(4)} °C/min`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: 'Tiempo (min)', color: '#7a8498' },
          ticks: { color: '#7a8498', maxTicksLimit: 12 },
          grid:  { color: '#252c3c' },
        },
        y: {
          title: { display: true, text: 'dT/dt (°C/min)', color: '#7a8498' },
          ticks: { color: '#7a8498' },
          grid:  { color: '#252c3c' },
        },
      },
    },
  });
}

export function updateCoolingRateChart(chart, { T0, Tamb, k, tmax, h }) {
  const steps  = Math.round(tmax / h);
  const times  = Array.from({ length: steps + 1 }, (_, i) => +(i * h).toFixed(4));
  const rates  = times.map(t => +(-k * (T0 - Tamb) * Math.exp(-k * t)).toFixed(6));

  chart.data.labels   = times.map(t => t.toFixed(1));
  chart.data.datasets = [{
    label:       'dT/dt — Velocidad de enfriamiento',
    data:        rates,
    borderColor: 'oklch(0.73 0.17 30)',
    borderWidth: 1.8,
    pointRadius: 0,
    tension:     0.3,
    fill:        {
      target: 'origin',
      above:  'oklch(0.73 0.17 30 / 0.06)',
      below:  'oklch(0.73 0.17 30 / 0.06)',
    },
  }];

  chart.update();
}
