# Estadísticas v5 · Buen Consejo 26/27

PWA local-first para importar actas FBM, consultar equipo y jugadoras, apuntar eventos durante un partido y añadir mapas de canastas.

## Publicar
1. Copia el contenido de esta carpeta a la raíz del repositorio.
2. Commit y Push en GitHub.
3. Espera a GitHub Pages y recarga la app.
4. Si la franja inferior conserva el color antiguo, desinstala y vuelve a instalar la PWA una vez: Android puede conservar el color del `manifest.json` de la instalación anterior.

No reemplaces el Worker de Cloudflare: `worker.js` no ha cambiado en v5.

## Probar
```bash
python tools/validate.py .
python tests/smoke.py
python tools/capture.py
```

Requisitos para las pruebas visuales: Python 3.12, Playwright y Chromium.

## Datos
- La app guarda primero en `localStorage` (`estadisticas_shared_v2`).
- Con URL y token del Worker, envía operaciones a Cloudflare D1.
- Descartar un Directo emite `live:null` y lo elimina en todos los dispositivos sincronizados.
- «Equipo (sin jugadora)» suma el evento al total y a TOTALES, no a una jugadora.

## Métricas
Son válidas: marcador, margen, origen de puntos anotados, TL%, intentos de TL, faltas cometidas/recibidas, casa/fuera, reparto de puntos/minutos, +/- del acta, rebote ofensivo, rachas, eventos de Directo y zonas de canastas.

No se muestran FG%, 2P%, 3P%, eFG%, TS%, posesiones ni ratings porque el origen no permite calcularlos con rigor.
