# CHANGELOG

## v12 · 2026-11-17
- Marcador móvil sin solapes, diferencias de 18–19 px con halo, desplazamiento horizontal y detalle completo.
- Diferencia propia única; elimina el valor rival opuesto.
- Visualizaciones distintas por modo y barras para tarjetas con un solo partido.
- Nueva tarjeta Posesiones extra, solo con Directo; La Dehesa valida +13.
- Terminología universal: nombre del equipo/Rival; «Rojo» y paletas accesibles renovadas.
- Ficha individual sin FAL/40; Pérdidas sin ambigüedad; balance `(ROB + REB O) − pérdidas`.
- Lista de jugadores corregida a 360–412 px y ficha con color sutil.
- Ajustes simplificados: sin Worker, URL ni token. Compartir crea enlaces Editor/Lector.
- Primer compartir de un equipo local crea su espacio privado y envía estado completo, conservando operaciones pendientes.
- Worker w4-v12 compatible con w2: no recrea D1, no exige `/api/setup`, añade límites básicos.
- Cache busting v12 y service worker network-first.
- GitHub Actions y scripts Playwright sin ruta fija obligatoria.
- Nuevo `instalar.html`: landing responsive, claro/oscuro, logo Aro vector, funciones reales, capturas v12 anonimizadas e instalación/fallback por navegador.
- Ajustes permite compartir la URL exacta de la landing publicada.
- `actualizar.html` pasa a ser universal: repositorio completo, contexto íntegro, multipartes, archivos completos, creación/borrado, autocambio y versiones futuras.
- Nueva regresión `tests/updater_e2e.py` con tres peticiones realistas y prueba v12→v13.
