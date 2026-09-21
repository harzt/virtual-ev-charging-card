// Virtual EV Charging Card
// Tarjeta nativa (sin dependencias de Mushroom/card-mod) que replica el panel
// de control de la integración "Virtual EV Charging Station": cabecera de
// estado dinámica, sliders de batería/potencia, cuadrícula de telemetría y
// controles, y bloque de carga programada.

const DEFAULT_CONFIG = {
  title: 'Virtual EV Station',
  icon: 'mdi:ev-station',
  // Entidades físicas del vehículo/enchufe (dependen de la instalación de cada usuario)
  plug_entity: null,
  solar_entity: null,
  load_entity: null,
  // Entidades generadas por la integración virtual_ev_charging_station
  battery_entity: 'number.virtual_ev_charging_station_porcentaje_actual',
  power_entity: 'number.virtual_ev_charging_station_potencia_carga',
  solar_threshold_entity: 'number.virtual_ev_charging_station_umbral_potencia_solar',
  kwh_remaining_entity: 'sensor.virtual_ev_charging_station_energia_restante_80',
  time_remaining_entity: 'sensor.virtual_ev_charging_station_tiempo_restante',
  solar_mode_entity: 'switch.virtual_ev_charging_station_modo_automatico_solar',
  grid_mode_entity: 'switch.virtual_ev_charging_station_forzar_carga_red',
  scheduled_mode_entity: 'switch.virtual_ev_charging_station_modo_programado',
  start_time_entity: 'time.virtual_ev_charging_station_hora_inicio',
  duration_entity: 'number.virtual_ev_charging_station_duracion_programada',
  show_scheduled: true,
};

const COLORS = {
  green: '#4caf50',
  'light-blue': '#03a9f4',
  blue: '#2196f3',
  purple: '#9c27b0',
  amber: '#ffc107',
  red: '#f44336',
  grey: 'var(--disabled-text-color, #9e9e9e)',
};

class VirtualEVChargingCard extends HTMLElement {
  setConfig(config) {
    if (!config || !config.plug_entity) {
      throw new Error('Debes indicar "plug_entity" (el switch del enchufe/cargador físico) en la configuración de la tarjeta.');
    }
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getStubConfig() {
    return {
      type: 'custom:virtual-ev-charging-card',
      plug_entity: 'switch.moto',
      solar_entity: 'sensor.total_solar_power',
      load_entity: 'sensor.moto_power',
    };
  }

  getCardSize() {
    return 8;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.content) {
      this._render();
    }
    this._update(hass);
  }

  _state(entityId) {
    return entityId ? this._hass.states[entityId] : undefined;
  }

  _fireMoreInfo(entityId) {
    if (!entityId) return;
    const event = new Event('hass-more-info', { bubbles: true, composed: true });
    event.detail = { entityId };
    this.dispatchEvent(event);
  }

  _toggle(entityId) {
    if (!entityId) return;
    this._hass.callService('switch', 'toggle', { entity_id: entityId });
  }

  _setNumber(entityId, value) {
    if (!entityId) return;
    this._hass.callService('number', 'set_value', { entity_id: entityId, value });
  }

