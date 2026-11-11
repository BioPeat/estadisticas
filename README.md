# Estadísticas v2

Aplicación web instalable para las estadísticas compartidas de **Buen Consejo · 26/27**.

## Qué incluye

- **Directo móvil sin scroll** en 360×640, 390×844 y 412×915: rival, cuarto, cuatro acciones, contadores, deshacer y finalizar.
- Importación local de plantilla y actas `.xlsx` de Afición FBM.
- Estadísticas de equipo y jugadoras basadas únicamente en datos disponibles.
- Mapa de **ataque** y de **defensa** en media pista, por partido y temporada.
- Sincronización local-first mediante Worker de Cloudflare + D1.
- Enlaces individuales de administrador, edición y lectura.
- PWA instalable, modo claro y oscuro.

## Datos honestos

La app arranca vacía. Nunca carga partidos ni estadísticas de demostración. Los ceros no fiables de las actas FBM en rebotes, asistencias, robos y pérdidas se ignoran. Hasta que se apunten en Directo se muestra `—`.

Los campos `TC 2P` y `TC 3P` de las actas representan **canastas anotadas**, no intentos reales. Por eso no se calculan FG%, 2P%, 3P%, eFG%, TS%, posesiones, ritmo, uso, PER, ORtg ni DRtg. El porcentaje de tiros libres sí es válido.

## Mapa de tiro

1. En Afición FBM, busca **BUEN CONSEJO** en la cabecera.
2. El equipo de arriba tira en la mitad izquierda; el de abajo, en la derecha.
3. El color y las columnas de jugadoras sirven para confirmar.
4. La IA devuelve `ownShots` y `opponentShots`; la app refleja la mitad derecha sobre la misma media pista.
5. Antes de guardar puedes intercambiar equipos, cambiar el tipo de un punto, arrastrarlo o borrarlo.

Consulta `PROMPT_MAPA_TIRO.md` para la regla y el JSON exactos.

## Desarrollo local

```bash
python -m http.server 8000
# abre http://localhost:8000
```

No abras `index.html` con doble clic: la instalación PWA y el caché necesitan HTTP/HTTPS.

## Pruebas

```bash
python tests/smoke.py
python tools/validate.py
```

Las pruebas usan las tres actas reales suministradas solo como fixtures; la app de producción no las carga automáticamente.

## Publicación

1. Copia **todo** el contenido de esta carpeta en la raíz del repositorio `estadisticas`.
2. Publica con GitHub Pages.
3. Crea un Worker y una base D1, usa `worker.js` y el binding `DB`.
4. Configura el secreto `SETUP_SECRET`, ejecuta una vez `POST /api/setup` y conecta la app con el token de administrador.

La guía PDF de `2_PARA_TI` explica el proceso clic a clic.
