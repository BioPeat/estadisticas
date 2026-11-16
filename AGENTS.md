# Reglas de mantenimiento · Estadísticas v10

## Invariantes

- No cambiar ni borrar `estadisticas_shared_v2`; las migraciones son aditivas.
- Conservar en cada móvil `settings.api`, `settings.token` y `settings.role`; nunca copiarlos a documentación, capturas, logs o fixtures.
- No modificar `worker.js`, no cambiar Worker w2 y no añadir pasos de Cloudflare a esta versión.
- Conservar el logo SVG `data-logo="aro-vector"` y la carpeta `assets/` existente en GitHub.
- Los marcadores visibles son local–visitante; `us/them` sigue siendo Buen Consejo/rival para los cálculos.
- Los eventos se deduplican por ID. La unión `merge-game` debe ser idempotente.
- Un evento con `playerId/playerName` nulos nunca se atribuye a una jugadora: va a `Equipo / sin asignar`.
- La asignación individual parte de `playerId` de plantilla y se resuelve contra el acta por nombre normalizado o dorsal único.
- Una actualización de recursos requiere cambiar el nombre de caché de `sw.js`.

## Antes de entregar

Ejecutar validación estática, smoke con Excel y copia real cuando estén disponibles, matriz 360/390/412 claro/oscuro con 4/25 partidos, capturas y revisión del PDF. Nunca incluir `assets/` ni la copia privada en el ZIP.