  _render() {
    const c = this.config;

    this.innerHTML = `
      <ha-card>
        <div class="ev-card">
          <div class="ev-header">
            <div class="ev-icon-shape" id="icon-shape">
              <ha-icon icon="${c.icon}" id="main-icon"></ha-icon>
            </div>
            <div class="ev-header-text">
              <div class="ev-title">${c.title}</div>
              <div class="ev-subtitle" id="subtitle">Estación en espera (Desarmada)</div>
            </div>
          </div>

          ${this._sliderRowTemplate('battery', 'mdi:battery-50', 'Estado de la Batería', 'light-blue')}
          ${this._sliderRowTemplate('power', 'mdi:ev-plug-type2', 'Potencia de Carga', 'light-blue')}

          <div class="ev-grid">
            ${this._templateTileTemplate('kwh', 'mdi:battery-charging-80', 'Restante al 80%', 'green')}
            ${this._templateTileTemplate('time_remaining', 'mdi:timer-sand', 'Tiempo Restante', 'blue')}
            ${this._entityTileTemplate('solar', 'mdi:white-balance-sunny', 'Producción Solar', 'amber')}
            ${this._entityTileTemplate('load', 'mdi:flash', 'Consumo', 'light-blue')}
            ${this._toggleTileTemplate('solar_mode', 'mdi:solar-power-variant', 'Carga Automática Solar', 'amber')}
            ${this._toggleTileTemplate('grid_mode', 'mdi:transmission-tower', 'Forzar Carga desde Red', 'red')}
          </div>

          ${c.show_scheduled ? `
          <div class="ev-grid two">
            ${this._templateTileTemplate('start_time', 'mdi:clock-edit-outline', 'Hora de Inicio', 'grey', true)}
            ${this._toggleTileTemplate('scheduled_mode', 'mdi:clock-check', 'Programación', 'purple')}
          </div>
          ${this._sliderRowTemplate('duration', 'mdi:timer-edit', 'Duración Carga Programada', 'light-blue')}
          ` : ''}
        </div>
      </ha-card>
    `;

    const style = document.createElement('style');
    style.textContent = `
      ha-card { overflow: visible; }
      .ev-card { padding: 16px; display: flex; flex-direction: column; gap: 16px; font-family: var(--paper-font-body1_-_font-family); }

      .ev-header { display: flex; align-items: center; gap: 16px; }
      .ev-icon-shape {
        width: 56px; height: 56px; min-width: 56px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        background: rgba(158, 158, 158, 0.2); color: var(--disabled-text-color, #9e9e9e);
        transition: background 0.4s ease, color 0.4s ease; --icon-color: currentColor;
      }
      .ev-icon-shape ha-icon { --mdc-icon-size: 30px; color: var(--icon-color); }
      .ev-icon-shape.pulse { animation: ev-pulse 2s infinite; }
      .ev-title { font-size: 16px; font-weight: 600; color: var(--primary-text-color); }
      .ev-subtitle { font-size: 13px; color: var(--secondary-text-color); margin-top: 2px; }

      .ev-slider-row { display: flex; flex-direction: column; gap: 6px; }
      .ev-slider-label { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--primary-text-color); }
      .ev-slider-label ha-icon { --mdc-icon-size: 18px; color: var(--secondary-text-color); }
      .ev-slider-value { margin-left: auto; font-weight: 600; color: var(--primary-text-color); }
      input[type="range"].ev-slider {
        -webkit-appearance: none; appearance: none; width: 100%; height: 34px;
        background: transparent; margin: 0; cursor: pointer;
      }
      input[type="range"].ev-slider::-webkit-slider-runnable-track {
        height: 34px; border-radius: 12px;
        background: linear-gradient(to right, var(--ev-slider-color, #03a9f4) 0%, var(--ev-slider-color, #03a9f4) var(--ev-slider-pct, 0%), var(--secondary-background-color) var(--ev-slider-pct, 0%), var(--secondary-background-color) 100%);
      }
      input[type="range"].ev-slider::-moz-range-track {
        height: 34px; border-radius: 12px; background: var(--secondary-background-color);
      }
      input[type="range"].ev-slider::-moz-range-progress {
        height: 34px; border-radius: 12px; background: var(--ev-slider-color, #03a9f4);
      }
      input[type="range"].ev-slider::-webkit-slider-thumb {
        -webkit-appearance: none; width: 4px; height: 24px; margin-top: 5px;
        border-radius: 2px; background: white; box-shadow: 0 0 0 1px rgba(0,0,0,0.2);
      }
      input[type="range"].ev-slider::-moz-range-thumb {
        width: 4px; height: 24px; border: none; border-radius: 2px; background: white;
      }

      .ev-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .ev-grid.two { grid-template-columns: 1fr 1fr; }
      .ev-tile {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        gap: 6px; padding: 12px 8px; border-radius: 12px;
        background: var(--ha-card-background, var(--card-background-color, #1c1c1c));
        border: 1px solid var(--divider-color); text-align: center;
      }
      .ev-tile.clickable { cursor: pointer; }
      .ev-tile .ev-tile-icon {
        width: 36px; height: 36px; border-radius: 50%; display: flex;
        align-items: center; justify-content: center; background: rgba(255,255,255,0.08);
      }
      .ev-tile .ev-tile-icon ha-icon { --mdc-icon-size: 20px; }
      .ev-tile .ev-tile-primary { font-size: 14px; font-weight: 600; color: var(--primary-text-color); }
      .ev-tile .ev-tile-secondary { font-size: 11px; color: var(--secondary-text-color); }
      .ev-tile.toggle { cursor: pointer; flex-direction: row; justify-content: flex-start; text-align: left; }
      .ev-tile.toggle .ev-tile-icon { flex: none; }
      .ev-tile.toggle .ev-tile-text { display: flex; flex-direction: column; }
      .ev-tile.toggle.active { border-color: var(--ev-tile-color, var(--primary-color)); }

      @keyframes ev-pulse {
        0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.35); }
        70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
        100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
      }
    `;
    this.appendChild(style);
    this.content = this.querySelector('.ev-card');

    this._bindEvents();
  }

