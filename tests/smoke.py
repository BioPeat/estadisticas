#!/usr/bin/env python3
import json,os,subprocess,sys,time,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];FIX=ROOT/'tests'/'fixtures';URL='http://127.0.0.1:8765';CHROME=os.environ.get('CHROME','/opt/pw-browsers/chromium-1228/chrome-linux64/chrome')
def wait_server():
 for _ in range(60):
  try: urllib.request.urlopen(URL,timeout=.25);return
  except Exception: time.sleep(.1)
 raise RuntimeError('Servidor no disponible')
def text(page,value): assert value in page.locator('body').inner_text(),f'No aparece: {value}'
def run():
 server=subprocess.Popen([sys.executable,'-m','http.server','8765','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 try:
  wait_server()
  with sync_playwright() as p:
   browser=p.chromium.launch(headless=True,**({'executable_path':CHROME} if CHROME and Path(CHROME).exists() else {}));page=browser.new_page(viewport={'width':1280,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(URL);page.evaluate('localStorage.clear();location.reload()');page.wait_for_load_state('networkidle');text(page,'Todavía no hay partidos');assert page.evaluate('window.__ESTADISTICAS__.APP_VERSION')=='v3'
   page.get_by_role('button',name='Jugadoras').first.click()
   with page.expect_file_chooser() as fc: page.get_by_role('button',name='Importar plantilla').first.click()
   fc.value.set_files(str(FIX/'jugadoras_fbm.xlsx'));page.wait_for_timeout(250);text(page,'14 jugadoras')
   page.get_by_role('button',name='Equipo').first.click()
   with page.expect_file_chooser() as fc: page.get_by_role('button',name='Importar actas FBM').click()
   fc.value.set_files([str(FIX/'acta_ensanche.xlsx'),str(FIX/'acta_olimpico.xlsx'),str(FIX/'acta_las_rozas.xlsx')]);page.wait_for_timeout(500);text(page,'3 actas FBM');page.get_by_role('button',name='Guardar actas').click();page.wait_for_timeout(250)
   state=page.evaluate('window.__ESTADISTICAS__.getState()');assert state['version']==3 and len(state['games'])==3;assert all(g['opponentPlayers'] for g in state['games']);ol=next(g for g in state['games'] if 'OLIMPICO' in g['opponent']);anon=[x for x in ol['opponentPlayers'] if x['number']=='X' and x['name']=='NOMBRE'];assert len(anon)==2 and anon[0]['id']!=anon[1]['id']
   text(page,'Estadísticas avanzadas');assert page.locator('.advanced-columns .insight').count()>=18
   # Cuatro zonas físicas y barras con porcentaje.
   zones=page.evaluate("[['pintura',zoneOf({x:.5,y:.2})],['media',zoneOf({x:.25,y:.35})],['esquina',zoneOf({x:.04,y:.1})],['triple',zoneOf({x:.5,y:.75})]]")
   assert [z[1] for z in zones]==['Pintura','Media distancia','Triple de esquina','Triple'];page.locator('[data-detail="heat-attack"]').click();text(page,'Triple de esquina');assert page.locator('.zone-bar strong').first.inner_text().endswith('%');page.get_by_role('button',name='Cerrar').click()
   # Acta completa: dos equipos, desplazamiento horizontal y ordenación en cualquier cabecera.
   page.get_by_role('button',name='Partidos').first.click();page.locator('[data-detail^="game:"]').filter(has_text='OLIMPICO 64').first.click();text(page,'Acta FBM completa');assert page.locator('.team-tabs button').count()==2;assert page.locator('.boxscore th').count()==26;assert page.locator('.box-wrap').evaluate('(e)=>e.scrollWidth>e.clientWidth');page.locator('th[data-key="min"]').click();assert '↓' in page.locator('th[data-key="min"]').inner_text() or '↑' in page.locator('th[data-key="min"]').inner_text();page.get_by_role('button',name='OLIMPICO 64 · 48').click();assert page.locator('.boxscore tbody tr').count()>=11;page.get_by_role('button',name='Cerrar').click()
   # Jugadora -> partido.
   page.get_by_role('button',name='Jugadoras').first.click();page.locator('[data-detail^="player:"]').filter(has_text='Sara Elzaurdi').first.click();text(page,'Puntos / 40');page.locator('.player-games button').first.click();text(page,'Acta FBM completa');page.get_by_role('button',name='Cerrar').click()
   # Tema oscuro actualiza el borde PWA.
   page.locator('[data-action="toggle-theme"]').click();assert page.evaluate("document.documentElement.dataset.theme")=='dark';assert page.locator('meta[name="theme-color"]').get_attribute('content')=='#101114'
   fixture=json.loads((FIX/'real_3_partidos.json').read_text(encoding='utf-8'))
   # Antes del partido hay scroll; al empezar, el tablero cabe completo sin scroll.
   for width,height in [(360,640),(390,844),(412,915)]:
    m=browser.new_page(viewport={'width':width,'height':height});m.goto(URL);m.evaluate('(s)=>localStorage.setItem("estadisticas_shared_v2",JSON.stringify(s))',fixture);m.reload();m.get_by_role('button',name='Directo').last.click();assert m.evaluate("getComputedStyle(document.body).overflowY!='hidden'");start=m.get_by_role('button',name='Empezar partido');start.scroll_into_view_if_needed();m.locator('#rival').fill('Rival prueba');start.click();m.wait_for_timeout(100);assert m.locator('body').evaluate('(e)=>e.classList.contains("live-running")');assert m.evaluate('document.documentElement.scrollHeight <= window.innerHeight + 2'),(width,height,m.evaluate('document.documentElement.scrollHeight'))
    for label in ['Robo','Pérdida','Rebote ofensivo','Rebote rival','Deshacer','Finalizar y guardar']: assert m.get_by_text(label,exact=False).last.is_visible(),(width,height,label)
    m.close()
   # Editor de mapa permite pan vertical salvo al arrastrar un punto.
   test=browser.new_page(viewport={'width':390,'height':844});test.goto(URL);test.evaluate('(s)=>localStorage.setItem("estadisticas_shared_v2",JSON.stringify(s))',fixture);test.reload();test.get_by_role('button',name='Partidos').first.click();test.get_by_role('button',name='Añadir mapa').click();assert test.locator('#shotCourt .court').evaluate('(e)=>getComputedStyle(e).touchAction')=='pan-y';test.get_by_role('button',name='Pegar respuesta JSON').click();test.locator('#shotJson').fill((FIX/'mapa_olimpico.json').read_text());test.get_by_role('button',name='Colocar las dos listas').click();assert test.locator('#shotCourt .shot-svg[data-kind="for"]').count()==4;assert test.locator('#shotCourt .shot-svg[data-kind="against"]').count()==4
   assert not errors,'Errores JS: '+repr(errors);browser.close()
  print('TODO OK · v3 · 2 equipos · tabla ordenable · 4 zonas · directo móvil · tema · navegación')
 finally:
  server.terminate();server.wait(timeout=3)
if __name__=='__main__': run()
