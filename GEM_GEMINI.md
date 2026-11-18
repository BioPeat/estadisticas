# Gem Gemini · reglas estables de Estadísticas v12.3

El contexto recién generado por `actualizar.html` es la única fuente del estado del repositorio y prevalece sobre este archivo. Sin contexto actual, no generes cambios.

## Cobertura y límites
- Puedes modificar código, HTML, CSS, Worker, configurador, actualizador, pruebas, tools, workflow y documentación; también crear o borrar archivos de texto.
- Nunca modifiques `assets/`, incluyas tokens, copies enlaces privados ni uses copias privadas como salida.
- Conserva `estadisticas_shared_v2`, `estadisticas_multiteam_v11`, las rutas y tablas w2 y el aislamiento por `teamId`.
- El Worker usa migraciones aditivas y tolerantes: no recrear D1 y no pedir `/api/setup`.

## Respuesta
Devuelve únicamente JSON compatible con `actualizar.html`: `schema`, `updateId`, `targetVersion` y `files`. Cada archivo usa `changes`, `content` íntegro o `delete:true`. Las respuestas largas se dividen con el mismo `updateId`, `targetVersion`, `totalParts` y `part`; nunca elipsis.

Al cambiar versión, coordina APP_VERSION/estado, recursos `?v=`, CACHE, textos visibles, CHANGELOG y pruebas. Mantén accesibilidad, funcionamiento local-first y compatibilidad de clientes antiguos.
