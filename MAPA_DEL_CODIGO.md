# Mapa del código · v7.1

## `app.js`
1. Estado, migración y persistencia (`blank`, `sanitise`, `save`).
2. Importación XLSX FBM (`readXlsx`, `parseRoster`, `parseGame`, `commitImport`).
3. Modelo fiable (`validGames`, `effectiveTotals`, `eventCounts`, `playerAgg`, `teamStats`): pendientes y datos ausentes quedan fuera.
4. Gráficos y métricas de equipo (`TEAM_METRICS`, `availableTeamMetricKeys`, `teamMetricRows`, `dualTrendSVG`, tarjetas y selector total/partido).
5. Portada Equipo: marcador, origen, reparto, minutos y datos de Directo.
6. Jugadoras: ranking, detalle, FAL/40, VAL/P y referencias del equipo.
7. Partidos: acta completa y mapas.
8. Detalles: estadísticas, plantilla completa, minutos y métricas de Directo.
9. Mapa de tiro: `openShotDetail`, `shotPrompt`, validación JSON, pista editable.
10. Directo, sincronización, permisos, temas y manejadores.
11. API de pruebas `window.__ESTADISTICAS__`.

## `styles.css`
Variables de claro/oscuro, responsive móvil/PC, Directo, tarjetas, gráficos, actas, modales, navegación temática, scroll táctil, series largas, cobertura manual y flujo IA del mapa.

## Marca y shell
- `index.html`: shell, SVG «Aro vector» sin letras, navegación, modal, JSZip y scripts.
- `assets/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`: versiones PWA del mismo símbolo; el maskable reduce el símbolo a la zona segura.
- `manifest.json`: PWA standalone, fondo `#10233f` y los tres iconos.
- `sw.js`: caché `estadisticas-v7-1-20261112-logo-aro-vector`.

## Operación y mantenimiento
- `actualizar.html`: genera el encargo de un archivo, aplica parches JSON `find`/`replace` únicos y valida el resultado.
- `configurar.html`: configuración operativa existente.
- `worker.js`: backend w2, sin cambios.
- `tests/smoke.py`: regresión funcional móvil/PC, datos, temas y marca.
- `tools/validate.py`: estructura, contratos, paleta e iconos.
- `tools/capture.py`: capturas reales para revisión y guía.
- `tools/generar_guia_pdf.py`: guía v7.1 a partir de esas capturas.