  _sliderRowTemplate(key, icon, label) {
    return `
      <div class="ev-slider-row" data-key="${key}">
        <div class="ev-slider-label">
          <ha-icon icon="${icon}"></ha-icon>
          <span>${label}</span>
          <span class="ev-slider-value" id="val-${key}">--</span>
        </div>
        <input type="range" class="ev-slider" id="slider-${key}" />
      </div>
    `;
  }

  _templateTileTemplate(key, icon, label, color, clickable) {
    return `
      <div class="ev-tile${clickable ? ' clickable' : ''}" data-key="${key}">
        <div class="ev-tile-icon" style="color:${COLORS[color] || color}; background: color-mix(in srgb, ${COLORS[color] || color} 20%, transparent);">
          <ha-icon icon="${icon}"></ha-icon>
        </div>
        <div class="ev-tile-primary" id="primary-${key}">${label}</div>
        <div class="ev-tile-secondary" id="secondary-${key}">--</div>
      </div>
    `;
  }

  _entityTileTemplate(key, icon, label, color) {
    return `
      <div class="ev-tile" data-key="${key}">
        <div class="ev-tile-icon" style="color:${COLORS[color] || color}; background: color-mix(in srgb, ${COLORS[color] || color} 20%, transparent);">
          <ha-icon icon="${icon}"></ha-icon>
        </div>
        <div class="ev-tile-primary" id="primary-${key}">--</div>
        <div class="ev-tile-secondary">${label}</div>
      </div>
    `;
  }

  _toggleTileTemplate(key, icon, label, color) {
    return `
      <div class="ev-tile toggle" data-key="${key}" style="--ev-tile-color:${COLORS[color] || color};">
        <div class="ev-tile-icon" style="color:${COLORS[color] || color}; background: color-mix(in srgb, ${COLORS[color] || color} 20%, transparent);">
          <ha-icon icon="${icon}"></ha-icon>
        </div>
        <div class="ev-tile-text">
          <div class="ev-tile-primary">${label}</div>
        </div>
      </div>
    `;
  }

  _bindEvents() {
    const c = this.config;

    const sliderHandlers = {
      battery: c.battery_entity,
      power: c.power_entity,
      duration: c.duration_entity,
    };
    Object.entries(sliderHandlers).forEach(([key, entityId]) => {
      const input = this.querySelector(`#slider-${key}`);
      if (!input) return;
      input.addEventListener('input', () => this._paintSlider(key, input.value));
      input.addEventListener('change', () => this._setNumber(entityId, parseFloat(input.value)));
    });

    const toggleHandlers = {
      solar_mode: c.solar_mode_entity,
      grid_mode: c.grid_mode_entity,
      scheduled_mode: c.scheduled_mode_entity,
    };
    Object.entries(toggleHandlers).forEach(([key, entityId]) => {
      const tile = this.querySelector(`.ev-tile[data-key="${key}"]`);
      if (!tile) return;
      tile.addEventListener('click', () => this._toggle(entityId));
    });

    const moreInfoHandlers = { start_time: c.start_time_entity, solar: c.solar_entity, load: c.load_entity };
    Object.entries(moreInfoHandlers).forEach(([key, entityId]) => {
      const tile = this.querySelector(`.ev-tile[data-key="${key}"]`);
      if (!tile) return;
      tile.addEventListener('click', () => this._fireMoreInfo(entityId));
    });
  }

  _paintSlider(key, value) {
    const input = this.querySelector(`#slider-${key}`);
    const label = this.querySelector(`#val-${key}`);
    if (!input) return;
    const min = parseFloat(input.min || '0');
    const max = parseFloat(input.max || '100');
    const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
    input.style.setProperty('--ev-slider-pct', `${pct}%`);
    if (label) label.textContent = `${value}${input.dataset.unit || ''}`;
  }

  _updateSlider(key, entityId, colorVar) {
    const state = this._state(entityId);
    const input = this.querySelector(`#slider-${key}`);
    if (!input || !state) return;

    const attrs = state.attributes || {};
    input.min = attrs.min ?? 0;
    input.max = attrs.max ?? 100;
    input.step = attrs.step ?? 1;
    input.dataset.unit = attrs.unit_of_measurement ? ` ${attrs.unit_of_measurement}` : '';
    input.style.setProperty('--ev-slider-color', colorVar);

    if (document.activeElement !== input) {
      input.value = state.state;
    }
    this._paintSlider(key, input.value);
  }

