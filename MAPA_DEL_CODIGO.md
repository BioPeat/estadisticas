# Mapa del código · v5

- `index.html`: estructura, metadatos PWA, navegación, modal y carga de JSZip.
- `styles.css`: temas, área segura, responsive, tarjetas, gráficos, Directo, actas y mapas.
- `app.js`
  - 24–122: estado, migración y persistencia.
  - 149–283: lectura/importación de Excel FBM.
  - 286–351: totales, agregados de jugadoras y equipo.
  - 361–430: gráficos reutilizables (marcador, margen, reparto, minutos).
  - `renderTeam`: panel de equipo.
  - `renderPlayers`: ranking de una línea y ordenación.
  - `renderLive`: configuración y partido en directo.
  - `renderGameDetail`: acta propia/rival y TOTALES de Directo.
  - `addLive`, `discardLive`, `finishLive`: ciclo del Directo.
  - `applyRemote`, `syncNow`: sincronización.
- `worker.js`: API Cloudflare/D1 sin cambios en v5.
- `sw.js`: caché `estadisticas-v5-20261111`.
- `tests/smoke.py`: pruebas funcionales y visuales en 3 móviles + PC.
- `tools/validate.py`: contratos estáticos, fixture real y sintaxis.
- `tools/capture.py`: capturas finales claro/oscuro.
