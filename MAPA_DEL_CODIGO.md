# Mapa del código

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Esqueleto accesible, navegación, modal y carga de recursos. |
| `styles.css` | Sistema visual, densidad y reglas responsive. El bloque final contiene los ajustes de Directo 360×640. |
| `app.js` | Estado local, migración v1→v2, vistas, eventos de Directo, importador XLSX, mapas y sincronización. |
| `worker.js` | API Cloudflare, D1, tokens por rol y registro de eventos idempotente. |
| `sw.js` | Caché PWA v2. |
| `actualizar.html` | Copia de seguridad y diagnóstico de actualización. |
| `assets/jszip.min.js` | Descompresión local del XLSX; no envía los archivos a terceros. |
| `PROMPT_MAPA_TIRO.md` | Contrato del prompt y JSON de ataque/defensa. |
| `tests/smoke.py` | Prueba integral con las tres actas y tres reglas visuales verificadas. |
| `tests/fixtures/` | Datos reales de prueba; nunca se cargan automáticamente en producción. |
| `tools/validate.py` | Auditoría estática, ZIP y ausencia de datos demo en producción. |

## Funciones clave en `app.js`

- `sanitise`, `migrateV1`, `splitLegacyShots`, `foldShots`: integridad y migración.
- `readXlsx`, `parseRoster`, `parseGame`: importación FBM.
- `renderLive`, `addLive`, `finishLive`: flujo de banquillo.
- `shotPrompt`, `openShotDetail`, `bindShotCourt`: IA personal y edición manual.
- `openHeatAnalysis`, `zoneOf`, `zoneCounts`: ataque/defensa por zona.
- `record`, `syncNow`, `applyRemote`: sincronización local-first.

## Invariantes

- `shotsFor` y `shotsAgainst` nunca se mezclan.
- Una ausencia manual nunca se transforma en `0`.
- La app de producción no importa `tests/fixtures`.
- El visor no envía mutaciones al Worker.
