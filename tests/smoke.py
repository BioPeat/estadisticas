#!/usr/bin/env python3
import contextlib,json,os,subprocess,sys,time,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
FIX=ROOT/'tests'/'fixtures'
URL='http://127.0.0.1:8765'
CHROME=os.environ.get('CHROME','/opt/pw-browsers/chromium-1228/chrome-linux64/chrome')

def wait_server():
 for _ in range(50):
  try: urllib.request.urlopen(URL,timeout=.3);return
  except Exception: time.sleep(.1)
 raise RuntimeError('Servidor no disponible')

def assert_text(page,text):
 assert text in page.locator('body').inner_text(),f'No aparece: {text}'

def run():
 server=subprocess.Popen([sys.executable,'-m','http.server','8765','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 try:
  wait_server()
  with sync_playwright() as p:
   browser=p.chromium.launch(headless=True,executable_path=CHROME)
   page=browser.new_page(viewport={'width':1280,'height':900})
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(URL);page.evaluate("localStorage.clear();location.reload()");page.wait_for_load_state('networkidle')
   assert_text(page,'Todavía no hay partidos')
   body=page.locator('body').inner_text()
   assert '8,0' not in body and '7,0' not in body,'Hay estadísticas manuales de demostración'

   # Importación real de plantilla.
   page.get_by_role('button',name='Jugadoras').first.click()
   with page.expect_file_chooser() as fc: page.get_by_role('button',name='Importar plantilla').first.click()
   fc.value.set_files(str(FIX/'jugadoras_fbm.xlsx'));page.wait_for_timeout(300)
   assert_text(page,'14 jugadoras')

   # Importación real y múltiple de las tres actas.
   page.get_by_role('button',name='Equipo').first.click()
   with page.expect_file_chooser() as fc: page.get_by_role('button',name='Importar actas FBM').click()
   fc.value.set_files([str(FIX/'acta_ensanche.xlsx'),str(FIX/'acta_olimpico.xlsx'),str(FIX/'acta_las_rozas.xlsx')]);page.wait_for_timeout(500)
   assert_text(page,'3 actas FBM')
   page.get_by_role('button',name='Guardar actas').click();page.wait_for_timeout(250)
   assert_text(page,'2–1');assert_text(page,'55,0');assert_text(page,'49,7')
   assert_text(page,'Robos / partido');assert page.locator('button[data-detail="steals"] strong').inner_text()=='—'
   imported=page.evaluate('window.__ESTADISTICAS__.getState().games.map(g=>({opponent:g.opponent,home:g.home}))')
   assert next(g for g in imported if 'ROZAS' in g['opponent'])['home'] is False
   assert all(g['home'] for g in imported if 'ROZAS' not in g['opponent'])
   # Migración de pista completa: clasifica por mitad y refleja la derecha.
   pair=page.evaluate("window.__ESTADISTICAS__.splitLegacyShots({courtMode:'full',sourceSide:'left',shots:[{x:.2,y:.3},{x:.8,y:.7}]})")
   assert len(pair['for'])==1 and len(pair['against'])==1
   assert abs(pair['for'][0]['y']-.4)<.001 and abs(pair['against'][0]['y']-.4)<.001

   # Directo: todas las funciones caben sin scroll en los tres móviles objetivo.
   fixture=json.loads((FIX/'real_3_partidos.json').read_text(encoding='utf-8'))
   for width,height in [(360,640),(390,844),(412,915)]:
    mobile=browser.new_page(viewport={'width':width,'height':height})
    mobile.goto(URL);mobile.evaluate('(s)=>localStorage.setItem("estadisticas_shared_v2",JSON.stringify(s))',fixture);mobile.reload();mobile.get_by_role('button',name='Directo').last.click()
    mobile.locator('#rival').fill('Rival prueba');mobile.get_by_role('button',name='Empezar partido').click();mobile.wait_for_timeout(80)
    assert mobile.evaluate('document.documentElement.scrollHeight <= window.innerHeight + 1'),(width,height,mobile.evaluate('document.documentElement.scrollHeight'))
    for label in ['Robo','Pérdida','Rebote ofensivo','Rebote rival','Deshacer','Finalizar y guardar']:
     loc=mobile.get_by_text(label,exact=False).last;assert loc.is_visible(),(width,height,label)
     box=loc.bounding_box();assert box and box['y']+box['height']<=height,(width,height,label)
    mobile.close()

   viewer=browser.new_page(viewport={'width':390,'height':844});view_state=json.loads(json.dumps(fixture));view_state['settings']['role']='viewer'
   viewer.goto(URL);viewer.evaluate('(s)=>localStorage.setItem("estadisticas_shared_v2",JSON.stringify(s))',view_state);viewer.reload()
   assert viewer.locator('[data-action="import-games"]:visible').count()==0
   viewer.get_by_role('button',name='Directo').last.click();assert viewer.locator('[data-action="start-live"]:visible').count()==0
   viewer.close()

   # Regla del mapa y tres respuestas simuladas verificadas.
   test=browser.new_page(viewport={'width':1100,'height':850});test.goto(URL);test.evaluate('(s)=>localStorage.setItem("estadisticas_shared_v2",JSON.stringify(s))',fixture);test.reload();test.get_by_role('button',name='Partidos').first.click();test.get_by_role('button',name='Añadir mapa').click()
   prompt=test.evaluate('shotPrompt()')
   for required in ['equipo de ARRIBA','MITAD IZQUIERDA','columna izquierda','checksAgree','ownShots','opponentShots']:
    assert required in prompt,required
   for name in ['mapa_olimpico.json','mapa_las_rozas.json','mapa_ensanche.json']:
    data=(FIX/name).read_text(encoding='utf-8')
    test.get_by_role('button',name='Pegar respuesta JSON').click();test.locator('#shotJson').fill(data);test.get_by_role('button',name='Colocar las dos listas').click();test.wait_for_timeout(80)
    assert_text(test,'Asignación comprobada')
    assert test.locator('#shotCourt .shot[data-kind="for"]').count()==2
    assert test.locator('#shotCourt .shot[data-kind="against"]').count()==2
   assert not errors,'Errores JS: '+repr(errors)
   browser.close()
  print('TODO OK · vacío honesto · 3 actas · directo 360/390/412 sin scroll · mapas x3 · sin errores JS')
 finally:
  server.terminate();server.wait(timeout=3)
if __name__=='__main__':run()
