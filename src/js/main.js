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
  const map = {
    T0:   parseFloat(server.last_temp ?? server.max_temp_c),
    Tamb: parseFloat(server.tamb_default),
    k:    parseFloat(server.k_value),
  };
  Object.entries(map).forEach(([id, val]) => {
    const el = document.getElementById(id);
    el.value = val;
    el.dispatchEvent(new Event('input'));
  });
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
}

async function onDeleteReading(serverId, readingId) {
  await api.readings.delete(serverId, readingId);
  refreshReadings();
}

document.getElementById('btnAddReading').addEventListener('click', async () => {
  if (!activeServerId) return;
  const val = parseFloat(document.getElementById('newReadingTemp').value);
  if (isNaN(val)) return;
  await api.readings.add(activeServerId, val);
  document.getElementById('newReadingTemp').value = '';
  await refreshReadings();
  await refreshServers();
});

// ── Formulario nuevo servidor ──────────────────────────────────────────────

document.getElementById('btnNewServer').addEventListener('click', () => {
  document.getElementById('serverForm').classList.toggle('hidden');
});

document.getElementById('formNewServer').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target;
  await api.servers.create({
    name:          f.srvName.value,
    type:          f.srvType.value,
    cooling_type:  f.srvCooling.value,
    k_value:       parseFloat(f.srvK.value),
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
