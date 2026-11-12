# Cambios

## v9 · visibilidad real y comparación (12-11-2026)
- Hace visibles ROB, PER y REB O aun sin datos de Directo, con ausencia explícita y sin ceros inventados.
- Mantiene columnas DIRECTO en actas de BC y bloque manual en jugadoras.
- Añade modo Comparar, diferencia, victorias y composición de puntos.
- Diferencia visualizaciones y refuerza gráficos de 25 partidos.
- Aumenta ligeramente los puntos del mapa y conserva Aro vector.
- Caché v9, pruebas, documentación, guía e instrucciones Gemini/Claude renovadas.


## v7.1 · auditoría, guía y marca (12-11-2026)
- Excluye los Directos pendientes sin marcador de balance, racha, medias, P1… y gráficos.
- Unifica el orden cronológico de todas las vistas.
- Evita perder operaciones creadas durante una sincronización y exige respuestas JSON sin caché.
- El service worker no intercepta API ni orígenes remotos y nunca devuelve la app como datos.
- Sustituye el monograma BC por «Aro vector»: símbolo geométrico sin letras, legible a 32 px y coherente en cabecera, iconos y maskable.
- Sube la caché a `estadisticas-v7-1-20261112-logo-aro-vector`.
- Navegación y franja segura cambian correctamente entre claro y oscuro.
- Selector global Totales / Por partido; tarjetas con etiquetas explícitas y visualizaciones diferenciadas.
- Ratios manuales de robos/pérdidas y rebote ofensivo, con cobertura visible.
- Medias manuales de jugadora con denominador de partidos registrados; ausencias como `null`.
- Columnas ROB, PER, REB O y REB R en el acta cuando existe Directo, incluso si un valor es cero.
- Gráficos desplazables para 20+ partidos y separación visual de series coincidentes.
- Mapa de tiro con puntos algo mayores y arrastre móvil sin desplazar la página.
- Añade `.gitignore`, refuerza pruebas, actualiza documentación y genera guía PDF con capturas reales.
- Alinea Gem de Gemini y Proyecto de Claude con el flujo JSON `find`/`replace` de `actualizar.html`.

## v7 · 12 de noviembre de 2026
- Reparto de puntos y minutos abren la plantilla completa de 14 jugadoras.
- Mapa de minutos horizontal táctil; faltas con FAL/40; valoración por partido.
- Tarjetas y detalles con criterio; Directo con robos, pérdidas y REB O.
- Flujo de mapa con JSON visible, validación, edición y guardado.
- Clave `estadisticas_shared_v2` y Worker w2 conservados.

## v6
Panel gráfico, comparativas BC/rival, minutos, doble referencia individual, TL% nulo, Directo y área segura.

## v5
Directo descartable, Equipo sin jugadora, primeras comparativas y faltas recibidas.
