# AGENTS.md · Estadísticas

## Objetivo innegociable

Mantener una aplicación compartida, rápida y comprensible para un equipo de baloncesto. No inventar datos. Una ausencia es `—`, no cero.

## Contrato de datos

- `localStorage`: `estadisticas_shared_v2`.
- `games[].shotsFor`: canastas de Buen Consejo, normalizadas a media pista.
- `games[].shotsAgainst`: canastas del rival, normalizadas a media pista.
- Coordenadas: `x` 0–1 de banda izquierda a derecha; `y` 0–1 de línea de fondo a medio campo; canasta arriba.
- `games[].events`: solo eventos apuntados en Directo con `provenance: recorded`.
- Las actas FBM son fiables para puntos, minutos, canastas de 2/3, tiros libres, faltas y +/-; no para REC, PER, REB ni AST cuando aparecen como ceros sistemáticos.

## Regla confirmada para mapas Afición FBM

1. Buscar `BUEN CONSEJO` en la cabecera.
2. Equipo de arriba → mitad izquierda. Equipo de abajo → mitad derecha.
3. El color confirma (Buen Consejo suele ser rojo), pero no manda.
4. Columna izquierda de jugadoras → equipo de arriba; columna derecha → equipo de abajo.
5. Si las tres comprobaciones no coinciden, la respuesta de IA debe marcar `checksAgree: false` y describir `conflict`.
6. La app debe mostrar la asignación y permitir **Intercambiar equipos** antes de guardar.
7. Reflejar la mitad derecha a media pista; conservar listas separadas de ataque y defensa.

Casos de prueba obligatorios:
- Buen Consejo arriba/izquierda/rojo vs Olímpico abajo/derecha/gris.
- Buen Consejo abajo/derecha/rojo vs Las Rozas arriba/izquierda/azul.
- Buen Consejo arriba/izquierda/rojo vs Ensanche abajo/derecha/negro.

## Reglas de interfaz

- En Directo, a 360×640, 390×844 y 412×915 no puede existir scroll de página.
- Deben verse rival, cuarto, cuatro acciones, contadores, deshacer y finalizar.
- Cada tarjeta de análisis es interactiva y abre desglose/explicación.
- Colores funcionales: coral Directo/ataque, verde petróleo Equipo, violeta Jugadoras, azul Partidos/defensa.
- Contraste mínimo WCAG AA y foco visible.
- No añadir animaciones decorativas, degradados, emojis ni tarjetas gigantes.

## Métricas prohibidas sin nuevos datos

No calcular 2P%, 3P%, FG%, eFG%, TS%, posesiones, ritmo, uso, PER, ORtg o DRtg. Los mapas muestran reparto de canastas anotadas, nunca acierto.

## Verificación antes de entregar

1. `node --check app.js`.
2. `python tools/validate.py`.
3. `python tests/smoke.py`.
4. Capturas claro/oscuro en móvil y PC con las tres actas reales importadas.
5. Confirmar que el estado vacío no contiene datos de ejemplo.
6. Confirmar que un enlace `viewer` no envía eventos.

## Revisión en frío obligatoria antes de empaquetar

Después de las pruebas y antes del ZIP, generar capturas con las tres actas reales en 360×640, 390×844, 412×915 y PC, claro/oscuro. Revisar como usuario nuevo: comprensión, jerarquía, densidad, separación, color, contraste, affordance, Directo sin scroll, mapas y apariencia no genérica. Registrar críticas, corregir y repetir hasta que todos los apartados sean positivos. Solo entonces crear el ZIP.
