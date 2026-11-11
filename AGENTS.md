# AGENTS.md · Estadísticas v4

## Reglas que no se pueden romper

- Mantener `STORE = 'estadisticas_shared_v2'`.
- No modificar `worker.js` sin documentar el cambio y migrar su contrato.
- No borrar fechas, Directo ni mapas al reimportar un acta.
- Una acta debe conservar por separado `players`, `opponentPlayers`, `teamTotals` y `opponentTotals`.
- No fusionar rivales por nombre de jugadora ni normalizar dos filas distintas en una.
- No calcular porcentajes de tiro de campo ni eficiencia basada en posesiones con datos incompletos.
- Tema claro y oscuro deben cubrir `html`, `body`, barra inferior y áreas seguras.

## Antes de entregar

1. `node --check app.js`.
2. `python tools/validate.py .`.
3. `python tests/smoke.py` en 390×844.
4. Repetir inspección en 360×640, 412×915 y escritorio.
5. Verificar rival escrito durante 10 s, acta desplazable, totales, pestaña rival y puntos rojo/azul.
6. Generar capturas con `python tools/capture.py`.

## Criterio de interfaz

Textos breves y neutros. No añadir eslóganes, frases de ánimo ni explicaciones permanentes. Las definiciones aparecen al abrir un indicador. Priorizar gráficos, comparación y desglose accionable.
