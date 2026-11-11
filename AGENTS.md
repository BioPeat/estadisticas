# AGENTS.md · Estadísticas v3

## Objetivo
Mantener una PWA sencilla y fiable para Buen Consejo 26/27. Los datos deben ser reales, trazables y compatibles con instalaciones existentes.

## Reglas que no se pueden romper
1. Conservar `STORE='estadisticas_shared_v2'` y migrar sin borrar datos.
2. No inventar estadísticas. Mostrar `—` cuando la fuente no exista.
3. No calcular FG%, 2P%, 3P%, eFG%, TS%, posesiones, ritmo u ORtg/DRtg con estas actas.
4. Guardar los dos equipos completos: `players`, `opponentPlayers`, `teamTotals`, `opponentTotals`.
5. Dos filas `X · NOMBRE` son dos personas distintas dentro del acta; no deduplicarlas.
6. Las cuatro zonas son exactamente: Pintura, Media distancia, Triple de esquina y Triple.
7. Coordenadas: `x` 0–1 de banda izquierda a derecha; `y` 0–1 de fondo a medio campo.
8. La pista es media pista FIBA SVG de 15×14 m. Aro a 1,575 m; triple a 6,75 m; esquinas a 0,90 m de banda; zona de 4,90 m; círculo de TL de radio 1,80 m.
9. La pista de lectura usa `touch-action: pan-y`. Solo bloquear gesto mientras se arrastra un punto del editor.
10. Antes de Directo debe haber scroll. En Directo en curso todo debe caber en 360×640.
11. Mantener rutas locales de `assets/`; no añadir CDN.
12. Actualizar `APP_VERSION`, caché del service worker, documentación, tests y capturas en cada versión.

## Flujo de cambio barato con IA
- Un chat nuevo por cambio.
- Abrir `actualizar.html`, elegir un único archivo y descargar el paquete enfocado.
- Pedir a la IA el archivo completo, nunca fragmentos con “resto igual”.
- Pegar, aplicar, comprobar, descargar y sustituir.
- Ejecutar validación y smoke.

## Cierre obligatorio
```bash
node --check app.js
python tools/validate.py
python tests/smoke.py
python tools/capture.py capturas
```
Revisar móvil y PC, claro y oscuro, y comprobar que ninguna captura muestra datos de prueba como producción.
