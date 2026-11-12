#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Create real v7.1 screenshots for the owner guide and final review."""
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import copy
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'captures'
OUT.mkdir(exist_ok=True)
for old in OUT.glob('*.png'):
    old.unlink()
STATE = json.loads((ROOT / 'tests/fixtures/real_3_partidos.json').read_text(encoding='utf-8'))
GUIDE_STATE = copy.deepcopy(STATE)
first = GUIDE_STATE['games'][0]
players = [p for p in first['players'] if p.get('id')]
first['events'] = [
    {'id':'guide-1','type':'steal','quarter':1,'playerId':players[0]['id'],'playerName':players[0]['name']},
    {'id':'guide-2','type':'steal','quarter':2,'playerId':players[1]['id'],'playerName':players[1]['name']},
    {'id':'guide-3','type':'turnover','quarter':2,'playerId':players[0]['id'],'playerName':players[0]['name']},
    {'id':'guide-4','type':'orbFor','quarter':3,'playerId':players[1]['id'],'playerName':players[1]['name']},
    {'id':'guide-5','type':'orbAgainst','quarter':4,'playerId':None,'playerName':None},
]
GUIDE_STATE['games'][1]['events'] = [
    {'id':'guide-6','type':'steal','quarter':1,'playerId':None,'playerName':None},
    {'id':'guide-7','type':'orbFor','quarter':2,'playerId':None,'playerName':None},
]

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=ROOT))
Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/'


def save(page, name, full=False):
    page.screenshot(path=OUT / name, full_page=full)

try:
    with sync_playwright() as playwright:
        fallback = Path('/opt/pw-browsers/chromium-1228/chrome-linux64/chrome')
        browser = playwright.chromium.launch(headless=True, executable_path=str(fallback) if fallback.exists() else None)

        # Mobile light: the main user flows used in the guide.
        page = browser.new_page(viewport={'width':390,'height':844}, device_scale_factor=1)
        page.goto(url, wait_until='networkidle')
        page.evaluate('(state) => window.__ESTADISTICAS__.setState(state)', GUIDE_STATE)
        save(page, '01_movil_claro_equipo_por_partido.png')
        page.click('[data-action="stats-mode"][data-mode="total"]')
        save(page, '02_movil_claro_equipo_totales.png')
        page.click('[data-action="stats-mode"][data-mode="average"]')
        page.locator('[data-detail="metric:points"]').click()
        save(page, '03_movil_detalle_puntos.png')
        page.locator('.modal-sheet .icon-button').click()
        page.locator('.bottom-nav [data-go="games"]').click()
        page.locator('.game-row', has_text='ENSANCHE').click()
        page.locator('.box-wrap').evaluate('e => e.scrollLeft = e.scrollWidth')
        page.locator('.modal-sheet').evaluate('e => e.scrollTop = 170')
        save(page, '04_movil_acta_directo.png')
        page.locator('.modal-sheet .icon-button').click()
        page.locator('[data-action="open-shot"]').click()
        payload = {"court":"half","ownIdentification":{"team":"BUEN CONSEJO","side":"left","color":"rojo","checksAgree":True,"conflict":""},"opponentIdentification":{"team":"RIVAL","side":"right","color":"azul","checksAgree":True,"conflict":""},"ownShots":[{"x":.35,"y":.18},{"x":.42,"y":.31}],"opponentShots":[{"x":.62,"y":.22}]}
        page.fill('#shotJson', json.dumps(payload))
        page.click('[data-action="apply-shot-json"]')
        save(page, '05_movil_mapa_tiro.png')
        page.locator('.modal-sheet .icon-button').click()
        page.locator('.bottom-nav [data-go="live"]').click()
        page.fill('#rival', 'Rival de ejemplo')
        page.click('[data-action="start-live"]')
        page.click('[data-action="add-live"][data-type="steal"]')
        page.click('.team-choice')
        save(page, '06_movil_directo.png')
        page.close()

        # Mobile dark confirms the themed navigation and safe area.
        page = browser.new_page(viewport={'width':390,'height':844}, device_scale_factor=1)
        page.goto(url, wait_until='networkidle')
        page.evaluate('(state) => window.__ESTADISTICAS__.setState(state)', GUIDE_STATE)
        page.click('[data-action="toggle-theme"]')
        save(page, '07_movil_oscuro_equipo.png')
        page.close()

        # Desktop view for GitHub/PC use.
        page = browser.new_page(viewport={'width':1440,'height':980}, device_scale_factor=1)
        page.goto(url, wait_until='networkidle')
        page.evaluate('(state) => window.__ESTADISTICAS__.setState(state)', GUIDE_STATE)
        save(page, '08_pc_claro_equipo.png')
        page.close()

        # actualizar.html is part of the end-to-end update workflow.
        page = browser.new_page(viewport={'width':1280,'height':900}, device_scale_factor=1)
        page.goto(url + 'actualizar.html', wait_until='networkidle')
        save(page, '09_actualizar_flujo.png', full=True)
        page.close()
        browser.close()
finally:
    server.shutdown()

print(f'OK · {len(list(OUT.glob("*.png")))} capturas reales en {OUT}')
