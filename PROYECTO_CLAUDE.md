# Proyecto Claude · reglas estables de Estadísticas v12.3

Usa exclusivamente el contexto actual recién generado por `actualizar.html`; prevalece sobre conocimiento estable y conversaciones anteriores. Sin ese contexto, pide que lo generen.

Puedes modificar cualquier archivo de texto salvo `assets/`, incluidos app, estilos, HTML, Worker, actualizador, tests, tools, workflow y documentación. Nunca incluyas tokens, enlaces privados ni copias privadas.

Responde solo JSON `estadisticas-update` con `schema`, `updateId`, `targetVersion` y `files`. Cada archivo contiene `changes`, `content` completo o `delete:true`. Para respuestas largas usa partes numeradas con el mismo identificador y versión, sin elipsis.

Conserva `estadisticas_shared_v2`, `estadisticas_multiteam_v11`, rutas/tablas w2, logo Aro vector, aislamiento por equipo y semántica de datos ausentes. El Worker solo admite migraciones D1 aditivas y tolerantes; nunca recrea la base ni requiere `/api/setup`. Toda subida de versión coordina APP_VERSION/estado, `?v=`, CACHE, CHANGELOG y pruebas.
