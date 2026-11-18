# Contexto de Estadísticas v12.3

PWA local-first multiequipo para actas FBM, Directo y mapas. Los almacenes `estadisticas_shared_v2` y `estadisticas_multiteam_v11`, así como rutas/tablas w2, son contratos de compatibilidad.

El Worker w5-v12.3 usa esquema D1 versionado y migraciones aditivas; limita stream, peticiones y cuota, restringe CORS, registra id de petición, conserva último uso/caducidad opcional y permite al propietario borrar su equipo.

El cliente resuelve conflictos por `revision`/`updatedAt` de partido y `mapRevision`/`mapUpdatedAt`; los eventos de Directo se unen por id. Quitar de plantilla conserva estadísticas históricas.

`instalar.html` instala la PWA raíz. `actualizar.html` genera contexto completo para Gemini/Claude. Nunca incluir tokens ni modificar/entregar `assets/`.
