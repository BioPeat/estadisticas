#!/usr/bin/env python3
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import json, os, sys, time
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
STATE = json.loads((ROOT/'tests/fixtures/real_3_partidos.json').read_text(encoding='utf-8'))

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=ROOT))
Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/'

try:
    with sync_playwright() as p:
        fallback = Path('/opt/pw-browsers/chromium-1228/chrome-linux64/chrome')
        browser = p.chromium.launch(headless=True, executable_path=str(fallback) if fallback.exists() else None)
        page = browser.new_page(viewport={'width':390,'height':844}, device_scale_factor=1)
        page.goto(url, wait_until='networkidle')
        page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)', STATE)
        assert page.locator('.score-summary').is_visible()
        assert page.locator('.score-chart circle.score-us').count() == 3
        assert page.locator('.metric-card').count() >= 12
        page.click('.bottom-nav [data-go="games"]')
        assert page.locator('.game-row').count() == 3
        page.click('text=OLIMPICO 64')
        page.click('[data-action="game-team"][data-side="opp"]')
        assert page.locator('.boxscore tbody tr').count() >= 11
        assert 'OLIMPICO 64' in page.locator('.team-tabs').inner_text()
        box = page.locator('.box-wrap')
        assert box.evaluate('(e)=>e.scrollWidth>e.clientWidth')
        box.evaluate('(e)=>e.scrollLeft=280')
        assert box.evaluate('(e)=>e.scrollLeft') > 0
        page.click('[data-action="game-map"][data-mode="both"]')
        own = page.locator('.game-map-block .shot-svg:not(.against)').first
        opp = page.locator('.game-map-block .shot-svg.against').first
        assert own.count() and opp.count()
        assert own.evaluate('(e)=>getComputedStyle(e).fill') != opp.evaluate('(e)=>getComputedStyle(e).fill')
        page.click('.icon-button[data-action="close-modal"]')
        page.click('.bottom-nav [data-go="live"]')
        page.fill('#rival','Rival de prueba')
        page.wait_for_timeout(10000)
        assert page.input_value('#rival') == 'Rival de prueba'
        before = int(page.locator('#selectedCount').inner_text().split()[0])
        page.locator('.roster-card input').first.uncheck(force=True)
        after = int(page.locator('#selectedCount').inner_text().split()[0])
        assert after == before - 1
        page.click('.bottom-nav [data-go="players"]')
        page.locator('.player-rank').first.click()
        assert page.locator('#playerMetric').is_visible()
        assert page.locator('.player-trend circle').count() >= 1
        assert 'Media del equipo' in page.locator('.trend-legend').inner_text()
        browser.close()
    print('OK · móvil, rival 10 s, acta rival, scroll, mapas, convocadas y evolución')
finally:
    server.shutdown()
