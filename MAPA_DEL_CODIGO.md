# Mapa del código · v11

- `index.html`: estructura, navegación y selector de equipo.
- `app.js`: estado local, migración, multiequipo, importador Excel, cálculos, vistas, Directo y sincronización.
  - `loadWorkspaceBook` / `switchWorkspace`: aislamiento local.
  - `detectGender` / `genderTerms` / `applyTeamIdentity`: categoría, lenguaje y color por equipo.
  - `scoreChart` / `openScoreChartDetail`: marcador desplazable y ampliado.
  - `playerShareData` / `robPerDisplay`: cuotas y ratio.
  - `TEAM_METRICS` / `LIVE_METRICS`: métricas integradas.
  - `syncNow`: rutas legacy o v3 según el equipo.
- `styles.css`: temas, móvil, gráficos, modales y multiequipo.
- `worker.js`: Worker w3 y compatibilidad w2.
- `config.js`: URL pública opcional del servicio; nunca tokens.
- `configurar.html`: genera `config.js` sin editar código.
- `actualizar.html`: contexto actual + parche multiarchivo + ZIP.
- `tests/smoke.py`: regresión funcional.
- `tools/validate.py`: validación y detector de secretos.
