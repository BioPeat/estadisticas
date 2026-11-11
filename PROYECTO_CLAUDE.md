# Proyecto Claude · Estadísticas v6

Objetivo: mantener una PWA local-first de baloncesto, sin compilación, con cambios pequeños y verificables.

## Contratos
- Estado local `estadisticas_shared_v2`; Excel FBM de ambos equipos es la fuente.
- No calcular porcentajes de campo ni posesiones; TL% sin tiros = `null`.
- Faltas recibidas del equipo = faltas del rival.
- `playerId:null` suma a Equipo; descartar Directo sincroniza `live:null`.
- Comparativas de equipo BC/rival; minutos temporada/media/partido; doble referencia individual.
- Mantener acta deslizable, mapas, roles, sincronización y migración.
- No tocar `worker.js` por cambios de UI.

## Identidad bloqueada
El logo no se rediseña: SVG e iconos estándar/maskable con `#10233f #18365f #ed304c #7455dc #18a985`, iguales en claro y oscuro.

## Flujo de poco contexto
1. Consulta `MAPA_DEL_CODIGO.md` y abre solo el archivo afectado.
2. Usa `actualizar.html` para preparar el prompt y validar la respuesta.
3. Cambia una responsabilidad cada vez.
4. Ejecuta:
```bash
python tools/validate.py .
python tests/smoke.py
python tools/capture.py
```
5. Revisa 360×640, 390×844, 412×915 y 1440×980 en claro/oscuro.
