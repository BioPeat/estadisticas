# Estadísticas v12.3

PWA local-first y multiequipo para actas FBM, Directo, mapas y sincronización privada.

## Novedades v12.3
- Conflictos entre dos editores: cada partido y mapa lleva revisión/fecha; un reemplazo antiguo no pisa uno nuevo y los eventos de Directo se unen por id.
- Worker `w5-v12.3`: límite real del stream, CORS restringido, cuotas atómicas, esquema versionado, último uso/caducidad opcional, id de petición y borrado completo por el propietario.
- Gráficos de evolución con mínimo, máximo y línea cero.
- Gestión de plantilla: quitar una persona conserva sus estadísticas históricas.
- Objetivos táctiles y textos pequeños reforzados sin colorear columnas de la ficha individual.
- Nueva landing de instalación móvil primero con tres pasos, funciones reales, privacidad, FAQ y fallbacks por navegador.

## Compatibilidad
- No se renombran `estadisticas_shared_v2` ni `estadisticas_multiteam_v11`.
- Las rutas y tablas w2 siguen intactas. No se recrea D1 y no hay que llamar a `/api/setup`.
- La app funciona en local y con el Worker anterior; las funciones nuevas de seguridad/borrado requieren desplegar `worker.js` v12.3.

## Comprobar
```bash
python tools/validate.py . --allow-assets
node tests/worker_mock.mjs
ESTADISTICAS_SECOND_BACKUP='tests/fixtures/estadisticas-2026-11-16 (4).json' python tests/smoke.py
python tests/updater_e2e.py
```
Chromium solo usa `/opt/pw-browsers/chromium-1228/chrome-linux64/chrome` si existe; en GitHub Actions usa Playwright sin ruta fija.

## Publicar
1. Conserva `assets/`; no se entrega ni modifica.
2. Sustituye en GitHub los archivos indicados en el LEEME de la entrega, respetando rutas.
3. Publica `5_CLOUDFLARE/worker.js` con los cuatro pasos de su LEEME; no toques D1.
4. Haz commit y espera a que GitHub Actions termine en verde y GitHub Pages se actualice.
5. Cierra y vuelve a abrir la PWA.

## Gemini y Claude
Sí hay que actualizar una vez las instrucciones y el conocimiento estable del Gem/Proyecto con los archivos v12.3. Después, en cada petición, genera contexto nuevo desde `actualizar.html`; no reutilices uno anterior.
