# AGENTS.md · Estadísticas v7

## Propósito
Mantener una PWA local-first, sin build, para Buen Consejo 26/27. Hacer cambios pequeños, verificables y compatibles con datos existentes.

## Antes de editar
1. Lee `CONTEXTO_ESTADISTICAS.md` y `MAPA_DEL_CODIGO.md`.
2. Identifica la fuente del dato: acta FBM, Directo o mapa.
3. Ejecuta `python tools/validate.py .` y `python tests/smoke.py` tras el cambio.

## Contratos que no se rompen
- PWA sin build: `index.html`, `styles.css`, `app.js` y JSZip local.
- Almacén: `estadisticas_shared_v2`; v7 migra el estado anterior sin borrar plantilla, partidos, Directo, mapas, permisos ni sincronización.
- Excel FBM de ambos equipos es la fuente de actas. No inventar datos.
- No calcular FG%, 2P%, 3P%, eFG%, TS%, posesiones ni ratings: los intentos de campo del acta no son fiables.
- TL% con 0 intentos es `null`/«sin tiros» y no entra en medias.
- Un partido sin registro manual no aporta ceros a métricas de Directo.
- Robos/pérdidas compara nuestros robos con nuestras pérdidas; no representa estadísticas completas del rival.
- Rebote ofensivo de Directo compara `orbFor` con `orbAgainst`; no usar los ceros vacíos del acta.
- `playerId:null` significa «Equipo (sin jugadora)».
- El logo y los iconos son fijos. No cambiar el SVG ni `#10233f #18365f #ed304c #7455dc #18a985`.
- `worker.js` conserva el protocolo `w2`; no tocarlo por cambios de interfaz.

## Estadísticas y UX
- La portada muestra una o dos vistas útiles por tarjeta; el detalle reúne total, media, evolución, partido y desglose cuando existe.
- Faltas: menos es mejor; mostrar FAL/P y FAL/40.
- Valoración: principal de Buen Consejo por partido; la comparación con rival queda en el detalle.
- Minutos y reparto de puntos deben permitir abrir las 14 jugadoras.
- La tabla de minutos debe desplazarse lateralmente con tacto y ratón.
- Mapa de tiro: textarea JSON visible, validación, edición manual y guardado de ataque/defensa. Cabecera arriba = mitad izquierda; abajo = derecha; confirmar cabecera, color y lista.

## Cambios asistidos por IA
`actualizar.html` usa JSON de bloques exactos `find`/`replace`, nunca archivos completos. Cada `find` debe ser único en el estado intermedio.
