#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Genera la guía de usuario v7.1 con capturas reales de la PWA."""
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

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / 'GUIA_ESTADISTICAS_v7_1.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)

FONT_DIR = Path('/usr/share/fonts/dejavu-sans-fonts')
pdfmetrics.registerFont(TTFont('DejaVu', str(FONT_DIR/'DejaVuSans.ttf')))
pdfmetrics.registerFont(TTFont('DejaVu-Bold', str(FONT_DIR/'DejaVuSans-Bold.ttf')))
INK=colors.HexColor('#10233f'); RED=colors.HexColor('#ed304c'); GREEN=colors.HexColor('#18a985'); BG=colors.HexColor('#f3f5f8'); LINE=colors.HexColor('#d7dee8'); MUTED=colors.HexColor('#526173'); PURPLE=colors.HexColor('#7455dc')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='Kicker',fontName='DejaVu-Bold',fontSize=8.5,leading=11,textColor=RED,spaceAfter=7,alignment=TA_CENTER))
styles.add(ParagraphStyle(name='Cover',fontName='DejaVu-Bold',fontSize=29,leading=33,textColor=INK,alignment=TA_CENTER,spaceAfter=8))
styles.add(ParagraphStyle(name='Sub',fontName='DejaVu',fontSize=11,leading=16,textColor=MUTED,alignment=TA_CENTER))
styles.add(ParagraphStyle(name='H1',fontName='DejaVu-Bold',fontSize=20,leading=24,textColor=INK,spaceAfter=9))
styles.add(ParagraphStyle(name='H2',fontName='DejaVu-Bold',fontSize=12.2,leading=15,textColor=INK,spaceBefore=6,spaceAfter=4))
styles.add(ParagraphStyle(name='Body',fontName='DejaVu',fontSize=8.8,leading=12.8,textColor=INK,spaceAfter=5))
styles.add(ParagraphStyle(name='Small',fontName='DejaVu',fontSize=7.4,leading=9.7,textColor=MUTED))
styles.add(ParagraphStyle(name='Badge',fontName='DejaVu-Bold',fontSize=11,textColor=colors.white,alignment=TA_CENTER))
styles.add(ParagraphStyle(name='Callout',fontName='DejaVu-Bold',fontSize=8.8,leading=12.5,textColor=INK))
styles.add(ParagraphStyle(name='Code7',fontName='DejaVu',fontSize=7.7,leading=11,textColor=INK,backColor=colors.HexColor('#eef2f6'),borderPadding=7))


def footer(canvas,doc):
    canvas.saveState()
    canvas.setStrokeColor(LINE); canvas.line(18*mm,14*mm,A4[0]-18*mm,14*mm)
    canvas.setFont('DejaVu',7.2); canvas.setFillColor(MUTED)
    canvas.drawString(18*mm,9*mm,'Estadísticas v7.1 · Buen Consejo 26/27')
    canvas.drawRightString(A4[0]-18*mm,9*mm,str(doc.page))
    canvas.restoreState()


def step(number,title,text,tone=INK):
    badge=Table([[Paragraph(str(number),styles['Badge'])]],colWidths=[9*mm],rowHeights=[9*mm])
    badge.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),tone),('VALIGN',(0,0),(-1,-1),'MIDDLE')]))
    table=Table([[badge,[Paragraph(title,styles['H2']),Paragraph(text,styles['Body'])]]],colWidths=[13*mm,151*mm],hAlign='LEFT')
    table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),4),('TOPPADDING',(0,0),(-1,-1),1),('BOTTOMPADDING',(0,0),(-1,-1),3)]))
    return table


def callout(title,text,tone=GREEN):
    table=Table([[Paragraph(title,styles['Callout']),Paragraph(text,styles['Body'])]],colWidths=[43*mm,119*mm])
    table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#eef3f8')),('BOX',(0,0),(-1,-1),.7,tone),('LINEBEFORE',(0,0),(0,-1),4,tone),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),6)]))
    return table


