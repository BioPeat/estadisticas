# AGENTS.md · Estadísticas v7.1

## Propósito
Mantener una PWA local-first, sin build, para Buen Consejo 26/27. Hacer cambios pequeños, verificables y compatibles con los datos existentes.

## Antes de editar
1. Lee `CONTEXTO_ESTADISTICAS.md` y `MAPA_DEL_CODIGO.md`.
2. Identifica la fuente del dato: acta FBM, Directo o mapa.
3. Trabaja sobre el archivo actual, nunca sobre una copia antigua.
4. Ejecuta `python tools/validate.py .` y `python tests/smoke.py` tras el cambio.

## Contratos que no se rompen
- PWA sin build: `index.html`, `styles.css`, `app.js` y JSZip local.
- Almacén: `estadisticas_shared_v2`; v7 migra el estado anterior sin borrar plantilla, partidos, Directo, mapas, permisos ni sincronización.
- Excel FBM de ambos equipos es la fuente de actas. No inventar datos.
- No calcular FG%, 2P%, 3P%, eFG%, TS%, posesiones ni ratings: los intentos de campo del acta no son fiables.
- TL% con 0 intentos es `null`/«sin tiros» y no entra en medias.
- Un partido sin registro manual no aporta ceros a métricas de Directo.
- Un partido `live-pending` sin marcador no es un partido disputado: queda fuera de balance, racha, medias, numeración y gráficos.
- Robos/pérdidas compara nuestros robos con nuestras pérdidas; no representa estadísticas completas del rival.
- Rebote ofensivo de Directo compara `orbFor` con `orbAgainst`; no usar los ceros vacíos del acta.
- Las medias individuales de Directo usan solo partidos con registro manual en los que la jugadora aparece en el acta. La ausencia de registro es `null`, nunca cero.
- `playerId:null` significa «Equipo (sin jugadora)».
- El logo «Aro vector» es geométrico y no contiene letras, siglas ni texto. El SVG de cabecera y los tres PNG comparten fondo `#10233f`, aro `#f7f9fc`, tendencia `#ed304c` y punto final `#18a985`; el maskable mantiene todo el símbolo dentro de la zona segura.
- El logo solo cambia por un encargo explícito. Si cambia, se actualizan juntos `index.html`, los tres PNG, validaciones, documentación, guía y caché.
- `worker.js` conserva el protocolo `w2`; no tocarlo por cambios de interfaz.

## Estadísticas y UX
- La portada muestra una o dos vistas útiles por tarjeta; el detalle reúne total, media, evolución, partido y desglose cuando existe.
- Faltas: menos es mejor; mostrar FAL/P y FAL/40.
- Valoración: principal de Buen Consejo por partido; la comparación con rival queda en el detalle.
- Minutos y reparto de puntos deben permitir abrir las 14 jugadoras.
- La tabla de minutos debe desplazarse lateralmente con tacto y ratón.
- Mapa de tiro: textarea JSON visible, validación, edición manual y guardado de ataque/defensa. Cabecera arriba = mitad izquierda; abajo = derecha; confirmar cabecera, color y lista.

## Cambios asistidos por IA
`actualizar.html` genera un encargo para un único archivo y aplica JSON de bloques exactos `find`/`replace`, nunca archivos completos. Cada `find` debe ser literal y único en el estado intermedio. Tras descargar el archivo comprobado, sustituirlo en el repositorio, ejecutar las dos pruebas y subir la caché de `sw.js` si cambió un recurso cacheado.
