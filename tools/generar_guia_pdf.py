#!/usr/bin/env python3
"""Genera la guía v9 con capturas reales creadas por tools/capture.py."""
from pathlib import Path
import sys
from PIL import Image as PILImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image, KeepTogether

ROOT=Path(__file__).resolve().parents[1]
OUT=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else ROOT/'GUIA_ESTADISTICAS_v9.pdf'; OUT.parent.mkdir(parents=True,exist_ok=True)
FONT=Path('/usr/share/fonts/dejavu-sans-fonts'); pdfmetrics.registerFont(TTFont('DV',str(FONT/'DejaVuSans.ttf'))); pdfmetrics.registerFont(TTFont('DV-B',str(FONT/'DejaVuSans-Bold.ttf')))
INK=colors.HexColor('#10233f'); RED=colors.HexColor('#ed304c'); GREEN=colors.HexColor('#18a985'); BLUE=colors.HexColor('#2563a9'); BG=colors.HexColor('#f3f5f8'); LINE=colors.HexColor('#d7dee8'); MUTED=colors.HexColor('#526173'); ORANGE=colors.HexColor('#d97706')
ss=getSampleStyleSheet(); ss.add(ParagraphStyle(name='Cover',fontName='DV-B',fontSize=29,leading=33,textColor=INK,alignment=TA_CENTER,spaceAfter=7)); ss.add(ParagraphStyle(name='Sub',fontName='DV',fontSize=11,leading=15,textColor=MUTED,alignment=TA_CENTER)); ss.add(ParagraphStyle(name='H1',fontName='DV-B',fontSize=19,leading=23,textColor=INK,spaceAfter=8)); ss.add(ParagraphStyle(name='H2',fontName='DV-B',fontSize=11,leading=14,textColor=INK,spaceAfter=3)); ss.add(ParagraphStyle(name='Body',fontName='DV',fontSize=8.5,leading=12.4,textColor=INK,spaceAfter=4)); ss.add(ParagraphStyle(name='Small',fontName='DV',fontSize=7.2,leading=9.4,textColor=MUTED)); ss.add(ParagraphStyle(name='Badge',fontName='DV-B',fontSize=10,textColor=colors.white,alignment=TA_CENTER)); ss.add(ParagraphStyle(name='Code9',fontName='DV',fontSize=7.5,leading=10.5,textColor=INK,backColor=colors.HexColor('#eef2f6'),borderPadding=7))

def footer(c,doc):
 c.saveState(); c.setStrokeColor(LINE); c.line(18*mm,14*mm,A4[0]-18*mm,14*mm); c.setFont('DV',7); c.setFillColor(MUTED); c.drawString(18*mm,9*mm,'Estadísticas v9 · Buen Consejo 26/27'); c.drawRightString(A4[0]-18*mm,9*mm,str(doc.page)); c.restoreState()
def shot(name,width,maxh=112*mm):
 p=ROOT/'captures'/name
 if not p.exists(): raise FileNotFoundError(f'Falta {p}; ejecuta python tools/capture.py')
 with PILImage.open(p) as im:w,h=im.size
 x=Image(str(p),width=width,height=width*h/w); x._restrictSize(width,maxh); x.hAlign='CENTER'; return x
def pair(a,b,w=59*mm,h=112*mm): return Table([[shot(a,w,h),shot(b,w,h)]],colWidths=[82*mm,82*mm],style=[('VALIGN',(0,0),(-1,-1),'TOP'),('ALIGN',(0,0),(-1,-1),'CENTER')])
def step(n,title,text,tone=INK):
 badge=Table([[Paragraph(str(n),ss['Badge'])]],colWidths=[9*mm],rowHeights=[9*mm]); badge.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),tone),('VALIGN',(0,0),(-1,-1),'MIDDLE')]))
 t=Table([[badge,[Paragraph(title,ss['H2']),Paragraph(text,ss['Body'])]]],colWidths=[13*mm,151*mm]); t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),4),('TOPPADDING',(0,0),(-1,-1),1),('BOTTOMPADDING',(0,0),(-1,-1),3)])); return t
def callout(title,text,tone=GREEN):
 t=Table([[Paragraph(title,ss['H2']),Paragraph(text,ss['Body'])]],colWidths=[42*mm,120*mm]); t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#eef3f8')),('BOX',(0,0),(-1,-1),.7,tone),('LINEBEFORE',(0,0),(0,-1),4,tone),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)])); return t

