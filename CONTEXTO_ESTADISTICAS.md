# Contexto funcional · v4

- Equipo: Buen Consejo, temporada 26/27.
- Fuente principal: Excel de estadísticas descargado de Afición FBM.
- Fuentes complementarias: Directo y mapas de tiro.
- Almacenamiento local: `estadisticas_shared_v2`.
- Sincronización: eventos mediante el Worker existente; la v4 evita repintar si no cambian datos y nunca repinta mientras se edita un campo.

## Migración v3 → v4

`sanitise` mantiene IDs, fechas, eventos y mapas. Un partido FBM sin rival o sin totales queda marcado con `needsReimport`. Al reimportar, se busca primero rival + marcador y se sustituye el acta dentro del mismo partido.

## Límites de datos

Las actas contienen aciertos de 2 y 3, pero no intentos fiables de campo. Por eso solo es válido el porcentaje de TL. Rebotes, asistencias, robos y pérdidas de la FBM pueden estar a cero si la competición no los publica; las columnas completamente vacías se ocultan en el acta.

## Vistas

- Equipo: marcador, composición de puntos, comparación, concentración e indicadores.
- Jugadoras: medias por partido y por 40; evolución seleccionable por partido con media de equipo.
- Partidos: acta completa de ambos equipos y mapa.
- Directo: cuatro eventos manuales y unión posterior al acta.
