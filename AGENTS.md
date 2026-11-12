# AGENTS.md · Estadísticas v9

## Propósito
Mantener una PWA local-first, sin build, para Buen Consejo 26/27. Los cambios deben verse en la app móvil real, conservar datos y distinguir siempre **cero registrado** de **dato ausente**.

## Antes de editar
1. Lee `CONTEXTO_ESTADISTICAS.md`, `MAPA_DEL_CODIGO.md` y `README.md`.
2. Trabaja sobre el archivo actual. `actualizar.html` genera un encargo para un único archivo.
3. Identifica la fuente: acta FBM, Directo o mapa. No mezcles fuentes silenciosamente.
4. Ejecuta `python tools/validate.py .` y `python tests/smoke.py`.

## Contratos
- PWA sin build; JSZip local.
- Almacén `estadisticas_shared_v2`; v9 migra estados anteriores sin borrar plantilla, actas, Directo, mapas, roles ni sincronización.
- Los Directos pendientes sin marcador no son partidos disputados.
- Los partidos sin Directo no son cero. Robos, pérdidas y REB O siguen visibles con **«Sin datos registrados todavía»** y quedan fuera de medias y ratios.
- Un cero dentro de un partido con Directo sí es un cero real.
- `playerId:null` significa «Equipo (sin jugadora)».
- No calcular porcentajes de campo, eFG%, TS%, posesiones ni ratings: los intentos 2P/3P del Excel no son fiables. TL% con 0 intentos es `null`.
- ROB/PER compara acciones de BC. REB O BC/rival solo usa `orbFor`/`orbAgainst` de Directo.
- El acta muestra siempre las columnas DIRECTO para BC; sin registro usa guiones y un aviso, nunca ceros falsos.
- Gráficos completos son desplazables con 20+ partidos; resúmenes enseñan una ventana reciente.
- Logo «Aro vector» sin letras: `#10233f`, `#f7f9fc`, `#ed304c`, `#18a985`.
- `worker.js` conserva el protocolo `w2` salvo encargo explícito.

## Respuesta para actualizar.html
Solo JSON válido, sin Markdown ni archivo completo:
`{"file":"nombre","changes":[{"find":"fragmento literal único","replace":"sustitución completa"}]}`
Cada `find` debe aparecer exactamente una vez en el estado intermedio. Si cambia un recurso cacheado, actualiza también el nombre de caché de `sw.js` en un encargo separado.
