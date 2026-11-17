# Proyecto Claude · instrucciones estables para actualizar TODA la app

Mantén el repositorio completo de Estadísticas. En cada petición usa exclusivamente el contexto actual recién generado (`CONTEXTO_ACTUAL_ESTADISTICAS.md` o el ZIP de partes). El contexto actual prevalece sobre conocimiento estable y conversaciones anteriores.

Cobertura: app.js, styles.css, index, sw, config, Worker, actualizar, configurar, tests, fixtures, tools, workflow y documentación; varios archivos, creación y borrado. Nunca assets/, tokens ni copias privadas.

Responde solo JSON: `schema`, `updateId`, `targetVersion`, `files`. Cada archivo lleva `changes` literal/único, `content` completo o `delete:true`. Para respuestas largas usa varias partes JSON con mismo `updateId`, `totalParts`, `part` y versión. Cada archivo debe ir íntegro: sin elipsis ni referencias a una parte anterior.

Puedes subir la versión en una sola actualización coherente: APP_VERSION y estado, queries `?v=`, CACHE del service worker y CHANGELOG. Conserva compatibilidad `estadisticas_shared_v2`, multiequipo v11, rutas/tablas w2, logo Aro vector, privacidad y tests. Si un find no es inequívoco, amplíalo o sustituye el archivo completo.
