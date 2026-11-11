# Estadísticas v4 · Buen Consejo 26/27

Aplicación PWA local-first para actas FBM, Directo y mapas de tiro.

## Actualizar

1. Sustituye en GitHub todo el contenido por esta carpeta.
2. Conserva la configuración existente del Worker de Cloudflare: `worker.js` no ha cambiado.
3. Abre la app y vuelve a importar las tres actas FBM. La v4 actualiza los mismos partidos y conserva fecha, eventos de Directo y mapas.
4. Si Android mantiene colores antiguos en las barras del sistema, desinstala la PWA y vuelve a instalarla una vez.

La clave local sigue siendo `estadisticas_shared_v2`; la actualización no borra datos.

## Datos válidos

- Acta FBM: marcador, minutos, puntos, canastas anotadas de 2 y 3, tiros libres, faltas, valoración, +/- y las columnas que la FBM publique.
- Directo: robos, pérdidas y rebotes ofensivos propios/rivales.
- Mapa: ubicaciones de canastas propias y rivales.

No se calculan FG%, 2P%, 3P%, eFG%, TS%, posesiones ni ratings: el Excel solo aporta canastas anotadas, no intentos de campo fiables.

## Comprobaciones

```bash
python tools/validate.py .
python tests/smoke.py
python tools/capture.py
```

`tests/smoke.py` necesita Playwright y Chromium. CI los instala automáticamente.

## Estructura

- `app.js`: estado, migración, importación, sincronización, vistas, gráficos y Directo.
- `styles.css`: diseño responsive, temas, áreas seguras y acta desplazable.
- `worker.js`: contrato de Cloudflare, sin cambios en v4.
- `tests/fixtures/real_3_partidos.json`: fixture derivado de las tres actas reales.
- `tools/validate.py`: validación estática.
- `tools/capture.py`: capturas claras/oscuras de móvil y PC.
