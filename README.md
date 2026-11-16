# Estadísticas v11 · multiequipo

PWA local-first para importar actas FBM en Excel, registrar robos/pérdidas/rebotes ofensivos en Directo, analizar equipo y jugadoras, editar mapas de tiro y sincronizar mediante Cloudflare Worker + D1.

## Qué cambia en v11

- Cuotas de puntos y minutos de jugadora con selector **Por partido / Temporada**; la vista inicial es por partido.
- ROB/PER se presenta como cociente no negativo y el resultado con signo aparece como **Balance ROB−PER**. Si PER=0 se muestra `∞` o `—`, nunca se divide entre cero.
- Las métricas de Directo se integran con las demás y solo aparecen cuando existen datos.
- Todas las tarjetas de equipo muestran evolución por partido con la misma gramática visual; los partidos sin Directo no se convierten en ceros.
- Marcador completo, desplazable y ampliable; muestra todos los partidos y etiquetas de diferencia legibles.
- Varios equipos aislados en un mismo dispositivo. Cada equipo tiene sus propios datos, rol y conexión.
- Detección femenino/masculino desde la categoría FBM; selección manual obligatoria si no hay contexto y textos adaptados por equipo.
- Paleta propia/rival accesible azul-naranja por defecto, color propio configurable; Buen Consejo conserva rojo-azul.
- Worker w3 con espacios privados por equipo, enlaces de editor/lector y revocación; conserva las tablas y rutas w2.

## Publicar

1. Conserva una copia desde **Ajustes → Exportar este equipo**.
2. Sube el contenido de esta carpeta a la raíz de GitHub.
3. **No borres ni sustituyas `assets/`**: no está incluida.
4. Si vas a permitir equipos nuevos, despliega `worker.js` siguiendo `5_CLOUDFLARE` y genera `config.js` con `configurar.html`.
5. Pulsa **Commit changes**, espera a GitHub Pages, cierra la PWA y vuelve a abrirla.

## Pruebas

```bash
python tools/validate.py . --excel-dir /ruta/a/excel --private-backup /ruta/a/copia.json
ESTADISTICAS_REAL_BACKUP=/ruta/a/copia.json ESTADISTICAS_EXCEL_DIR=/ruta/a/excel python tests/smoke.py
```

Las credenciales de la copia real solo se usan para comparar en memoria. No deben entrar en el repositorio, fixtures, capturas o logs.
