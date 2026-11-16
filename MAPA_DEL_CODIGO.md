# Mapa del código · v10

- `app.js`
  - Estado/migración: `blank`, `sanitise`, `repairPendingGames`.
  - Unión: `mergeEvents`, `mergePendingIntoGame`, `mergePendingManual`, `merge-game`.
  - Identidad Directo→acta: `rosterPlayerForEvent`, `resolveEventPlayer`, `eventCounts`, `unassignedEventCounts`.
  - Marcador: `gameScore`, `gameSides`, `scoreChart` (ventana de 8).
  - Minutos: `minutesHeatmap`, `openMinutesDetail`.
  - Equipo/Comparar: `TEAM_METRICS`, `liveMetricCard`, `balanceVisual`.
- `styles.css`: temas, responsive, rejilla única de Minutos, fila de equipo y ventana del marcador.
- `actualizar.html`: carpeta/ZIP → contexto actual → JSON multiarchivo → ZIP.
- `sw.js`: caché `estadisticas-v10-20261116-audit2`.
- `worker.js`: original recibido, sin cambios.
- `tests/smoke.py`: pruebas funcionales, Excel y copia real opcionales, responsive y actualizador.
- `tests/fixtures/dehesa_directo_sanitizado.json`: datos reales necesarios sin configuración ni credenciales.
- `tools/capture.py`: 24 capturas finales.
