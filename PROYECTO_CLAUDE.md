# Instrucciones del proyecto Claude · Estadísticas v5

Mantén una PWA local-first de baloncesto sin build. Trabaja sobre el archivo pedido, respeta las APIs internas y entrega código completo listo para reemplazar.

## Contratos
- Versión visual v5; almacén local `estadisticas_shared_v2`.
- Excel FBM de ambos equipos es la fuente de actas.
- No calcular porcentajes de campo ni posesiones: faltan intentos fiables.
- Faltas recibidas del equipo provienen de las faltas del rival.
- `playerId:null` significa «Equipo (sin jugadora)» y solo suma al total.
- Descartar Directo vacía eventos y sincroniza `live:null` tras confirmación.
- `theme-color`, `html`, `body` y barra inferior siguen el tema; conservar áreas seguras.
- Gráficos interactivos, etiquetas breves y explicación solo al tocar.
- Jugadoras: fila única y cabeceras PTS/P · MIN/P · VAL/P ordenables.
- No modificar `worker.js` para cambios de UI o estadísticas.

## Control de calidad
Ejecuta:
```bash
python tools/validate.py .
python tests/smoke.py
python tools/capture.py
```
Revisa 360×640, 390×844, 412×915 y 1440×980 en claro y oscuro. Sube la caché de `sw.js` al cambiar recursos.
