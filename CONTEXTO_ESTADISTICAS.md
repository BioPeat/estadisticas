# Contexto · Estadísticas v5

Aplicación PWA de Buen Consejo, temporada 26/27. Importa actas FBM de ambos equipos, registra cuatro eventos durante el partido y permite añadir mapas de canastas anotadas.

## v5
- Tema claro y oscuro coordinado con `theme-color`, fondo de `html/body`, área segura y barra inferior.
- Directo: evento sin jugadora, deshacer, descartar sincronizado con confirmación y finalizar.
- Equipo: marcador sin relleno, etiquetas y acceso al partido; reparto real por puntos totales; top 3; margen por partido; minutos; comparación ataque/defensa; faltas recibidas desde las faltas rivales; mapas por cuatro zonas.
- Jugadoras: una fila por jugadora, PTS/P · MIN/P · VAL/P visibles y cabeceras ordenables.
- Acta: FR individual se oculta si el Excel lo trae a cero; eventos sin jugadora aparecen solo en TOTALES.

## Límites honestos
Los Excel FBM aportan canastas anotadas e intentos de TL, pero no intentos de 2P/3P fiables. Los mapas contienen canastas, no fallos. Robos, pérdidas y rebotes de Directo solo son completos si se apuntan durante todo el partido.

## Sincronización
La operación de descarte es `live-upsert` con `live:null`; los demás dispositivos eliminan el Directo activo al recibirla. No se ha cambiado `worker.js` ni la configuración de Cloudflare.
