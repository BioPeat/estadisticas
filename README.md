# Estadísticas · Buen Consejo v10

PWA local-first para la temporada 26/27. Importa actas FBM, registra en Directo robos, pérdidas y rebote ofensivo, conserva mapas de tiro y mantiene la sincronización existente.

## Publicación

Copia el contenido de `1_CODIGO_GITHUB` en la raíz de GitHub Pages. **No borres `assets/`**: la entrega no incluye esa carpeta ni modifica el logo. La clave local sigue siendo `estadisticas_shared_v2`; al actualizar se conservan `api`, `token` y `role` tal como ya están guardados en cada móvil. `worker.js` es exactamente el original recibido y no requiere ninguna acción.

La caché es `estadisticas-v10-20261116-audit2`.

## Correcciones verificadas

- La copia real del 16/11 y el Excel real de La Dehesa se migran y unen en un solo partido, de forma idempotente.
- Los eventos se asignan desde `playerId` de la plantilla a la fila del acta por identidad normalizada y dorsal único. `playerName` es respaldo, no una reasignación inventada.
- Los nulos aparecen solo en `Equipo / sin asignar`: 3 robos, 1 pérdida, 1 REB O de BC y 7 REB O rival.
- La suma individual + equipo cuadra con 21 robos, 13 pérdidas, 12 REB O BC y 7 REB O rival.
- Minutos usa una única rejilla: Jugadora, Media, Cuota, P1…Pn; cabecera y filas tienen exactamente los mismos anchos.
- Marcador muestra los últimos 8 partidos cuando hay temporadas largas, ocupando todo el ancho y señalando la ventana, sin media tarjeta vacía.
- Se conserva el orden local–visitante, la serie Diferencia, Comparar completo y la ausencia de la tarjeta Victorias.

## Actualizaciones con Gemini o Claude

Gemini y Claude **no conocen automáticamente el GitHub actual**. `actualizar.html` genera `CONTEXTO_ACTUAL_ESTADISTICAS.md` desde la carpeta o ZIP vigente; ese es el único archivo de código que se adjunta en cada petición. Las instrucciones del Gem/Proyecto se configuran una vez. Ya no hay que sustituir manualmente `PROYECTO_ESTADISTICAS.md` en el conocimiento.

## Pruebas

```bash
python tools/validate.py . --excel-dir /ruta/al/excel
ESTADISTICAS_REAL_XLSX=/ruta/estadisticaPartido_15112026.xlsx \
ESTADISTICAS_REAL_BACKUP=/ruta/estadisticas-2026-11-16.json \
python tests/smoke.py
python tools/capture.py
```

La copia real no forma parte del repositorio ni del ZIP entregado. El fixture incluido está sanitizado y no contiene configuración de sincronización.
