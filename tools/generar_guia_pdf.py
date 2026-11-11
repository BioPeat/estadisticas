#!/usr/bin/env python3
"""Generate the concise v6 owner guide as an A4 PDF."""
from pathlib import Path
import sys
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / 'GUIA_ESTADISTICAS_v6.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)

INK = colors.HexColor('#10233f')
RED = colors.HexColor('#ed304c')
GREEN = colors.HexColor('#18a985')
PURPLE = colors.HexColor('#7455dc')
BG = colors.HexColor('#f3f5f8')
LINE = colors.HexColor('#d7dee8')
MUTED = colors.HexColor('#526173')

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='Kicker', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=RED, spaceAfter=7, alignment=TA_CENTER))
styles.add(ParagraphStyle(name='Cover', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=30, leading=33, textColor=INK, alignment=TA_CENTER, spaceAfter=8))
styles.add(ParagraphStyle(name='Sub', parent=styles['Normal'], fontName='Helvetica', fontSize=11, leading=16, textColor=MUTED, alignment=TA_CENTER))
styles.add(ParagraphStyle(name='H1v6', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=22, leading=25, textColor=INK, spaceAfter=10))
styles.add(ParagraphStyle(name='H2v6', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=12.5, leading=15, textColor=INK, spaceBefore=8, spaceAfter=5))
styles.add(ParagraphStyle(name='Bodyv6', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.3, leading=13.5, textColor=INK, spaceAfter=6))
styles.add(ParagraphStyle(name='Smallv6', parent=styles['BodyText'], fontName='Helvetica', fontSize=7.8, leading=10.5, textColor=MUTED))
styles.add(ParagraphStyle(name='Badge', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=12, textColor=colors.white, alignment=TA_CENTER))
styles.add(ParagraphStyle(name='Callout', parent=styles['BodyText'], fontName='Helvetica-Bold', fontSize=9, leading=13, textColor=INK))

def footer(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE)
    canvas.line(18*mm, 14*mm, A4[0]-18*mm, 14*mm)
    canvas.setFont('Helvetica', 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(18*mm, 9*mm, 'Estadísticas v6 · Buen Consejo 26/27')
    canvas.drawRightString(A4[0]-18*mm, 9*mm, str(doc.page))
    canvas.restoreState()

def step(number, title, text, tone=INK):
    badge = Table([[Paragraph(str(number), styles['Badge'])]], colWidths=[10*mm], rowHeights=[10*mm])
    badge.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),tone),('VALIGN',(0,0),(-1,-1),'MIDDLE')]))
    body = [Paragraph(title, styles['H2v6']), Paragraph(text, styles['Bodyv6'])]
    table = Table([[badge, body]], colWidths=[14*mm, 150*mm], hAlign='LEFT')
    table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),4),('TOPPADDING',(0,0),(-1,-1),2),('BOTTOMPADDING',(0,0),(-1,-1),4)]))
    return table

def callout(title, text, tone=GREEN):
    table = Table([[Paragraph(title, styles['Callout']), Paragraph(text, styles['Bodyv6'])]], colWidths=[43*mm,119*mm])
    table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#eef3f8')),('BOX',(0,0),(-1,-1),.7,tone),('LINEBEFORE',(0,0),(0,-1),4,tone),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
    return table

def screenshot(name, width, max_height=112*mm):
    path = ROOT / 'captures' / name
    if not path.exists():
        return Spacer(1,1)
    image = Image(str(path), width=width)
    image._restrictSize(width, max_height)
    image.hAlign = 'CENTER'
    return image

