# Auditoría v11 · crítica iterativa

## Ronda 1 · comprensión sin contexto

**Críticas:** las cuotas no decían su denominador; Directo parecía otra aplicación; ROB/PER se confundía con el balance; el marcador ocultaba temporadas largas y sus diferencias eran ilegibles.

**Mejoras aplicadas:** selector Por partido/Temporada, etiquetas completas, Directo integrado y condicional, explicación de ratio frente a balance, PER=0 seguro, 15–16 px en diferencias, todos los partidos y ampliación táctil.

## Ronda 2 · coherencia visual e interacción

**Críticas:** cada tarjeta usaba un mini gráfico distinto, varias barras no contaban una historia temporal y comparar no permitía ver la evolución.

**Mejoras aplicadas:** evolución BC/rival común en todas las tarjetas, puntos separados cuando coinciden, huecos para ausencia, detalle desplazable y acceso al acta desde los puntos.

## Ronda 3 · privacidad y multiequipo

**Críticas:** el estado único podía mezclar equipos; las rutas w2 no separaban datos; los tokens de invitación en query podían llegar al servidor de la web; faltaba revocar enlaces.

**Mejoras aplicadas:** libro local de espacios, conexión/cola/secuencia por equipo, D1 con `team_id`, enlaces nuevos en fragmento `#`, limpieza inmediata de la barra, roles y revocación. Las rutas y tablas w2 permanecen para Buen Consejo.

## Ronda 4 · operación real

**Críticas:** una persona sin conocimientos podía confundir instrucciones estables, conocimiento del Gem y código de cada actualización; activar el servicio público obligaba a editar JavaScript.

**Mejoras aplicadas:** `configurar.html` genera `config.js`; `actualizar.html` produce un único contexto actual y aplica varios archivos; pruebas automáticas ejecutan una petición multiarchivo real.

## Ronda 5 · universalidad real

**Críticas:** «Jugadoras» y rojo/azul seguían haciendo que un equipo masculino o neutro pareciera una copia de Buen Consejo.

**Mejoras aplicadas:** género por equipo, detección de categoría FBM, elección manual cuando no hay certeza, textos adaptativos y paleta azul/naranja accesible por defecto. El color propio es configurable y se sincroniza; Buen Consejo conserva femenino y rojo/azul. Se probaron femenino, masculino y sin detección.

## Límites honestos antes de una integración oficial

La PWA v11 funciona como producto autogestionado, pero no debe presentarse aún como servicio oficial de federación. Antes hacen falta: responsable de hosting, política de privacidad y conservación, borrado de equipos en nube, recuperación segura del propietario, límites/antiabuso para creación pública, revisión de seguridad externa, accesibilidad formal y acuerdo técnico con Afición FBM. No se ha supuesto que exista una API o mecanismo de instalación dentro de esa app.