  _update(hass) {
    const c = this.config;

    // Sliders
    this._updateSlider('battery', c.battery_entity, COLORS['light-blue']);
    this._updateSlider('power', c.power_entity, COLORS['light-blue']);
    if (c.show_scheduled) {
      this._updateSlider('duration', c.duration_entity, COLORS['light-blue']);
    }

    // Cuadrícula de telemetría
    const kwh = this._state(c.kwh_remaining_entity);
    this.querySelector('#secondary-kwh').textContent = kwh ? `${kwh.state} kWh` : '-- kWh';

    const timeRemaining = this._state(c.time_remaining_entity);
    this.querySelector('#secondary-time_remaining').textContent = timeRemaining ? timeRemaining.state : '--';

    const solar = this._state(c.solar_entity);
    this.querySelector('#primary-solar').textContent = solar ? `${solar.state} ${solar.attributes.unit_of_measurement || 'W'}` : '--';

    const load = this._state(c.load_entity);
    this.querySelector('#primary-load').textContent = load ? `${load.state} ${load.attributes.unit_of_measurement || 'W'}` : '--';

    const solarMode = this._state(c.solar_mode_entity);
    this._setToggleTileState('solar_mode', solarMode);

    const gridMode = this._state(c.grid_mode_entity);
    this._setToggleTileState('grid_mode', gridMode);

    if (c.show_scheduled) {
      const startTime = this._state(c.start_time_entity);
      this.querySelector('#secondary-start_time').textContent = startTime ? String(startTime.state).slice(0, 5) : '--:--';

      const scheduledMode = this._state(c.scheduled_mode_entity);
      this._setToggleTileState('scheduled_mode', scheduledMode);

      const scheduledIcon = this.querySelector('.ev-tile[data-key="start_time"] .ev-tile-icon');
      const scheduledColor = scheduledMode && scheduledMode.state === 'on' ? COLORS.purple : COLORS.grey;
      if (scheduledIcon) scheduledIcon.style.color = scheduledColor;
    }

    // Cabecera dinámica
    const plug = this._state(c.plug_entity);
    const power = this._state(c.power_entity);
    const solarThreshold = this._state(c.solar_threshold_entity);
    const iconShape = this.querySelector('#icon-shape');
    const subtitle = this.querySelector('#subtitle');

    iconShape.classList.remove('pulse');

    if (gridMode && gridMode.state === 'on') {
      this._paintHeader(iconShape, subtitle, COLORS.blue, plug && plug.state === 'on'
        ? `Cargando por Red (${power ? power.state : '--'} kW)`
        : 'Iniciando carga por Red...');
      if (plug && plug.state === 'on') iconShape.classList.add('pulse');
    } else if (solarMode && solarMode.state === 'on') {
      const charging = plug && plug.state === 'on';
      this._paintHeader(iconShape, subtitle, charging ? COLORS.green : COLORS['light-blue'],
        charging ? 'Aprovechando Producción Solar' : `Esperando Producción Solar (> ${solarThreshold ? solarThreshold.state : '--'}W)`);
      if (charging) iconShape.classList.add('pulse');
    } else if (c.show_scheduled && this._state(c.scheduled_mode_entity) && this._state(c.scheduled_mode_entity).state === 'on') {
      const startTime = this._state(c.start_time_entity);
      this._paintHeader(iconShape, subtitle, COLORS.purple, `Inicio programado a las ${startTime ? String(startTime.state).slice(0, 5) : '--:--'}`);
    } else {
      this._paintHeader(iconShape, subtitle, COLORS.grey, 'Estación en espera (Desarmada)');
    }
  }

  _paintHeader(iconShape, subtitle, color, text) {
    iconShape.style.color = color;
    iconShape.style.background = `color-mix(in srgb, ${color} 20%, transparent)`;
    subtitle.textContent = text;
  }

  _setToggleTileState(key, state) {
    const tile = this.querySelector(`.ev-tile[data-key="${key}"]`);
    if (!tile) return;
    tile.classList.toggle('active', !!state && state.state === 'on');
  }
}

if (!customElements.get('virtual-ev-charging-card')) {
  customElements.define('virtual-ev-charging-card', VirtualEVChargingCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'virtual-ev-charging-card',
  name: 'Virtual EV Charging Card',
  description: 'Panel de control para la integración Virtual EV Charging Station: batería, potencia, carga solar/red y programación.',
  preview: true,
});
