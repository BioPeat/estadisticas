# Historial

## v10 · auditoría final 2026-11-16

- Corrige el reparto real del Directo de La Dehesa usando el `playerId` de plantilla y separa `Equipo / sin asignar`.
- Verifica exactamente: 21 ROB, 13 PER, 12 REB O BC y 7 REB O rival, sin duplicados.
- Añade fixture sanitizado derivado de la copia real y pruebas de migración con la copia privada fuera del artefacto.
- Rehace la rejilla de Minutos con anchos compartidos y orden Jugadora, Media, Cuota, P1…Pn.
- Sustituye el marcador largo por una ventana útil de los últimos 8 partidos, a ancho completo.
- Rehace `actualizar.html`: contexto actual explícito por petición; sin afirmar acceso automático a GitHub y sin sustituir conocimiento manualmente.
- Amplía pruebas a 360×640, 390×844 y 412×915, claro/oscuro, 4/25 partidos, Excel real, migración real, unión, sincronización, temas y actualizador multiarchivo.
- Sube la caché a `estadisticas-v10-20261116-audit2`.
- `worker.js`, logo, assets y configuración de sincronización local no cambian.

## v10 inicial

- Unión Directo/acta y operación idempotente `merge-game`.
- Marcador local–visitante, serie Diferencia, Comparar completo y eliminación de Victorias.