story = [
    Spacer(1,17*mm), Paragraph('GUÍA DEFINITIVA DE ACTUALIZACIÓN', styles['Kicker']),
    Paragraph('Estadísticas v6', styles['Cover']),
    Paragraph('Buen Consejo · temporada 26/27', styles['Sub']), Spacer(1,8*mm),
    callout('Qué cambia', 'Panel de estadísticas BC/rival, minutos por partido, doble referencia individual, TL sin falsos ceros, Directo a pantalla completa, área segura corregida y logo definitivo.', PURPLE),
    Spacer(1,8*mm), screenshot('movil_claro_equipo.png', 58*mm, 122*mm),
    Spacer(1,4*mm), Paragraph('11 de noviembre de 2026 · versión definitiva', styles['Smallv6']),
    PageBreak(),
]

story += [
    Paragraph('1. Publicar v6 sin perder datos', styles['H1v6']),
    step(1,'Guarda una copia','En la app actual: Ajustes → Exportar copia. Conserva el JSON hasta terminar la comprobación.'),
    step(2,'Descomprime el ZIP','Abre <b>1_CODIGO_GITHUB</b>. No copies la carpeta exterior ni <b>2_PARA_TI</b> al repositorio.'),
    step(3,'Reemplaza el repositorio','Copia todo el contenido de <b>1_CODIGO_GITHUB</b> a la raíz de <b>estadisticas</b> y acepta reemplazar.'),
    step(4,'Publica','Commit y Push. Espera a GitHub Pages y recarga por completo.'),
    step(5,'Comprueba los datos','Deben seguir la plantilla, las tres actas, Directo y mapas. La clave sigue siendo <b>estadisticas_shared_v2</b>.'),
    Spacer(1,5*mm), callout('Cloudflare', '<b>worker.js no ha cambiado.</b> No vuelvas a desplegar el Worker ni a crear enlaces.', GREEN),
    Spacer(1,6*mm), Paragraph('Si quieres una copia adicional antes de reemplazar, abre <b>actualizar.html</b> en la versión antigua y usa «Descargar copia local».', styles['Smallv6']),
    PageBreak(),
]

story += [
    Paragraph('2. Leer Equipo y Minutos', styles['H1v6']),
    Paragraph('La cifra grande de cada tarjeta es la media por partido. Rojo es Buen Consejo y azul es el rival.', styles['Bodyv6']),
    step(1,'Marcador','Muestra puntos propios/rivales y la diferencia integrada en cada partido. La tarjeta grande de Margen ya no existe.'),
    step(2,'Origen y reparto','Compara puntos de 2, de 3 y tiros libres. El reparto por jugadora abre su detalle.'),
    step(3,'Todas las estadísticas','Puntos, canastas de 2 y de 3, TL, intentos, TL%, faltas y valoración. Al tocar: total, media, evolución, mejor/menor partido y reparto.'),
    step(4,'Minutos','El selector ofrece Temporada, Media por partido y cada partido. El detalle muestra mapa jugadora×partido, evolución, media y cuota.'),
    Spacer(1,4*mm), screenshot('pc_claro_equipo.png', 162*mm, 91*mm),
    Paragraph('No se calculan porcentajes de 2P/3P, FG%, eFG%, TS%, posesiones ni ratings: faltan intentos de campo fiables.', styles['Smallv6']),
    PageBreak(),
]

story += [
    Paragraph('3. Jugadoras y Directo', styles['H1v6']),
    step(1,'Evolución individual','Elige puntos, minutos, 2P, 3P, TL, TL%, faltas, valoración o +/-. Cada punto abre el partido.'),
    step(2,'Dos referencias','La línea de puntos compara con el equipo en ese partido; la línea horizontal muestra la referencia de temporada.'),
    step(3,'TL% correcto','Si una jugadora no lanza tiros libres, aparece «sin tiros». No se convierte en 0% ni baja su media.'),
    step(4,'Directo','Los cuatro recuadros ocupan todo el alto disponible. Equipo (sin jugadora), Deshacer, Descartar y Finalizar siguen activos.'),
    Spacer(1,5*mm),
    Table([[screenshot('movil_claro_jugadoras.png',55*mm,105*mm), screenshot('movil_claro_directo.png',55*mm,105*mm)]], colWidths=[78*mm,78*mm], style=[('VALIGN',(0,0),(-1,-1),'TOP'),('ALIGN',(0,0),(-1,-1),'CENTER')]),
    PageBreak(),
]

