# Revisión de la auditoría externa (GPT 6.1 Sol) · v12.2

Revisado por Opus 5.5 contra el código real. Leyenda: ✅ de acuerdo y corregido · 🟡 de acuerdo en parte · ❌ no de acuerdo · ⏸ de acuerdo, aplazado (motivo).

| ID | Veredicto | Comentario |
|---|---|---|
| A-001 | ❌ | Falso positivo. app.js envía `Authorization: Bearer ${token}` en las 5 llamadas; el «******» lo puso el sistema que ocultó el texto al adjuntarlo. |
| A-002 | ✅ | Los simuladores de smoke.py ahora exigen el token correcto (401 si no). |
| A-003/A-004 | ✅ | Temporada y meta escapadas; ids, fechas y marcadores saneados al cargar cualquier dato (local o remoto). Regresión XSS añadida. |
| A-005 | ✅ | updateId/targetVersion escapados en actualizar.html. |
| A-006 | ✅ | El rol se confirma con el servidor (GET del equipo) al abrir la app. |
| A-007 | ✅ | Un enlace de menor permiso no sustituye a un acceso de propietario/editor. |
| A-008 | ✅ | Ajustes en solo lectura para el lector. |
| A-009 | ✅ | Exportar ya no incluye token ni URL. |
| A-010 | ⏸ | CSP: GitHub Pages no permite cabeceras y la app usa scripts en línea; se mitiga con A-003/A-004. |
| A-011/A-054/A-055 | ✅ | Sincronización siempre activa, pausa en segundo plano, reintento al volver la red y paginación. |
| A-012 | ✅ | Estado real: En la nube / Pendiente · n / Sin conexión. |
| A-013 | ⏸ | Conflictos entre dos editores sin conexión: requiere versionado en Worker y cliente. Riesgo bajo en el uso actual. |
| A-014 | ✅ | Reimportar sin fecha exacta solo une si coincide casa/fuera y la fecha difiere ≤3 días. |
| A-015 | 🟡 | La unión automática al arrancar se mantiene solo con coincidencia muy alta; el resto, manual. |
| A-016 | ✅ | Mapas fusionados por id/coordenada. |
| A-017 | 🟡 | La fecha del nombre del Excel es la de DESCARGA, no la del partido, y el acta no trae fecha: se mantiene el campo de fecha obligatorio al importar. |
| A-018 | ✅ | Si el equipo no aparece en el acta, la app pregunta cuál es el tuyo. |
| A-019/A-020 | ✅ | Lectura por almacén con copia del dañado; aviso si no hay espacio. |
| A-021 | ✅ | Confirmación al quitar equipo; aviso fuerte si es solo local. |
| A-022 | ✅ | «Restaurar copia» crea un equipo nuevo, nunca sobrescribe. |
| A-023/A-024/A-025 | ✅ | SW: solo borra cachés «estadisticas-», exige recursos esenciales, recarga una vez al actualizar (no durante un Directo). |
| A-026–A-029, A-050–A-053 | ⏸ | Mejoras del Worker: obligan a volver a desplegar en Cloudflare. Se harán juntas en la próxima versión del Worker. |
| A-030 | ✅ | configurar.html comprueba capacidad multiequipo, no «w3». |
| A-031/A-032/A-035 | 🟡 | Comprobación de sintaxis JS, resumen de líneas por archivo y máximo de 50 partes. Las pruebas completas siguen en GitHub Actions. |
| A-033/A-034 | 🟡 | Correcto en el fondo; el LEEME ya explica parche y borrados. assets/ queda fuera a propósito. |
| A-036 | ⏸ | null frente a 0 por columna del acta: cambio amplio; hoy solo afecta a columnas que la FBM no publica (rebotes, asistencias). |
| A-037 | ✅ | Faltas/40 de equipo ÷5. |
| A-038 | ✅ | Peso del triple/TL con %. |
| A-039 | 🟡 | Aviso de empate al importar. |
| A-040 | ✅ | Cuota de minutos con los minutos del acta (prórrogas). |
| A-041/A-043/A-046 | ⏸ | Casos de actas incoherentes/plantilla acumulativa: sin incidencias reales; se revisarán con más actas. |
| A-042/A-044/A-045 | ✅ | Más columnas validadas, minutos con coma, coincidencia exacta del equipo primero. |
| A-047/A-048 | ✅ | Disponibilidad derivada de los datos; saneado robusto. |
| A-049 | ❌ | Cada acción tiene un id estable; reintentos reutilizan el mismo id. |
| A-056 | ✅ | El cambio de servidor por localStorage solo vale en localhost (pruebas). |
| A-057/A-059/A-063/A-065/A-076 | ⏸ | Diseño/accesibilidad: se abordarán en una revisión visual. |
| A-058 | ✅ | Barras divergentes reales: arriba ventaja, abajo desventaja. |
| A-060 | ✅ | Mapas sin datos muestran «Sin mapa». |
| A-061 | ❌ | Los puntos son canastas anotadas de la captura de Afición FBM; la etiqueta es correcta. |
| A-062 | ✅ | «Media de la plantilla · partido». |
| A-064/A-066 | ✅ | Fondo inerte con modal abierto; foco visible en convocatoria. |
| A-067 | ✅ | Fechas visibles en dd/mm/aaaa. |
| A-068/A-070 | ✅ | «Abrir app» tras instalar; más navegadores internos. |
| A-069 | ⏸ | Requiere prueba en iPhone físico. |
| A-071/A-072 | ❌ | Basados en A-001 o en la estructura del ZIP (5_CLOUDFLARE es carpeta de entrega). |
| A-073/A-074 | 🟡 | Autenticación y XSS cubiertos; pruebas con D1 real pendientes. |
| A-075 | ✅ | Código muerto eliminado. |
| A-077 | ✅ | Aviso visible si el Directo no cuadra con el acta. |
| A-078/A-079 | ✅ | Se guarda la convocatoria; quien no estaba convocado no cuenta como 0. |
| A-080 | ✅ | La descarga se libera a los 4 s. |


## Cierre v12.3
- A-013, A-026–A-029 y A-050–A-053: resueltos con versionado cliente, Worker w5-v12.3 y pruebas D1 simuladas.
- A-046, A-057 y A-063: resueltos; quitar de plantilla conserva partidos, gráficos muestran escala y los controles críticos alcanzan objetivos táctiles.
- A-076: limpieza conservadora de reglas superpuestas y bloque final v12.3; se priorizó no alterar la ficha individual ni colorear columnas.
- A-010 no se activa: una meta CSP rompería scripts en línea actuales en GitHub Pages. A-036/A-041 no se aplican sin más actas fiables porque cambiarían el significado de columnas ausentes; se mantiene la semántica existente.