def shot(name,width,max_height=112*mm):
    path=ROOT/'captures'/name
    if not path.exists():
        raise FileNotFoundError(f'Falta la captura real: {path}')
    with PILImage.open(path) as source:
        pixel_width,pixel_height=source.size
    image=Image(str(path),width=width,height=width*pixel_height/pixel_width)
    image._restrictSize(width,max_height); image.hAlign='CENTER'
    return image


def pair(left,right,left_w=62*mm,right_w=94*mm,height=110*mm):
    return Table([[shot(left,left_w,height),shot(right,right_w,height)]],colWidths=[78*mm,84*mm],style=[('VALIGN',(0,0),(-1,-1),'TOP'),('ALIGN',(0,0),(-1,-1),'CENTER')])

logo=Image(str(ROOT/'assets/icon-512.png'),width=42*mm,height=42*mm); logo.hAlign='CENTER'
story=[Spacer(1,9*mm),logo,Spacer(1,6*mm),Paragraph('GUÍA DE USUARIO Y ACTUALIZACIÓN',styles['Kicker']),Paragraph('Estadísticas v7.1',styles['Cover']),Paragraph('Buen Consejo · temporada 26/27',styles['Sub']),Spacer(1,8*mm),callout('Qué incluye','Publicación segura, logo, temas, estadísticas y ratios, Totales/Por partido, Directo, acta ampliada, mapa de tiro y cambios con actualizar.html + Gemini o Claude.',PURPLE),Spacer(1,9*mm),shot('01_movil_claro_equipo_por_partido.png',55*mm,105*mm),Spacer(1,4*mm),Paragraph('12 de noviembre de 2026 · guía generada con capturas reales de esta entrega',styles['Small']),PageBreak()]

story += [Paragraph('1. Publicar en GitHub sin perder datos',styles['H1']),step(1,'Exporta una copia','En la versión que estás usando abre Ajustes y pulsa Exportar copia. Guarda el JSON hasta comprobar la publicación.'),step(2,'Usa solo la carpeta de código','Del ZIP final abre <b>1_CODIGO_GITHUB</b>. Copia su contenido a la raíz del repositorio; no subas los Excel de validación ni las carpetas Gemini, Claude o Guía.'),step(3,'Sustituye todos los archivos','Incluye archivos ocultos: <b>.gitignore</b> y <b>.github/workflows/check.yml</b>. Acepta reemplazar los existentes.'),step(4,'Commit, Push y Pages','Haz Commit y Push. Espera a que GitHub Actions/Pages termine antes de abrir la web.'),step(5,'Fuerza la actualización','Recarga por completo. Si la PWA instalada mantiene una caché antigua, confirma primero la copia de datos, cierra la app y vuelve a abrirla; reinstala solo si sigue desactualizada.'),step(6,'Comprueba la migración','Deben seguir la plantilla, actas, Directo, mapas, permisos y sincronización. La clave continúa siendo <b>estadisticas_shared_v2</b>.'),Spacer(1,4*mm),callout('Cloudflare','<b>worker.js mantiene el protocolo w2.</b> No lo redespliegues por este cambio de interfaz y documentación.',GREEN),PageBreak()]

story += [Paragraph('2. Logo y temas',styles['H1']),Paragraph('El nuevo símbolo «Aro vector» no contiene letras ni siglas. El aro blanco resume balón/pista; la línea roja representa evolución y el punto verde el dato más reciente. Mantiene fondo azul noche y lectura a 32 px.',styles['Body']),step(1,'Misma marca en todas partes','La cabecera usa SVG y la PWA incluye iconos de 192, 512 y maskable. El maskable reserva margen para los recortes de Android.'),step(2,'Tema claro','La navegación inferior y el área segura usan la superficie clara, no un azul fijo.'),step(3,'Tema oscuro','Fondo, tarjetas, navegación, área segura y <i>theme-color</i> cambian a superficies oscuras.'),step(4,'Límite del sistema','La forma y el color final de botones o gestos pertenecen a Android/Chrome; compruébalos en el móvil después de publicar.'),Spacer(1,5*mm),pair('01_movil_claro_equipo_por_partido.png','07_movil_oscuro_equipo.png',55*mm,55*mm,104*mm),PageBreak()]

