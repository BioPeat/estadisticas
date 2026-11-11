# Contexto funcional · Estadísticas v7

## Fuentes
- Acta FBM: marcador, minutos, puntos, canastas anotadas, tiros libres, faltas, valoración y datos de ambos equipos publicados en el Excel.
- Directo: robos, pérdidas, rebotes ofensivos BC y rebotes ofensivos del rival. Solo los partidos con eventos manuales entran en estas medias.
- Mapa: canastas detectadas por IA o colocadas manualmente; no son intentos ni porcentajes.

## Criterios de presentación
- Puntos, 2P, 3P, TL, TLI, TL% y faltas: comparación BC/rival útil en portada y completa en detalle.
- Valoración: media BC por partido en portada; total, rival, evolución y partidos dentro.
- Faltas: menor valor = mejor; detalle con FAL/40 para equipo y jugadoras.
- Robos/pérdidas: dos hechos de Buen Consejo, no un duelo completo contra el rival y no una métrica de posesiones.
- Rebote ofensivo: BC frente al rival, únicamente desde Directo.
- Minutos y reparto de puntos: vista rápida más modal con la plantilla completa.
- TL% agregado usa sumas de anotados/intentos; 0 intentos queda ausente.

## Mapa de tiro
La asignación se decide por cabecera: arriba corresponde a mitad izquierda; abajo a derecha. La IA debe cruzar cabecera, color y lista. Si declara conflicto, la app no coloca puntos. El usuario puede revisar, mover, intercambiar, borrar, vaciar y guardar ataque/defensa.

## Persistencia y nube
La clave local sigue siendo `estadisticas_shared_v2`. `worker.js` conserva el contrato w2. Reimportar un acta conserva Directo y mapas. Roles admin/editor/viewer continúan.

## Área inferior Android
El manifest usa azul noche fijo. En móvil, navegación y guardia inferior usan el mismo `#10233f` en ambos temas para que la barra del sistema observada se funda visualmente con la app. La emulación verifica superficies web; el color final de botones/gestos lo controla Android y requiere comprobación física.
