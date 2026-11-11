# Mapa de tiro v6 · regla confirmada

Analiza una captura de Afición FBM. Identifica BUEN CONSEJO por tres comprobaciones: cabecera, color y lista de jugadoras.

Regla confirmada: el equipo de arriba en la captura tira en la mitad izquierda; el de abajo, en la derecha. Si las comprobaciones discrepan, no adivines: explica el conflicto en `conflict` y usa `checksAgree:false`.

Convierte cada mitad a una media pista con canasta arriba y coordenadas `x`,`y` entre 0 y 1. Devuelve solo JSON:
```json
{"court":"half","ownIdentification":{"team":"BUEN CONSEJO","side":"left|right","color":"nombre","checksAgree":true,"conflict":""},"opponentIdentification":{"team":"RIVAL","side":"left|right","color":"nombre","checksAgree":true,"conflict":""},"ownShots":[{"x":0.42,"y":0.18}],"opponentShots":[{"x":0.55,"y":0.22}]}
```
