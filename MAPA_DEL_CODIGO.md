# Mapa del código · v9

- `index.html`: shell, Aro vector, navegación, modal y carga de recursos.
- `app.js`: estado/migración, importación FBM, métricas, vistas, actas, Directo, mapas y sincronización.
  - Modelo: `validGames`, `hasManualData`, `effectiveTotals`, `eventCounts`, `playerAgg`, `teamStats`.
  - Equipo: `TEAM_METRICS`, `teamMetricCard`, `renderLiveMetrics`, `openTeamMetricDetail`, `openLiveMetricDetail`.
  - Jugadoras: `PLAYER_METRICS`, `playerMetricRows`, `openPlayerDetail`.
  - Acta: `BOX_GROUPS`, `visibleBoxGroups`, `renderGameDetail`.
  - Escalabilidad: `scoreChart`, `dualTrendSVG`, `playerTrendSVG` y contenedores `trend-scroller`.
- `styles.css`: temas, móvil, área segura, tarjetas, estados sin datos y gráficos.
- `sw.js`: caché `estadisticas-v9-20261112-manual-visible`.
- `actualizar.html`: aplica JSON `find`/`replace` a un archivo y valida antes de descargar.
- `worker.js`: Cloudflare D1 `w2`; no depende de la interfaz.
- `tests/smoke.py`: 360×640, 390×844, 412×915, claro/oscuro, 3/25 partidos y Directo presente/ausente.
