type: entities
title: Virtual EV Station
icon: mdi:ev-station
state_color: true
entities:
  # 1. EL ENCHUFE FÍSICO (Control directo desde la tarjeta)
  - entity: switch.TU_ENCHUFE_FISICO # Sustituye por la entidad de tu enchufe Zigbee real
    name: Interruptor Cargador
    icon: mdi:power-socket-eu

  - type: divider

  # 2. DESLIZADORES DE CONFIGURACIÓN
  # (Si usas custom:slider-entity-row, mantén tu formato pero cambia el entity_id)
  - entity: number.virtual_ev_charging_station_porcentaje_actual
    name: Estado de la Batería
  - entity: number.virtual_ev_charging_station_potencia_carga
    name: Potencia de Carga

  - type: divider

  # 3. SENSORES MATEMÁTICOS DE LA INTEGRACIÓN
  - entity: sensor.virtual_ev_charging_station_energia_restante_80
    name: Restante al 80%
  - entity: sensor.virtual_ev_charging_station_tiempo_restante
    name: Tiempo Restante

  - type: divider

  # 4. SENSORES FÍSICOS (Lectura en vivo)
  - entity: sensor.TU_SENSOR_SOLAR # Sustituye por tu sensor de Watios fotovoltaicos
    name: Producción Solar
    icon: mdi:white-balance-sunny
  - entity: sensor.TU_SENSOR_POTENCIA_ENCHUFE # Sustituye por el consumo en W del enchufe
    name: Consumo Moto
    icon: mdi:flash

  - type: divider

  # 5. CONTROLES DE LA INTEGRACIÓN
  - entity: switch.virtual_ev_charging_station_modo_automatico_solar
    name: Carga Automática Solar
  - entity: switch.virtual_ev_charging_station_forzar_carga_red
    name: Forzar Carga desde Red
