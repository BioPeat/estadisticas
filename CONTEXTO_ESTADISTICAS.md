# Contexto · Estadísticas v2

## Producto

PWA compartida para el equipo femenino Buen Consejo, temporada 26/27. Máximo previsto: unas 20 personas. Todos ven el mismo conjunto de datos; el administrador entrega enlaces de edición o lectura.

## Flujo real

1. Antes del partido: rival, fecha y convocadas.
2. Durante el partido: cuarto manual; robo, pérdida, rebote ofensivo propio y rebote ofensivo rival; selección de jugadora excepto en el último; deshacer.
3. Después: importar acta FBM; unión aproximada por rival y fecha.
4. Mapa: copiar prompt, adjuntar captura a la IA personal, pegar JSON, comprobar asignación, corregir y guardar.

## Qué cambió en v2

- Media pista en lugar de pista entera.
- Datos de mapa separados: ataque (`shotsFor`) y defensa (`shotsAgainst`).
- Migración de coordenadas de pista completa.
- Regla definitiva por posición en la cabecera, con comprobación por color y columnas de jugadoras.
- Eliminación de datos semilla/demo y de ceros FBM no fiables.
- `—` y explicación cuando una métrica aún no existe.
- Directo compacto sin scroll en móvil.
- Tarjetas interactivas y densidad mayor.
- Dos mapas de calor de temporada, filtros cuando existen datos y comparación por zonas.

## Regla de identificación del mapa

- Cabecera: arriba tira izquierda; abajo tira derecha.
- Si Buen Consejo está arriba, sus tiros son la izquierda. Si está abajo, la derecha.
- Color: confirmación secundaria; Buen Consejo ha aparecido rojo en las capturas verificadas.
- Lista: columna izquierda corresponde al equipo de arriba; derecha al de abajo.
- La mitad derecha se refleja a la misma media pista.
- La app siempre ofrece intercambio manual antes de guardar.

## Evidencia disponible

- Plantilla: 14 jugadoras.
- Actas: Ensanche 40–65, Olímpico 61–48 y Las Rozas 36–64 (Buen Consejo visitante y ganador 64–36).
- Captura de mapa: Buen Consejo arriba, rojo e izquierda; Olímpico abajo, gris y derecha.
- Las fechas de los partidos no están dentro de las actas; la app propone la fecha del día y exige revisión.

## Métricas válidas

Resultado, puntos a favor/en contra, margen, puntos/minutos por jugadora, canastas de 2 y 3 anotadas, TL anotados/intentos y TL%, faltas, +/-, reparto de anotación, puntos por 40, cuota de puntos/minutos, frecuencia de eventos manuales, reparto de canastas por zona de ataque/defensa.

## Métricas no válidas

Porcentajes de 2/3/campo, eFG%, TS%, posesiones, ritmo, uso, PER, rating ofensivo/defensivo. Falta el denominador real.
