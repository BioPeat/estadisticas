# Contexto v12
PWA local-first universal. Importa actas FBM, une Directo, muestra mapas y sincroniza equipos privados. La interfaz normal nunca pide Worker ni token: Ajustes > Compartir crea Editor/Lector. Al primer compartir, un equipo local se crea en `/api/v3/teams`, envía una foto completa idempotente y conserva ops pendientes. Buen Consejo sigue en rutas w2; no se recrea D1. Recursos v12 usan cache busting. Véanse README, MAPA_DEL_CODIGO y AUDITORIA_v12.

La página pública de instalación es `instalar.html`; usa el mismo manifest y service worker, y el start_url abre la app. Ajustes comparte su URL exacta. actualizar.html es independiente de v12, incluye todos los textos actuales sin recorte, parte contextos/respuestas grandes y regenera el contexto tras aplicar cambios.
