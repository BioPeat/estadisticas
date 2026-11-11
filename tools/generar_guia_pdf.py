#!/usr/bin/env python3
from pathlib import Path
import sys
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image, KeepTogether

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT/'GUIA_ESTADISTICAS_v5.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)

INK = colors.HexColor('#10233f')
RED = colors.HexColor('#e8334a')
GREEN = colors.HexColor('#158060')
PURPLE = colors.HexColor('#7357d8')
BG = colors.HexColor('#f3f5f8')
LINE = colors.HexColor('#d7dee8')
MUTED = colors.HexColor('#526173')

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='CoverKicker', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, leading=11, textColor=RED, spaceAfter=7, tracking=1.4))
styles.add(ParagraphStyle(name='CoverTitle', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=31, leading=33, textColor=INK, alignment=TA_CENTER, spaceAfter=10))
styles.add(ParagraphStyle(name='CoverSub', parent=styles['Normal'], fontName='Helvetica', fontSize=12, leading=17, textColor=MUTED, alignment=TA_CENTER))
styles.add(ParagraphStyle(name='H1x', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=23, leading=26, textColor=INK, spaceAfter=12))
styles.add(ParagraphStyle(name='H2x', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=13, leading=16, textColor=INK, spaceBefore=9, spaceAfter=6))
styles.add(ParagraphStyle(name='Bodyx', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.5, leading=14, textColor=INK, spaceAfter=6))
styles.add(ParagraphStyle(name='Smallx', parent=styles['BodyText'], fontName='Helvetica', fontSize=8, leading=11, textColor=MUTED))
styles.add(ParagraphStyle(name='Numberx', parent=styles['BodyText'], fontName='Helvetica-Bold', fontSize=13, textColor=colors.white, alignment=TA_CENTER))
styles.add(ParagraphStyle(name='Calloutx', parent=styles['BodyText'], fontName='Helvetica-Bold', fontSize=9.5, leading=14, textColor=INK))


def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE); canvas.line(18*mm, 14*mm, A4[0]-18*mm, 14*mm)
    canvas.setFont('Helvetica', 7.5); canvas.setFillColor(MUTED)
    canvas.drawString(18*mm, 9*mm, 'Estadísticas v5 · Buen Consejo 26/27')
    canvas.drawRightString(A4[0]-18*mm, 9*mm, str(doc.page))
    canvas.restoreState()


def step(n, title, text, tone=INK):
    badge=Table([[Paragraph(str(n), styles['Numberx'])]], colWidths=[10*mm], rowHeights=[10*mm])
    badge.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),tone),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('BOX',(0,0),(-1,-1),0,tone)]))
    body=[Paragraph(title, styles['H2x']), Paragraph(text, styles['Bodyx'])]
    t=Table([[badge, body]], colWidths=[14*mm, 150*mm], hAlign='LEFT')
    t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),4),('TOPPADDING',(0,0),(-1,-1),2),('BOTTOMPADDING',(0,0),(-1,-1),4)]))
    return t


def callout(title, text, color=GREEN):
    t=Table([[Paragraph(title, styles['Calloutx']), Paragraph(text, styles['Bodyx'])]], colWidths=[43*mm, 119*mm])
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#eef3f8')),('BOX',(0,0),(-1,-1),0.7,color),('LINEBEFORE',(0,0),(0,-1),4,color),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),9),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
    return t


def screenshot(path, width):
    p=ROOT/path
    if not p.exists(): return Spacer(1,1)
    im=Image(str(p), width=width)
    im._restrictSize(width, 112*mm)
    return im

story=[]
story += [Spacer(1,18*mm), Paragraph('GUÍA DE ACTUALIZACIÓN', styles['CoverKicker']), Paragraph('Estadísticas v5', styles['CoverTitle']), Paragraph('Buen Consejo · temporada 26/27', styles['CoverSub']), Spacer(1,9*mm), callout('Qué incluye', 'Directo descartable, eventos de equipo sin jugadora, panel de equipo rehecho, faltas recibidas correctas, filas de jugadoras claras y tema PWA corregido.', PURPLE), Spacer(1,10*mm)]
cover_img=ROOT/'captures/movil_claro_jugadoras.png'
if cover_img.exists():
    im=Image(str(cover_img), width=58*mm); im._restrictSize(58*mm,115*mm); im.hAlign='CENTER'; story.append(im)
story += [Spacer(1,6*mm), Paragraph('11 de noviembre de 2026 · entrega lista para reemplazar', styles['Smallx']), PageBreak()]

story += [Paragraph('1. Actualizar sin perder datos', styles['H1x']), step(1,'Haz una copia','Abre la app actual y usa Ajustes → Exportar copia. Guarda el JSON fuera del repositorio.'), step(2,'Descomprime el ZIP','Trabaja con las dos carpetas extraídas. No copies la carpeta exterior.'), step(3,'Reemplaza el repositorio','Copia todo el contenido de <b>1_CODIGO_GITHUB</b> a la raíz de <b>estadisticas</b>. Acepta reemplazar. No copies <b>2_PARA_TI</b>.'), step(4,'Publica','En GitHub Desktop: Commit to main y Push origin. Espera a GitHub Pages y abre la app.'), step(5,'Recarga','Haz una recarga completa. La app conserva el almacén local <b>estadisticas_shared_v2</b>.'), Spacer(1,5*mm), callout('Cloudflare', 'No sustituyas ni vuelvas a desplegar el Worker: worker.js no ha cambiado en v5.', GREEN), PageBreak()]

