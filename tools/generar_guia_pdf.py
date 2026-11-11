#!/usr/bin/env python3
from pathlib import Path
import sys
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,PageBreak,Table,TableStyle,Image,KeepTogether
OUT=Path(sys.argv[1]) if len(sys.argv)>1 else Path('GUIA_ESTADISTICAS_v2.pdf')
CAP=Path(sys.argv[2]) if len(sys.argv)>2 else None
FONT='/usr/share/fonts/liberation/LiberationSans-Regular.ttf';BOLD='/usr/share/fonts/liberation/LiberationSans-Bold.ttf'
pdfmetrics.registerFont(TTFont('DV',FONT));pdfmetrics.registerFont(TTFont('DVB',BOLD))
BG=colors.HexColor('#F3F1EC');INK=colors.HexColor('#172128');MUTED=colors.HexColor('#68747B');TEAL=colors.HexColor('#167C78');CORAL=colors.HexColor('#D5533D');BLUE=colors.HexColor('#356B9A');LINE=colors.HexColor('#DCDCD5')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='Cover',fontName='DVB',fontSize=31,leading=34,textColor=INK,spaceAfter=8))
styles.add(ParagraphStyle(name='H1x',fontName='DVB',fontSize=22,leading=26,textColor=INK,spaceAfter=10))
styles.add(ParagraphStyle(name='H2x',fontName='DVB',fontSize=13,leading=16,textColor=INK,spaceBefore=8,spaceAfter=5))
styles.add(ParagraphStyle(name='Bodyx',fontName='DV',fontSize=9.5,leading=14,textColor=INK,spaceAfter=7))
styles.add(ParagraphStyle(name='Smallx',fontName='DV',fontSize=8,leading=11,textColor=MUTED,spaceAfter=5))
styles.add(ParagraphStyle(name='Step',fontName='DVB',fontSize=11,leading=15,textColor=TEAL,leftIndent=9,borderColor=TEAL,borderWidth=1,borderPadding=7,spaceAfter=8))
styles.add(ParagraphStyle(name='Note',fontName='DV',fontSize=9,leading=13,textColor=INK,backColor=colors.HexColor('#F8F6F1'),borderColor=LINE,borderWidth=.6,borderPadding=8,spaceAfter=8))

def P(text,style='Bodyx'): return Paragraph(text,styles[style])
def bullets(items): return [P('• '+x) for x in items]
def footer(canvas,doc):
 canvas.saveState();canvas.setFont('DV',7);canvas.setFillColor(MUTED);canvas.drawString(18*mm,11*mm,'ESTADÍSTICAS v2 · Guía práctica');canvas.drawRightString(192*mm,11*mm,str(doc.page));canvas.restoreState()
def pic(name,w=170*mm,h=102*mm):
 if not CAP:return Spacer(1,1)
 p=CAP/name
 if not p.exists():return Spacer(1,1)
 im=Image(str(p));im._restrictSize(w,h);return im