story += [Paragraph('3. Estadísticas: Totales y Por partido',styles['H1']),step(1,'Selector principal','En Equipo usa <b>Por partido</b> para comparar medias y <b>Totales</b> para acumulados. El contexto no cambia.'),step(2,'Tarjetas con criterio','Puntos, 2P, 3P, TL, TLI, TL% y faltas comparan BC/rival. Valoración muestra BC por partido en portada y el rival en detalle.'),step(3,'Detalle al tocar','Cada tarjeta abre total, media, evolución, mejor/peor, partidos y desglose por jugadora cuando el dato existe.'),step(4,'Ratios de Directo','Con datos manuales aparecen ROB/PER, balance ROB−PER, cuota de acciones positivas, cuota REB O y balance REB O.'),step(5,'Ausencia no es cero','Un partido sin registro de Directo no entra en el denominador. TL% sin intentos queda ausente.'),Spacer(1,4*mm),pair('02_movil_claro_equipo_totales.png','03_movil_detalle_puntos.png',55*mm,55*mm,108*mm),PageBreak()]

story += [Paragraph('4. Directo y acta ampliada',styles['H1']),step(1,'Empieza el partido','Abre Directo, escribe el rival y pulsa iniciar. Registra cada acción en el cuarto correcto.'),step(2,'Asigna jugadora o Equipo','ROB, PER y REB O pueden asociarse a una jugadora o a «Equipo (sin jugadora)». REB R registra el rebote ofensivo rival.'),step(3,'Acta del partido','Cuando existe registro manual, el acta añade el bloque DIRECTO y las columnas <b>ROB, PER, REB O y REB R</b>; los ceros reales se muestran.'),step(4,'Partidos pendientes','Un Directo sin acta queda pendiente y no altera balance, racha, medias, P1… ni gráficos.'),Spacer(1,5*mm),pair('06_movil_directo.png','04_movil_acta_directo.png',55*mm,74*mm,113*mm),Spacer(1,4*mm),callout('Interpretación correcta','Robos/pérdidas compara dos acciones de BC; no son estadísticas completas del rival ni posesiones. REB O rival procede únicamente de Directo.',RED),PageBreak()]

story += [Paragraph('5. Mapa de tiro',styles['H1']),step(1,'Abre el mapa del partido','En Partidos toca el botón de mapa. Ataque y defensa permanecen separados.'),step(2,'Usa la ayuda de IA','Copia las instrucciones y envíalas junto con la captura FBM. Pega la respuesta JSON en el campo visible.'),step(3,'Identificación segura','Cabecera arriba = mitad izquierda; cabecera abajo = derecha. La IA debe cruzar cabecera, color y lista. Si informa de conflicto, la app no coloca puntos.'),step(4,'Revisa manualmente','Pulsa Leer y colocar puntos. Mueve, añade, intercambia o borra puntos antes de guardar.'),step(5,'No inventa intentos','El mapa contiene canastas localizadas; no crea FGA, porcentajes de campo, eFG%, TS% ni ratings.'),Spacer(1,5*mm),shot('05_movil_mapa_tiro.png',62*mm,117*mm),PageBreak()]

