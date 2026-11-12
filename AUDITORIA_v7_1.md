# Auditoría v7.1 · Estadísticas Buen Consejo

Fecha: 12 de noviembre de 2026.

## Criterio estadístico

Se revisaron las definiciones del **FIBA Statisticians' Manual 2024 v2** y los Four Factors de Dean Oliver. No se han añadido métricas que den una falsa precisión:

- eFG%, TS%, porcentaje de pérdidas, posesiones y ratings necesitan intentos de campo fiables; el Excel FBM disponible no los aporta.
- ORB% estándar necesita rebote defensivo rival, que tampoco está disponible de forma fiable.
- Los mapas contienen canastas localizadas, no intentos; no permiten porcentajes de tiro.

Sí se incorporan lecturas que usan únicamente datos observados:

- `ROB/PER = robos manuales / pérdidas manuales`.
- `Balance de balón = robos manuales − pérdidas manuales`.
- `Acciones positivas = robos / (robos + pérdidas)`; se muestra como lectura descriptiva, no como posesiones.
- `Cuota REB O BC = REB O BC / (REB O BC + REB O rival)`.
- `Balance REB O = REB O BC − REB O rival`.
- Totales y medias por partido con Directo solo usan partidos realmente registrados.
- Para una jugadora, el denominador manual son los partidos con Directo en los que figura en el acta. Una ausencia de registro es `null`, no cero.

Referencias de investigación:

- FIBA, *Statisticians' Manual 2024 v2*: https://assets.fiba.basketball/image/upload/documents-corporate-fiba-statisticians-manual-2024-v2.pdf
- Basketball Reference, *Four Factors*: https://www.basketball-reference.com/about/factors.html
- Harvard Digital Accessibility, *Data Visualizations, Charts, and Graphs*: https://accessibility.huit.harvard.edu/data-viz-charts-graphs

## Errores corregidos

- Los Directos pendientes sin marcador ya no cuentan como 0–0 ni alteran balance, medias, racha, P1… o gráficos.
- Todas las vistas usan el mismo orden cronológico.
- La racha usa el partido disputado más reciente.
- La sincronización elimina solo el lote confirmado; conserva operaciones creadas durante el envío.
- Las peticiones de sincronización usan `no-store`, validan JSON y el service worker nunca sustituye datos por la app.
- El arrastre del mapa bloquea el desplazamiento de página y conserva el punto capturado.
- Se declararon UTF-8 y se comprobó que no quedan caracteres corruptos.
- Se añadió `.gitignore`.
- Un Directo pendiente aparece como pendiente, no como derrota, y dispone de un detalle específico.
- La reimportación no confunde automáticamente dos partidos repetidos con mismo rival y marcador si hay ambigüedad.

## Interfaz y estadísticas

- Nuevo logo «Aro vector» sin letras ni siglas; SVG, iconos normal/maskable y zona segura coherentes.
- Navegación y franja segura adaptadas a claro/oscuro.
- Selector general **Por partido / Totales**.
- En el detalle por jugadora se puede elegir **Totales / Por partido** para el reparto.
- Métricas manuales con cobertura explícita, ratios, cuartos, jugadoras y partido a partido.
- Las actas muestran ROB, PER, REB O y REB R cuando hay Directo; cero registrado y dato ausente son distintos.
- Las jugadoras mantienen una sola línea, elipsis y columnas compactas sin solaparse.
- Los gráficos completos se desplazan con 20+ partidos; los resúmenes muestran los últimos 8–12.
- Las series coincidentes se separan y el rival usa línea discontinua, además del color.
- El mapa usa geometría de media pista FIBA 15 × 14 m y puntos ligeramente mayores.
- Los modales restauran el foco y lo mantienen dentro al navegar con teclado.

## Verificación

```bash
python tools/validate.py .
python tests/smoke.py
python tools/capture.py
python tools/generar_guia_pdf.py
```

La batería cubre 360×640, 390×844, 412×915 y 1440×980; claro/oscuro; 3 y 25 partidos; datos manuales presentes/ausentes; series coincidentes; acta ampliada; pendiente; mapa; migración; y una carrera de sincronización.

## Límites honestos

- La barra de gestos final pertenece a Android/Chrome: la PWA controla sus superficies y `theme-color`, pero conviene comprobar el dispositivo físico tras publicar.
- Los datos históricos no pueden recuperar eventos manuales que nunca se registraron.
- Si futuros Excel incluyen de forma fiable FGA, rebotes defensivos rivales u otras columnas, podrán añadirse métricas avanzadas estándar sin cambiar la regla de no inventar datos.
