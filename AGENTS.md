# AGENTS.md · Estadísticas v5

## Contrato
- App web local-first, sin compilación. Entrada: `index.html`; lógica: `app.js`; estilos: `styles.css`.
- Conserva el almacén `estadisticas_shared_v2`: la versión de interfaz es v5, no se cambia la clave local.
- No inventes estadísticas. No calcules FG%, 2P%, 3P%, eFG%, TS%, posesiones ni ratings: el Excel FBM no contiene los intentos de campo completos.
- Las faltas recibidas del equipo son las faltas cometidas por el rival (`opponentTotals.fouls`). FR individual permanece oculto cuando todo es 0.
- Los eventos de Directo con `playerId:null` cuentan para el equipo y TOTALES, nunca para una jugadora.
- Descartar Directo debe emitir `live-upsert` con `live:null` y exigir confirmación.
- `worker.js` es el contrato de Cloudflare. No modificarlo para cambios visuales o estadísticos.

## Antes de entregar
1. `python tools/validate.py .`
2. `python tests/smoke.py`
3. `python tools/capture.py`
4. Revisar 360×640, 390×844, 412×915 y 1440×980; claro y oscuro.
5. Subir versión de caché en `sw.js` si cambia un recurso cacheado.

## Datos de prueba
`tests/fixtures/real_3_partidos.json` se creó desde las tres actas reales adjuntas. No incluye Excel ni datos inventados.
