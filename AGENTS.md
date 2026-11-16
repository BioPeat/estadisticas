# Reglas de mantenimiento · v11

- No modificar el SVG `data-logo="aro-vector"` ni entregar `assets/`.
- Mantener `STORE = 'estadisticas_shared_v2'`: es la fuente de migración de Buen Consejo.
- Mantener `MULTI_STORE = 'estadisticas_multiteam_v11'` y el aislamiento por espacio.
- Mantener las rutas w2 del Worker (`/api/events`, `/api/invites`, `/api/setup`) y sus tablas.
- No incluir URL real, tokens, copias privadas, Excel, capturas con credenciales ni datos inventados.
- Conservar `team.gender` y `team.color`; Buen Consejo se migra como `female` + `red`. La paleta por defecto es azul/naranja y los textos usan `genderTerms()`.
- Directo ausente es `null`/hueco, no cero. ROB/PER es un cociente; Balance ROB−PER lleva el signo.
- Todo gráfico de temporada larga debe desplazarse, no comprimirse indefinidamente.
- Antes de publicar: `node --check`, `tools/validate.py`, `tests/smoke.py`, claro/oscuro y tres tamaños móviles.
