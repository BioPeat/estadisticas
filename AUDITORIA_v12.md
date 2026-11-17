# Auditoría dura · Estadísticas v12

## Hallazgos de v11
1. Varias cadenas seguían ligadas a «BC» y la Diferencia duplicaba el mismo dato con signo opuesto.
2. El mismo gráfico de líneas se repetía incluso cuando Totales, Comparar o un solo partido pedían otra lectura.
3. La diferencia del marcador competía con la línea punteada y las etiquetas de puntos podían aproximarse demasiado.
4. La ficha individual mezclaba la abreviatura PER con una posible métrica de eficiencia y mostraba FAL/40 sin aportar claridad.
5. Compartir existía técnicamente, pero Ajustes exponía URL, token y permiso; un equipo local no se promovía al compartir.
6. El service worker podía servir app.js/styles.css antiguos tras publicar index.html nuevo.
7. Las pruebas fijaban una ruta de Chromium inexistente en GitHub Actions.

## Correcciones verificadas
- Tres móviles: 360×640, 390×844 y 412×915, claro/oscuro, sin desbordamiento horizontal.
- Buen Consejo real: 4 partidos, un Directo de 53 eventos y Posesiones extra +13.
- CB POZUELO B real: 6 partidos, masculino, sin Directo; no aparecen tarjetas manuales inventadas.
- Temporada de 25 partidos: 25 puntos, scroll lateral y modal completo.
- Un partido de Directo: barras legibles en lugar de dos puntos aislados.
- Compartir simulado: 7 operaciones pendientes más foto completa; enlaces editor/lector y teamId aislado.
- Migración desde `estadisticas_shared_v2` conserva equipo, 4 partidos, rol, token y color; el token nunca se copia a fixtures, capturas o documentación.
- Service worker con caché v12 y recursos `?v=12`; navegación y recursos principales intentan red antes de caché.
- `tools/validate.py` y `tests/smoke.py` terminan en OK.

## Límites honestos
- La app no puede desplegar Cloudflare por sí sola: el propietario debe pegar worker.js y pulsar Deploy una vez.
- La privacidad es por enlaces con token. Quien reenvíe un enlace comparte su permiso; el propietario debe revocarlo si deja de ser válido.
- La carpeta assets no se entrega porque se conserva sin cambios en GitHub.

## Refuerzo final: actualizador y landing
- El actualizador anterior estaba atado a v12 y a una sola respuesta. Se sustituyó por un flujo version-independent, multipartes, full-content, create/delete y autocambio.
- El contexto actual ronda menos de 700 KB; se valida byte lógico por byte lógico dentro de BEGIN/END. Por encima del umbral se divide por archivo en un ZIP, nunca con elipsis.
- Tres peticiones E2E pasan: visual multiarchivo, app.js completo multipartes y Worker+docs+actualizador con salto v13.
- La landing se probó a 360×640, 390×844, 412×915 y 1440×900, claro/oscuro, `beforeinstallprompt` simulado y fallback iOS.
- Las cuatro capturas usadas por la landing proceden de v12 real, con equipos, rivales y personas anonimizados; no contienen conexión ni credenciales.
