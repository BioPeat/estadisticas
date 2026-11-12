# Contexto estadístico · v9

## Fuentes
- **Acta FBM:** marcador, minutos, canastas anotadas, TL, faltas, valoración y columnas que el Excel rellene de forma fiable.
- **Directo:** robos, pérdidas, rebote ofensivo BC y rebote ofensivo rival.
- **Mapa:** ubicación de canastas, no intentos.

## Ausencia frente a cero
Un partido sin Directo es `null`/ausente: no entra en totales, medias, ratios ni evoluciones manuales. Un partido grabado con Directo y cero acciones sí aporta 0. La interfaz mantiene siempre el bloque y dice «Sin datos registrados todavía» cuando la cobertura es nula.

## Métricas permitidas
- Totales, por partido y diferencia BC−rival de variables observadas.
- Margen, porcentaje de victorias y pesos de 2P/3P/TL sobre puntos.
- ROB/PER, ROB−PER y robos/(robos+pérdidas).
- REB O BC−rival, REB O BC/(BC+rival) y ratio BC/rival.
- FAL/P, FAL/40, VAL/P, PTS/40 y cuotas de puntos/minutos.

## Métricas no permitidas aún
FG%, 2P%, 3P%, eFG%, TS%, TOV%, ORB% estándar, posesiones y ratings. Los Excel reales muestran intentos 2P/3P no fiables y no aportan todos los rebotes defensivos necesarios. Referencias: FIBA Statisticians' Manual 2024 v2 y Four Factors de Dean Oliver.
