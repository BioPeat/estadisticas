# AGENTS.md · Estadísticas v6

## Orden de trabajo
1. Lee `CONTEXTO_ESTADISTICAS.md` y `MAPA_DEL_CODIGO.md`.
2. Cambia el menor número posible de archivos; usa `actualizar.html` para un cambio enfocado.
3. Conserva contratos de datos y funciones públicas.
4. Ejecuta `python tools/validate.py .` y `python tests/smoke.py`.
5. Revisa 360×640, 390×844, 412×915 y 1440×980, claro y oscuro.

## Contratos que no se rompen
- PWA sin build: `index.html`, `styles.css`, `app.js` y JSZip local.
- Almacén: `estadisticas_shared_v2`; la migración admite versiones anteriores.
- Excel FBM de los dos equipos es la fuente de actas. No inventar estadísticas.
- No calcular FG%, 2P%, 3P%, eFG%, TS%, posesiones ni ratings.
- TL% con 0 intentos es `null`/«sin tiros» y no entra en medias.
- `playerId:null` es Equipo (sin jugadora). Descartar Directo sincroniza `live:null`.
- Acta, mapas, roles, sincronización y unión Directo↔acta deben seguir funcionando.
- `worker.js` no se modifica para cambios de interfaz o métricas.

## Logo definitivo: bloqueado
No modificar nunca el SVG de `index.html`, `assets/icon-192.png`, `assets/icon-512.png` ni `assets/icon-maskable-512.png`. Colores fijos: `#10233f`, `#18365f`, `#ed304c`, `#7455dc`, `#18a985`. El logo es idéntico en claro y oscuro.

## Definición de terminado
Datos propios y rivales visibles; tarjeta de Margen ausente; minutos con temporada/media/partido y detalle; referencias individuales de partido y temporada; TL nulo sin intentos; Directo sin scroll con objetivos grandes; área segura igual al tema; caché de `sw.js` nueva si cambian recursos.
