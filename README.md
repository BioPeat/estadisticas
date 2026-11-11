# Estadísticas v7 · Buen Consejo 26/27

PWA local-first, sin build, para actas FBM, estadísticas, Directo y mapas de tiro.

## Publicar sin perder datos
1. En la app actual: Ajustes → Exportar copia.
2. Copia el contenido de `1_CODIGO_GITHUB` a la raíz del repositorio y reemplaza.
3. Commit y Push; espera a GitHub Pages y recarga por completo.
4. La clave sigue siendo `estadisticas_shared_v2`; v7 migra el estado anterior.
5. `worker.js` no cambió: no redesplegar Cloudflare.

## Novedades v7
- «Ver las 14» en reparto de puntos y minutos.
- Tabla de minutos con desplazamiento lateral táctil.
- Faltas con criterio correcto, FAL/P y FAL/40; valoración por partido.
- Tarjetas con comparaciones solo cuando aportan valor; detalle completo al tocar.
- Nuevas tarjetas de Directo: robos/pérdidas de BC y REB O BC/rival, sin convertir ausencia en cero.
- Pegado JSON del mapa visible y validado; conserva edición manual y ataque/defensa.
- Navegación móvil del mismo azul noche que la franja Android observada.
- `actualizar.html` usa bloques BUSCAR/CAMBIAR POR, no archivos completos.

## Pruebas
```bash
python tools/validate.py .
python tests/smoke.py
python tools/capture.py
```
La publicación se comprueba en 360×640, 390×844, 412×915 y 1440×980, claro/oscuro. Los Excel reales se usan en la validación de entrega, pero no se incluyen en el repositorio ni en el ZIP.

## Límites de datos
No se calculan porcentajes de campo, posesiones, eFG%, TS% ni ratings. Los ceros no publicados de rebotes/robos/pérdidas del acta no se presentan como datos reales. TL% sin intentos es ausente.