story += [Paragraph('6. Cambios con actualizar.html + Gemini/Claude',styles['H1']),Paragraph('El Gem y el Proyecto no sustituyen la herramienta: trabajan juntos. actualizar.html aporta el archivo actual, crea el encargo, aplica los cambios exactos y valida antes de descargar.',styles['Body']),step(1,'Prepara las IAs una sola vez','Sigue el TXT de <b>2_GEMINI</b> o <b>3_CLAUDE</b>: pega las instrucciones en el campo del Gem/Proyecto y sube exactamente los archivos de su carpeta <b>ARCHIVOS_PARA_SUBIR</b>.'),step(2,'Carga un único archivo','Abre actualizar.html, descarga la copia de datos y carga el archivo actual que quieres cambiar.'),step(3,'Genera el encargo','Describe un cambio concreto y pulsa Preparar encargo. Copia el prompt generado en Gemini o Claude.'),step(4,'Exige solo JSON','La IA debe responder sin Markdown: <b>{"file":"…","changes":[{"find":"…","replace":"…"}]}</b>.'),step(5,'Aplica y descarga','Pega el JSON en el paso 3. La herramienta exige que cada find sea literal y único en el estado intermedio.'),step(6,'Prueba antes de publicar','Sustituye el archivo descargado y ejecuta las validaciones. Si cambió un recurso cacheado, actualiza también la caché de sw.js mediante un encargo separado.'),Spacer(1,4*mm),shot('09_actualizar_flujo.png',160*mm,84*mm),PageBreak()]

story += [Paragraph('7. Mantener actualizado el conocimiento de la IA',styles['H1']),step(1,'El código cambia con el tiempo','Los archivos de conocimiento del ZIP son una foto exacta de esta entrega. Un find solo funciona contra el archivo actual.'),step(2,'Después de cada cambio','Reemplaza en el Gem o Proyecto el archivo que has modificado. Si la plataforma no permite sustituirlo, adjunta el archivo actual en la conversación antes del siguiente encargo.'),step(3,'Un archivo cada vez','actualizar.html valida un único nombre de archivo por respuesta. Para un cambio coordinado, repite el ciclo archivo a archivo y prueba al final.'),step(4,'Logo protegido','El logo no se cambia salvo petición explícita. Los PNG son binarios y no se actualizan con find/replace; cualquier cambio de marca debe regenerar SVG, tres PNG, documentación, pruebas y caché conjuntamente.'),step(5,'Worker protegido','No cambies worker.js por ajustes visuales. Solo se toca por un encargo explícito de Cloudflare/API.'),Spacer(1,5*mm),Paragraph('<b>Comandos de control</b><br/>python tools/validate.py .<br/>python tests/smoke.py<br/>python tools/capture.py<br/>python tools/generar_guia_pdf.py',styles['Code7']),Spacer(1,6*mm),shot('08_pc_claro_equipo.png',160*mm,90*mm),PageBreak()]

story += [Paragraph('8. Lista final de comprobación',styles['H1']),step(1,'Copia','Existe una exportación JSON reciente y se conserva fuera del repositorio.'),step(2,'Marca','La cabecera y el icono instalado muestran Aro vector, sin BC ni otras letras.'),step(3,'Datos','Siguen la plantilla, los tres partidos, Directo y mapas. Resultados de validación: 40–65, 64–36 y 61–48.'),step(4,'Estadísticas','Cambian Totales/Por partido; los detalles abren; FAL/40 y VAL/P tienen contenido; los gráficos largos se desplazan.'),step(5,'Directo y acta','Se registran ROB, PER, REB O y REB R, y el acta muestra las columnas al existir datos manuales.'),step(6,'Mapa','El JSON se valida, los puntos pueden editarse y ataque/defensa no se mezclan.'),step(7,'Temas','Prueba claro y oscuro en móvil; navegación y guardia siguen cada tema.'),step(8,'Pruebas','validate.py y smoke.py terminan con OK antes del Commit.'),Spacer(1,5*mm),callout('Resultado esperado','La v7.1 conserva los datos y contratos, aplica la nueva marca sin letras y deja un flujo repetible para cambios futuros con Gemini o Claude.',GREEN)]

doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=18*mm,leftMargin=18*mm,topMargin=16*mm,bottomMargin=19*mm,title='Guía Estadísticas v7.1',author='Microsoft Copilot para Diego Ramirez',subject='Uso, publicación y mantenimiento seguro de la PWA')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(f'OK · {OUT}')
