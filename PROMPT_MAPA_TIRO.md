# Mapa de tiro · contrato v9

La captura FBM identifica equipo de arriba = mitad izquierda y equipo de abajo = mitad derecha. Cruzar nombre de cabecera, color y lista de jugadoras. Si las señales discrepan, `checksAgree:false` y explicar `conflict`. Devolver solo JSON con `court`, `ownIdentification`, `opponentIdentification`, `ownShots` y `opponentShots`; coordenadas `x`,`y` entre 0 y 1, canasta arriba. No inventar lanzamientos: el mapa contiene canastas localizadas. La app pliega ambas mitades a media pista FIBA 15 × 14 m y permite revisar/mover puntos.