story += [
    Paragraph('4. Tema, franja inferior y logo', styles['H1v6']),
    step(1,'Prueba claro y oscuro','La página, barra inferior, zona segura y color del navegador cambian juntos.'),
    step(2,'Cierra versiones antiguas','Tras publicar, cierra todas las pestañas antiguas y recarga la URL.'),
    step(3,'Reinstala solo si Android conserva el manifest anterior','Haz antes la copia JSON. Desinstala e instala una vez; después la capa de área segura sigue el tema activo.'),
    Spacer(1,5*mm), callout('Logo definitivo', 'Fondo azul noche y tres barras roja, morada y verde. Es idéntico en claro/oscuro, iconos estándar y maskable. Las instrucciones de IA prohíben modificarlo.', RED),
    Spacer(1,6*mm), screenshot('movil_oscuro_directo.png',61*mm,112*mm),
    PageBreak(),
]

story += [
    Paragraph('5. Cambios futuros con poco límite', styles['H1v6']),
    step(1,'Abre actualizar.html','Carga un único archivo actual y descarga su copia.'),
    step(2,'Describe un solo cambio','La herramienta crea un prompt corto con los contratos del archivo.'),
    step(3,'Pega la respuesta','Gemini o Claude debe devolver el archivo completo. «Aplicar y comprobar» valida sintaxis básica, clave de datos y logo.'),
    step(4,'Descarga y prueba','Reemplaza el archivo y ejecuta las dos pruebas. Si cambia un recurso, actualiza la caché de sw.js.'),
    Spacer(1,4*mm), callout('Archivos de conocimiento', 'Gemini: AGENTS.md, CONTEXTO_ESTADISTICAS.md, MAPA_DEL_CODIGO.md, GEM_GEMINI.md y los archivos que vaya a tocar. Claude: los mismos, sustituyendo GEM_GEMINI.md por PROYECTO_CLAUDE.md.', PURPLE),
    Spacer(1,8*mm), Paragraph('Pruebas', styles['H2v6']),
    Paragraph('<b>python tools/validate.py .</b><br/><b>python tests/smoke.py</b><br/><b>python tools/capture.py</b>', styles['Bodyv6']),
    Paragraph('Cobertura: 360×640, 390×844, 412×915 y 1440×980; claro/oscuro; tres actas completas; migración v5; comparativas, minutos, TL nulo, Directo, actas, logo y área segura.', styles['Smallv6']),
    PageBreak(),
]

story += [
    Paragraph('6. Comprobación final', styles['H1v6']),
    step(1,'Equipo','Balance 2–1. Puntos por partido: 55,0 BC y 49,7 rival. Abre varias tarjetas y partidos.'),
    step(2,'Faltas recibidas','El rival suma 59 faltas en tres actas: 19,7 por partido.'),
    step(3,'Minutos','Cambia las cinco opciones del selector y abre Carga y evolución.'),
    step(4,'Jugadoras','Abre Lara, selecciona TL% y confirma «sin tiros» con las dos referencias.'),
    step(5,'Directo','Comprueba que no hay scroll, que los recuadros llenan la pantalla y que Descartar pide confirmación.'),
    step(6,'Partidos','Abre Buen Consejo y rival; la tabla debe deslizarse y mantener sus totales.'),
    Spacer(1,7*mm), callout('Resultado esperado', 'Si todo coincide, v6 queda lista. Conserva el ZIP y la copia JSON; no hace falta cambiar Cloudflare.', GREEN),
]

doc = SimpleDocTemplate(str(OUT), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=17*mm, bottomMargin=19*mm, title='Guía Estadísticas v6', author='Microsoft Copilot para Diego Ramirez')
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(f'OK · {OUT}')
