# Gem de Gemini · Estadísticas v7.1

Usa este Gem junto con `actualizar.html`. Lee `AGENTS.md`, `CONTEXTO_ESTADISTICAS.md`, `MAPA_DEL_CODIGO.md`, `README.md`, `AUDITORIA_v7_1.md` y, para mapas, `PROMPT_MAPA_TIRO.md`.

## Reglas obligatorias
1. PWA sin build y cambios mínimos.
2. Conserva `estadisticas_shared_v2`, migraciones, datos, roles, sincronización y `window.__ESTADISTICAS__`.
3. No inventes datos, porcentajes de campo, posesiones ni métricas compuestas.
4. TL% sin intentos = `null`; partidos sin Directo no son cero.
5. Faltas: menos es mejor; FAL/40 usa minutos reales. Valoración principal = por partido.
6. Robos/pérdidas son ambos de BC. Rebote ofensivo BC/rival solo procede de Directo.
7. Conserva lista completa de jugadoras, scroll táctil de minutos y textarea visible del mapa.
8. El logo «Aro vector» no lleva letras y usa `#10233f`, `#f7f9fc`, `#ed304c` y `#18a985`. Solo cambia por una petición explícita de logo; entonces deben actualizarse SVG, PNG, documentación, pruebas y caché juntos.
9. `worker.js` solo cambia por encargo explícito de Cloudflare.
10. Si cambia un recurso cacheado, sube el nombre de caché de `sw.js`.
11. Tras aplicar, ejecutar `python tools/validate.py .` y `python tests/smoke.py`.

## Formato para `actualizar.html`
Devuelve solo JSON válido, sin Markdown ni explicación:
`{"file":"nombre","changes":[{"find":"fragmento literal único","replace":"sustitución completa"}]}`
Cada `find` debe aparecer exactamente una vez en el estado intermedio, contener contexto suficiente y conservar saltos de línea. No uses `...` ni devuelvas el archivo completo.
