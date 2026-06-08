class VirtualEVChargingCard extends HTMLElement {
  // Configuración por defecto de la tarjeta
  setConfig(config) {
    this.config = config;
  }

  // Home Assistant invoca este método cada vez que cambia un estado
  set hass(hass) {
    this._hass = hass;
    
    // Mapeo de entidades generadas por la integración
    const pctState = hass.states['number.virtual_ev_charging_station_porcentaje_actual'];
    const powerState = hass.states['number.virtual_ev_charging_station_potencia_de_carga'];
    const solarThresholdState = hass.states['number.virtual_ev_charging_station_umbral_potencia_solar'];
    const solarModeState = hass.states['switch.virtual_ev_charging_station_modo_automatico_solar'];
    const gridModeState = hass.states['switch.virtual_ev_charging_station_forzar_carga_red'];
    const kwhRemainingState = hass.states['sensor.virtual_ev_charging_station_energia_restante_80'];
    const timeRemainingState = hass.states['sensor.virtual_ev_charging_station_tiempo_restante'];
    const currentSolarState = hass.states['sensor.total_solar_power'];
    const currentLoadState = hass.states['sensor.moto_power'];
    const physicalPlugState = hass.states['switch.moto'];

    // Si las entidades esenciales no están listas, salir
    if (!pctState || !physicalPlugState) return;

    // Inicializar el contenedor HTML de la tarjeta la primera vez
    if (!this.content) {
      this.innerHTML = `
        <ha-card>
          <div class="ev-card-container">
            <!-- Cabecera de Estado Dinámica -->
            <div class="ev-header">
              <div class="ev-icon-wrapper" id="ev-main-icon-wrapper">
                <ha-icon icon="mdi:ev-station" id="ev-main-icon"></ha-icon>
              </div>
              <div class="ev-status-text">
                <div class="ev-title">Virtual EV Station</div>
                <div class="ev-subtitle" id="ev-status-subtitle">Cargador Listo</div>
              </div>
            </div>

            <!-- Panel de Cuenta Atrás Visual -->
            <div class="ev-countdown-panel">
              <div class="ev-stat">
                <span class="ev-stat-label">Restante al 80%</span>
                <span class="ev-stat-value" id="ev-val-kwh">0.0 kWh</span>
              </div>
              <div class="ev-stat">
                <span class="ev-stat-label">Tiempo Estimado</span>
                <span class="ev-stat-value" id="ev-val-time">0m</span>
              </div>
            </div>

            <!-- Sección de Telemetría Instantánea -->
            <div class="ev-telemetry">
              <div class="ev-telemetry-item">
                <ha-icon icon="mdi:white-balance-sunny"></ha-icon>
                <span id="ev-tel-solar">0 W</span>
              </div>
              <div class="ev-telemetry-item">
                <ha-icon icon="mdi:flash"></ha-icon>
                <span id="ev-tel-load">0 W</span>
              </div>
            </div>

            <!-- Controles Interactivos -->
            <div class="ev-controls">
              <div class="ev-control-row">
                <div class="ev-control-label">
                  <ha-icon icon="mdi:solar-power"></ha-icon>
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

      // Inyectar estilos CSS avanzados y responsivos dentro del Shadow de la tarjeta
      const style = document.createElement('style');
      style.textContent = `
        .ev-card-container { padding: 16px; font-family: var(--paper-font-body1_-_font-family); }
        .ev-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
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
        
        .ev-countdown-panel { 
          display: grid; grid-template-columns: 1fr 1fr; gap: 12px; 
          background: var(--secondary-background-color); padding: 12px; 
          border-radius: 8px; margin-bottom: 16px; text-align: center;
        }
        .ev-stat { display: flex; flex-direction: column; }
        .ev-stat-label { font-size: 11px; text-transform: uppercase; color: var(--secondary-text-color); letter-spacing: 0.5px; }
        .ev-stat-value { font-size: 20px; font-weight: bold; margin-top: 4px; color: var(--primary-text-color); }
        
        .ev-telemetry { display: flex; justify-content: space-around; margin-bottom: 20px; font-size: 14px; color: var(--primary-text-color); }
        .ev-telemetry-item { display: flex; align-items: center; gap: 6px; }
        .ev-telemetry-item ha-icon { color: var(--secondary-text-color); }

        .ev-controls { display: flex; flex-direction: column; gap: 12px; border-top: 1px solid var(--divider-color); padding-top: 16px; }
        .ev-control-row { display: flex; justify-content: space-between; align-items: center; }
        .ev-control-label { display: flex; align-items: center; gap: 10px; font-size: 14px; color: var(--primary-text-color); }
        .ev-control-label ha-icon { color: var(--secondary-text-color); }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
          100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
        }
      `;
      this.appendChild(style);
      this.content = this.querySelector('.ev-card-container');

      // Vincular eventos mecánicos a los interruptores virtuales (Llamadas a servicios de HA)
      this.querySelector('#ev-sw-solar').addEventListener('change', (e) => {
        hass.callService('switch', e.target.checked ? 'turn_on' : 'turn_off', {
          entity_id: 'switch.virtual_ev_charging_station_modo_automatico_solar'
        });
      });

      this.querySelector('#ev-sw-grid').addEventListener('change', (e) => {
        hass.callService('switch', e.target.checked ? 'turn_on' : 'turn_off', {
          entity_id: 'switch.virtual_ev_charging_station_forzar_carga_red'
        });
      });
    }

    // ACTUALIZACIÓN DE DATOS EN TIEMPO REAL
    // 1. Estados numéricos y cadenas de texto
    this.querySelector('#ev-val-kwh').textContent = kwhRemainingState ? `${kwhRemainingState.state} kWh` : '0.0 kWh';
    this.querySelector('#ev-val-time').textContent = timeRemainingState ? timeRemainingState.state : '0m';
    this.querySelector('#ev-tel-solar').textContent = currentSolarState ? `${currentSolarState.state} W` : '0 W';
    this.querySelector('#ev-tel-load').textContent = currentLoadState ? `${currentLoadState.state} W` : '0 W';

    // 2. Sincronizar interruptores visuales con los estados de Home Assistant
    this.querySelector('#ev-sw-solar').checked = solarModeState && solarModeState.state === 'on';
    this.querySelector('#ev-sw-grid').checked = gridModeState && gridModeState.state === 'on';

    // 3. Renderizado de animaciones y comportamiento de color según el modo de carga activo
    const iconWrapper = this.querySelector('#ev-main-icon-wrapper');
    const subtitle = this.querySelector('#ev-status-subtitle');

    iconWrapper.className = 'ev-icon-wrapper'; // Limpiar clases previas

    if (physicalPlugState.state === 'on') {
      if (gridModeState && gridModeState.state === 'on') {
        iconWrapper.classList.add('charging-grid');
        subtitle.textContent = `Cargando por Red (${powerState ? powerState.state : '1.4'} kW)`;
        subtitle.style.color = '#2196F3';
      } else {
        iconWrapper.classList.add('charging-solar');
        subtitle.textContent = `Inyectando Excedentes Solares`;
        subtitle.style.color = '#4CAF50';
      }
    } else {
      if (solarModeState && solarModeState.state === 'on') {
        iconWrapper.classList.add('ready');
        subtitle.textContent = `Esperando Excedentes (> ${solarThresholdState ? solarThresholdState.state : '3000'}W)`;
        subtitle.style.color = 'var(--secondary-text-color)';
      } else {
        subtitle.textContent = 'Estación en espera (Desarmada)';
        subtitle.style.color = 'var(--disabled-text-color)';
      }
    }
  }

  getCardSize() {
    return 3;
  }
}

// Registrar de forma oficial el elemento custom en el ecosistema Lovelace
customElements.define('virtual-ev-charging-card', VirtualEVChargingCard);