story += [Paragraph('2. Si queda una franja inferior', styles['H1x']), Paragraph('v5 cambia el color del manifest, el meta theme-color, el fondo de la página y el área segura inferior. El navegador adopta el tema activo.', styles['Bodyx']), step(1,'Prueba ambos temas','Alterna claro y oscuro. La franja inferior debe seguir el fondo y la barra de navegación.'), step(2,'Recarga la página','Cierra todas las pestañas antiguas y vuelve a abrir la URL publicada.'), step(3,'Reinstala una vez si persiste','Android puede conservar el color del manifest usado al instalar la PWA. Desinstala Estadísticas y vuelve a instalarla una sola vez. Los datos sincronizados regresan al conectar; conserva antes la copia JSON.'), Spacer(1,7*mm), callout('No es un fallo de datos', 'La reinstalación solo se recomienda si la franja sigue con el color anterior. No hace falta para actualizar funciones.', RED), PageBreak()]

story += [Paragraph('3. Directo', styles['H1x']), Paragraph('Los cuatro contadores y los tres controles inferiores caben en 360×640, 390×844 y 412×915.', styles['Bodyx']), step(1,'Equipo (sin jugadora)','En Robo, Pérdida y Rebote ofensivo, pulsa esta opción cuando no sepas quién hizo la acción. Suma al equipo y a TOTALES; no aparece en una jugadora.'), step(2,'Deshacer','Anula el último evento sin borrar el partido.'), step(3,'Descartar','Pide confirmación, vacía los eventos y sincroniza la eliminación con todos los dispositivos. No crea partido ni guarda datos.'), step(4,'Finalizar','Une los eventos al acta coincidente o los guarda pendientes hasta importar el acta.'), Spacer(1,5*mm), screenshot('captures/movil_claro_directo.png',64*mm), PageBreak()]

story += [Paragraph('4. Leer Equipo', styles['H1x']), Paragraph('Cada gráfico usa una medida visible y se puede tocar para abrir el partido o la jugadora relacionada.', styles['Bodyx']), step(1,'Marcador','Líneas sin relleno, cifras propias/rivales, fecha y acceso al partido.'), step(2,'Reparto de puntos','Ordenado por puntos totales de temporada. En las tres actas de prueba, Sara Elzaurdi suma 36 puntos.'), step(3,'Top 3','Muestra qué porcentaje de la anotación concentran las tres máximas anotadoras; sustituye al índice HHI.'), step(4,'Faltas recibidas','Se calculan con las faltas cometidas por el rival: 59 en tres partidos, 19,7 por partido. FR individual se oculta si está a cero.'), step(5,'Resto del panel','Origen de puntos anotados, TL, ratio TL por canasta, casa/fuera, márgenes, minutos, rebote ofensivo, racha, Directo y cuatro zonas de canastas.'), Paragraph('No se muestran FG%, 2P%, 3P%, eFG%, TS%, posesiones ni ratings porque el acta no permite calcularlos con rigor.', styles['Smallx']), PageBreak()]

story += [Paragraph('5. Jugadoras y comprobación', styles['H1x']), step(1,'Fila única','Cada jugadora ocupa una sola línea en móvil. Los números están bajo PTS/P, MIN/P y VAL/P.'), step(2,'Ordenar','Toca cualquiera de esas cabeceras para alternar orden ascendente y descendente.'), step(3,'Abrir detalle','Toca una fila para ver promedios, tendencia por partido y comparación con la media del equipo.'), Spacer(1,5*mm), screenshot('captures/pc_claro_jugadoras.png',162*mm), Spacer(1,7*mm), Paragraph('Comprobación final', styles['H2x']), Paragraph('Equipo: 3 partidos y faltas recibidas 19,7. Jugadoras: Sara 36 puntos totales y filas alineadas. Directo: Equipo, Deshacer, Descartar y Finalizar. Tema: probar claro y oscuro. Partidos: abrir acta propia y rival.', styles['Bodyx']), PageBreak()]

story += [Paragraph('6. Archivos auxiliares', styles['H1x']), Paragraph('<b>2_PARA_TI</b> contiene esta guía, las instrucciones actualizadas del Gem de Gemini y del proyecto Claude, las capturas finales y el resumen de las rondas de revisión.', styles['Bodyx']), callout('Gem y Claude', 'Reemplaza las instrucciones anteriores por los TXT de esta entrega. Refuerzan los contratos de v5: métricas válidas, eventos de equipo, descarte sincronizado, área segura y pruebas.', PURPLE), Spacer(1,8*mm), Paragraph('Pruebas incluidas en el repositorio', styles['H2x']), Paragraph('python tools/validate.py .<br/>python tests/smoke.py<br/>python tools/capture.py', styles['Bodyx']), Spacer(1,8*mm), callout('Resultado', 'Validación y smoke tests superados con las tres actas reales, tres tamaños móviles y PC, en claro y oscuro.', GREEN)]

doc=SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=17*mm, bottomMargin=19*mm, title='Guía Estadísticas v5', author='Microsoft Copilot para Diego Ramirez')
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(f'OK · {OUT}')
