#!/usr/bin/env python3
"""Generate the polished v7 owner guide as an A4 PDF."""
from pathlib import Path
import sys
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image, KeepTogether

ROOT = Path(__file__).resolve().parents[1]
OUT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / 'GUIA_ESTADISTICAS_v7.pdf'
OUT.parent.mkdir(parents=True, exist_ok=True)
INK=colors.HexColor('#10233f'); RED=colors.HexColor('#ed304c'); GREEN=colors.HexColor('#18a985'); PURPLE=colors.HexColor('#7455dc'); BG=colors.HexColor('#f3f5f8'); LINE=colors.HexColor('#d7dee8'); MUTED=colors.HexColor('#526173'); ORANGE=colors.HexColor('#d97706')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='Kicker7',parent=styles['Normal'],fontName='Helvetica-Bold',fontSize=8.5,leading=11,textColor=RED,spaceAfter=7,alignment=TA_CENTER))
styles.add(ParagraphStyle(name='Cover7',parent=styles['Title'],fontName='Helvetica-Bold',fontSize=30,leading=33,textColor=INK,alignment=TA_CENTER,spaceAfter=8))
styles.add(ParagraphStyle(name='Sub7',parent=styles['Normal'],fontName='Helvetica',fontSize=11,leading=16,textColor=MUTED,alignment=TA_CENTER))
styles.add(ParagraphStyle(name='H1v7',parent=styles['Heading1'],fontName='Helvetica-Bold',fontSize=21,leading=24,textColor=INK,spaceAfter=10))
styles.add(ParagraphStyle(name='H2v7',parent=styles['Heading2'],fontName='Helvetica-Bold',fontSize=12.5,leading=15,textColor=INK,spaceBefore=7,spaceAfter=5))
styles.add(ParagraphStyle(name='Bodyv7',parent=styles['BodyText'],fontName='Helvetica',fontSize=9.2,leading=13.3,textColor=INK,spaceAfter=6))
styles.add(ParagraphStyle(name='Smallv7',parent=styles['BodyText'],fontName='Helvetica',fontSize=7.8,leading=10.5,textColor=MUTED))
styles.add(ParagraphStyle(name='Badge7',parent=styles['Normal'],fontName='Helvetica-Bold',fontSize=12,textColor=colors.white,alignment=TA_CENTER))
styles.add(ParagraphStyle(name='Callout7',parent=styles['BodyText'],fontName='Helvetica-Bold',fontSize=9,leading=13,textColor=INK))

def footer(canvas,doc):
    canvas.saveState();canvas.setStrokeColor(LINE);canvas.line(18*mm,14*mm,A4[0]-18*mm,14*mm);canvas.setFont('Helvetica',7.5);canvas.setFillColor(MUTED);canvas.drawString(18*mm,9*mm,'Estadisticas v7 - Buen Consejo 26/27');canvas.drawRightString(A4[0]-18*mm,9*mm,str(doc.page));canvas.restoreState()

def step(number,title,text,tone=INK):
    badge=Table([[Paragraph(str(number),styles['Badge7'])]],colWidths=[10*mm],rowHeights=[10*mm]);badge.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),tone),('VALIGN',(0,0),(-1,-1),'MIDDLE')]))
    table=Table([[badge,[Paragraph(title,styles['H2v7']),Paragraph(text,styles['Bodyv7'])]]],colWidths=[14*mm,150*mm],hAlign='LEFT')
    table.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),4),('TOPPADDING',(0,0),(-1,-1),2),('BOTTOMPADDING',(0,0),(-1,-1),4)]));return table

def callout(title,text,tone=GREEN):
    table=Table([[Paragraph(title,styles['Callout7']),Paragraph(text,styles['Bodyv7'])]],colWidths=[43*mm,119*mm])
    table.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#eef3f8')),('BOX',(0,0),(-1,-1),.7,tone),('LINEBEFORE',(0,0),(0,-1),4,tone),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),9),('RIGHTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),7)]));return table

def shot(name,width,max_height=112*mm):
    path=ROOT/'captures'/name
    if not path.exists(): return Spacer(1,1)
    from PIL import Image as PILImage
    with PILImage.open(path) as source:
        pixel_width,pixel_height=source.size
    image=Image(str(path),width=width,height=width*pixel_height/pixel_width)
    image._restrictSize(width,max_height);image.hAlign='CENTER';return image

