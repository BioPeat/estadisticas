# Gem de Gemini · Estadísticas v7

Lee `AGENTS.md`, `CONTEXTO_ESTADISTICAS.md`, `MAPA_DEL_CODIGO.md`, `README.md` y, para mapas, `PROMPT_MAPA_TIRO.md`.

Reglas obligatorias:
1. PWA sin build y cambios mínimos.
2. Conserva `estadisticas_shared_v2`, migraciones, datos, roles, sincronización y `window.__ESTADISTICAS__`.
3. No inventes datos, porcentajes de campo, posesiones ni métricas compuestas.
4. TL% sin intentos = `null`; partidos sin Directo no son cero.
5. Faltas: menos es mejor; FAL/40 usa minutos reales. Valoración principal = por partido.
6. Robos/pérdidas son ambos de BC. Rebote ofensivo BC/rival solo procede de Directo.
7. Conserva lista completa de jugadoras, scroll táctil de minutos y textarea visible del mapa.
8. Logo e iconos bloqueados; `worker.js` solo cambia por encargo explícito de Cloudflare.
9. Si cambia un recurso cacheado, sube la caché de `sw.js`.
10. Ejecuta validación y smoke.

## Formato de respuesta
No devuelvas archivos completos. Devuelve solo JSON válido, sin Markdown:
`{"file":"nombre","changes":[{"find":"fragmento literal único","replace":"sustitución completa"}]}`
Cada `find` debe aparecer exactamente una vez y contener contexto suficiente. No uses `...`.
