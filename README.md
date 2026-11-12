# Estadísticas · Buen Consejo v9

PWA local-first, sin compilación, para importar actas FBM, registrar Directo, analizar equipo/jugadoras y mantener mapas de tiro.

## Publicación
Copia el contenido de esta carpeta en la raíz de GitHub Pages, incluidos `.gitignore` y `.github`. La caché v9 fuerza la descarga de recursos nuevos sin cambiar `estadisticas_shared_v2`.

## Novedades visibles
- En **Equipo**, «Estadísticas manuales · Directo» aparece incluso sin eventos y explica que la ausencia no es cero.
- Selector **Por partido / Totales / Comparar**.
- Nuevas lecturas: diferencia, porcentaje de victorias, peso del triple y peso del tiro libre.
- Las tarjetas abren total, media, referencia rival, evolución, mejor/peor y reparto aplicable.
- En **Jugadoras**, el bloque ROB/PER/REB O existe siempre; las medias solo usan partidos con Directo.
- En cada **Acta** de BC se ven ROB, PER, REB O y REB R aunque aún no haya Directo.
- Gráficos largos se desplazan; el rival usa línea discontinua y las series coincidentes se separan.
- Mapa FIBA 15 × 14 m, puntos de edición algo mayores y arrastre táctil.

## Comprobación
```bash
python tools/validate.py .
python tests/smoke.py
python tools/capture.py
python tools/generar_guia_pdf.py
```
Para volver a validar los Excel originales: `python tools/validate.py . --excel-dir /ruta/a/los/excel`.

## Datos y sincronización
Almacén: `estadisticas_shared_v2`. Worker: contrato `w2`. Antes de publicar, exporta una copia desde Ajustes.
