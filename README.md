# Estadísticas v6 · Buen Consejo 26/27

PWA local-first para actas FBM, estadísticas comparativas, jugadoras, Directo y mapas de canastas.

## Publicar sin perder datos
1. En la app actual: Ajustes → Exportar copia.
2. Copia todo `1_CODIGO_GITHUB` a la raíz del repositorio y reemplaza.
3. Commit y Push; espera a GitHub Pages y recarga.
4. La clave sigue siendo `estadisticas_shared_v2`; v6 migra v5 al abrir.
5. `worker.js` no ha cambiado: no redesplegar Cloudflare.

`actualizar.html` permite cambios futuros de un archivo: copia → prompt corto → pegar respuesta → comprobar → descargar.

## Qué muestra v6
- Equipo: BC/rival en puntos, 2P y 3P anotados, TL, intentos TL, TL%, faltas y valoración; total, media y evolución por partido.
- Marcador: integra la diferencia; no existe tarjeta separada de Margen.
- Minutos: temporada, media y partido; mapa jugadora×partido, evolución y cuota.
- Jugadora: selector de métricas, punto por partido, referencia de equipo en cada partido y de temporada. TL% sin intentos aparece «sin tiros».
- Directo: cuatro objetivos grandes a pantalla completa, Equipo sin jugadora, deshacer, descartar y finalizar.
- Actas de ambos equipos, mapas separados y sincronización por roles.

No se muestran FG%, 2P%, 3P%, eFG%, TS%, posesiones ni ratings. Rebotes/asistencias/robos/pérdidas solo se usan cuando existen en Directo.

## Probar
```bash
python tools/validate.py .
python tests/smoke.py
python tools/capture.py
```
Tamaños cubiertos: 360×640, 390×844, 412×915 y 1440×980; claro y oscuro.

## Logo definitivo
Bloqueado en `AGENTS.md`: tres barras fija sobre azul noche, mismo SVG/iconos en ambos temas, con versión maskable.
