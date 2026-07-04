/**
 * servers.js
 * Renderizado de chips de servidores, panel de detalle y lecturas.
 */

const STATUS_LABELS = { active: 'Activo', shutdown: 'Apagado', maintenance: 'Mantenimiento' };
const STATUS_CLASS  = { active: 'tag-green', shutdown: 'tag-gray', maintenance: 'tag-orange' };

const TYPE_ICONS = {
  web: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="8" cy="8" r="5.5"/>
    <path d="M8 2.5C6.2 4.5 5.2 6.2 5.2 8s1 3.5 2.8 5.5M8 2.5c1.8 2 2.8 3.7 2.8 5.5s-1 3.5-2.8 5.5"/>
    <line x1="2.5" y1="6" x2="13.5" y2="6"/>
    <line x1="2.5" y1="10" x2="13.5" y2="10"/>
  </svg>`,

  database: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <ellipse cx="8" cy="4.5" rx="4.5" ry="1.5"/>
    <path d="M3.5 4.5v7c0 .83 2.02 1.5 4.5 1.5s4.5-.67 4.5-1.5v-7"/>
    <path d="M3.5 8c0 .83 2.02 1.5 4.5 1.5S12.5 8.83 12.5 8"/>
  </svg>`,

  gpu: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="4" y="4" width="8" height="8" rx="1"/>
    <path d="M6 4V2.5M8 4V2.5M10 4V2.5M6 12v1.5M8 12v1.5M10 12v1.5M4 6H2.5M4 8H2.5M4 10H2.5M12 6h1.5M12 8h1.5M12 10h1.5"/>
  </svg>`,

  hpc: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="2" width="5" height="5" rx="0.75"/>
    <rect x="9" y="2" width="5" height="5" rx="0.75"/>
    <rect x="2" y="9" width="5" height="5" rx="0.75"/>
    <rect x="9" y="9" width="5" height="5" rx="0.75"/>
  </svg>`,

  storage: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="2.5" width="12" height="4" rx="1"/>
    <rect x="2" y="9.5" width="12" height="4" rx="1"/>
    <circle cx="11.5" cy="4.5" r="0.8" fill="currentColor" stroke="none"/>
    <circle cx="11.5" cy="11.5" r="0.8" fill="currentColor" stroke="none"/>
    <line x1="4" y1="4.5" x2="8" y2="4.5"/>
    <line x1="4" y1="11.5" x2="8" y2="11.5"/>
  </svg>`,

  general: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="3" width="12" height="10" rx="1"/>
    <line x1="2" y1="8" x2="14" y2="8"/>
    <circle cx="4.5" cy="5.5" r="0.75" fill="currentColor" stroke="none"/>
    <circle cx="4.5" cy="10.5" r="0.75" fill="currentColor" stroke="none"/>
    <line x1="7" y1="5.5" x2="10" y2="5.5"/>
    <line x1="7" y1="10.5" x2="10" y2="10.5"/>
  </svg>`,
};

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
