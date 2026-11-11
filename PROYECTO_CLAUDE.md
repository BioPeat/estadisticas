# Proyecto Claude · Estadísticas v7

Objetivo: mantener una PWA local-first de baloncesto, sin compilación, con cambios pequeños y verificables.

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
- Logo/iconos fijos. Worker w2, endpoints y permisos intactos.

## Interfaz
- Una o dos lecturas en portada; todas las vistas válidas dentro del detalle.
- Listas completas de puntos/minutos; scroll lateral táctil real.
- JSON del mapa siempre visible, validado y editable; cabecera arriba=izquierda, abajo=derecha.
- Navegación y guardia inferior azul noche en ambos temas para empatar el color fijo observado en Android.

## Respuesta para `actualizar.html`
Devuelve únicamente JSON de bloques exactos `find`/`replace`, nunca el archivo completo. Cada búsqueda debe ser literal y única. Tras aplicar: `python tools/validate.py .` y `python tests/smoke.py`.
