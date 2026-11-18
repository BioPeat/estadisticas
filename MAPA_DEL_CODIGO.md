# Mapa del código · v12.3

- `index.html`, `styles.css`, `app.js`: interfaz, estado local, importación FBM, estadísticas, Directo, mapas, multiequipo, conflictos y sincronización.
- `worker.js`: API Cloudflare/D1 compatible w2 y equipos v3; CORS, autenticación, cuotas, migraciones y borrado.
- `sw.js`, `manifest.json`: instalación y caché PWA.
- `instalar.html`: landing de conversión e instalación.
- `configurar.html`: comprobación y generación de `config.js`.
- `actualizar.html`: contexto/patch multiarchivo para IA.
- `tests/smoke.py`: UI, datos reales, dos clientes, landing y copias.
- `tests/worker_mock.mjs`: D1 simulado, w2, CORS, límites, caducidad y borrado.
- `tests/updater_e2e.py`: actualizador universal.
- `tools/validate.py`: estructura, sintaxis, fixtures y secretos.
