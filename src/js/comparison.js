/**
 * comparison.js
 * Gráfico de barras: T(t=15 min) por servidor.
 */

const T_CRIT = 85;
const T_WARN = 70;

function barColor(t15) {
  if (t15 > T_CRIT) return 'oklch(0.62 0.22 15 / 0.85)';
  if (t15 > T_WARN) return 'oklch(0.80 0.16 80 / 0.85)';
  return 'oklch(0.72 0.20 218 / 0.85)';
}

function borderColor(t15) {
  if (t15 > T_CRIT) return 'oklch(0.62 0.22 15)';
  if (t15 > T_WARN) return 'oklch(0.80 0.16 80)';
  return 'oklch(0.72 0.20 218)';
}

export function initComparisonChart(canvasId) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  return new Chart(ctx, {
    type: 'bar',
    data: { labels: [], datasets: [] },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 250 },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` T(15 min) = ${ctx.parsed.y.toFixed(2)} °C`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#7a8498', font: { size: 11 } },
          grid:  { color: '#252c3c' },
        },
        y: {
          title:   { display: true, text: 'Temperatura (°C)', color: '#7a8498' },
          ticks:   { color: '#7a8498' },
          grid:    { color: '#252c3c' },
          suggestedMin: 0,
        },
      },
    },
  });
}

export function updateComparisonChart(chart, servers) {
  const withK = (servers ?? []).filter(s => s.k_value != null);

  if (!withK.length) {
    chart.data.labels   = [];
    chart.data.datasets = [];
    chart.update();
    return;
  }

  const values = withK.map(s => {
    const T0   = parseFloat(s.max_temp_c);
    const Tamb = parseFloat(s.tamb_default);
    const k    = parseFloat(s.k_value);
    return +(Tamb + (T0 - Tamb) * Math.exp(-k * 15)).toFixed(2);
  });

  chart.data.labels   = withK.map(s => s.name);
  chart.data.datasets = [{
    label:           'T(15 min)',
    data:            values,
    backgroundColor: values.map(barColor),
    borderColor:     values.map(borderColor),
    borderWidth:     1.5,
    borderRadius:    4,
  }];

  chart.update();
}