doc=SimpleDocTemplate(str(OUT),pagesize=A4,rightMargin=18*mm,leftMargin=18*mm,topMargin=18*mm,bottomMargin=18*mm,title='Guía Estadísticas v2',author='Microsoft Copilot')
story=[]
# 1 cover
story += [Spacer(1,22*mm),P('GUÍA PASO A PASO','Smallx'),P('Estadísticas v2','Cover'),P('Buen Consejo · temporada 26/27','H1x'),Spacer(1,6*mm),P('Importa actas reales, apunta cuatro acciones en directo y convierte las capturas de Afición FBM en mapas de ataque y defensa sobre una sola media pista.','Bodyx'),Spacer(1,5*mm),P('<b>Esta versión arranca vacía y nunca rellena huecos con datos de prueba.</b>','Note'),pic('01_PC_CLARO_EQUIPO.png',170*mm,82*mm),Spacer(1,4*mm),P('Versión 2 · noviembre de 2026','Smallx'),PageBreak()]
# 2 overview
story += [P('1. Qué ha cambiado','H1x')]+bullets(['Media pista en todos los mapas.','Ataque y defensa separados por partido y temporada.','Robos, pérdidas y rebotes inexistentes se muestran como «—».','Directo completo en una sola pantalla móvil.','Tarjetas tocables con desgloses y explicaciones.','Color funcional ligero y más información por pantalla.'])+[P('Qué datos son fiables','H2x'),P('Del acta FBM se usan marcador, puntos, minutos, canastas anotadas de 2 y 3, tiros libres, faltas y +/-. Los ceros sistemáticos de rebotes, asistencias, robos y pérdidas se descartan.'),P('Qué no se calcula','H2x'),P('No hay intentos reales de 2 ni 3. Por tanto, no se muestran FG%, 2P%, 3P%, eFG%, TS%, posesiones, ritmo, uso, PER, ORtg ni DRtg.'),PageBreak()]
# 3 update
story += [P('2. Actualizar desde v1','H1x'),P('Hazlo en el dispositivo que ya tiene tus datos.'),P('1 · Abre <b>actualizar.html</b> desde tu GitHub Pages.','Step'),P('2 · Pulsa <b>Descargar copia local</b> y guarda el JSON.','Step'),P('3 · Copia todo el contenido de <b>1_CODIGO_GITHUB</b> sobre el repositorio y reemplaza.','Step'),P('4 · Commit y Push. Espera a Pages y abre con Ctrl+F5.','Step'),P('5 · Comprueba las actas y los mapas antes de borrar la copia.','Step'),P('La migración conserva datos reales, refleja puntos de pista completa y elimina elementos marcados como demo/ejemplo/seed.','Note'),PageBreak()]
# 4 github
story += [P('3. Publicar en GitHub','H1x'),P('1 · Crea o abre el repositorio <b>estadisticas</b>.','Step'),P('2 · Copia únicamente el contenido de <b>1_CODIGO_GITHUB</b>.','Step'),P('3 · En GitHub Desktop escribe “Estadísticas v2”, pulsa Commit to main y Push origin.','Step'),P('4 · En GitHub: Settings → Pages → Deploy from a branch → main / root.','Step'),P('5 · Espera a que aparezca la URL pública y ábrela.','Step'),P('<b>No subas 2_PARA_TI.</b> Esa carpeta contiene tu guía y las capturas, no forma parte de la web.','Note'),PageBreak()]
# 5 cloudflare
story += [P('4. Crear Worker y D1','H1x'),P('Cloudflare guarda el mismo estado para todos los usuarios.'),P('1 · En Cloudflare crea una base D1 llamada <b>estadisticas</b>.','Step'),P('2 · Crea un Worker llamado <b>estadisticas</b> y pega worker.js.','Step'),P('3 · En Settings → Bindings añade D1 con el nombre exacto <b>DB</b>.','Step'),P('4 · En Variables and Secrets crea un secreto <b>SETUP_SECRET</b> con una frase larga.','Step'),P('5 · Deploy. Abre /health: debe responder {"ok":true,"version":"w2"}.','Step'),P('No pongas SETUP_SECRET en GitHub ni lo envíes a otras personas.','Note'),PageBreak()]
# 6 links
story += [P('5. Crear enlaces de acceso','H1x'),P('1 · Abre <b>configurar.html</b> desde tu GitHub Pages.','Step'),P('2 · Pega URL del Worker, SETUP_SECRET y URL pública de la app.','Step'),P('3 · Pulsa <b>Crear enlaces</b>. Solo funciona una vez.','Step'),P('4 · Guarda el enlace de administrador para ti.','Step'),P('5 · Envía edición solo a quien apunte/importa. Envía lectura al resto.','Step'),P('Desde Ajustes, el administrador puede crear enlaces individuales. Si alguien deja el equipo, revoca su token en el Worker.','Note'),PageBreak()]
# 7 install
story += [P('6. Instalar en el móvil','H1x'),P('Android / Chrome','H2x'),P('Abre el enlace, toca ⇩ en la cabecera. Si Chrome no ofrece instalar, menú ⋮ → Instalar aplicación o Añadir a pantalla de inicio.'),P('iPhone / Safari','H2x'),P('Compartir → Añadir a pantalla de inicio.'),P('Si no actualiza','H2x'),P('Cierra la app instalada, abre la URL en el navegador, recarga y vuelve a abrir. El caché se llama estadisticas-v2.'),PageBreak()]
# 8 import roster
story += [P('7. Importar la plantilla','H1x'),P('1 · Abre Jugadoras.','Step'),P('2 · Pulsa Importar plantilla.','Step'),P('3 · Elige el Excel Jugadores-Equipo de la FBM.','Step'),P('4 · Confirma que aparecen 14 jugadoras.','Step'),P('El Excel de plantilla no siempre trae dorsal. La app completa los dorsales reales cuando importa las actas.','Note'),PageBreak()]
# 9 live
story += [P('8. Apuntar en Directo','H1x'),pic('06_MOVIL_CLARO_DIRECTO_EJEMPLO.png',85*mm,148*mm),P('Antes: escribe rival, fecha y convocadas. Durante el partido: elige cuarto y toca Robo, Pérdida, Rebote ofensivo o Rebote rival. En los tres primeros selecciona dorsal y nombre; el rebote rival no pide jugadora. Usa Deshacer si te equivocas.','Bodyx'),P('Todo cabe sin scroll en 360×640, 390×844 y 412×915.','Note'),PageBreak()]
# 10 acta
story += [P('9. Importar el acta','H1x'),P('1 · Descarga el Excel del partido desde Afición FBM.','Step'),P('2 · Equipo o Partidos → Importar acta.','Step'),P('3 · Revisa la fecha: la FBM no la guarda dentro del archivo.','Step'),P('4 · Guarda. La app intenta unir el Directo por rival y fecha.','Step'),P('El orden del acta también marca casa/fuera: primer equipo local, segundo visitante.','Note'),PageBreak()]
# 11 map rule
story += [P('10. La regla del mapa','H1x'),P('<b>Regla principal:</b> busca BUEN CONSEJO en la cabecera. El equipo de arriba tira en la mitad izquierda; el de abajo, en la derecha.'),P('<b>Confirmación por color:</b> Buen Consejo ha aparecido rojo, pero el color puede cambiar y no manda.'),P('<b>Confirmación por jugadoras:</b> columna izquierda debajo del mapa = equipo de arriba; columna derecha = equipo de abajo.'),P('Ejemplos verificados','H2x'),Table([['Cabecera','Buen Consejo','Rival'],['BC 61 arriba / Olímpico 48 abajo','izquierda roja','derecha gris'],['Las Rozas 36 arriba / BC 64 abajo','derecha roja','izquierda azul'],['BC 40 arriba / Ensanche 65 abajo','izquierda roja','derecha negra']],colWidths=[58*mm,52*mm,52*mm],style=TableStyle([('FONT',(0,0),(-1,-1),'DV',7.6),('FONT',(0,0),(-1,0),'DVB',8),('BACKGROUND',(0,0),(-1,0),TEAL),('TEXTCOLOR',(0,0),(-1,0),colors.white),('GRID',(0,0),(-1,-1),.4,LINE),('VALIGN',(0,0),(-1,-1),'TOP'),('PADDING',(0,0),(-1,-1),5)])),PageBreak()]
# 12 AI flow
story += [P('11. Pasar la captura por tu IA','H1x'),P('1 · Partidos → Añadir mapa.','Step'),P('2 · Selecciona el partido. Si lo sabes, indica lado y colores.','Step'),P('3 · Copiar prompt para mi IA.','Step'),P('4 · En tu Gem/Claude, adjunta la captura y pega el prompt.','Step'),P('5 · Copia únicamente el JSON de respuesta.','Step'),P('6 · En la app: Pegar respuesta JSON → Colocar las dos listas.','Step'),P('La respuesta debe incluir cabecera, asignación, coincidencia de las tres comprobaciones, ownShots y opponentShots.','Note'),PageBreak()]
# 13 review
story += [P('12. Revisar antes de guardar','H1x'),P('La app muestra qué equipo ha asignado arriba/abajo, lado y color. Si las comprobaciones no coinciden, aparece Revisión necesaria.'),P('Controles','H2x')]+bullets(['Nuestra (ataque): los nuevos puntos son de Buen Consejo.','Rival (defensa): los nuevos puntos son del rival.','Intercambiar equipos: corrige toda la asignación con un toque.','Arrastrar: mueve un punto.','Borrar punto: elimina el seleccionado.','Guardar ambos mapas: confirma el partido.'])+[P('La mitad derecha ya llega reflejada sobre la misma canasta.','Note'),PageBreak()]
# 14 analysis
story += [P('13. Leer ataque y defensa','H1x'),pic('08_PC_CLARO_MAPA_PARTIDO.png',170*mm,104*mm),P('Por partido puedes alternar Ataque, Defensa y Juntos. En Equipo, los mapas de calor suman la temporada y permiten filtrar por rival y casa/fuera cuando existe mapa.'),P('Las zonas indican reparto de canastas anotadas o recibidas: cerca del aro, pintura, media distancia, esquina y triple frontal/lateral. No son porcentajes de acierto.','Note'),PageBreak()]
# 15 cards
story += [P('14. Usar las tarjetas','H1x'),P('Toca cualquier tarjeta para abrir el detalle. Según el dato verás partidos, jugadoras, eventos de Directo, explicación y acceso al partido.'),P('Significado de «—»','H2x'),P('No significa cero. Significa que la fuente todavía no contiene ese dato. Debajo verás «Se rellena al apuntar en Directo» o «al subir el mapa».', 'Note'),P('Colores','H2x')]+bullets(['Coral: Directo y ataque.','Verde petróleo: Equipo.','Violeta: Jugadoras.','Azul: Partidos y defensa.'])+[PageBreak()]
# 16 troubleshooting
story += [P('15. Si algo falla','H1x'),P('No sincroniza','H2x'),P('Ajustes → comprueba URL del Worker y token. Abre /health. Un enlace revocado devuelve “Enlace no válido o revocado”.'),P('No importa Excel','H2x'),P('Debe ser el Excel original .xlsx de Afición FBM, no una captura ni un PDF.'),P('El mapa queda cambiado','H2x'),P('Pulsa Intercambiar equipos. Confirma cabecera, color y columnas antes de guardar.'),P('Faltan robos o rebotes','H2x'),P('Es correcto si no se apuntaron en Directo. La app no usa los ceros falsos del acta.'),P('No aparece Instalar','H2x'),P('Usa el botón ⇩ o el menú del navegador.'),PageBreak()]
# 17 checklist
story += [P('16. Lista final','H1x')]+bullets(['La app abre y muestra v2.','Ves las tres actas reales y balance 2–1.','Robos, pérdidas y rebotes no apuntados aparecen como «—».','Directo cabe completo en tu móvil.','El mapa de Olímpico separa 14 círculos propios visibles y 15 rivales visibles de la captura entregada.','Puedes alternar Ataque, Defensa y Juntos.','Un enlace de lectura no permite modificar.','La app se instala desde ⇩.'])+[Spacer(1,8*mm),P('Archivos de ayuda','H2x'),P('Conserva RESUMEN_CAMBIOS_v2.md, INFORME_PRUEBAS.md y las instrucciones del Gem y de Claude junto a este PDF.'),P('Fin de la guía','Smallx')]
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(OUT)
