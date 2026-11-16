# Auditoría final · Estadísticas v10

## Método

Se volvió a leer todo el código, no solo los tres fallos visuales. Cada ronda terminó en crítica, corrección y repetición de pruebas. La copia real `estadisticas-2026-11-16.json` se usó solo como entrada privada de migración; el Excel real se usó para la importación. Ninguna credencial se incorporó a fixtures, capturas, documentación o ZIP.

## Ronda 1 · hallazgos duros

1. **La captura anterior era falsa como evidencia individual.** `capture.py` y `smoke.py` fabricaban 53 eventos y atribuían 46 a Sara. La aplicación además comparaba `playerId` del evento con el ID de la fila del acta, aunque pertenecen a espacios de identidad distintos.
2. **La tabla de minutos compartía texto pero no geometría.** Cabecera y filas podían calcular anchuras distintas por `minmax/fr` y por tener anchos intrínsecos diferentes.
3. **Marcador largo técnicamente desplazable, visualmente inútil.** La combinación de un SVG muy ancho y el estado del desplazamiento dejaba media tarjeta vacía y enseñaba solo pocos puntos a la derecha.
4. **El actualizador ocultaba mantenimiento manual.** Decía tres pasos, pero exigía reemplazar después el contexto del Gem/Proyecto. Gemini o Claude no tienen por este flujo acceso automático a GitHub.

## Correcciones

- `resolveEventPlayer` resuelve `playerId` contra la plantilla y después busca una única fila de acta por nombre normalizado o dorsal. `playerName` queda como respaldo. Los nulos no pasan por ningún fallback.
- El acta añade una fila visible `Equipo / sin asignar`. Resultado real: Sara 10/1/1; Lucía 2/2/2; Julia 2/2/0; Teresa 1/0/2; Alba 1/0/0; Lara 1/1/0; Gloria 1/0/2; Beatriz 0/3/0; Eider 0/2/3; Claudia 0/1/1; equipo 3/1/1/7. Los totales son 21/13/12/7.
- Minutos calcula un único `--table-width` y usa la misma plantilla de columnas en cabecera y filas.
- Marcador muestra todos los partidos hasta 8; con más, muestra los últimos 8 a ancho completo y la etiqueta “Últimos 8 de N”.
- `actualizar.html` acepta carpeta o ZIP, genera un único contexto actual, aplica JSON multiarchivo y genera el ZIP. La IA recibe el código actual como adjunto en cada petición; no se simula lectura de GitHub.

## Ronda 2 · crítica posterior

- Se detectó que un acta de prueba incompleta convertía eventos de Eider y Beatriz en “equipo”. Se sustituyó por el acta real sanitizada y se añadió una aserción por cada jugadora.
- La fila de equipo decía solo “Equipo” por el formateador de nombre. Se cambió a `Equipo / sin asignar` visible.
- Las capturas de Minutos probaban el inicio de la tabla, pero no demostraban P1. Se añadió desplazamiento real y matriz completa de tamaños/temas.
- Se confirmó por hash que `worker.js` es idéntico al recibido. La migración conserva `api`, `token` y `role`; no hay acciones sobre Worker ni credenciales.

## Cobertura final

- Sintaxis JS/Python y estructura PWA.
- Importación del Excel real; marcador 66–69 y condición fuera.
- Migración de la copia real; pendiente eliminado, 53 eventos conservados y configuración local intacta.
- Unión automática/manual, deduplicación e idempotencia de `merge-game`.
- Acta, Equipo y Jugadoras con el reparto exacto y nulos separados.
- 360×640, 390×844, 412×915; claro/oscuro; 4 y 25 partidos; scroll horizontal.
- Marcador, Diferencia, tablas, Comparar, ausencia de Victorias, temas, mapas, localStorage y caché.
- Actualizador con contexto generado y petición multiarchivo realista.

## Invariantes confirmados

Se conserva la clave `estadisticas_shared_v2`; `worker.js` permanece idéntico al original y la configuración local de sincronización no se reescribe.

## Límites conscientes

Los 25 partidos son un fixture visual explícito porque la copia real solo contiene la temporada disponible. No se presentan como resultados reales. Las credenciales y la copia privada quedan fuera de la entrega.
