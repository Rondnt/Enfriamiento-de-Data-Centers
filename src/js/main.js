/**
 * main.js
 * Punto de entrada. Orquesta servidores, solver, charts y análisis.
 */

import { buildTimeArray, solveAnalytical } from './solver.js';

import { initMainChart, updateMainChart } from './charts.js';
import {
  readParams, syncSliderLabels,
  updateMetrics, updateTable, bindControls, exportCSV,
} from './ui.js';
import { THRESHOLDS } from './scenarios.js';
import { initSensitivityChart, updateSensitivityChart } from './sensitivity.js';
import { api } from './api.js';
import { renderServerList, renderSelectedServer, renderReadings } from './servers.js';

const RESOLUTION_H = 0.5;

// ── Gráficas ───────────────────────────────────────────────────────────────

const mainChart        = initMainChart('mainChart');
const sensitivityChart = initSensitivityChart('sensitivityChart');

// ── Estado ─────────────────────────────────────────────────────────────────

let activeServerId = null;
let activeServers  = [];

// ── Simulación ─────────────────────────────────────────────────────────────

function run() {
  const params = readParams();

  const times      = buildTimeArray({ tmax: params.tmax, h: RESOLUTION_H });
  const analytical = solveAnalytical({ ...params, times });

  const T15 = params.Tamb + (params.T0 - params.Tamb) * Math.exp(-params.k * 15);

  updateMainChart(mainChart, times, analytical, THRESHOLDS);
  updateMetrics({ analytical, times, T15 });
  updateTable({ times, analytical });

  updateSensitivityChart(sensitivityChart, activeServers, params.tmax, RESOLUTION_H);
  window._lastResults = { times, analytical };
}

// ── Calculadora de k (desde parámetros manuales) ──────────────────────────

document.getElementById('btnCalcK').addEventListener('click', () => {
  const params = readParams();
  const t1     = parseFloat(document.getElementById('kCalcT1').value);
  const Tt1    = parseFloat(document.getElementById('kCalcTt1').value);
  const result = document.getElementById('kCalcResult');

  result.classList.remove('hidden', 'success', 'error');

  if (isNaN(t1) || t1 <= 0 || isNaN(Tt1)) {
    result.textContent = 'Ingresa valores válidos para t₁ y T(t₁).';
    result.classList.add('error');
    return;
  }

  const { T0, Tamb } = params;

  if (Math.abs(T0 - Tamb) < 0.01) {
    result.textContent = 'T₀ y T_amb son iguales — no hay enfriamiento.';
    result.classList.add('error');
    return;
  }

  const ratio = (Tt1 - Tamb) / (T0 - Tamb);
  if (ratio <= 0 || ratio >= 1) {
    result.textContent = 'T(t₁) debe estar estrictamente entre T_amb y T₀.';
    result.classList.add('error');
    return;
  }

  const k      = -Math.log(ratio) / t1;
  const kInput = document.getElementById('kval');
  kInput.value = k.toFixed(5);
  kInput.dispatchEvent(new Event('input'));

  result.textContent = `k = ${k.toFixed(4)} min⁻¹ — aplicado a la simulación`;
  result.classList.add('success');
});

// ── Calculadora de k desde lecturas del servidor ───────────────────────────

async function calcKFromReading(t1, Tt1) {
  const params  = readParams();
  const { T0, Tamb } = params;
  const result  = document.getElementById('kFromReadingResult');

  result.classList.remove('hidden', 'success', 'error');

  if (Math.abs(T0 - Tamb) < 0.01) {
    result.textContent = 'T₀ y T_amb son iguales — ajusta los parámetros primero.';
    result.classList.add('error');
    return;
  }

  const ratio = (Tt1 - Tamb) / (T0 - Tamb);
  if (ratio <= 0 || ratio >= 1) {
    result.textContent = `T(t₁) = ${Tt1} °C debe estar entre T_amb (${Tamb} °C) y T₀ (${T0} °C).`;
    result.classList.add('error');
    return;
  }

  const k      = -Math.log(ratio) / t1;
  const kInput = document.getElementById('kval');
  kInput.value = k.toFixed(5);
  kInput.dispatchEvent(new Event('input'));

  if (activeServerId) {
    try {
      await api.servers.updateK(activeServerId, k);
      await refreshServers();
    } catch { /* silencioso */ }
  }

  result.textContent = `k = ${k.toFixed(4)} min⁻¹ — calculado de T(${t1} min) = ${Tt1.toFixed(1)} °C y guardado`;
  result.classList.add('success');
}

