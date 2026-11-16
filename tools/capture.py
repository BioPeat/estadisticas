#!/usr/bin/env python3
"""Capturas reales de la interfaz v11; elimina conexión y credenciales antes de renderizar."""
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright
import argparse,copy,json
parser=argparse.ArgumentParser();parser.add_argument('--root',default=str(Path(__file__).resolve().parents[1]));parser.add_argument('--backup');parser.add_argument('--out',default='captures');args=parser.parse_args()
ROOT=Path(args.root).resolve();OUT=Path(args.out).resolve();OUT.mkdir(parents=True,exist_ok=True)
base=json.loads(Path(args.backup).read_text(encoding='utf-8')) if args.backup else json.loads((ROOT/'tests/fixtures/real_3_partidos.json').read_text(encoding='utf-8'))
def clean(value):
 out=copy.deepcopy(value);out['settings']={**out.get('settings',{}),'api':'','token':'','role':'admin','teamId':''};out['ops']=[];out['lastSeq']=0;return out
state=clean(base)
def long_state(value):
 out=clean(value);template=copy.deepcopy(out['games'][0]);out['games']=[]
 for i in range(25):
  g=copy.deepcopy(template);g['id']=f'visual-{i+1}';g['opponent']=f'Fixture visual {i+1:02d}';g['date']=f'2026-{9+i//20:02d}-{1+i%20:02d}';g['us']=45+(i*7)%35;g['them']=43+(i*11)%37;g['events']=[];out['games'].append(g)
 return out
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=ROOT));Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/'
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/opt/pw-browsers/chromium-1228/chrome-linux64/chrome')
  page=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1);page.goto(url,wait_until='networkidle');page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)',state)
  page.screenshot(path=str(OUT/'01_equipo_claro_390x844.png'),full_page=False)
  if page.locator('.live-stat-card').count(): page.locator('.live-stat-card').first.scroll_into_view_if_needed();page.screenshot(path=str(OUT/'02_directo_integrado_claro.png'),full_page=False)
  page.click('.bottom-nav [data-go="players"]');row=page.locator('.player-rank',has_text='Eider');(row if row.count() else page.locator('.player-rank').first).click();page.screenshot(path=str(OUT/'03_jugadora_cuotas_ratio.png'),full_page=True);page.click('.modal-sheet .icon-button')
  page.click('.bottom-nav [data-go="team"]');page.click('[data-action="toggle-theme"]');page.screenshot(path=str(OUT/'04_equipo_oscuro_390x844.png'),full_page=False)
  page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)',long_state(state));page.locator('.score-evolution').scroll_into_view_if_needed();page.screenshot(path=str(OUT/'05_marcador_25_desplazable.png'),full_page=False)
  page.locator('.score-chart-scroller').click(position={'x':8,'y':8});page.screenshot(path=str(OUT/'06_marcador_ampliado.png'),full_page=False);page.click('.modal-sheet .icon-button')
  page.click('[data-action="open-teams"]');page.screenshot(path=str(OUT/'07_selector_multiequipo.png'),full_page=False)
  page2=browser.new_page(viewport={'width':360,'height':640});page2.goto(url,wait_until='networkidle');page2.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)',state);page2.click('.bottom-nav [data-go="live"]');page2.screenshot(path=str(OUT/'08_directo_360x640.png'),full_page=False)
  male=clean(state);male['team']={'name':'Equipo masculino de prueba','season':'27/28','gender':'male','color':'blue'}
  page3=browser.new_page(viewport={'width':390,'height':844});page3.goto(url,wait_until='networkidle');page3.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)',male);page3.screenshot(path=str(OUT/'09_paleta_universal_equipo.png'),full_page=False);page3.click('.bottom-nav [data-go="players"]');page3.screenshot(path=str(OUT/'10_masculino_jugadores.png'),full_page=False)
  browser.close()
finally:server.shutdown()
print(f'OK · {len(list(OUT.glob("*.png")))} capturas v11 en {OUT}')
