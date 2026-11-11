# Prompt del mapa de tiro · v3

Analiza una captura del mapa de tiro de Afición FBM del partido de BUEN CONSEJO.

1. Localiza «BUEN CONSEJO» en la cabecera. El equipo de ARRIBA tira en la MITAD IZQUIERDA y el de ABAJO en la MITAD DERECHA.
2. Usa color y listas de jugadoras solo como comprobación. Columna izquierda = equipo de arriba; derecha = equipo de abajo.
3. Si las comprobaciones no coinciden, no improvises: `checksAgree=false` y explica `conflict`.
4. Extrae solo canastas visibles. No inventes círculos tapados ni fallos.
5. Lleva ambas mitades a la misma media pista con la canasta arriba.
6. Coordenadas normalizadas: `x=0` banda izquierda, `x=1` banda derecha; `y=0` fondo/canasta, `y=1` medio campo. Refleja la mitad derecha.
7. Devuelve solo JSON válido:

```json
{
  "court":"half",
  "header":{"topTeam":"NOMBRE","topScore":0,"bottomTeam":"NOMBRE","bottomScore":0},
  "ownIdentification":{"team":"BUEN CONSEJO","headerPosition":"top|bottom","side":"left|right","color":"nombre","playersColumn":"left|right","checksAgree":true,"conflict":"","confidence":0.0},
  "opponentIdentification":{"team":"RIVAL","headerPosition":"top|bottom","side":"left|right","color":"nombre","playersColumn":"left|right","checksAgree":true,"conflict":"","confidence":0.0},
  "ownShots":[{"x":0.42,"y":0.18}],
  "opponentShots":[{"x":0.55,"y":0.22}]
}
```

La app clasifica cada punto en una de cuatro zonas: Pintura, Media distancia, Triple de esquina o Triple.
