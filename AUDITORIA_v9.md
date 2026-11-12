# Auditoría dura · Estadísticas v9

Fecha: 12 de noviembre de 2026.

## Ronda 1 · empezar desde cero
**Crítica:** la v7.1 tenía código de ROB/PER/REB O, pero `renderLiveMetrics()` devolvía vacío sin eventos; para el usuario la funcionalidad no existía. Las columnas DIRECTO y el bloque individual también desaparecían sin cobertura.

**Corrección:** sección, tarjetas, bloque de jugadora y columnas del acta permanecen visibles. La ausencia usa guiones y «Sin datos registrados todavía»; nunca se agrega ni divide como 0.

## Ronda 2 · utilidad estadística
**Crítica:** dos escalas no cumplían «total, por partido o comparación» y varias tarjetas repetían el mismo gráfico.

**Corrección:** tercer modo Comparar, nuevas lecturas de diferencia, victorias y composición de puntos; líneas, barras, anillos, columnas y balances según la variable. El detalle reúne total, media, evolución y reparto.

## Ronda 3 · crecimiento y móvil
**Crítica:** una temporada de 25 partidos podía comprimir etiquetas o líneas coincidentes; filas y selectores podían apretarse.

**Corrección:** lienzos de ancho creciente dentro de scroll táctil, resúmenes de últimos partidos, rival discontinuo, puntos coincidentes separados, elipsis de una sola línea y selectores adaptables.

## Ronda 4 · acta y mapa
**Crítica:** sin Directo no se podía comprobar que existían columnas manuales. Los puntos del mapa eran pequeños para edición táctil.

**Corrección:** DIRECTO siempre visible para BC, aviso explícito de ausencia y puntos de edición de radio 24 sobre geometría FIBA 15 × 14 m.

## Verificación
Pruebas en 360×640, 390×844, 412×915 y 1440×980; claro/oscuro; 3 y 25 partidos; con y sin Directo; acta, jugadoras, mapa, migración y Worker w2. Los Excel originales solo se usaron para confirmar estructura y resultados 40–65, 64–36 y 61–48.
