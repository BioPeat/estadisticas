# Proyecto Claude · Estadísticas v7.1

Usa este proyecto junto con `actualizar.html` para mantener una PWA local-first sin compilación mediante cambios pequeños y verificables.

## Contratos
- Estado local `estadisticas_shared_v2`; migración sin pérdida.
- Excel FBM de ambos equipos es la fuente de actas.
- No porcentajes de campo, posesiones, ratings ni datos inventados.
- TL% sin tiros = `null`; no entra en medias.
- Partidos sin Directo quedan fuera de métricas manuales.
- Robos/pérdidas = nuestros robos frente a nuestras pérdidas; no es rival ni posesiones.
- REB O BC/rival solo desde eventos `orbFor`/`orbAgainst`.
- `playerId:null` conserva «Equipo (sin jugadora)».
- Faltas ordenan mejor por menor valor y exponen FAL/40; valoración se expresa por partido.
- Logo «Aro vector» sin letras: `#10233f`, `#f7f9fc`, `#ed304c`, `#18a985`. Solo cambiar por encargo explícito y de forma coordinada en SVG, PNG, pruebas, documentos y caché.
- Worker w2, endpoints y permisos intactos salvo encargo explícito de Cloudflare.

## Interfaz
- Una o dos lecturas en portada; todas las vistas válidas dentro del detalle.
- Listas completas de puntos/minutos; scroll lateral táctil real.
- JSON del mapa siempre visible, validado y editable; cabecera arriba=izquierda, abajo=derecha.
- Navegación y guardia inferior siguen el tema: superficie clara en claro y oscura en oscuro.

## Respuesta para `actualizar.html`
Devuelve únicamente JSON de bloques exactos `find`/`replace`, nunca Markdown, explicaciones ni el archivo completo. Cada búsqueda debe ser literal y única en el estado intermedio. Tras aplicar: `python tools/validate.py .` y `python tests/smoke.py`.
