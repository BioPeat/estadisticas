#!/usr/bin/env python3
"""Capturas finales v10: datos reales de La Dehesa y fixtures visuales explícitos."""
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import copy, json, os
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'captures'; OUT.mkdir(exist_ok=True)
for old in OUT.glob('*.png'): old.unlink()
BASE=json.loads((ROOT/'tests/fixtures/real_3_partidos.json').read_text(encoding='utf-8'))
DEHESA_FIXTURE=json.loads((ROOT/'tests/fixtures/dehesa_directo_sanitizado.json').read_text(encoding='utf-8'))
REAL=Path(os.environ.get('ESTADISTICAS_REAL_XLSX',''))

def events_53(): return copy.deepcopy(DEHESA_FIXTURE['pendingGame']['events'])

def fallback_dehesa():
    data=copy.deepcopy(BASE); data['roster']=copy.deepcopy(DEHESA_FIXTURE['roster']); template=copy.deepcopy(DEHESA_FIXTURE['actaGame'])
    template.update({'id':'dehesa-acta','events':events_53(),'availability':{**template.get('availability',{}),'manual':True}})
    data['games'].append(template); return data

def visual_season(count):
    """Fixture visual: repite partidos ya presentes; no representa resultados adicionales."""
    source=fallback_dehesa()['games']; data=copy.deepcopy(BASE); data['games']=[]
    for index in range(count):
        game=copy.deepcopy(source[index%len(source)]);game['id']=f'visual-{count}-{index+1}';game['opponent']=f'PRUEBA P{index+1:02d}';game['date']=f'2026-{9+index//20:02d}-{1+index%20:02d}';data['games'].append(game)
    return data

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=ROOT));Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/'

def page_for(browser,state,theme='light',viewport=(390,844)):
    context=browser.new_context(viewport={'width':viewport[0],'height':viewport[1]},device_scale_factor=1)
    page=context.new_page();page.goto(url,wait_until='networkidle');page.evaluate('(state)=>window.__ESTADISTICAS__.setState(state)',state)
    if page.evaluate('document.documentElement.dataset.theme')!=theme:page.click('[data-action="toggle-theme"]')
    return context,page

def snap(page,name,full=False):page.screenshot(path=OUT/name,full_page=full)

def import_real(browser):
    if not REAL.is_file(): return fallback_dehesa()
    state=copy.deepcopy(BASE);state['roster']=copy.deepcopy(DEHESA_FIXTURE['roster']);state['games'].append({'id':'dehesa-live','opponent':'La dehesa','date':'2026-11-11','us':None,'them':None,'players':[],'opponentPlayers':[],'events':events_53(),'source':'live-pending','availability':{'manual':True}})
    context,page=page_for(browser,state)
    page.set_input_files('#fileInput',str(REAL));page.wait_for_selector('[data-action="confirm-import"]');page.fill('[data-import-date="0"]','2026-11-15');page.click('[data-action="confirm-import"]');page.wait_for_timeout(120)
    result=page.evaluate('window.__ESTADISTICAS__.getState()');context.close();return result

try:
  with sync_playwright() as pw:
    fallback=Path('/opt/pw-browsers/chromium-1228/chrome-linux64/chrome');browser=pw.chromium.launch(headless=True,executable_path=str(fallback) if fallback.exists() else None)
    dehesa=import_real(browser)
    # Equipo real y temas.
    for name,theme,size in [('01_equipo_dehesa_claro.png','light',(390,844)),('02_equipo_dehesa_oscuro.png','dark',(390,844)),('03_equipo_360x640.png','light',(360,640)),('04_equipo_412x915.png','dark',(412,915))]:
        context,page=page_for(browser,dehesa,theme,size);snap(page,name);context.close()
    # Marcador: 4 partidos reales y fixture de 25, en ambos temas.
    for name,state,theme in [('05_marcador_4_claro.png',dehesa,'light'),('06_marcador_4_oscuro.png',dehesa,'dark'),('07_marcador_25_claro.png',visual_season(25),'light'),('08_marcador_25_oscuro.png',visual_season(25),'dark')]:
        context,page=page_for(browser,state,theme);snap(page,name);context.close()
    # Acta real: reparto individual y fila Equipo/sin asignar.
    context,page=page_for(browser,dehesa,'light',(412,915));page.locator('.bottom-nav [data-go="games"]').click();snap(page,'09_partidos_dehesa_66_69.png');page.locator('.game-row',has_text='LA DEHESA CDSCM').click();page.locator('.box-wrap').evaluate('e=>e.scrollLeft=e.scrollWidth');snap(page,'10_acta_reparto_individual.png');page.locator('.modal-sheet').evaluate('e=>e.scrollTop=e.scrollHeight');snap(page,'11_acta_equipo_sin_asignar.png');context.close()
    # Minutos: 4/25, 360/390/412, claro/oscuro, con desplazamiento horizontal visible.
    shot_no=12
    for count in [4,25]:
      state=dehesa if count==4 else visual_season(25)
      for width,height in [(360,640),(390,844),(412,915)]:
       for theme in ['light','dark']:
        context,page=page_for(browser,state,theme,(width,height));page.locator('[data-detail="minutes"]').click();page.locator('.minutes-scroll').evaluate('e=>e.scrollLeft=0');snap(page,f'{shot_no:02d}_minutos_{count}_{width}x{height}_{theme}.png');shot_no+=1;context.close()
    # Flujo de actualización honesto.
    context=browser.new_context(viewport={'width':1280,'height':1000});page=context.new_page();page.goto(url+'actualizar.html',wait_until='networkidle');snap(page,f'{shot_no:02d}_actualizar_flujo_real.png');context.close()
    browser.close()
finally:server.shutdown()
print(f'OK · {len(list(OUT.glob("*.png")))} capturas finales en {OUT}')
