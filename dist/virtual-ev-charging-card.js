class VirtualEVChargingCard extends HTMLElement {
  constructor() {
    super();
    // Usamos Shadow DOM para que tus estilos CSS no rompan el resto de Home Assistant
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    if (!config.solar_sensor || !config.grid_sensor || !config.enchufe_entity) {
      throw new Error("Define 'solar_sensor', 'grid_sensor' y 'enchufe_entity' en la configuración de la tarjeta.");
    }
    this.config = config;
  }

  // Lanza el panel emergente nativo "More Info" de Home Assistant
  _openMoreInfo(entityId) {
    const event = new CustomEvent('hass-more-info', {
      detail: { entityId: entityId },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  set hass(hass) {
    this._hass = hass;
    
    // Nombres exactos de las entidades generadas por la integración (¡Sin el "de" fantasma!)
    const pctState = hass.states['number.virtual_ev_charging_station_porcentaje_actual'];
    const powerState = hass.states['number.virtual_ev_charging_station_potencia_carga'];
    const solarThresholdState = hass.states['number.virtual_ev_charging_station_umbral_potencia_solar'];
    const solarModeState = hass.states['switch.virtual_ev_charging_station_modo_automatico_solar'];
    const gridModeState = hass.states['switch.virtual_ev_charging_station_forzar_carga_red'];
    const kwhRemainingState = hass.states['sensor.virtual_ev_charging_station_energia_restante_80'];
    const timeRemainingState = hass.states['sensor.virtual_ev_charging_station_tiempo_restante'];
    
    // Entidades configurables por el usuario
    const currentSolarState = hass.states[this.config.solar_sensor];
    const currentLoadState = hass.states[this.config.grid_sensor];
    const physicalPlugState = hass.states[this.config.enchufe_entity];

    // Evita renderizar si las entidades principales aún no existen en HA
    if (!pctState || !physicalPlugState) return;

    if (!this.content) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = `
        <ha-card>
          <div class="ev-card-container">
            <div class="ev-header">
              <div class="ev-icon-wrapper" id="ev-main-icon-wrapper">
                <ha-icon icon="mdi:ev-station" id="ev-main-icon"></ha-icon>
              </div>
              <div class="ev-status-text">
                <div class="ev-title">Virtual EV Station</div>
                <div class="ev-subtitle" id="ev-status-subtitle">Cargador Listo</div>
              </div>
            </div>

            <div class="ev-setup-panel">
              <div class="ev-slider-row">
                <div class="ev-slider-label">
                  <span>Estado de la Batería:</span>
                  <span class="ev-slider-numeric" id="ev-txt-pct">20%</span>
                </div>
                <input type="range" min="0" max="100" step="1" id="ev-range-pct" class="ev-slider">
              </div>
              
              <div class="ev-slider-row">
                <div class="ev-slider-label">
                  <span>Potencia de Carga:</span>
                  <span class="ev-slider-numeric" id="ev-txt-power">1.4 kW</span>
                </div>
                <input type="range" min="0.1" max="22.0" step="0.1" id="ev-range-power" class="ev-slider">
              </div>
            </div>

            <div class="ev-countdown-panel">
              <div class="ev-stat ev-clickable" id="ev-click-kwh">
                <span class="ev-stat-label">Restante al 80%</span>
                <span class="ev-stat-value" id="ev-val-kwh">0.0 kWh</span>
              </div>
              <div class="ev-stat ev-clickable" id="ev-click-time">
                <span class="ev-stat-label">Tiempo Restante</span>
                <span class="ev-stat-value" id="ev-val-time">0m</span>
              </div>
            </div>

            <div class="ev-telemetry">
              <div class="ev-telemetry-item ev-clickable" id="ev-click-solar" title="Ajustar Umbral Solar">
                <ha-icon icon="mdi:white-balance-sunny"></ha-icon>
                <span id="ev-tel-solar">0 W</span>
              </div>
              <div class="ev-telemetry-item">
                <ha-icon icon="mdi:flash"></ha-icon>
                <span id="ev-tel-load">0 W</span>
              </div>
            </div>

            <div class="ev-controls">
              <div class="ev-control-row">
                <div class="ev-control-label">
                  <ha-icon icon="mdi:solar-power-variant"></ha-icon>
                  <span>Carga Automática Solar</span>
                </div>
                <ha-switch id="ev-sw-solar"></ha-switch>
              </div>
              <div class="ev-control-row">
                <div class="ev-control-label">
                  <ha-icon icon="mdi:transmission-tower"></ha-icon>
                  <span>Forzar Carga desde Red</span>
                </div>
                <ha-switch id="ev-sw-grid"></ha-switch>
              </div>
            </div>
          </div>
        </ha-card>
      `;

      const style = document.createElement('style');
      style.textContent = `
        .ev-card-container { padding: 16px; font-family: var(--paper-font-body1_-_font-family); }
        .ev-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
        .ev-icon-wrapper { 
          width: 48px; height: 48px; border-radius: 50%; 
          display: flex; align-items: center; justify-content: center;
          background: var(--disabled-text-color); color: white;
          transition: all 0.5s ease;
        }
        .ev-icon-wrapper.charging-solar { background: #4CAF50; animation: pulse 2s infinite; }
        .ev-icon-wrapper.charging-grid { background: #2196F3; animation: pulse 2s infinite; }
        .ev-icon-wrapper.ready { background: var(--primary-color); }
        #ev-main-icon { --mdc-icon-size: 26px; }
        .ev-title { font-size: 18px; font-weight: bold; color: var(--primary-text-color); }
        .ev-subtitle { font-size: 13px; color: var(--secondary-text-color); }
        
        .ev-setup-panel { 
          background: var(--secondary-background-color); padding: 14px; 
          border-radius: 8px; margin-bottom: 14px; display: flex; flex-direction: column; gap: 14px;
        }
        .ev-slider-row { display: flex; flex-direction: column; gap: 6px; }
        .ev-slider-label { display: flex; justify-content: space-between; font-size: 13px; color: var(--primary-text-color); }
        .ev-slider-numeric { font-weight: bold; color: var(--primary-color); }
        .ev-slider { 
          -webkit-appearance: none; width: 100%; height: 6px; border-radius: 3px; 
          background: var(--border-color, #e0e0e0); outline: none; margin: 4px 0;
        }
        .ev-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none; width: 16px; height: 16px; 
          border-radius: 50%; background: var(--primary-color); cursor: pointer; transition: transform 0.1s ease;
        }
        .ev-slider::-webkit-slider-thumb:hover { transform: scale(1.25); }
        
        .ev-countdown-panel { 
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px; 
          background: var(--secondary-background-color); padding: 12px; 
          border-radius: 8px; margin-bottom: 14px; text-align: center; opacity: 0.9;
        }
        .ev-stat { display: flex; flex-direction: column; border-radius: 6px; padding: 4px 0; transition: background 0.2s ease; }
        .ev-stat-label { font-size: 11px; text-transform: uppercase; color: var(--secondary-text-color); letter-spacing: 0.5px; }
        .ev-stat-value { font-size: 18px; font-weight: bold; margin-top: 2px; color: var(--primary-text-color); }
        
        .ev-telemetry { display: flex; justify-content: space-around; margin-bottom: 16px; font-size: 14px; color: var(--primary-text-color); }
        .ev-telemetry-item { display: flex; align-items: center; gap: 6px; border-radius: 20px; padding: 4px 12px; transition: background 0.2s ease; }
        .ev-telemetry-item ha-icon { color: var(--secondary-text-color); }

        .ev-controls { display: flex; flex-direction: column; gap: 12px; border-top: 1px solid var(--divider-color); padding-top: 14px; }
        .ev-control-row { display: flex; justify-content: space-between; align-items: center; }
        .ev-control-label { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--primary-text-color); }
        .ev-control-label ha-icon { color: var(--secondary-text-color); }

        .ev-clickable { cursor: pointer; }
        .ev-clickable:hover { background: var(--rgba-accent-color, rgba(255, 255, 255, 0.08)); }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
          100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
        }
      `;
      
      this.shadowRoot.appendChild(style);
      this.shadowRoot.appendChild(wrapper);
      this.content = this.shadowRoot.querySelector('.ev-card-container');

      // --- LISTENERS DE LOS DESLIZADORES INTERNOS ---
      const rangePct = this.content.querySelector('#ev-range-pct');
      rangePct.addEventListener('input', (e) => {
        this.content.querySelector('#ev-txt-pct').textContent = e.target.value + '%';
      });
      rangePct.addEventListener('change', (e) => {
        hass.callService('number', 'set_value', {
          entity_id: 'number.virtual_ev_charging_station_porcentaje_actual',
          value: parseFloat(e.target.value)
        });
      });

      const rangePower = this.content.querySelector('#ev-range-power');
      rangePower.addEventListener('input', (e) => {
        this.content.querySelector('#ev-txt-power').textContent = e.target.value + ' kW';
      });
      rangePower.addEventListener('change', (e) => {
        // CORREGIDO: ¡Sin el "de"!
        hass.callService('number', 'set_value', {
          entity_id: 'number.virtual_ev_charging_station_potencia_carga',
          value: parseFloat(e.target.value)
        });
      });

      // --- LISTENERS DE LAS ZONAS CLICABLES ---
      this.content.querySelector('#ev-click-kwh').addEventListener('click', () => {
        this._openMoreInfo('sensor.virtual_ev_charging_station_energia_restante_80');
      });
      this.content.querySelector('#ev-click-time').addEventListener('click', () => {
        this._openMoreInfo('sensor.virtual_ev_charging_station_tiempo_restante');
      });
      this.content.querySelector('#ev-click-solar').addEventListener('click', () => {
        this._openMoreInfo('number.virtual_ev_charging_station_umbral_potencia_solar');
      });

      // --- LISTENERS DE LOS INTERRUPTORES ---
      this.content.querySelector('#ev-sw-solar').addEventListener('change', (e) => {
        hass.callService('switch', e.target.checked ? 'turn_on' : 'turn_off', {
          entity_id: 'switch.virtual_ev_charging_station_modo_automatico_solar'
        });
      });
      this.content.querySelector('#ev-sw-grid').addEventListener('change', (e) => {
        hass.callService('switch', e.target.checked ? 'turn_on' : 'turn_off', {
          entity_id: 'switch.virtual_ev_charging_station_forzar_carga_red'
        });
      });
    }

    // --- ACTUALIZACIÓN DE DATOS EN TIEMPO REAL ---

    // Sincroniza los deslizadores solo si el usuario no los está tocando en ese momento
    if (this.shadowRoot.activeElement !== this.content.querySelector('#ev-range-pct') && pctState) {
      this.content.querySelector('#ev-range-pct').value = pctState.state;
      this.content.querySelector('#ev-txt-pct').textContent = pctState.state + '%';
    }
    
    if (this.shadowRoot.activeElement !== this.content.querySelector('#ev-range-power') && powerState) {
      this.content.querySelector('#ev-range-power').value = powerState.state;
      this.content.querySelector('#ev-txt-power').textContent = powerState.state + ' kW';
    }

    // Actualiza textos dinámicos
    this.content.querySelector('#ev-val-kwh').textContent = kwhRemainingState ? `${kwhRemainingState.state} kWh` : '0.0 kWh';
    this.content.querySelector('#ev-val-time').textContent = timeRemainingState ? timeRemainingState.state : '0m';
    this.content.querySelector('#ev-tel-solar').textContent = currentSolarState ? `${currentSolarState.state} ${currentSolarState.attributes.unit_of_measurement || 'W'}` : '0 W';
    this.content.querySelector('#ev-tel-load').textContent = currentLoadState ? `${currentLoadState.state} ${currentLoadState.attributes.unit_of_measurement || 'W'}` : '0 W';

    // Actualiza posición de interruptores
    this.content.querySelector('#ev-sw-solar').checked = solarModeState && solarModeState.state === 'on';
    this.content.querySelector('#ev-sw-grid').checked = gridModeState && gridModeState.state === 'on';

    // Animación y estados visuales del icono principal
    const iconWrapper = this.content.querySelector('#ev-main-icon-wrapper');
    const subtitle = this.content.querySelector('#ev-status-subtitle');
    iconWrapper.className = 'ev-icon-wrapper';

    if (physicalPlugState.state === 'on') {
      if (gridModeState && gridModeState.state === 'on') {
        iconWrapper.classList.add('charging-grid');
        subtitle.textContent = `Cargando por Red (${powerState ? powerState.state : '1.4'} kW)`;
        subtitle.style.color = '#2196F3';
      } else {
        iconWrapper.classList.add('charging-solar');
        subtitle.textContent = `Inyectando producción solar`;
        subtitle.style.color = '#4CAF50';
      }
    } else {
      if (solarModeState && solarModeState.state === 'on') {
        iconWrapper.classList.add('ready');
        subtitle.textContent = `Esperando excedentes (> ${solarThresholdState ? solarThresholdState.state : '3000'}W)`;
        subtitle.style.color = 'var(--secondary-text-color)';
      } else {
        subtitle.textContent = 'Estación en espera (Desarmada)';
        subtitle.style.color = 'var(--disabled-text-color)';
      }
    }
  }

  getCardSize() {
    return 4;
  }
}

customElements.define('virtual-ev-charging-card', VirtualEVChargingCard);
