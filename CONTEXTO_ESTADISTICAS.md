# Contexto de Estadísticas v6

PWA local-first para Buen Consejo, temporada 26/27. Importa plantilla y actas XLSX de la FBM, muestra estadísticas de equipo/jugadoras, registra eventos en Directo y mantiene mapas de canastas.

## Fuentes y límites
- Acta FBM: puntos, minutos, 2P/3P anotados, TL anotados e intentados, faltas, valoración y +/- de ambos equipos.
- Rebotes, asistencias, robos y pérdidas de la hoja suelen venir a cero/no publicados: solo se muestran como Directo cuando existen eventos reales.
- No hay intentos fiables de 2P/3P; están prohibidos los porcentajes de campo y métricas derivadas de posesiones.
- Faltas recibidas de equipo = faltas del rival. No atribuirlas individualmente.
- TL% sin intentos = dato ausente, nunca 0%.

## Experiencia v6
- Equipo compara siempre Buen Consejo y rival; cada métrica abre total, media, evolución, reparto y partidos.
- El margen solo aparece como diferencia dentro de Marcador.
- Minutos permite temporada, media y partido; el detalle incluye mapa jugadora×partido, evolución y cuota.
- Jugadora compara con media del equipo en cada partido y con referencia de temporada.
- Directo ocupa todo el espacio disponible y conserva Equipo, Deshacer, Descartar y Finalizar.
- Tema: `html`, `body`, navegación, guardia de área segura y `theme-color` cambian juntos.

## Persistencia
La clave local sigue siendo `estadisticas_shared_v2`. La nube sincroniza operaciones, no reemplaza el modelo local. `worker.js` conserva el contrato w2 y no cambió en v6.
