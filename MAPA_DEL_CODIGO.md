# Mapa del código · v4

## Estado y migración

- `blank`, `load`, `sanitise`, `migrateV1`, `legacyPlayer`
- Contrato local: `estadisticas_shared_v2`
- Señal de reparación: `needsReimport`

## Excel

- `readXlsx`: lector OOXML con JSZip.
- `parseRoster`: plantilla.
- `parseGame`, `parseBoxRow`: dos equipos completos.
- `validateTotals`: compara filas con TOTALES.
- `commitImport`, `findImportMatch`: actualización sin perder Directo/mapas.

## Cálculo

- `sumBox`, `effectiveTotals`, `teamStats`, `playerAgg`, `eventCounts`.
- `PLAYER_METRICS`: métricas permitidas en evolución.
- `zoneOf`, `zoneCounts`: cuatro zonas del mapa.

## Interfaz

- `renderTeam`, `renderPlayers`, `renderGames`, `renderLive`.
- `openPlayerDetail`, `playerTrendSVG`.
- `openGameDetail`, `renderGameDetail`.
- `scoreChart`, `stackedBar`, `compareBar`, `donut`, `sparkline`.

## Directo y sincronización

- Borrador: `state.liveDraft` + `updateDraftFromInput`.
- Partido: `startLive`, `commitLiveEvent`, `finishLive`.
- Red: `record`, `syncNow`, `applyRemote`.
- `syncNow` compara firmas y respeta el foco activo.
