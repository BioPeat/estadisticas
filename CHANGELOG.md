### v12.3 · 2026-11-18 · Worker seguro, conflictos y landing
- Worker w5-v12.3: límite real del stream, CORS restringido, esquema versionado, rate limit atómico y limpieza, cuota por token/equipo, último uso y caducidad opcional, id de petición y borrado completo del equipo.
- Compatibilidad: rutas/tablas w2 intactas, migraciones D1 solo aditivas y tolerantes; la app sigue operativa si el Worker nuevo aún no está publicado.
- Dos editores: revisiones y updatedAt por partido/mapa; reemplazos antiguos no pisan cambios nuevos; Directo se fusiona por id.
- App: gestión para quitar personas de la plantilla sin borrar estadísticas; confirmación fuerte para borrar de la nube.
- Diseño: escalas mínimo/máximo/cero, objetivos táctiles de 40–44 px y refuerzo de textos pequeños; sin color por columna en la ficha.
- Instalar: nueva landing móvil primero con tres pasos, beneficios, capturas reales anonimizadas, público, privacidad/roles, FAQ, CTA fija, SEO/Open Graph y fallbacks de instalación.
- Pruebas: D1 simulado, conflictos, Pozuelo como segunda copia, validate, smoke, actualizador y capturas multiformato.
- Gemini/Claude/Cloudflare: instrucciones y pasos de publicación actualizados.

### v12.2 · 2026-11-18 · revisión de la auditoría externa
- Seguridad: datos remotos saneados (ids, fechas y marcadores) y textos escapados; actualizar.html escapa updateId/targetVersion.
- Enlaces: el rol lo confirma el servidor; abrir un enlace más débil ya no sustituye un acceso de propietario; el lector no puede editar Ajustes.
- Sincronización: bucle siempre activo (también para equipos creados o compartidos después), pausa en segundo plano, paginación y estado real (Pendiente / Sin conexión).
- Datos: reimportación exige fecha cercana y misma condición casa/fuera; mapas se fusionan sin perder puntos; unión automática al arrancar solo con coincidencia muy alta; convocatoria del Directo guardada.
- Copias: exportar no incluye claves; nuevo «Restaurar copia» (crea un equipo nuevo, nunca sobrescribe); quitar un equipo pide confirmación.
- Estadística: faltas/40 de equipo corregidas (÷5), porcentajes con %, cuota de minutos con los minutos reales del acta (prórrogas), aviso de empate, validación de más columnas, minutos con coma.
- Gráficos: barras de Diferencia/Comparar/Posesiones realmente divergentes (arriba ventaja, abajo desventaja); mapas vacíos dicen «Sin mapa».
- Primer uso: si el acta no coincide con el nombre del equipo, la app pregunta cuál es el tuyo.
- Service worker: solo borra sus cachés y exige los recursos esenciales; recarga una vez al activarse una versión nueva (nunca durante un Directo).
- Instalar: «Abrir app» funciona tras instalar; más navegadores internos detectados. Configurar: acepta el Worker w4-v12.
- Pruebas: los servidores simulados exigen el token correcto; nueva regresión XSS.

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
