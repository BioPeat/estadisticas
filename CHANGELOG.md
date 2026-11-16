# CHANGELOG

## v11 · 2026-11-16

### Gráficos y cálculos
- Cuotas de jugadora por partido/temporada, con etiqueta inequívoca.
- ROB/PER protegido frente a PER=0 y balance negativo visible y explicado.
- Directo integrado en las tarjetas normales; ausencia de registro excluida del denominador.
- Evolución uniforme en todas las estadísticas de equipo.
- Marcador con todos los partidos, desplazamiento horizontal, diferencias más grandes y detalle ampliado.

### Equipos universales
- Género por equipo: femenino, masculino o mixto/neutro. Detección de `Fem/Femenino` y `Masc/Masculino` al importar.
- Terminología adaptativa: Jugadora/Jugador, Jugadoras/Jugadores, convocadas/convocados y cabeceras.
- Paleta universal azul/naranja con contraste claro/oscuro y selector por equipo; Buen Consejo migra como femenino y rojo.

### Multiequipo y privacidad
- Almacén `estadisticas_multiteam_v11` con migración automática desde `estadisticas_shared_v2`.
- Cambio de equipo sin mezclar plantilla, partidos, Directo, operaciones o conexión.
- Enlaces v11 en fragmento `#` para que el token no se envíe al servidor de GitHub Pages; se borran de la barra al abrirse.
- Roles propietario/editor/lector y revocación de enlaces.
- Worker w3 con tablas aisladas por `team_id`; rutas y tablas w2 conservadas.

### Herramientas
- `actualizar.html` acepta cambios multiarchivo, archivos nuevos y borrados explícitos.
- Guías Gemini/Claude separan configuración única, conocimiento y adjuntos de cada petición.
- Smoke móvil, temas, 25 partidos, copia real, Excel, aislamiento, enlaces, roles y actualización multiarchivo.
