#!/usr/bin/env python3
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'captures'; OUT.mkdir(exist_ok=True)
STATE = json.loads((ROOT/'tests/fixtures/real_3_partidos.json').read_text(encoding='utf-8'))
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=ROOT));Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/'
try:
 with sync_playwright() as p:
  fallback=Path('/opt/pw-browsers/chromium-1228/chrome-linux64/chrome')
  browser=p.chromium.launch(headless=True,executable_path=str(fallback) if fallback.exists() else None)
  for device,size in [('movil',{'width':390,'height':844}),('pc',{'width':1440,'height':980})]:
   for theme in ('claro','oscuro'):
    page=browser.new_page(viewport=size,device_scale_factor=1)
    page.goto(url,wait_until='networkidle');page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)',STATE)
    if theme=='oscuro':page.click('[data-action="toggle-theme"]')
    page.screenshot(path=OUT/f'{device}_{theme}_equipo.png',full_page=True)
    page.locator('[data-go="games"]:visible').click();page.click('text=OLIMPICO 64');page.click('[data-action="game-team"][data-side="opp"]')
    page.screenshot(path=OUT/f'{device}_{theme}_acta_rival.png',full_page=False)
    page.close()
  browser.close()
finally: server.shutdown()
print(f'OK · capturas en {OUT}')
