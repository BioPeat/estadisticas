# Contexto funcional · Estadísticas v7.1

## Fuentes
- Acta FBM: marcador, minutos, puntos, canastas anotadas, tiros libres, faltas, valoración y datos publicados de ambos equipos.
- Directo: robos, pérdidas, rebotes ofensivos BC y rebotes ofensivos del rival. Solo los partidos con eventos manuales entran en estas medias.
- Mapa: canastas detectadas por IA o colocadas manualmente; no son intentos ni porcentajes.

## Criterios de presentación
- Puntos, 2P, 3P, TL, TLI, TL% y faltas: comparación BC/rival útil en portada y completa en detalle.
- Valoración: media BC por partido en portada; total, rival, evolución y partidos dentro.
- Faltas: menor valor = mejor; detalle con FAL/40 para equipo y jugadoras.
- Robos/pérdidas: dos hechos de Buen Consejo, no un duelo completo contra el rival ni una métrica de posesiones.
- Rebote ofensivo: BC frente al rival, únicamente desde Directo.
- Minutos y reparto de puntos: vista rápida más modal con la plantilla completa.
- TL% agregado usa sumas de anotados/intentos; 0 intentos queda ausente.

## Mapa de tiro
La asignación se decide por cabecera: arriba corresponde a mitad izquierda; abajo a derecha. La IA cruza cabecera, color y lista. Si declara conflicto, la app no coloca puntos. El usuario puede revisar, mover, intercambiar, borrar, vaciar y guardar ataque/defensa.

## Persistencia, nube y publicación
La clave local sigue siendo `estadisticas_shared_v2`. `worker.js` conserva el contrato w2. Reimportar un acta conserva Directo y mapas. Roles admin/editor/viewer continúan. Antes de publicar se exporta una copia; después se sustituyen archivos en GitHub, se espera a Pages y se fuerza una recarga completa.

## Tema y marca
En ejecución, `theme-color`, navegación móvil y guardia inferior siguen el tema: superficie clara en claro y oscura en oscuro. El color final de botones/gestos lo controla Android. El logo v7.1 «Aro vector» no usa letras: un aro blanco representa balón/pista, la línea roja una evolución y el punto verde el último dato. El fondo PWA permanece `#10233f`.

## Auditoría v7.1
- Los pendientes de Directo sin marcador no son partidos disputados.
- El orden canónico es fecha, importación e id; P1, P2… coincide en selectores, gráficos y detalles.
- Estadísticas permite cambiar entre total y por partido. Los detalles conservan ambas escalas.
- Gráficos largos se desplazan horizontalmente; las series iguales se separan y el rival usa trazo discontinuo.
- Ratios manuales: ROB/PER, balance ROB−PER, cuota de acciones positivas, cuota REB O y balance REB O. Solo usan partidos con Directo.
- No se calculan posesiones, ratings, eFG% ni TS% porque el Excel no aporta FGA fiables.