// ── Servidores ─────────────────────────────────────────────────────────────

async function refreshServers() {
  try {
    const servers = await api.servers.list();
    activeServers = servers;
    renderServerList('serverList', servers, onServerSelect);
    const params = readParams();
    updateSensitivityChart(sensitivityChart, activeServers, params.tmax, RESOLUTION_H);
  } catch {
    document.getElementById('serverList').innerHTML =
      '<p class="empty-msg error">No se pudo conectar.</p>';
  }
}

function applyServerToControls(server) {
  const T0val   = parseFloat(server.max_temp_c);
  const Tambval = parseFloat(server.tamb_default);

  if (!isNaN(T0val)) {
    const el = document.getElementById('T0val');
    el.value = T0val;
    el.dispatchEvent(new Event('input'));
  }
  if (!isNaN(Tambval)) {
    const el = document.getElementById('Tambval');
    el.value = Tambval;
    el.dispatchEvent(new Event('input'));
  }
  if (server.k_value != null) {
    const k = parseFloat(server.k_value);
    if (!isNaN(k)) {
      const el = document.getElementById('kval');
      el.value = k.toFixed(5);
      el.dispatchEvent(new Event('input'));
    }
  }
}

async function onServerSelect(server) {
  activeServerId = server.id;
  renderSelectedServer('serverDetailPanel', server);
  applyServerToControls(server);
  refreshReadings();
}

// ── Lecturas de temperatura ────────────────────────────────────────────────

async function refreshReadings() {
  if (!activeServerId) return;
  const readings = await api.readings.list(activeServerId);
  renderReadings('readingsList', readings, activeServerId, onDeleteReading);

  document.getElementById('readingsList').querySelectorAll('.btn-calc-k').forEach(btn => {
    btn.addEventListener('click', () => {
      calcKFromReading(parseFloat(btn.dataset.t), parseFloat(btn.dataset.temp));
    });
  });
}

async function onDeleteReading(serverId, readingId) {
  await api.readings.delete(serverId, readingId);
  refreshReadings();
}

document.getElementById('btnAddReading').addEventListener('click', async () => {
  if (!activeServerId) return;
  const temp = parseFloat(document.getElementById('newReadingTemp').value);
  const tMin = parseFloat(document.getElementById('newReadingT').value);
  if (isNaN(temp)) return;
  await api.readings.add(activeServerId, temp, isNaN(tMin) ? null : tMin);
  document.getElementById('newReadingTemp').value = '';
  document.getElementById('newReadingT').value    = '';
  await refreshReadings();
  await refreshServers();
});

// ── Modal: nuevo servidor ──────────────────────────────────────────────────

const modal = document.getElementById('modalNewServer');

document.getElementById('btnNewServer').addEventListener('click', () => modal.showModal());
document.getElementById('btnCloseModal').addEventListener('click', () => modal.close());
document.getElementById('btnCancelModal').addEventListener('click', () => modal.close());

// Cerrar al hacer clic en el backdrop
modal.addEventListener('click', e => {
  if (e.target === modal) modal.close();
});

document.getElementById('formNewServer').addEventListener('submit', async e => {
  e.preventDefault();
  const f    = e.target;
  const kVal = f.srvK.value.trim();
  await api.servers.create({
    name:          f.srvName.value,
    type:          f.srvType.value,
    cooling_type:  f.srvCooling.value,
    k_value:       kVal !== '' ? parseFloat(kVal) : null,
    max_temp_c:    parseFloat(f.srvMaxTemp.value),
    tamb_default:  parseFloat(f.srvTamb.value),
    rack_location: f.srvRack.value,
    status:        f.srvStatus.value,
  });
  f.reset();
  modal.close();
  refreshServers();
});

// ── Eliminar servidor ──────────────────────────────────────────────────────

document.getElementById('btnDeleteServer').addEventListener('click', async () => {
  if (!activeServerId) return;
  if (!confirm('¿Eliminar este servidor y todas sus lecturas?')) return;
  await api.servers.delete(activeServerId);
  activeServerId = null;
  document.getElementById('serverDetailPanel').classList.add('hidden');
  document.querySelectorAll('.server-chip').forEach(c => c.classList.remove('active'));
  refreshServers();
});

// ── Otros eventos ──────────────────────────────────────────────────────────

document.getElementById('btnExportCSV').addEventListener('click', () => exportCSV(window._lastResults));

// ── Arranque ───────────────────────────────────────────────────────────────

bindControls(run);
run();
refreshServers();
