/**
 * main.js
 * Punto de entrada. Orquesta servidores, solver, charts y análisis.
 */

import {
  buildTimeArray, solveAnalytical,
  halfLifeTime, timeConstant,
} from './solver.js';

import { initMainChart, updateMainChart } from './charts.js';
import {
  readParams, syncSliderLabels,
  updateMetrics, updateTable, bindControls, exportCSV,
} from './ui.js';
import { THRESHOLDS } from './scenarios.js';
import { initSensitivityChart, updateSensitivityChart } from './sensitivity.js';
import { initPhaseChart, updatePhaseChart } from './phase.js';
import { api } from './api.js';
import { renderServerList, renderSelectedServer, renderReadings } from './servers.js';

// Resolución interna para la gráfica (no expuesto al usuario)
const RESOLUTION_H = 0.5;

// ── Gráficas ───────────────────────────────────────────────────────────────

const mainChart        = initMainChart('mainChart');
const sensitivityChart = initSensitivityChart('sensitivityChart');
const phaseChart       = initPhaseChart('phaseChart');

// ── Estado ─────────────────────────────────────────────────────────────────

let activeServerId = null;

// ── Simulación ─────────────────────────────────────────────────────────────

function run() {
  const params = readParams();
  syncSliderLabels(params);

  const times      = buildTimeArray({ tmax: params.tmax, h: RESOLUTION_H });
  const analytical = solveAnalytical({ ...params, times });

  updateMainChart(mainChart, times, analytical, THRESHOLDS);
  updateMetrics({ analytical, times, halfLife: halfLifeTime(params.k), tau: timeConstant(params.k) });
  updateTable({ times, analytical });

  updateSensitivityChart(sensitivityChart, { ...params, h: RESOLUTION_H });
  updatePhaseChart(phaseChart, { ...params, qdot: 0 });

  window._lastResults = { times, analytical };
}

// ── Calculadora de k (desde parámetros manuales) ──────────────────────────

document.getElementById('btnCalcK').addEventListener('click', () => {
  const params  = readParams();
  const t1      = parseFloat(document.getElementById('kCalcT1').value);
  const Tt1     = parseFloat(document.getElementById('kCalcTt1').value);
  const result  = document.getElementById('kCalcResult');

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

  const k = -Math.log(ratio) / t1;

  const kSlider = document.getElementById('k');
  const kInput  = document.getElementById('kval');
  kSlider.value = k;
  kInput.value  = k.toFixed(3);
  kSlider.dispatchEvent(new Event('input'));

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

  const k = -Math.log(ratio) / t1;

  // Aplica k a la simulación
  const kSlider = document.getElementById('k');
  const kInput  = document.getElementById('kval');
  kSlider.value = k;
  kInput.value  = k.toFixed(3);
  kSlider.dispatchEvent(new Event('input'));

  // Guarda k en el servidor
  if (activeServerId) {
    try {
      await api.servers.updateK(activeServerId, k);
      await refreshServers();
    } catch { /* silencioso si falla el guardado */ }
  }

  result.textContent = `k = ${k.toFixed(4)} min⁻¹ — calculado de T(${t1} min) = ${Tt1.toFixed(1)} °C y guardado`;
  result.classList.add('success');
}

// ── Servidores ─────────────────────────────────────────────────────────────

async function refreshServers() {
  try {
    const servers = await api.servers.list();
    renderServerList('serverList', servers, onServerSelect);
  } catch {
    document.getElementById('serverList').innerHTML =
      '<p class="empty-msg error">No se pudo conectar con el servidor.</p>';
  }
}

function applyServerToControls(server) {
  const T0val   = parseFloat(server.last_temp ?? server.max_temp_c);
  const Tambval = parseFloat(server.tamb_default);

  if (!isNaN(T0val)) {
    const el = document.getElementById('T0');
    el.value = T0val;
    el.dispatchEvent(new Event('input'));
  }
  if (!isNaN(Tambval)) {
    const el = document.getElementById('Tamb');
    el.value = Tambval;
    el.dispatchEvent(new Event('input'));
  }
  // Solo aplica k si el servidor tiene valor definido
  if (server.k_value != null) {
    const k = parseFloat(server.k_value);
    if (!isNaN(k)) {
      const el = document.getElementById('k');
      el.value = k;
      el.dispatchEvent(new Event('input'));
    }
  }
}

async function onServerSelect(server) {
  activeServerId = server.id;
  renderSelectedServer('serverDetail', server);
  applyServerToControls(server);
  refreshReadings();
}

// ── Lecturas de temperatura ────────────────────────────────────────────────

async function refreshReadings() {
  if (!activeServerId) return;
  const readings = await api.readings.list(activeServerId);
  renderReadings('readingsList', readings, activeServerId, onDeleteReading);

  // Delegación de eventos para botones "→ k" en cada lectura
  document.getElementById('readingsList').querySelectorAll('.btn-calc-k').forEach(btn => {
    btn.addEventListener('click', () => {
      const t1  = parseFloat(btn.dataset.t);
      const Tt1 = parseFloat(btn.dataset.temp);
      calcKFromReading(t1, Tt1);
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

// ── Formulario nuevo servidor ──────────────────────────────────────────────

document.getElementById('btnNewServer').addEventListener('click', () => {
  document.getElementById('serverForm').classList.toggle('hidden');
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
  document.getElementById('serverForm').classList.add('hidden');
  refreshServers();
});

// ── Eliminar servidor ──────────────────────────────────────────────────────

document.getElementById('btnDeleteServer').addEventListener('click', async () => {
  if (!activeServerId) return;
  if (!confirm('¿Eliminar este servidor y todas sus lecturas?')) return;
  await api.servers.delete(activeServerId);
  activeServerId = null;
  document.getElementById('serverDetail').classList.add('hidden');
  refreshServers();
});

// ── Otros eventos ──────────────────────────────────────────────────────────

document.getElementById('btnExportCSV').addEventListener('click', () => exportCSV(window._lastResults));

// ── Arranque ───────────────────────────────────────────────────────────────

bindControls(run);
run();
refreshServers();
