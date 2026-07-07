/**
 * ui.js
 * Lectura de controles, actualización de métricas y tabla de resultados.
 */

const CRITICAL_TEMP = 85;
const TABLE_STEP = 5;

// ── Lectura de parámetros ──────────────────────────────────────────────────

export function readParams() {
  const hRaw = document.getElementById('hval').value.trim();
  const h    = hRaw !== '' ? parseFloat(hRaw) : null;
  return {
    T0:   parseFloat(document.getElementById('T0val').value)   || 80,
    Tamb: parseFloat(document.getElementById('Tambval').value) || 22,
    k:    parseFloat(document.getElementById('kval').value)    || 0.08,
    tmax: parseFloat(document.getElementById('tmaxval').value) || 90,
    // Paso de Euler — opcional. null = no dibujar Euler (no afecta el resultado)
    h:    (h != null && !isNaN(h) && h > 0) ? h : null,
  };
}

// ── Actualización de labels de sliders ────────────────────────────────────

export function syncSliderLabels(params) {
  document.getElementById('T0val').value   = params.T0;
  document.getElementById('Tambval').value = params.Tamb;
  document.getElementById('kval').value    = params.k.toFixed(3);
  document.getElementById('tmaxval').value = params.tmax;
}

// ── Métricas ───────────────────────────────────────────────────────────────

function setMetric(id, text, warn = false) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.classList.toggle('warn', warn);
}

export function updateMetrics({ analytical, times, T15 }) {
  const tFinal      = analytical[analytical.length - 1];
  const criticalIdx = analytical.findIndex(T => T > CRITICAL_TEMP);
  const isCritical  = criticalIdx !== -1;

  setMetric('metricTFinal', `${tFinal.toFixed(2)} °C`);
  setMetric('metricT15',    `${T15.toFixed(2)} °C`, T15 > CRITICAL_TEMP);
  setMetric(
    'metricCritical',
    isCritical ? `Sí — t=${times[criticalIdx].toFixed(1)} min` : 'No',
    isCritical
  );
}

// ── Tabla ──────────────────────────────────────────────────────────────────

export function updateTable({ times, analytical }) {
  const body = document.getElementById('tableBody');
  const rows = times
    .filter((_, i) => i % TABLE_STEP === 0)
    .map((t, idx) => {
      const i = idx * TABLE_STEP;
      return `<tr><td>${t.toFixed(2)}</td><td>${analytical[i].toFixed(4)}</td></tr>`;
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
  [
    { id: 'T0val',    decimals: 0 },
    { id: 'Tambval',  decimals: 0 },
    { id: 'kval',     decimals: 5 },
    { id: 'tmaxval',  decimals: 0 },
  ].forEach(({ id, decimals }) => {
    const input = document.getElementById(id);

    input.addEventListener('input', () => {
      if (!isNaN(parseFloat(input.value))) onChange();
    });

    input.addEventListener('blur', () => {
      const val = parseFloat(input.value);
      if (!isNaN(val) && isFinite(val) && decimals > 0) {
        input.value = val.toFixed(decimals);
      }
    });
  });

  // Paso de Euler (opcional): re-ejecuta también al vaciarlo, para poder
  // quitar la curva de Euler y volver a solo la solución analítica.
  const hInput = document.getElementById('hval');
  if (hInput) hInput.addEventListener('input', () => onChange());
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

export function exportCSV({ times, analytical }) {
  const header = 't_min,T_analitica\n';
  const rows = times.map((t, i) =>
    `${t.toFixed(4)},${analytical[i].toFixed(6)}`
  ).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'resultados_enfriamiento_dc.csv';
  a.click();
  URL.revokeObjectURL(url);
}
