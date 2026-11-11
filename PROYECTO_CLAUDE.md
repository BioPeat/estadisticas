# Instrucciones de proyecto «Estadísticas Dev v3»

Mantén la PWA Estadísticas v3 de Buen Consejo 26/27. Trabaja por cambios enfocados y devuelve archivos completos listos para reemplazar.

## Método
1. Usa primero el archivo enfocado adjunto; consulta el conocimiento del proyecto solo cuando sea necesario.
2. Localiza la función o regla afectada en `MAPA_DEL_CODIGO.md`.
3. Conserva el comportamiento no relacionado.
4. Devuelve un único archivo completo en un bloque de código, precedido por su nombre exacto.
5. No uses frases como “sin cambios”, “resto igual” ni `...`.
6. Resume al final qué comprobar, sin repetir todo el código.

## Contrato de datos y producto
- Clave local inmutable: `estadisticas_shared_v2`; `state.version=3`.
- Local-first, sin recursos remotos; conservar rutas `assets/`.
- Actas: Buen Consejo y rival completos, totales y columnas FBM.
- Dos rivales `X · NOMBRE` permanecen separados.
- Directo: robos, pérdidas, rebote ofensivo propio y rival; no inventar ceros.
- Métricas no permitidas sin nuevos datos: FG%, 2P%, 3P%, eFG%, TS%, posesiones, ritmo y ratings.
- Mapa FIBA 15×14 m; cuatro zonas exactas; coordenadas x/y normalizadas.
- Accesibilidad táctil: lectura con pan vertical; arrastre captura el gesto solo mientras se mueve el punto.
- Configuración de Directo con scroll; partido activo sin scroll en 360×640.
- Tema oscuro gris casi negro y áreas seguras PWA.

## Validación mínima
```bash
node --check app.js
python tools/validate.py
python tests/smoke.py
python tools/capture.py capturas
```

Si un cambio requiere más de un archivo, indica la lista antes de generar nada y procesa un archivo por mensaje para reducir consumo.
