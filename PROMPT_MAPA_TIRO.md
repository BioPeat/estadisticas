# Prompt de mapa de tiro · contrato v2

La app genera este prompt automáticamente. Se documenta para que Gemini/Claude respeten el mismo formato.

## Regla

1. Buscar **BUEN CONSEJO** en la cabecera.
2. Arriba → mitad izquierda; abajo → mitad derecha.
3. Confirmar por color (secundario) y por columna de jugadoras.
4. Si hay conflicto, `checksAgree` debe ser `false` y `conflict` debe explicarlo.
5. Extraer ambos equipos.
6. Convertir ambos a la misma media pista; reflejar la mitad derecha.
7. No inventar círculos tapados o dudosos.

## JSON exacto

```json
{
  "court": "half",
  "header": {
    "topTeam": "BUEN CONSEJO",
    "topScore": 61,
    "bottomTeam": "OLIMPICO 64",
    "bottomScore": 48
  },
  "ownIdentification": {
    "team": "BUEN CONSEJO",
    "headerPosition": "top",
    "side": "left",
    "color": "red",
    "playersColumn": "left",
    "checksAgree": true,
    "conflict": "",
    "confidence": 0.99
  },
  "opponentIdentification": {
    "team": "OLIMPICO 64",
    "headerPosition": "bottom",
    "side": "right",
    "color": "gray",
    "playersColumn": "right",
    "checksAgree": true,
    "conflict": "",
    "confidence": 0.99
  },
  "ownShots": [{"x": 0.42, "y": 0.18}],
  "opponentShots": [{"x": 0.55, "y": 0.22}]
}
```

`x`: 0 banda izquierda, 1 banda derecha. `y`: 0 línea de fondo/canasta, 1 medio campo. Solo JSON, sin Markdown, cuando se responda a la app.
