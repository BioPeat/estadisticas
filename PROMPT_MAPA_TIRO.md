# Prompt del mapa de tiro

Analiza una captura del mapa de tiro de Afición FBM del partido de BUEN CONSEJO.

1. Identifica equipos por la cabecera: arriba = mitad izquierda; abajo = mitad derecha.
2. Cruza nombre de cabecera, color y lista de jugadoras. Si discrepan, `checksAgree:false` y explica `conflict`.
3. Separa `ownShots` (BUEN CONSEJO) y `opponentShots` (rival).
4. Convierte cada mitad a media pista con `x` e `y` entre 0 y 1 y canasta arriba.
5. No inventes puntos ni porcentajes.
6. Devuelve solo JSON válido con `court`, `ownIdentification`, `opponentIdentification`, `ownShots` y `opponentShots`.

La app rechaza coordenadas fuera de 0–1 y conflictos declarados. Después se revisa visualmente, se puede editar y solo entonces se guarda.
