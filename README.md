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

Añade esta tarjeta a tu dashboard:

```yaml
type: custom:virtual-ev-charging-card
title: Virtual EV Station
```

### Configuración Completa

```yaml
type: custom:virtual-ev-charging-card
title: Virtual EV Station
icon: mdi:ev-station
state_color: true
entities:
  # Control del enchufe físico
  - entity: switch.TU_ENCHUFE_FISICO
    name: Interruptor Cargador
    icon: mdi:power-socket-eu

  # Deslizadores de configuración
  - entity: number.virtual_ev_charging_station_porcentaje_actual
    name: Estado de la Batería
  
  - entity: number.virtual_ev_charging_station_potencia_carga
    name: Potencia de Carga
  
  - entity: number.virtual_ev_charging_station_umbral_potencia_solar
    name: Umbral Solar

  # Sensores matemáticos
  - entity: sensor.virtual_ev_charging_station_energia_restante_80
    name: Restante al 80%
  
  - entity: sensor.virtual_ev_charging_station_tiempo_restante
    name: Tiempo Restante

  # Sensores físicos
  - entity: sensor.TU_SENSOR_SOLAR
    name: Producción Solar
    icon: mdi:white-balance-sunny
  
  - entity: sensor.TU_SENSOR_POTENCIA_ENCHUFE
    name: Consumo Moto
    icon: mdi:flash

  # Controles de la integración
  - entity: switch.virtual_ev_charging_station_modo_automatico_solar
    name: Carga Automática Solar
  
  - entity: switch.virtual_ev_charging_station_forzar_carga_red
    name: Forzar Carga desde Red
```

### Notas Importantes

⚠️ **Personalización Requerida:**
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
| **Sensor** | `sensor.virtual_ev_charging_station_energia_restante_80` | kWh faltantes al 80% |
| **Sensor** | `sensor.virtual_ev_charging_station_tiempo_restante` | Tiempo estimado de carga |
| **Switch** | `switch.virtual_ev_charging_station_modo_automatico_solar` | Activar carga solar automática |
| **Switch** | `switch.virtual_ev_charging_station_forzar_carga_red` | Forzar carga desde la red al 100% |

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

**Última actualización**: Junio 2026 | **Versión**: 1.0.0