logo=Image(str(ROOT/'assets/icon-512.png'),width=42*mm,height=42*mm); logo.hAlign='CENTER'
story=[Spacer(1,10*mm),logo,Spacer(1,6*mm),Paragraph('GUÍA DE USO, PUBLICACIÓN Y MANTENIMIENTO',ss['Small']),Spacer(1,3*mm),Paragraph('Estadísticas v9',ss['Cover']),Paragraph('Buen Consejo · temporada 26/27',ss['Sub']),Spacer(1,8*mm),callout('Cambio principal','Robos, pérdidas y rebote ofensivo ya no desaparecen. Sin Directo se ven con «Sin datos registrados todavía» y esos partidos no se convierten en ceros.',RED),Spacer(1,8*mm),shot('01_claro_sin_directo_3.png',58*mm,105*mm),Spacer(1,3*mm),Paragraph('Capturas reales generadas el 12 de noviembre de 2026',ss['Small']),PageBreak()]

story += [Paragraph('1. Actualizar desde GitHub sin perder datos',ss['H1']),step(1,'Exporta una copia','En la PWA actual abre Ajustes → Exportar copia. Conserva el JSON hasta terminar la comprobación.'),step(2,'Sube solo 1_CODIGO_GITHUB','Copia el contenido a la raíz del repositorio, incluidos `.gitignore` y `.github/workflows/check.yml`.'),step(3,'Reemplaza todos los archivos','No mezcles v7.1 y v9. `sw.js` usa una caché nueva para que el móvil descargue la entrega.'),step(4,'Espera a GitHub Pages','Haz Commit/Push y espera a que Actions y Pages terminen. Cierra y vuelve a abrir la PWA instalada.'),step(5,'Comprueba los datos','Deben seguir plantilla, actas, Directo, mapas, permisos y sincronización; la clave continúa siendo `estadisticas_shared_v2`.'),Spacer(1,5*mm),callout('Worker','`worker.js` conserva el protocolo w2. No hace falta redesplegarlo por estos cambios de interfaz.',GREEN),Spacer(1,8*mm),Paragraph('<b>Pruebas locales</b><br/>python tools/validate.py .<br/>python tests/smoke.py',ss['Code9']),PageBreak()]

story += [Paragraph('2. La estadística manual existe incluso sin datos',ss['H1']),Paragraph('Las tarjetas de ROB/PER y REB O están siempre en Equipo. La insignia indica la cobertura real. Un partido sin Directo queda fuera del denominador; un cero dentro de un Directo completo sí cuenta.',ss['Body']),pair('01_claro_sin_directo_3.png','03_claro_con_directo_3.png',58*mm,113*mm),Spacer(1,4*mm),callout('Lectura','Izquierda: 0 de 3 con datos, ausencia explícita. Derecha: 2 de 3; las medias usan solo esos dos partidos.',ORANGE),PageBreak()]

story += [Paragraph('3. Claro y oscuro; 3 y 25 partidos',ss['H1']),Paragraph('La barra inferior y el área segura usan la superficie del tema. Las mismas reglas de cobertura se mantienen cuando la temporada crece.',ss['Body']),pair('02_oscuro_sin_directo_3.png','04_oscuro_con_directo_3.png',58*mm,106*mm),Spacer(1,4*mm),pair('05_claro_sin_directo_25.png','08_oscuro_con_directo_25.png',58*mm,106*mm),PageBreak()]

story += [Paragraph('4. Acta: columnas comprobables desde el primer día',ss['H1']),step(1,'Sin Directo','En el acta de Buen Consejo aparecen DIRECTO, ROB, PER, REB O y REB R. Un aviso explica la ausencia y las celdas usan guiones.'),step(2,'Con Directo','Las jugadoras muestran ceros reales y acciones asignadas. REB R solo aparece en la fila total porque se registra para el rival, no para una jugadora de BC.'),step(3,'Desliza','La identidad queda fija y la tabla puede desplazarse lateralmente en móvil.'),Spacer(1,4*mm),pair('10_acta_sin_directo_columnas_derecha.png','11_acta_con_directo_columnas.png',58*mm,118*mm),PageBreak()]

