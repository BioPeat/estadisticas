#!/usr/bin/env python3
from pathlib import Path
import sys
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether

OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / 'GUIA_ACTUALIZACION_v4.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
navy = colors.HexColor('#111827'); red = colors.HexColor('#D7333F'); blue = colors.HexColor('#2563A9'); green = colors.HexColor('#16805A'); gray = colors.HexColor('#647083'); pale = colors.HexColor('#EEF2F6')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='Cover', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=28, leading=31, textColor=navy, alignment=TA_LEFT, spaceAfter=8))
styles.add(ParagraphStyle(name='Sub', parent=styles['Normal'], fontName='Helvetica', fontSize=12, leading=17, textColor=gray, spaceAfter=14))
styles.add(ParagraphStyle(name='H1x', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=18, leading=22, textColor=navy, spaceBefore=8, spaceAfter=10))
styles.add(ParagraphStyle(name='H2x', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=12, leading=15, textColor=blue, spaceBefore=8, spaceAfter=5))
styles.add(ParagraphStyle(name='Bodyx', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.5, leading=14, textColor=navy, spaceAfter=6))
styles.add(ParagraphStyle(name='Smallx', parent=styles['BodyText'], fontName='Helvetica', fontSize=8, leading=11, textColor=gray))
styles.add(ParagraphStyle(name='Callout', parent=styles['BodyText'], fontName='Helvetica-Bold', fontSize=10, leading=14, textColor=navy, backColor=colors.HexColor('#FFF3DD'), borderColor=colors.HexColor('#D97706'), borderWidth=1, borderPadding=9, spaceBefore=5, spaceAfter=10))

def p(text, style='Bodyx'): return Paragraph(text, styles[style])
def bullets(items):
    out=[]
    for item in items: out += [Paragraph('• ' + item, styles['Bodyx']), Spacer(1, 1.5*mm)]
    return out

def header_footer(canvas, doc):
    canvas.saveState(); w,h=A4
    canvas.setFillColor(navy); canvas.rect(0,h-12*mm,w,12*mm,fill=1,stroke=0)
    canvas.setFont('Helvetica-Bold',8); canvas.setFillColor(colors.white); canvas.drawString(18*mm,h-7.5*mm,'ESTADÍSTICAS v4 · BUEN CONSEJO 26/27')
    canvas.setFont('Helvetica',8); canvas.setFillColor(gray); canvas.drawRightString(w-18*mm,10*mm,str(doc.page)); canvas.restoreState()

doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=18*mm,leftMargin=18*mm,topMargin=20*mm,bottomMargin=18*mm,title='Guía de actualización · Estadísticas v4',author='Microsoft Copilot')
story=[Spacer(1,20*mm),p('Estadísticas v4','Cover'),p('Buen Consejo · Temporada 26/27','Sub'),Spacer(1,6*mm),p('Actualización de la PWA, migración de datos y comprobaciones finales.','H2x'),Spacer(1,4*mm),p('<b>Importante:</b> vuelve a importar las tres actas FBM después de publicar la v4. La app conservará la fecha, los eventos de Directo y los mapas del partido.','Callout')]
summary=[['Versión','v4'],['Almacenamiento','estadisticas_shared_v2 (sin cambio)'],['Worker de Cloudflare','Sin cambios'],['Actas reales probadas','3'],['Temas','Claro y oscuro'],['Tamaños probados','360×640, 390×844, 412×915 y PC']]
t=Table(summary,colWidths=[46*mm,105*mm]);t.setStyle(TableStyle([('BACKGROUND',(0,0),(0,-1),pale),('TEXTCOLOR',(0,0),(-1,-1),navy),('FONTNAME',(0,0),(0,-1),'Helvetica-Bold'),('FONTNAME',(1,0),(1,-1),'Helvetica'),('FONTSIZE',(0,0),(-1,-1),8.5),('GRID',(0,0),(-1,-1),.4,colors.HexColor('#D7DEE8')),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]));story += [Spacer(1,6*mm),t,PageBreak()]
story += [p('1. Actualización','H1x'),p('Publica el contenido de la carpeta <b>1_CODIGO_GITHUB</b> en el repositorio, sustituyendo los archivos anteriores. No cambies la configuración de Cloudflare ni del Gem.','Bodyx'),p('Orden recomendado','H2x')]
story += bullets(['Haz una copia de seguridad desde Ajustes → Exportar copia.', 'Copia todos los archivos de 1_CODIGO_GITHUB al repositorio.', 'Espera a que GitHub Pages termine de publicar.', 'Abre la app y fuerza una recarga.', '<b>Vuelve a importar las tres actas</b> descargadas de Afición FBM.', 'Abre cada partido y comprueba la pestaña del rival.'])
story += [p('Reinstalación en Android','H2x'),p('El manifest y las áreas seguras se han corregido. Si la app ya estaba instalada y Android conserva los colores antiguos de la barra inferior, desinstala la PWA y vuelve a instalarla <b>una sola vez</b>. No es necesario si el navegador ya muestra bien ambos temas.','Bodyx'),p('Datos que se conservan','H2x')]
story += bullets(['La clave local sigue siendo <b>estadisticas_shared_v2</b>.', 'La reimportación casa rival + marcador y conserva ID, fecha previa, Directo y mapas.', 'Los partidos antiguos incompletos muestran el aviso «Faltan datos del rival».', 'El Worker de Cloudflare no se ha modificado.'])
story += [PageBreak(),p('2. Cambios de la v4','H1x')]
changes=[('Diseño','Interfaz neutra, compacta y gráfica; textos permanentes reducidos.'),('Rival','Acta completa y estadísticas defensivas de ambos equipos.'),('Acta móvil','Primera columna fija con número y nombre; resto deslizable; columnas vacías ocultas; orden por cabecera.'),('Jugadoras','Medias por partido y por 40, selector de métrica, un punto por partido y línea de media del equipo.'),('Directo','Borrador persistente del rival, fecha y convocadas; estado marcado inequívoco y contador.'),('Mapas','Ataque rojo, defensa azul y borde fino.'),('Sincronización','No repinta sin cambios ni mientras se escribe; aplica cambios pendientes al salir del campo.'),('Importación','Validación de filas contra TOTALES y aviso de reimportación.')]
t=Table([[p(a,'Smallx'),p(b,'Smallx')] for a,b in changes],colWidths=[38*mm,113*mm]);t.setStyle(TableStyle([('BACKGROUND',(0,0),(0,-1),pale),('BOX',(0,0),(-1,-1),.5,colors.HexColor('#D7DEE8')),('INNERGRID',(0,0),(-1,-1),.35,colors.HexColor('#D7DEE8')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]));story += [t,Spacer(1,5*mm),p('Estadísticas incluidas','H2x')]
story += bullets(['Composición de puntos 2P / 3P / TL propia y rival.', 'TL%, intentos de TL y ratio de TL por canasta anotada.', 'Faltas cometidas y recibidas; margen, casa/fuera y racha.', 'Concentración de anotación y reparto entre cinco con más minutos y resto.', 'Rebote ofensivo de acta; robos, pérdidas y rebote de Directo.', '+/- por jugadora, mapas y cuatro zonas de tiro.'])
story += [p('No se muestran porcentajes de tiro de campo, eFG%, TS%, posesiones ni ratings porque los Excel no contienen intentos de campo fiables.','Callout'),PageBreak(),p('3. Comprobación rápida','H1x')]
story += bullets(['Directo: escribe un rival, espera 10 segundos y confirma que no desaparece.', 'Convocadas: marcada = juega (✓ y verde); no marcada = gris; revisa el contador.', 'Partidos: abre Olímpico 64 y cambia a la pestaña rival.', 'Acta móvil: arrastra horizontalmente; Nº + nombre debe quedar fijo.', 'Totales: 2P, 3P y TL de las filas deben coincidir con TOTALES.', 'Mapas: ataque rojo y defensa azul.', 'Tema oscuro: revisa cabecera, contenido, modal, barra inferior y zona segura.', 'Jugadora: cambia la métrica y toca un punto para abrir el partido.'])
story += [p('Pruebas ejecutadas','H2x'),p('Se importaron los cuatro Excel reales y se validaron 3 partidos, 28 filas propias y 34 rivales. La matriz visual incluyó móvil 360×640, 390×844, 412×915 y escritorio, en claro y oscuro.','Bodyx'),p('Archivos de ayuda','H2x'),p('En 2_PARA_TI se incluyen las instrucciones TXT del Gem y de Claude, el resumen de revisiones y las capturas finales.','Bodyx')]
doc.build(story,onFirstPage=header_footer,onLaterPages=header_footer)
print(OUT)
