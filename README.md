# Estadísticas v3 · Buen Consejo 26/27

Aplicación web local-first para importar actas FBM, registrar acciones en directo, revisar actas completas de ambos equipos y analizar mapas de canastas sobre media pista FIBA.

## Publicación

1. Conserva en el repositorio la carpeta `assets/` existente (`jszip.min.js`, `icon-192.png`, `icon-512.png`).
2. Copia sobre la raíz todo el contenido de `1_CODIGO_GITHUB` y reemplaza.
3. Commit y Push a `main`.
4. GitHub Pages publica desde `main / root`.
5. El Worker de Cloudflare usa `worker.js`, un binding D1 llamado `DB` y el secreto `SETUP_SECRET`.

## Datos y migración

- La clave local sigue siendo `estadisticas_shared_v2`: v3 la migra en sitio y no obliga a reinstalar.
- `state.version` pasa a `3`.
- Se conservan plantilla, actas, mapas, Directo, configuración y cola de sincronización.
- Cada acta guarda `players` y `opponentPlayers`, además de los totales de los dos equipos.
- No se calculan FG%, 2P%, 3P%, eFG%, TS%, posesiones ni ratings porque las actas de esta temporada no aportan intentos fiables de campo.

## Funciones principales

- Directo: configuración desplazable; tablero en curso sin scroll en 360×640, 390×844 y 412×915.
- Acta completa: 26 columnas, dos equipos, primera columna y nombre fijos, desplazamiento horizontal y orden ascendente/descendente.
- Jugadoras: totales, medias, por 40, cuotas, valoración, +/-, Directo, evolución y navegación al partido.
- Equipo: Estadísticas avanzadas separadas en Ataque y Defensa, con desglose al tocar.
- Mapas: SVG FIBA de 15×14 m y cuatro zonas exactas: Pintura, Media distancia, Triple de esquina y Triple.
- Tema: claro y oscuro gris neutro; `theme-color` se actualiza con el tema y respeta áreas seguras.
- `actualizar.html`: copia local, archivo enfocado, validación aislada y descarga.

## Pruebas

```bash
python tools/validate.py
python tests/smoke.py
python tools/capture.py capturas
```

Los fixtures se regeneraron a partir de los cuatro Excel reales y tres mapas simulados. La producción no los carga.