story += [Paragraph('5. Jugadoras: manual siempre visible y media fiable',ss['H1']),Paragraph('Cada ficha incluye el bloque Robos, pérdidas y rebote ofensivo. Si no hay cobertura, lo dice; si la hay, expone totales, por partido, ratio ROB/PER, balance y REB O. La evolución deja huecos para partidos ausentes.',ss['Body']),pair('12_jugadora_sin_directo.png','13_jugadora_con_directo.png',58*mm,118*mm),Spacer(1,4*mm),callout('Denominador','Solo cuentan partidos con Directo en los que la jugadora figura en el acta. Los partidos sin registro no bajan artificialmente la media.',GREEN),PageBreak()]

story += [Paragraph('6. Estadísticas visuales y comparación',ss['H1']),step(1,'Tres modos','Equipo ofrece Por partido, Totales y Comparar.'),step(2,'Más lecturas','Diferencia, victorias, peso del triple y peso del tiro libre complementan las variables del acta sin inventar intentos.'),step(3,'Visual apropiada','Líneas para evolución; barras para magnitudes; anillos para porcentajes; balances para BC−rival.'),step(4,'Detalle de triples','Las series coincidentes se separan y el rival es discontinuo. El reparto por jugadora permite Totales/Por partido.'),Spacer(1,4*mm),pair('14_modo_comparar.png','15_triples_detalle.png',58*mm,117*mm),PageBreak()]

story += [Paragraph('7. Gráficos extensibles y mapa de tiro',ss['H1']),step(1,'25 partidos','Los gráficos completos crecen horizontalmente y se desplazan; las tarjetas resumen una ventana reciente.'),step(2,'Media pista correcta','El SVG representa media pista FIBA de 15 × 14 m, con aro a 1,575 m, zona y arco de 6,75 m.'),step(3,'Puntos mayores','La edición usa radio 24, un aumento pequeño para tocar y arrastrar sin tapar la pista.'),step(4,'Sin porcentajes falsos','El mapa contiene canastas localizadas, no lanzamientos intentados.'),Spacer(1,5*mm),shot('16_mapa_tiro.png',65*mm,120*mm),PageBreak()]

story += [Paragraph('8. Gemini y Claude con máximo 9 archivos',ss['H1']),step(1,'Crea el Gem/Proyecto','Sigue el TXT de 2_GEMINI o 3_CLAUDE y pega el bloque de instrucciones indicado.'),step(2,'Sube exactamente 9','Usa solo `ARCHIVOS_PARA_SUBIR`; la lista está enumerada en el TXT.'),step(3,'Carga el archivo en actualizar.html','La herramienta incluye el contenido actual en el encargo; por eso el conocimiento puede quedarse en nueve archivos.'),step(4,'Respuesta solo JSON','La IA devuelve `{"file":"…","changes":[{"find":"…","replace":"…"}]}`.'),step(5,'Aplica, valida y descarga','Cada `find` debe ser literal y único. Después ejecuta validate.py y smoke.py.'),step(6,'Caché separada','Si cambió un recurso cacheado, repite el flujo para subir el nombre de caché de sw.js.'),Spacer(1,5*mm),shot('17_actualizar_v9.png',160*mm,93*mm),PageBreak()]

story += [Paragraph('9. Lista final',ss['H1']),step(1,'Datos','La copia existe y la PWA conserva `estadisticas_shared_v2`.'),step(2,'Manual','Equipo y Jugadoras muestran ROB/PER/REB O con o sin cobertura.'),step(3,'Acta','DIRECTO aparece con guiones sin registro y con ceros/acciones cuando existe.'),step(4,'Temas','Barra inferior y área segura siguen claro/oscuro.'),step(5,'Escala','Con 25 partidos los gráficos se desplazan y no pisan etiquetas.'),step(6,'Mapa','Los puntos se colocan, mueven y distinguen ataque/defensa.'),step(7,'Validación','Los resultados reales siguen siendo 40–65, 64–36 y 61–48; Worker w2 y Aro vector permanecen intactos.'),Spacer(1,6*mm),callout('Resultado esperado','La v9 hace visible lo que antes estaba oculto y protege la fiabilidad: ausencia no es cero.',GREEN)]

doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=18*mm,leftMargin=18*mm,topMargin=16*mm,bottomMargin=19*mm,title='Guía Estadísticas v9',author='Microsoft Copilot para Diego Ramirez',subject='Uso, publicación y mantenimiento de la PWA Estadísticas v9')
doc.build(story,onFirstPage=footer,onLaterPages=footer); print(f'OK · {OUT}')