story=[Spacer(1,14*mm),Paragraph('GUIA DE ACTUALIZACION Y USO',styles['Kicker7']),Paragraph('Estadisticas v7',styles['Cover7']),Paragraph('Buen Consejo - temporada 26/27',styles['Sub7']),Spacer(1,7*mm),callout('Objetivo','Corregir listas, desplazamiento, faltas, valoracion, mapa de tiro y franja Android; mostrar cada comparacion solo donde ayuda y conservar todos los datos.',PURPLE),Spacer(1,7*mm),shot('movil_claro_equipo.png',58*mm,121*mm),Spacer(1,3*mm),Paragraph('12 de noviembre de 2026 - entrega verificada',styles['Smallv7']),PageBreak()]

story += [Paragraph('1. Publicar v7 sin perder datos',styles['H1v7']),step(1,'Guarda una copia','En la app actual: Ajustes > Exportar copia. Conserva el JSON hasta terminar.'),step(2,'Abre la carpeta correcta','Del ZIP copia solo el contenido de <b>1_CODIGO_GITHUB</b>. <b>2_PARA_TI</b> es documentación personal.'),step(3,'Reemplaza y publica','Copia todo a la raiz del repositorio, acepta reemplazar, haz Commit y Push y espera a GitHub Pages.'),step(4,'Recarga por completo','Cierra pestanas antiguas y vuelve a abrir la URL. Si Android conserva una PWA antigua, exporta antes los datos y reinstala una vez.'),step(5,'Confirma la migracion','La plantilla, tres actas, Directo, mapas, permisos y sincronizacion deben seguir. La clave es <b>estadisticas_shared_v2</b>.'),Spacer(1,4*mm),callout('Cloudflare','<b>worker.js no ha cambiado.</b> No redespliegues el Worker ni recrees enlaces.',GREEN),PageBreak()]

story += [Paragraph('2. Equipo: menos ruido, mas detalle',styles['H1v7']),Paragraph('Cada tarjeta principal muestra una o dos lecturas. Al tocarla aparecen todas las vistas validas: total, media, evolucion, partidos y jugadoras cuando existe el dato.',styles['Bodyv7']),step(1,'Comparaciones utiles','Puntos, 2P anotados, 3P anotados, tiros libres, intentos, TL% y faltas muestran BC frente al rival.'),step(2,'Valoracion enfocada','La portada muestra la valoracion media de Buen Consejo por partido. El detalle conserva total, rival, evolucion y cada acta.'),step(3,'Reparto completo','La vista rapida conserva 5 jugadoras y Resto; <b>Ver las 14 jugadoras</b> abre la lista completa, incluidas las de 0.'),step(4,'Minutos completos','El selector mantiene temporada, media y partido. El detalle incluye las 14 jugadoras y se desliza lateralmente para mostrar todos los partidos.'),Spacer(1,3*mm),shot('pc_claro_equipo.png',160*mm,89*mm),PageBreak()]

story += [Paragraph('3. Faltas, valoracion y Directo',styles['H1v7']),step(1,'Faltas con el criterio correcto','En faltas, mejor significa menos. El detalle distingue mejor/peor y muestra FAL por partido y FAL por 40 minutos.'),step(2,'Comparacion justa entre jugadoras','FAL/40 normaliza por minutos reales; no premia ni castiga solo por jugar mas.'),step(3,'Valoracion por partido','Jugadoras y equipo muestran VAL/P. La grafica usa los valores publicados en cada acta.'),step(4,'Robos y perdidas','Directo compara nuestros robos con nuestras perdidas. No se presenta como estadistica completa del rival ni como posesiones.'),step(5,'Rebote ofensivo','Directo compara REB O de BC con REB O del rival. Partidos sin registro manual quedan fuera, no entran como ceros.'),Spacer(1,4*mm),Table([[shot('movil_claro_faltas.png',57*mm,108*mm),shot('pc_claro_valoracion.png',94*mm,108*mm)]],colWidths=[66*mm,98*mm],style=[('VALIGN',(0,0),(-1,-1),'TOP'),('ALIGN',(0,0),(-1,-1),'CENTER')]),PageBreak()]

