/**
 * servers.js
 * Renderizado de chips de servidores, panel de detalle y lecturas.
 */

const STATUS_LABELS = { active: 'Activo', shutdown: 'Apagado', maintenance: 'Mantenimiento' };
const STATUS_CLASS  = { active: 'tag-green', shutdown: 'tag-gray', maintenance: 'tag-orange' };
const TYPE_ICONS    = { web: '🌐', database: '🗄️', gpu: '⚡', hpc: '🖥️', storage: '💾', general: '🔲' };

// ── Chips de servidores (franja horizontal) ───────────────────────────────

function buildServerChip(server) {
  const icon      = TYPE_ICONS[server.type] ?? '🔲';
  const statusCls = STATUS_CLASS[server.status] ?? 'tag-gray';
  const statusLbl = STATUS_LABELS[server.status] ?? server.status;
  const kDisplay  = server.k_value != null
    ? `k = ${parseFloat(server.k_value).toFixed(3)}`
    : 'k = —';
  const tempPart  = server.last_temp != null
    ? ` · ${parseFloat(server.last_temp).toFixed(1)} °C`
    : '';

  return `
    <div class="server-chip" data-id="${server.id}">
      <span class="chip-icon">${icon}</span>
      <div class="chip-info">
        <span class="chip-name">${server.name}</span>
        <span class="chip-meta">${kDisplay}${tempPart}</span>
      </div>
      <span class="scenario-tag ${statusCls}">${statusLbl}</span>
    </div>`;
}

export function renderServerList(containerId, servers, onSelect) {
  const container = document.getElementById(containerId);
  if (!servers.length) {
    container.innerHTML = '<p class="empty-msg">No hay servidores registrados.</p>';
    return;
  }
  container.innerHTML = servers.map(s => buildServerChip(s)).join('');
  container.querySelectorAll('.server-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.server-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const server = servers.find(s => s.id === parseInt(chip.dataset.id));
      onSelect(server);
    });
  });
}

// ── Panel de detalle del servidor seleccionado ────────────────────────────

export function renderSelectedServer(containerId, server) {
  const panel = document.getElementById(containerId);
  panel.classList.remove('hidden');

  document.getElementById('selectedServerName').textContent     = server.name;
  document.getElementById('selectedServerType').textContent     = `${TYPE_ICONS[server.type] ?? ''} ${server.type} · ${server.cooling_type}`;
  document.getElementById('selectedServerLocation').textContent = server.rack_location ?? '—';
  document.getElementById('selectedServerStatus').textContent   = STATUS_LABELS[server.status] ?? server.status;
  document.getElementById('selectedServerMaxTemp').textContent  = `${server.max_temp_c} °C`;
  document.getElementById('selectedServerTamb').textContent     = `${server.tamb_default} °C`;

  const kEl = document.getElementById('selectedServerK');
  if (server.k_value != null) {
    kEl.textContent = parseFloat(server.k_value).toFixed(4);
    kEl.classList.remove('k-unknown');
  } else {
    kEl.textContent = '— (usar lecturas para calcular)';
    kEl.classList.add('k-unknown');
  }

  const resultEl = document.getElementById('kFromReadingResult');
  if (resultEl) {
    resultEl.textContent = '';
    resultEl.className = 'k-calc-result hidden';
  }
}

// ── Lecturas de temperatura ────────────────────────────────────────────────

function buildReadingRow(reading, serverId) {
  const temp  = parseFloat(reading.temperature);
  const tMin  = reading.t_minutes != null ? parseFloat(reading.t_minutes) : null;
  const date  = new Date(reading.recorded_at).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });
  const warn  = temp >= 85 ? 'temp-critical' : temp >= 70 ? 'temp-warn' : '';
  const tCell = tMin != null
    ? `<span class="reading-t">t = ${tMin} min</span>`
    : `<span class="reading-t reading-t-none">t = —</span>`;
  const calcBtn = tMin != null
    ? `<button class="btn-calc-k" data-t="${tMin}" data-temp="${temp}" title="Calcular k con esta lectura">→ k</button>`
    : '';

  return `
    <div class="reading-row">
      ${tCell}
      <span class="reading-temp ${warn}">${temp.toFixed(1)} °C</span>
      <span class="reading-date">${date}</span>
      ${calcBtn}
      <button class="btn-del" data-id="${reading.id}" data-server="${serverId}">✕</button>
    </div>`;
}

export function renderReadings(containerId, readings, serverId, onDelete) {
  const container = document.getElementById(containerId);
  if (!readings.length) {
    container.innerHTML = '<p class="empty-msg">Sin lecturas registradas.</p>';
    return;
  }
  container.innerHTML = readings.map(r => buildReadingRow(r, serverId)).join('');
  container.querySelectorAll('.btn-del').forEach(btn =>
    btn.addEventListener('click', () => onDelete(parseInt(btn.dataset.server), parseInt(btn.dataset.id)))
  );
}
