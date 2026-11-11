# Mapa del código · v3

## `index.html`
Shell, navegación, modal, input XLSX, rutas de assets, metadatos PWA y arranque temprano del tema.

## `app.js`
- Estado/migración: `blank`, `load`, `sanitise`, `save`, `migrateV1`.
- XLSX: `readXlsx`, `parseRoster`, `parseGame`, `parseBoxRow`, `commitImport`.
- Equipo: `teamTotals`, `renderTeam`, `openAdvancedDetail`.
- Jugadoras: `playerAgg`, `renderPlayers`, `openPlayerDetail`.
- Partidos: `renderGames`, `openGameDetail`, `renderGameDetail`, `BOX_COLS`.
- Directo: `renderLive`, `startLive`, `addLive`, `commitLiveEvent`, `finishLive`.
- Pista: `courtHTML`, `shotSVG`, `zoneOf`, `zoneCounts`, `zoneBars`.
- Mapas: `openHeatAnalysis`, `openShotDetail`, `bindShotCourt`, `shotPrompt`.
- Tema/PWA: `applyTheme`, registro de `sw.js`.
- Sincronización: `record`, `syncNow`, `applyRemote`.

## `styles.css`
Tokens de color, escritorio/móvil, áreas seguras, configuración y tablero de Directo, SVG FIBA, barras de zonas, acta horizontal, fichas de jugadora y tema oscuro.

## `actualizar.html`
Herramienta autónoma: copia local, paquete enfocado, extracción de respuesta, comprobación de JS/JSON/CSS/HTML y descarga.

## Infraestructura
- `worker.js`: API, roles, invitaciones, D1.
- `configurar.html`: alta inicial.
- `sw.js`: caché `estadisticas-v3`.
- `manifest.json`: PWA.

## Calidad
- `tools/validate.py`: estructura, versiones, tokens críticos y sintaxis.
- `tests/smoke.py`: Excel reales, rival completo, anónimas, scroll, tema, tabla, zonas y navegación.
- `tools/capture.py`: 10 capturas finales claro/oscuro en PC y móvil.
