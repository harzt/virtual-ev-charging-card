# Virtual EV Charging Card

**Tarjeta personalizada para Home Assistant que muestra los datos de la integración Virtual EV Charging Station**

![Virtual EV Charging Card](https://github.com/harzt/virtual-ev-charging-card/raw/main/icon.png)

---

## 🚗⚡ Características

- **Monitoreo en Tiempo Real**: Visualiza el estado de carga de tu vehículo eléctrico
- **Control Solar Automático**: Activa/desactiva la carga según la producción fotovoltaica
- **Cálculos Dinámicos**: Energía restante al 80% y tiempo estimado de carga
- **Interfaz Intuitiva**: Deslizadores para ajustar parámetros
- **Integración Perfecta**: Funciona seamlessly con la integración virtual_ev_charging_station

---

## 📦 Instalación

### Mediante HACS (Recomendado)

1. Abre **HACS** en Home Assistant
2. Ve a **Frontend** → **Explorar y Descargar Repositorios**
3. Busca **"Virtual EV Charging Card"**
4. Click en **Descargar**
5. Reinicia Home Assistant

### Instalación Manual

1. Descarga el repositorio:
```bash
git clone https://github.com/harzt/virtual-ev-charging-card.git
```

2. Copia la carpeta `dist/` a tu directorio `www/community/virtual-ev-charging-card/`

3. En tu dashboard, añade la referencia de la tarjeta:
```yaml
resources:
  - url: /local/community/virtual-ev-charging-card/dist/virtual-ev-charging-card.js
    type: module
```

---

## 🎨 Uso

La tarjeta es 100% nativa: no necesita Mushroom Cards, card-mod ni stack-in-card,
pero reproduce el mismo diseño (cabecera dinámica, deslizadores, cuadrícula de
telemetría y bloque de programación). Solo tienes que indicar tus entidades
físicas; las de la integración `virtual_ev_charging_station` ya tienen el
nombre por defecto.

Añade esta tarjeta a tu dashboard:

```yaml
type: custom:virtual-ev-charging-card
plug_entity: switch.TU_ENCHUFE_FISICO
solar_entity: sensor.TU_SENSOR_SOLAR
load_entity: sensor.TU_SENSOR_POTENCIA_ENCHUFE
```

### Configuración Completa

```yaml
type: custom:virtual-ev-charging-card
title: Virtual EV Station
icon: mdi:ev-station

# --- Entidades físicas (dependen de tu instalación) ---
plug_entity: switch.TU_ENCHUFE_FISICO
solar_entity: sensor.TU_SENSOR_SOLAR
load_entity: sensor.TU_SENSOR_POTENCIA_ENCHUFE

# --- Entidades generadas por la integración (opcional, ya traen estos valores por defecto) ---
battery_entity: number.virtual_ev_charging_station_porcentaje_actual
power_entity: number.virtual_ev_charging_station_potencia_carga
solar_threshold_entity: number.virtual_ev_charging_station_umbral_potencia_solar
kwh_remaining_entity: sensor.virtual_ev_charging_station_energia_restante_80
time_remaining_entity: sensor.virtual_ev_charging_station_tiempo_restante
solar_mode_entity: switch.virtual_ev_charging_station_modo_automatico_solar
grid_mode_entity: switch.virtual_ev_charging_station_forzar_carga_red
scheduled_mode_entity: switch.virtual_ev_charging_station_modo_programado
start_time_entity: time.virtual_ev_charging_station_hora_inicio
duration_entity: number.virtual_ev_charging_station_duracion_programada

# Pon esto a false si no usas el modo de carga programada
show_scheduled: true
```

### Alternativa: Configuración Manual (Mushroom Cards)

Si prefieres seguir usando Mushroom Cards + card-mod en lugar de la tarjeta
nativa, puedes montar el mismo panel a mano con este `stack-in-card`:

```yaml
type: custom:stack-in-card
mode: vertical
cards:
  # --- 1. CABECERA DINÁMICA MUSHROOM ---
  - type: custom:mod-card
    card_mod:
      style: |
        mushroom-template-card {
          --mush-icon-size: 50px !important;
          --mush-shape-size: 80px !important;
        }
    card:
      type: custom:mushroom-template-card
      primary: Virtual EV Station
      secondary: >-
        {% if is_state('switch.virtual_ev_charging_station_forzar_carga_red', 'on') %}
          {% if is_state('switch.TU_ENCHUFE_FISICO', 'on') %}
            Cargando por Red ({{ states('number.virtual_ev_charging_station_potencia_carga') }} kW)
          {% else %}
            Iniciando carga por Red...
          {% endif %}
        {% elif is_state('switch.virtual_ev_charging_station_modo_automatico_solar', 'on') %}
          {% if is_state('switch.TU_ENCHUFE_FISICO', 'on') %}
            Aprovechando Producción Solar
          {% else %}
            Esperando Producción Solar (> {{ states('number.virtual_ev_charging_station_umbral_potencia_solar') }}W)
          {% endif %}
        {% elif is_state('switch.virtual_ev_charging_station_modo_programado', 'on') %}
          Inicio programado a las {{ states('time.virtual_ev_charging_station_hora_inicio')[:5] }}
        {% else %}
          Estación en espera (Desarmada)
        {% endif %}
      icon: mdi:ev-station
      icon_color: >-
        {% if is_state('switch.virtual_ev_charging_station_forzar_carga_red', 'on') %}
          blue
        {% elif is_state('switch.virtual_ev_charging_station_modo_automatico_solar', 'on') %}
          {% if is_state('switch.TU_ENCHUFE_FISICO', 'on') %} green {% else %} light-blue {% endif %}
        {% elif is_state('switch.virtual_ev_charging_station_modo_programado', 'on') %}
          purple
        {% else %}
          grey
        {% endif %}
      multiline_secondary: true
   # --- 2. BARRAS DESLIZANTES ---
  - type: custom:mushroom-number-card
    entity: number.virtual_ev_charging_station_porcentaje_actual
    name: Estado de la Batería
    icon: mdi:battery-50
    icon_color: light-blue
    display_mode: slider
  - type: custom:mushroom-number-card
    entity: number.virtual_ev_charging_station_potencia_carga
    name: Potencia de Carga
    icon: mdi:ev-plug-type2
    icon_color: light-blue
    display_mode: slider
   # --- 3. ESTADÍSTICAS Y TELEMETRÍA (Cuadrícula) ---
  - type: grid
    columns: 2
    square: false
    cards:
      - type: custom:mushroom-template-card
        primary: Restante al 80%
        secondary: '{{ states(''sensor.virtual_ev_charging_station_energia_restante_80'') }} kWh'
        icon: mdi:battery-charging-80
        icon_color: green
        layout: vertical
      - type: custom:mushroom-template-card
        primary: Tiempo Restante
        secondary: '{{ states(''sensor.virtual_ev_charging_station_tiempo_restante'') }}'
        icon: mdi:timer-sand
        icon_color: blue
        layout: vertical
      - type: custom:mushroom-entity-card
        entity: sensor.TU_SENSOR_SOLAR
        name: Producción Solar
        icon: mdi:white-balance-sunny
        icon_color: amber
        primary_info: state
        secondary_info: name
        layout: vertical
      - type: custom:mushroom-entity-card
        entity: sensor.TU_SENSOR_POTENCIA_ENCHUFE
        name: Consumo
        icon: mdi:flash
        icon_color: light-blue
        primary_info: state
        secondary_info: name
        layout: vertical
      - type: custom:mushroom-entity-card
        entity: switch.virtual_ev_charging_station_modo_automatico_solar
        name: Carga Automática Solar
        icon: mdi:solar-power-variant
        icon_color: amber
        tap_action:
          action: toggle
      - type: custom:mushroom-entity-card
        entity: switch.virtual_ev_charging_station_forzar_carga_red
        name: Forzar Carga desde Red
        icon: mdi:transmission-tower
        icon_color: red
        tap_action:
          action: toggle

  # --- 5. CONTROL HORARIO PROGRAMADO (Diseño Premium) ---
  - type: grid
    columns: 2
    square: false
    cards:
      - type: custom:mushroom-template-card
        entity: time.virtual_ev_charging_station_hora_inicio
        primary: Hora de Inicio
        secondary: "{{ states('time.virtual_ev_charging_station_hora_inicio')[:5] }}"
        icon: mdi:clock-edit-outline
        icon_color: >-
          {% if is_state('switch.virtual_ev_charging_station_modo_programado', 'on') %}
            purple
          {% else %}
            grey
          {% endif %}
        tap_action:
          action: more-info
      - type: custom:mushroom-entity-card
        entity: switch.virtual_ev_charging_station_modo_programado
        name: Programación
        icon: mdi:clock-check
        icon_color: purple
        tap_action:
          action: toggle   
```

### Notas Importantes

⚠️ **Personalización Requerida (tarjeta nativa):**
- `plug_entity` (**obligatorio**): tu switch de enchufe/cargador real
- `solar_entity`: tu sensor de producción solar (opcional, se muestra `--` si no se indica)
- `load_entity`: tu sensor de consumo del enchufe/vehículo (opcional)

⚠️ **Personalización Requerida (Mushroom manual):**
- Reemplaza `TU_ENCHUFE_FISICO` con tu entidad de enchufe real
- Reemplaza `TU_SENSOR_SOLAR` con tu sensor de producción solar
- Reemplaza `TU_SENSOR_POTENCIA_ENCHUFE` con tu sensor de consumo del enchufe

---

## 📊 Entidades Compatibles

| Tipo | Entity ID | Descripción |
|------|-----------|------------|
| **Number** | `number.virtual_ev_charging_station_porcentaje_actual` | Estado actual de batería (0-100%) |
| **Number** | `number.virtual_ev_charging_station_potencia_carga` | Potencia de carga (0.1-22 kW) |
| **Number** | `number.virtual_ev_charging_station_umbral_potencia_solar` | Umbral mínimo solar (0-10000 W) |
| **Number** | `number.virtual_ev_charging_station_duracion_programada` | Duración de la carga programada |
| **Sensor** | `sensor.virtual_ev_charging_station_energia_restante_80` | kWh faltantes al 80% |
| **Sensor** | `sensor.virtual_ev_charging_station_tiempo_restante` | Tiempo estimado de carga |
| **Switch** | `switch.virtual_ev_charging_station_modo_automatico_solar` | Activar carga solar automática |
| **Switch** | `switch.virtual_ev_charging_station_forzar_carga_red` | Forzar carga desde la red al 100% |
| **Switch** | `switch.virtual_ev_charging_station_modo_programado` | Activar carga programada por horario |
| **Time** | `time.virtual_ev_charging_station_hora_inicio` | Hora de inicio de la carga programada |

---

## 🔗 Links Relacionados

- **Integración**: [Virtual EV Charging Station](https://github.com/harzt/virtual_ev_charging_station)
- **Issues**: [Reportar un problema](https://github.com/harzt/virtual-ev-charging-card/issues)
- **Repositorio**: [GitHub](https://github.com/harzt/virtual-ev-charging-card)

---

## 📝 Licencia

MIT License - Libre para usar y modificar

---

## 👤 Autor

**harzt** - Entusiasta de Smart Home y Energías Renovables

---

## 🙏 Contribuciones

¡Las contribuciones son bienvenidas! Por favor abre un issue o pull request.

---

**Última actualización**: Septiembre 2026 | **Versión**: 2.0.0
