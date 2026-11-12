#!/usr/bin/env python3
"""Capturas reales de la matriz v9: tema × Directo × 3/25 partidos."""
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import copy, json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]; OUT=ROOT/'captures'; OUT.mkdir(exist_ok=True)
for old in OUT.glob('*.png'): old.unlink()
BASE=json.loads((ROOT/'tests/fixtures/real_3_partidos.json').read_text())

def with_live(state,all_games=False):
    data=copy.deepcopy(state)
    targets=data['games'] if all_games else data['games'][:2]
    for i,g in enumerate(targets):
        players=[p for p in g.get('players',[]) if p.get('id')]
        g['events']=[
          {'id':f'{g["id"]}-s','type':'steal','quarter':1,'playerId':players[0]['id'] if players else None,'playerName':players[0]['name'] if players else None},
          {'id':f'{g["id"]}-t','type':'turnover','quarter':2,'playerId':players[0]['id'] if players else None,'playerName':players[0]['name'] if players else None},
          {'id':f'{g["id"]}-o','type':'orbFor','quarter':3,'playerId':players[1]['id'] if len(players)>1 else None,'playerName':players[1]['name'] if len(players)>1 else None},
          {'id':f'{g["id"]}-r','type':'orbAgainst','quarter':4,'playerId':None,'playerName':None},
        ]
        g.setdefault('availability',{})['manual']=True
    return data

def long_state(live=False):
    data=copy.deepcopy(BASE); template=data['games'][0]; data['games']=[]
    for i in range(25):
        g=copy.deepcopy(template); g['id']=f'long-{i+1}'; g['opponent']=f'RIVAL {i+1:02d}'; g['date']=f'2026-{10+i//20:02d}-{1+i%20:02d}'; g['us']=44+i%11; g['them']=39+i%9; g['events']=[]; g['availability']['manual']=False; data['games'].append(g)
    return with_live(data,True) if live else data

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=ROOT)); Thread(target=server.serve_forever,daemon=True).start(); url=f'http://127.0.0.1:{server.server_port}/'

def page_for(browser,state,theme='light',viewport=(390,844)):
    context=browser.new_context(viewport={'width':viewport[0],'height':viewport[1]},device_scale_factor=1)
    page=context.new_page(); page.goto(url,wait_until='networkidle'); page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)',state)
    current=page.evaluate('document.documentElement.dataset.theme')
    if current!=theme: page.click('[data-action="toggle-theme"]')
    return context,page

def snap(page,name,full=False): page.screenshot(path=OUT/name,full_page=full)

try:
  with sync_playwright() as pw:
    fallback=Path('/opt/pw-browsers/chromium-1228/chrome-linux64/chrome')
    browser=pw.chromium.launch(headless=True,executable_path=str(fallback) if fallback.exists() else None)
    matrix=[
      ('01_claro_sin_directo_3.png',BASE,'light'),('02_oscuro_sin_directo_3.png',BASE,'dark'),
      ('03_claro_con_directo_3.png',with_live(BASE),'light'),('04_oscuro_con_directo_3.png',with_live(BASE),'dark'),
      ('05_claro_sin_directo_25.png',long_state(False),'light'),('06_oscuro_sin_directo_25.png',long_state(False),'dark'),
      ('07_claro_con_directo_25.png',long_state(True),'light'),('08_oscuro_con_directo_25.png',long_state(True),'dark')]
    for name,state,theme in matrix:
      ctx,page=page_for(browser,state,theme); page.locator('.live-data-block').scroll_into_view_if_needed(); snap(page,name); ctx.close()
    # Evidencias de cada cambio principal.
    ctx,page=page_for(browser,BASE,'light'); page.locator('.bottom-nav [data-go="games"]').click(); page.locator('.game-row').first.click(); snap(page,'09_acta_sin_directo_columnas.png'); page.locator('.box-wrap').evaluate('e=>e.scrollLeft=e.scrollWidth'); snap(page,'10_acta_sin_directo_columnas_derecha.png'); ctx.close()
    ctx,page=page_for(browser,with_live(BASE),'light'); page.locator('.bottom-nav [data-go="games"]').click(); page.locator('.game-row',has_text='ENSANCHE').click(); page.locator('.box-wrap').evaluate('e=>e.scrollLeft=e.scrollWidth'); snap(page,'11_acta_con_directo_columnas.png'); ctx.close()
    ctx,page=page_for(browser,BASE,'light'); page.locator('.bottom-nav [data-go="players"]').click(); page.locator('.player-rank',has_text='Lara').click(); page.locator('.modal-sheet').evaluate('e=>e.scrollTop=250'); snap(page,'12_jugadora_sin_directo.png'); ctx.close()
    ctx,page=page_for(browser,with_live(BASE),'dark'); page.locator('.bottom-nav [data-go="players"]').click(); page.locator('.player-rank',has_text='Sara').click(); page.locator('.modal-sheet').evaluate('e=>e.scrollTop=250'); snap(page,'13_jugadora_con_directo.png'); ctx.close()
    ctx,page=page_for(browser,with_live(BASE),'light'); page.click('[data-action="stats-mode"][data-mode="compare"]'); snap(page,'14_modo_comparar.png'); page.locator('[data-detail="metric:p3m"]').click(); snap(page,'15_triples_detalle.png'); ctx.close()
    ctx,page=page_for(browser,BASE,'light'); page.locator('.bottom-nav [data-go="games"]').click(); page.locator('[data-action="open-shot"]').click(); payload={'court':'half','ownIdentification':{'team':'BUEN CONSEJO','side':'left','color':'rojo','checksAgree':True,'conflict':''},'opponentIdentification':{'team':'RIVAL','side':'right','color':'azul','checksAgree':True,'conflict':''},'ownShots':[{'x':.35,'y':.18},{'x':.42,'y':.31}],'opponentShots':[{'x':.62,'y':.22}]}; page.fill('#shotJson',json.dumps(payload)); page.click('[data-action="apply-shot-json"]'); snap(page,'16_mapa_tiro.png'); ctx.close()
    ctx=browser.new_context(viewport={'width':1280,'height':900}); page=ctx.new_page(); page.goto(url+'actualizar.html',wait_until='networkidle'); snap(page,'17_actualizar_v9.png',True); ctx.close()
    browser.close()
finally: server.shutdown()
print(f'OK · {len(list(OUT.glob("*.png")))} capturas reales v9 en {OUT}')
