/**
 * servers.js
 * Renderizado de la lista de servidores y panel de lecturas de temperatura.
 */

const STATUS_LABELS = { active: 'Activo', shutdown: 'Apagado', maintenance: 'Mantenimiento' };
const STATUS_CLASS  = { active: 'tag-green', shutdown: 'tag-gray', maintenance: 'tag-orange' };
const TYPE_ICONS    = { web: '🌐', database: '🗄️', gpu: '⚡', hpc: '🖥️', storage: '💾', general: '🔲' };

// ── Lista de servidores ────────────────────────────────────────────────────

function buildServerCard(server, compact = false) {
  const icon       = TYPE_ICONS[server.type] ?? '🔲';
  const statusCls  = STATUS_CLASS[server.status] ?? 'tag-gray';
  const statusLbl  = STATUS_LABELS[server.status] ?? server.status;
  const lastTemp   = server.last_temp != null
    ? `<span class="srv-temp ${parseFloat(server.last_temp) >= server.max_temp_c ? 'temp-critical' : ''}">
         ${parseFloat(server.last_temp).toFixed(1)} °C
       </span>`
    : `<span class="srv-temp-none">Sin lecturas</span>`;

  return `
    <div class="server-card" data-id="${server.id}">
      <div class="srv-header">
        <span class="srv-icon">${icon}</span>
        <div class="srv-info">
          <span class="srv-name">${server.name}</span>
          <span class="srv-location">${server.rack_location ?? '—'}</span>
        </div>
        <span class="scenario-tag ${statusCls}">${statusLbl}</span>
      </div>
      <div class="srv-meta">
        <span>k = ${parseFloat(server.k_value).toFixed(3)}</span>
        <span>T_max = ${server.max_temp_c} °C</span>
        <span>Cooling: ${server.cooling_type}</span>
      </div>
      <div class="srv-footer">
        <span class="srv-temp-label">Última lectura:</span>
        ${lastTemp}
      </div>
    </div>`;
}

export function renderServerList(containerId, servers, onSelect) {
  const container = document.getElementById(containerId);
  if (!servers.length) {
    container.innerHTML = '<p class="empty-msg">No hay servidores registrados.</p>';
    return;
  }
  container.innerHTML = servers.map(s => buildServerCard(s, true)).join('');
  container.querySelectorAll('.server-card').forEach(card => {
    card.addEventListener('click', () => {
      container.querySelectorAll('.server-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const server = servers.find(s => s.id === parseInt(card.dataset.id));
      onSelect(server);
    });
  });
}

// ── Panel del servidor seleccionado ───────────────────────────────────────

export function renderSelectedServer(containerId, server) {
  const el = document.getElementById(containerId);
  el.classList.remove('hidden');
  el.querySelector('#selectedServerName').textContent = server.name;
  el.querySelector('#selectedServerType').textContent = `${TYPE_ICONS[server.type] ?? ''} ${server.type} · ${server.cooling_type}`;
  el.querySelector('#selectedServerLocation').textContent = server.rack_location ?? '—';
  el.querySelector('#selectedServerStatus').textContent = STATUS_LABELS[server.status] ?? server.status;
  el.querySelector('#selectedServerK').textContent = parseFloat(server.k_value).toFixed(4);
  el.querySelector('#selectedServerMaxTemp').textContent = `${server.max_temp_c} °C`;
  el.querySelector('#selectedServerTamb').textContent = `${server.tamb_default} °C`;
}

// ── Lecturas de temperatura ────────────────────────────────────────────────

function buildReadingRow(reading, serverId, onDelete) {
  const temp = parseFloat(reading.temperature);
  const date = new Date(reading.recorded_at).toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });
  const warn = temp >= 85 ? 'temp-critical' : temp >= 70 ? 'temp-warn' : '';
  return `
    <div class="reading-row">
      <span class="reading-temp ${warn}">${temp.toFixed(1)} °C</span>
      <span class="reading-date">${date}</span>
      <button class="btn-del" data-id="${reading.id}" data-server="${serverId}">✕</button>
    </div>`;
}

export function renderReadings(containerId, readings, serverId, onDelete) {
  const container = document.getElementById(containerId);
  if (!readings.length) {
    container.innerHTML = '<p class="empty-msg">Sin lecturas registradas.</p>';
    return;
  }
  container.innerHTML = readings.map(r => buildReadingRow(r, serverId, onDelete)).join('');
  container.querySelectorAll('.btn-del').forEach(btn =>
    btn.addEventListener('click', () => onDelete(parseInt(btn.dataset.server), parseInt(btn.dataset.id)))
  );
}