story += [Paragraph('4. Mapa de tiro recuperado',styles['H1v7']),step(1,'Copia las instrucciones','Pulsa <b>Copiar instrucciones para la IA</b> y usalas con la captura FBM.'),step(2,'Pega la respuesta','El recuadro JSON esta siempre visible. Pega el bloque y pulsa <b>Leer y colocar puntos</b>.'),step(3,'Asignacion segura','Cabecera arriba = mitad izquierda; abajo = derecha. La IA debe cruzar cabecera, color y lista. Si declara conflicto, la app no coloca puntos.'),step(4,'Revisa antes de guardar','Mueve, anade, intercambia o borra puntos. Ataque y defensa siguen separados. Solo despues pulsa Guardar mapa.'),Spacer(1,5*mm),shot('movil_claro_mapa_pegado.png',64*mm,119*mm),Spacer(1,3*mm),callout('Importante','El mapa registra canastas localizadas. No crea intentos, porcentajes de campo ni datos que no existan.',RED),PageBreak()]

story += [Paragraph('5. Franja inferior y temas',styles['H1v7']),step(1,'Que se corrigio','La navegacion movil y la guardia del area segura usan el mismo azul noche <b>#10233f</b> en claro y oscuro, igual que el color fijo observado de la barra Android.'),step(2,'Que se ha probado','En navegador automatizado, navegacion y guardia coinciden en ambos temas; fondo, texto y theme-color cambian correctamente.'),step(3,'Limite real de Android','Los botones, gestos y decisiones finales de la barra del sistema pertenecen a Android/Chrome. La prueba definitiva del dispositivo se hace tras publicar e instalar.'),Spacer(1,5*mm),Table([[shot('movil_claro_directo.png',59*mm,112*mm),shot('movil_oscuro_directo.png',59*mm,112*mm)]],colWidths=[80*mm,80*mm],style=[('VALIGN',(0,0),(-1,-1),'TOP'),('ALIGN',(0,0),(-1,-1),'CENTER')]),PageBreak()]

story += [Paragraph('6. Cambios futuros con poco limite',styles['H1v7']),step(1,'Carga un archivo','Abre <b>actualizar.html</b>, carga el archivo actual y descarga su copia.'),step(2,'Genera el encargo','Describe el cambio. La herramienta pide a Gemini o Claude solo bloques exactos BUSCAR/CAMBIAR POR.'),step(3,'Pega el JSON','La respuesta tiene <b>file</b> y <b>changes</b>. Cada find debe aparecer exactamente una vez. La herramienta rechaza bloques ambiguos.'),step(4,'Valida y reemplaza','Descarga el resultado comprobado, reemplaza el archivo y ejecuta las pruebas. Ya no se devuelven app.js completos que puedan truncarse.'),Spacer(1,4*mm),callout('Instrucciones alineadas','Los TXT v7, GEM_GEMINI.md y PROYECTO_CLAUDE.md comparten contratos, formato por bloques y limites de datos.',PURPLE),Spacer(1,6*mm),Paragraph('Comandos',styles['H2v7']),Paragraph('<b>python tools/validate.py .</b><br/><b>python tests/smoke.py</b><br/><b>python tools/capture.py</b>',styles['Bodyv7']),PageBreak()]

story += [Paragraph('7. Lista final de comprobacion',styles['H1v7']),step(1,'Datos reales','Plantilla de 14 jugadoras y resultados 40-65, 64-36 y 61-48.'),step(2,'Listas','Abre Reparto completo y Carga y evolucion: deben aparecer 14 filas.'),step(3,'Desplazamiento','En movil, arrastra el mapa de minutos a derecha e izquierda y comprueba todas las columnas.'),step(4,'Faltas y valoracion','Mejor faltas debe ser 13,0; confirma FAL/40 y la grafica de valoracion por partido.'),step(5,'Mapa','Copia instrucciones, pega un JSON, coloca puntos, revisa ataque/defensa y guarda.'),step(6,'Temas y dispositivo','Prueba claro/oscuro. Verifica fisicamente la union entre navegacion azul noche y barra Android.'),Spacer(1,5*mm),callout('Resultado esperado','v7 conserva datos, clave, iconos y Worker; corrige los errores indicados y deja limites explicitamente documentados. Ninguna prueba puede garantizar que nunca aparezca un fallo futuro.',GREEN)]

doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=18*mm,leftMargin=18*mm,topMargin=17*mm,bottomMargin=19*mm,title='Guia Estadisticas v7',author='Microsoft Copilot para Diego Ramirez')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(f'OK · {OUT}')
