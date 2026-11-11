# Mapa del código · Estadísticas v6

Nombres de funciones, sin números de línea.

## Estado y migración (`app.js`)
- `blank`, `load`, `sanitise`, `migrateV1`, `save`, `record`.
- Contrato público de pruebas: `window.__ESTADISTICAS__`.

## Importación FBM
- `readXlsx`, `parseRoster`, `parseBoxRow`, `sumBox`, `validateTotals`, `parseGame`.
- `handleFiles`, `findImportMatch`, `commitImport` conservan Directo, fecha y mapas al reimportar.

## Modelo estadístico
- `effectiveTotals`, `eventCounts`, `playerAgg`, `teamStats`.
- `TEAM_METRICS`, `teamMetricRows`, `aggregateMetric`: comparativas BC/rival.
- `PLAYER_METRICS`, `playerMetricRows`, `playerSeasonReference`: detalle individual y TL nulo.

## Vistas y gráficos
- `renderTeam`, `teamMetricCard`, `scoreChart`, `dualTrendSVG`, `scoringMixCompare`.
- `renderMinutesCard`, `minuteRows`, `minuteBars`, `openMinutesDetail`, `minutesHeatmap`.
- `renderPlayers`, `playerTrendSVG`, `openPlayerDetail`.
- `renderGames`, `openGameDetail`, `renderGameDetail`.
- `renderLive`, `startLive`, `addLive`, `discardLive`, `finishLive`.

## Mapas
- `courtHTML`, `foldShots`, `splitLegacyShots`, `zoneOf`, `openHeatAnalysis`, `openShotDetail`, `shotPrompt`.
- Regla confirmada: equipo de arriba en la captura FBM = mitad izquierda; validar también color y lista.

## Sincronización y tema
- `applyRemote`, `syncNow`, `record` mantienen el Worker w2.
- `applyTheme` coordina fondo, área segura y meta theme-color.

## Archivos auxiliares
- `actualizar.html`: cambio de un archivo con copia, prompt, validación y descarga.
- `tests/smoke.py`: regresión funcional responsive.
- `tools/validate.py`: contratos estáticos y de datos.
- `tools/capture.py`: 14 capturas finales.
