# Mapa del código · v7

## `app.js`
1. Estado, migración y persistencia (`blank`, `sanitise`, `save`).
2. Importación XLSX FBM (`readXlsx`, `parseRoster`, `parseGame`, `commitImport`).
3. Modelo fiable (`effectiveTotals`, `eventCounts`, `playerAgg`, `teamStats`).
4. Gráficos y métricas de equipo (`TEAM_METRICS`, `teamMetricRows`, `dualTrendSVG`, tarjetas).
5. Portada Equipo: marcador, origen, reparto, minutos y datos de Directo.
6. Jugadoras: ranking, detalle, FAL/40, VAL/P y referencias del equipo.
7. Partidos: acta completa y mapas.
8. Detalles: estadísticas, plantilla completa, minutos y métricas de Directo.
9. Mapa de tiro: `openShotDetail`, `shotPrompt`, validación JSON, pista editable.
10. Directo, sincronización, permisos, temas y manejadores.
11. API de pruebas `window.__ESTADISTICAS__`.

## `styles.css`
- Variables de claro/oscuro y diseño base.
- Responsive móvil/PC y Directo a pantalla útil.
- Tarjetas, gráficos, actas y modales.
- Bloque v7 al final: navegación azul noche, scroll táctil de minutos, flujo IA de mapas y tarjetas con criterio.

## Otros
- `index.html`: shell, logo fijo, navegación, modal, JSZip y scripts.
- `sw.js`: caché v7.
- `manifest.json`: PWA standalone e iconos fijos.
- `actualizar.html`: aplica parches JSON `find`/`replace` únicos.
- `configurar.html`: configuración operativa existente.
- `worker.js`: backend w2, sin cambios.
- `tests/smoke.py`: regresión funcional móvil/PC.
- `tools/validate.py`: estructura y contratos.
- `tools/capture.py`: capturas finales claro/oscuro.
