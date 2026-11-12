# Estadísticas v7.1 · Buen Consejo 26/27

PWA local-first, sin build, para actas FBM, estadísticas, Directo y mapas de tiro.

## Publicar sin perder datos
1. En la app actual: Ajustes → Exportar copia.
2. Copia a la raíz del repositorio el contenido de `1_CODIGO_GITHUB` y reemplaza los archivos.
3. Haz Commit y Push; espera a GitHub Pages y recarga por completo.
4. La clave sigue siendo `estadisticas_shared_v2`; v7 migra el estado anterior.
5. `worker.js` no cambió: no redesplegar Cloudflare.

## Novedades v7.1
- «Ver las 14» en reparto de puntos y minutos; tabla de minutos desplazable.
- Faltas con criterio correcto, FAL/P y FAL/40; valoración por partido.
- Tarjetas con comparaciones solo cuando aportan valor y detalle completo al tocar.
- Directo: robos/pérdidas de BC y REB O BC/rival, sin convertir ausencia en cero.
- Acta ampliada con ROB, PER, REB O y REB R cuando existe Directo.
- Mapa JSON visible y validado, edición manual y ataque/defensa.
- Navegación y franja segura adaptadas a claro/oscuro.
- Selector Totales / Por partido; ratios ROB/PER, balances y cuota de rebote ofensivo.
- Gráficos desplazables para 20+ partidos y series coincidentes visibles.
- Pendientes sin marcador fuera de balance, medias, racha, P1… y gráficos.
- Sincronización sin pérdida de operaciones nuevas y sin respuestas antiguas de caché.
- Logo «Aro vector» geométrico, sin letras ni siglas, con iconos normal y maskable coherentes.
- `actualizar.html` usa bloques BUSCAR/CAMBIAR POR, no archivos completos.

## Pruebas
```bash
python tools/validate.py .
python tests/smoke.py
python tools/capture.py
python tools/generar_guia_pdf.py
```
Se comprueba en 360×640, 390×844, 412×915 y 1440×980, claro/oscuro. Los tres Excel reales y la plantilla se usan en la validación, pero no se incluyen en el repositorio ni en el ZIP.

## Límites de datos
No se calculan porcentajes de campo, posesiones, eFG%, TS% ni ratings. Los ceros no publicados de rebotes/robos/pérdidas del acta no se presentan como datos reales. TL% sin intentos es ausente.
