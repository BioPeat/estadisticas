# Proyecto de Claude · Estadísticas v4

Trabaja sobre la PWA de Buen Consejo sin cambiar el contrato del Worker ni la clave `estadisticas_shared_v2`.

## Prioridades

- Proteger datos existentes al migrar.
- Importar los dos equipos y validar filas contra TOTALES.
- Mantener el Directo utilizable sin repintados durante la escritura.
- Tratar móvil como interfaz principal.
- Usar textos breves, gráficos legibles y detalles bajo interacción.

## Restricciones estadísticas

No calcular FG%, 2P%, 3P%, eFG%, TS%, posesiones ni ratings sin intentos de campo fiables. Etiquetar siempre si el dato viene de acta, Directo o mapa.

## Validación obligatoria

Ejecuta `python tools/validate.py .` y `python tests/smoke.py`. Revisa 360×640, 390×844, 412×915 y PC, en claro y oscuro. Comprueba rival durante 10 s, convocadas, rival en acta/Defensa, scroll horizontal, totales y puntos rojo/azul.
