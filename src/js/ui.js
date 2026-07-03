/**
 * ui.js
 * Lectura de controles, actualización de métricas y tabla de resultados.
 */

const CRITICAL_TEMP = 85;
const TABLE_STEP = 5;

// ── Lectura de parámetros ──────────────────────────────────────────────────

export function readParams() {
  return {
    T0: parseFloat(document.getElementById('T0').value),
    Tamb: parseFloat(document.getElementById('Tamb').value),
    k: parseFloat(document.getElementById('k').value),
    tmax: parseFloat(document.getElementById('tmax').value),
    h: parseFloat(document.getElementById('h').value),
  };
}

export function readVisibility() {
  return {
    analytical: document.getElementById('showAnalytical').checked,
    euler: document.getElementById('showEuler').checked,
    rk4: document.getElementById('showRK4').checked,
  };
}

// ── Actualización de labels de sliders ────────────────────────────────────

export function syncSliderLabels(params) {
  document.getElementById('T0val').textContent = params.T0;
  document.getElementById('Tambval').textContent = params.Tamb;
  document.getElementById('kval').textContent = params.k.toFixed(3);
  document.getElementById('tmaxval').textContent = params.tmax;
  document.getElementById('hval').textContent = params.h.toFixed(1);
}

// ── Métricas ───────────────────────────────────────────────────────────────

function setMetric(id, text, warn = false) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.classList.toggle('warn', warn);
}

export function updateMetrics({ analytical, eulerError, rk4Error, times, halfLife, tau }) {
  const tFinal = analytical[analytical.length - 1];
  const maxEulerErr = Math.max(...eulerError);
  const maxRK4Err = Math.max(...rk4Error);
  const criticalIdx = analytical.findIndex(T => T > CRITICAL_TEMP);
  const isCritical = criticalIdx !== -1;

  setMetric('metricTFinal', `${tFinal.toFixed(2)} °C`);
  setMetric('metricHalfLife', `${halfLife.toFixed(2)} min`);
  setMetric('metricTau', `${tau.toFixed(2)} min`);
  setMetric('metricEulerErr', `${maxEulerErr.toFixed(4)} °C`);
  setMetric('metricRK4Err', `${maxRK4Err.toFixed(6)} °C`);
  setMetric(
    'metricCritical',
    isCritical ? `Sí — desde t=${times[criticalIdx].toFixed(1)} min` : 'No',
    isCritical
  );
}

// ── Tabla ──────────────────────────────────────────────────────────────────

function buildTableRow(t, tA, tE, errE, tR, errR) {
  return `
    <tr>
      <td>${t.toFixed(2)}</td>
      <td>${tA.toFixed(4)}</td>
      <td>${tE.toFixed(4)}</td>
      <td class="err-euler">${errE.toFixed(4)}</td>
      <td>${tR.toFixed(4)}</td>
      <td class="err-rk4">${errR.toFixed(6)}</td>
    </tr>`;
}

export function updateTable({ times, analytical, euler, rk4, eulerError, rk4Error }) {
  const body = document.getElementById('tableBody');
  const rows = times
    .filter((_, i) => i % TABLE_STEP === 0)
    .map((t, idx) => {
      const i = idx * TABLE_STEP;
      return buildTableRow(t, analytical[i], euler[i], eulerError[i], rk4[i], rk4Error[i]);
    });
  body.innerHTML = rows.join('');
}

// ── Modelo extendido: generación de calor ─────────────────────────────────

export function readQdot() {
  return parseFloat(document.getElementById('qdot').value);
}

export function syncQdotLabel(qdot) {
  document.getElementById('qdotval').textContent = qdot.toFixed(1);
}

// ── Registro de eventos ────────────────────────────────────────────────────

export function bindControls(onChange) {
  const sliders = ['T0', 'Tamb', 'k', 'tmax', 'h'];
  const checks = ['showAnalytical', 'showEuler', 'showRK4'];

  sliders.forEach(id => document.getElementById(id).addEventListener('input', onChange));
  checks.forEach(id => document.getElementById(id).addEventListener('change', onChange));
}

// ── Historial de simulaciones ─────────────────────────────────────────────

export function readSimName() {
  return document.getElementById('simName').value.trim() || 'Sin nombre';
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });
}

function buildHistoryRow(sim, onLoad, onDelete) {
  return `
    <div class="history-item" data-id="${sim.id}">
      <div class="history-info">
        <span class="history-name">${sim.name}</span>
        <span class="history-meta">T₀=${sim.t0}°C · k=${parseFloat(sim.k).toFixed(3)} · Tamb=${sim.tamb}°C</span>
        <span class="history-date">${formatDate(sim.created_at)}</span>
      </div>
      <div class="history-actions">
        <button class="btn-load" data-id="${sim.id}">Cargar</button>
        <button class="btn-del"  data-id="${sim.id}">✕</button>
      </div>
    </div>`;
}

export function renderHistory(containerId, simulations, onLoad, onDelete) {
  const container = document.getElementById(containerId);
  if (!simulations.length) {
    container.innerHTML = '<p class="empty-msg">No hay simulaciones guardadas.</p>';
    return;
  }
  container.innerHTML = simulations.map(s => buildHistoryRow(s)).join('');
  container.querySelectorAll('.btn-load').forEach(btn =>
    btn.addEventListener('click', () => {
      const sim = simulations.find(s => s.id === parseInt(btn.dataset.id));
      onLoad(sim);
    })
  );
  container.querySelectorAll('.btn-del').forEach(btn =>
    btn.addEventListener('click', () => onDelete(parseInt(btn.dataset.id)))
  );
}

export function applySimulationToControls(sim) {
  const map = { T0: sim.t0, Tamb: sim.tamb, k: sim.k, tmax: sim.tmax, h: sim.h, qdot: sim.qdot };
  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    el.value = val;
    el.dispatchEvent(new Event('input'));
  });
}

// ── Exportar CSV ───────────────────────────────────────────────────────────

export function exportCSV({ times, analytical, euler, rk4, eulerError, rk4Error }) {
  const header = 't_min,T_analitica,T_euler,error_euler,T_rk4,error_rk4\n';
  const rows = times.map((t, i) =>
    `${t.toFixed(4)},${analytical[i].toFixed(6)},${euler[i].toFixed(6)},${eulerError[i].toFixed(6)},${rk4[i].toFixed(6)},${rk4Error[i].toFixed(8)}`
  ).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'resultados_enfriamiento_dc.csv';
  a.click();
  URL.revokeObjectURL(url);
}
