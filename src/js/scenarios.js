/**
 * scenarios.js
 * Escenarios reales de data centers y umbrales de temperatura ASHRAE.
 */

export const SCENARIOS = [
  {
    id: 'air-cooling',
    name: 'Enfriamiento por Aire',
    tag: 'Estándar',
    description: 'Rack de servidores con sistema CRAC (Computer Room Air Conditioning) operando normalmente. Configuración más común en data centers corporativos. La constante k baja refleja la menor conductividad del aire.',
    params: { T0: 80, Tamb: 22, k: 0.08, tmax: 90, h: 1 },
  },
  {
    id: 'liquid-cooling',
    name: 'Enfriamiento Líquido',
    tag: 'Alto rendimiento',
    description: 'Sistema de refrigeración por agua (Direct Liquid Cooling). Usado en servidores HPC y AI. La alta conductividad térmica del agua produce una k mucho mayor, enfriando el servidor en fracción del tiempo.',
    params: { T0: 85, Tamb: 15, k: 0.35, tmax: 30, h: 0.5 },
  },
  {
    id: 'planned-shutdown',
    name: 'Apagado Planificado',
    tag: 'Mantenimiento',
    description: 'Servidor apagado durante ventana de mantenimiento programado. Sistema CRAC funcionando correctamente, temperatura ambiente dentro de rango ASHRAE A1 (15–32 °C). Enfriamiento gradual sin riesgo.',
    params: { T0: 72, Tamb: 18, k: 0.10, tmax: 60, h: 1 },
  },
  {
    id: 'crac-failure',
    name: 'Fallo del Sistema CRAC',
    tag: 'Incidente',
    description: 'El sistema de aire acondicionado del cuarto de servidores falla. La temperatura ambiente sube significativamente. El servidor pierde capacidad de disipar calor, aumentando el riesgo de apagado térmico.',
    params: { T0: 75, Tamb: 35, k: 0.04, tmax: 90, h: 1 },
  },
  {
    id: 'critical-overload',
    name: 'Sobrecalentamiento Crítico',
    tag: 'Crítico',
    description: 'Servidor superando umbrales ASHRAE por carga de trabajo extrema combinada con fallo parcial de enfriamiento. Escenario de emergencia: CPU por encima de 85 °C activa throttling y riesgo de shutdown automático.',
    params: { T0: 105, Tamb: 38, k: 0.03, tmax: 120, h: 1 },
  },
];

export const THRESHOLDS = {
  critical: { value: 85, label: 'Límite crítico CPU (85 °C)', color: '#ff5f6d' },
  warning:  { value: 70, label: 'Zona de advertencia (70 °C)',  color: '#f9c74f' },
  ashrae:   { value: 27, label: 'Máx. entrada ASHRAE A1 (27 °C)', color: '#4f9cf9' },
};

export function renderScenarioCards(containerId, onSelect) {
  const container = document.getElementById(containerId);
  container.innerHTML = SCENARIOS.map(s => buildScenarioCard(s, false)).join('');
  bindScenarioCardClicks(container, onSelect);
}

export function renderCustomScenarioCards(containerId, customList, onSelect, onDelete) {
  const container = document.getElementById(containerId);
  const existing = container.querySelectorAll('.scenario-card[data-custom]');
  existing.forEach(el => el.remove());

  const fragment = document.createDocumentFragment();
  customList.forEach(s => {
    const div = document.createElement('div');
    div.innerHTML = buildScenarioCard(
      { id: `custom-${s.id}`, name: s.name, tag: s.tag, params: { T0: s.t0, Tamb: s.tamb, k: s.k, tmax: s.tmax, h: s.h } },
      true,
      s.id
    );
    fragment.appendChild(div.firstElementChild);
  });
  container.appendChild(fragment);

  container.querySelectorAll('.scenario-card[data-custom] .btn-delete-scenario').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      onDelete(parseInt(btn.dataset.dbid));
    });
  });

  bindScenarioCardClicks(container, onSelect);
}

function bindScenarioCardClicks(container, onSelect) {
  container.querySelectorAll('.scenario-card').forEach(card => {
    card.onclick = () => {
      container.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const id = card.dataset.id;
      const isCustom = card.dataset.custom === 'true';
      let scenario;
      if (isCustom) {
        const { T0, Tamb, k, tmax, h } = JSON.parse(card.dataset.params);
        scenario = { name: card.querySelector('.scenario-name').textContent, params: { T0: parseFloat(T0), Tamb: parseFloat(Tamb), k: parseFloat(k), tmax: parseFloat(tmax), h: parseFloat(h) }, description: '' };
      } else {
        scenario = SCENARIOS.find(s => s.id === id);
      }
      onSelect(scenario);
    };
  });
}

function buildScenarioCard(scenario, isCustom = false, dbId = null) {
  const tagClass = tagColorClass(scenario.tag ?? 'Personalizado');
  const customAttrs = isCustom
    ? `data-custom="true" data-params='${JSON.stringify(scenario.params)}'`
    : '';
  const deleteBtn = isCustom
    ? `<button class="btn-delete-scenario" data-dbid="${dbId}" title="Eliminar">✕</button>`
    : '';
  return `
    <div class="scenario-card" data-id="${scenario.id}" ${customAttrs}>
      <div class="scenario-card-header">
        <span class="scenario-name">${scenario.name}</span>
        <span class="scenario-tag ${tagClass}">${scenario.tag ?? 'Personalizado'}</span>
        ${deleteBtn}
      </div>
    </div>`;
}

function tagColorClass(tag) {
  const map = {
    'Estándar': 'tag-blue',
    'Alto rendimiento': 'tag-green',
    'Mantenimiento': 'tag-gray',
    'Incidente': 'tag-orange',
    'Crítico': 'tag-red',
  };
  return map[tag] ?? 'tag-gray';
}

export function applyScenarioToControls(scenario) {
  const { T0, Tamb, k, tmax, h } = scenario.params;
  setSlider('T0', T0);
  setSlider('Tamb', Tamb);
  setSlider('k', k);
  setSlider('tmax', tmax);
  setSlider('h', h);
}

function setSlider(id, value) {
  const el = document.getElementById(id);
  el.value = value;
  el.dispatchEvent(new Event('input'));
}

export function updateScenarioDescription(containerId, scenario) {
  const el = document.getElementById(containerId);
  el.textContent = scenario.description;
  el.classList.remove('hidden');
}
