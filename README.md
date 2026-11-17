# Estadísticas v12

PWA local-first y multiequipo para actas FBM, Directo, mapas y sincronización privada.

## Novedades visibles
- Marcador horizontal desplazable, etiquetas legibles y ventana ampliada.
- Diferencia como un único valor con signo y barras divergentes.
- Gráficos por criterio: evolución en Por partido, barras en Totales y balance en Comparar.
- Posesiones extra de Directo: `(REB O propios + robos) − (REB O rival + pérdidas propias)`.
- Etiquetas universales basadas en el nombre del equipo; paletas Azul, Verde, Morado y Rojo.
- Ficha individual sin FAL/40; «PER» se presenta como Pérdidas; balance `(ROB + REB O) − pérdidas`.
- Compartir sin configuración: Editor o Lector. El primer enlace sube automáticamente el equipo local.
- Ajustes normales sin URL del Worker ni token.
- Recursos `?v=12` y service worker network-first para evitar mezclar versiones.

## Publicar
1. Conserva tu carpeta `assets/`; no viene en este paquete.
2. Copia esta carpeta sobre el repositorio respetando `.github`, `tests` y `tools`.
3. Publica el Worker de `5_CLOUDFLARE` antes de probar equipos nuevos compartidos.
4. Haz commit y espera a GitHub Actions/Pages.
5. Cierra y abre la PWA.

## Comprobar
```bash
python tools/validate.py . --allow-assets
python tests/smoke.py
```
Chromium solo usa la ruta `/opt/pw-browsers/...` si existe; en GitHub Actions usa la instalación normal de Playwright.

## Página pública para instalar
La landing independiente es `instalar.html`. La dirección que se comparte es **la URL actual de GitHub Pages de la app terminada en `/instalar.html`**. Por ejemplo, si la app abre en `https://USUARIO.github.io/REPOSITORIO/`, la dirección exacta es `https://USUARIO.github.io/REPOSITORIO/instalar.html`.

Como el dominio y repositorio no están escritos en el código, Ajustes incluye **Compartir página de instalación**: al pulsarlo copia o comparte la URL exacta del sitio publicado, sin que el usuario tenga que construirla.

Chrome/Edge/Android permiten el aviso de instalación en un toque cuando disparan `beforeinstallprompt`. iPhone/iPad Safari y navegadores internos no permiten iniciarlo desde JavaScript; la landing detecta el caso y muestra `Compartir → Añadir a pantalla de inicio` o pide abrir en Chrome/Safari.

## Actualizaciones completas con IA
`actualizar.html` cubre todo archivo de texto del repositorio salvo `assets/`, acepta sustitución completa, creación, borrado, varias partes y subidas de versión. Siempre genera el contexto posterior. Véase `PRUEBAS_ACTUALIZADOR_E2E.md`.
