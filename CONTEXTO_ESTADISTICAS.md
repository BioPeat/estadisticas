# Contexto de Estadísticas v3

- Equipo: Buen Consejo, temporada 26/27.
- App estática en GitHub Pages; sincronización opcional mediante Worker + D1 de Cloudflare.
- Aplicación local-first y sin dependencias remotas. `assets/jszip.min.js` lee XLSX en el navegador.
- Clave histórica que debe conservarse: `estadisticas_shared_v2`.

## Fuentes
- Excel Jugadores-Equipo: nombres y resumen de plantilla.
- Excel Estadísticas de partido: dos equipos completos, marcador y columnas FBM.
- Directo: robos, pérdidas, rebotes ofensivos propios y rebotes ofensivos del rival.
- Mapas: canastas visibles propias y rivales; no intentos fallados.

## Limitaciones reales de las actas
En los archivos de esta temporada, 2P y 3P muestran canastas anotadas y los supuestos intentos no son fiables; varios campos aparecen siempre a cero. Se presenta el acta importada, pero las métricas derivadas solo usan datos válidos. Tiros libres sí tienen aciertos e intentos útiles.

## Modelo v3
- `roster[]`
- `games[]`: `players[]`, `opponentPlayers[]`, `teamTotals`, `opponentTotals`, `events[]`, `shotsFor[]`, `shotsAgainst[]`.
- `live`: partido activo.
- `ops[]` y `lastSeq`: sincronización.
- `settings`: API, token, rol y preferencias del mapa.

## Diseño
- Claro neutro y oscuro gris casi negro, sin dominante verde.
- Acentos discretos rojo, verde y azul.
- Explicaciones cortas aparecen al abrir una métrica, no de forma repetitiva.
- Actas inspiradas en la legibilidad de Afición FBM: nombre fijo, desplazamiento horizontal y orden por cabecera.
