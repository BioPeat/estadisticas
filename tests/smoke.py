#!/usr/bin/env python3
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import json
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
        for width, height in [(360,640), (390,844), (412,915)]:
            page = browser.new_page(viewport={'width':width,'height':height}, device_scale_factor=1)
            page.goto(url, wait_until='networkidle')
            page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)', STATE)
            stats = page.evaluate('window.__ESTADISTICAS__.teamStats()')
            assert stats['topScorer']['name'] == 'ELZAURDI CARRERA, SARA'
            assert stats['topScorer']['pts'] == 36
            assert stats['foulsDrawn'] == 59 and round(stats['foulsDrawn']/stats['played'], 1) == 19.7
            assert page.locator('.score-chart polyline.score-us').evaluate('(e)=>getComputedStyle(e).fill') == 'none'
            assert page.locator('.share-bars button').count() >= 5
            assert page.locator('.margin-chart rect').count() == 3
            assert page.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1')

            page.locator('.bottom-nav [data-go="players"]').click()
            row = page.locator('.player-rank').first
            assert row.bounding_box()['height'] < 72
            centers = page.locator('.player-rank').first.locator('.player-id,.rank-metric').evaluate_all('(xs)=>xs.map(x=>Math.round(x.getBoundingClientRect().top+x.getBoundingClientRect().height/2))')
            assert max(centers)-min(centers) <= 4
            assert page.locator('.player-table-head [data-key="pts"]').is_visible()
            page.locator('.player-table-head [data-key="min"]').click()
            assert 'Sara Elzaurdi Carrera' in page.locator('.player-rank').first.inner_text()

            page.locator('.bottom-nav [data-go="live"]').click()
            page.fill('#rival', 'Rival de prueba')
            page.click('[data-action="start-live"]')
            assert page.locator('.live-footer [data-action="discard-live"]').is_visible()
            assert page.locator('.live-board').bounding_box()['height'] <= height
            page.click('[data-action="add-live"][data-type="steal"]')
            assert page.locator('.team-choice').is_visible()
            page.click('.team-choice')
            event = page.evaluate('window.__ESTADISTICAS__.getState().live.events.at(-1)')
            assert event['playerId'] is None and event['type'] == 'steal'
            assert page.locator('[data-action="add-live"][data-type="steal"] strong').inner_text() == '1'
            page.click('[data-action="discard-live"]')
            assert 'todos los dispositivos' in page.locator('#modalBody').inner_text()
            page.click('[data-action="confirm-discard-live"]')
            after = page.evaluate('window.__ESTADISTICAS__.getState()')
            assert after['live'] is None and len(after['games']) == 3
            assert after['ops'][-1]['type'] == 'live-upsert' and after['ops'][-1]['payload']['live'] is None

            page.click('[data-action="toggle-theme"]')
            assert page.locator('meta[name="theme-color"]').get_attribute('content') == '#0b0f16'
            assert page.evaluate('getComputedStyle(document.body).backgroundColor') != 'rgb(0, 0, 0)'
            page.close()

        page = browser.new_page(viewport={'width':1440,'height':980})
        page.goto(url, wait_until='networkidle')
        game_state = json.loads(json.dumps(STATE))
        for game in game_state['games']:
            game['events'] = [{'id':'team-event-'+game['id'],'type':'steal','quarter':1,'playerId':None,'playerName':None,'undone':False}]
        page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)', game_state)
        page.locator('.sidebar [data-go="games"]').click()
        page.locator('.game-row').first.click()
        assert 'ROB' in page.locator('.boxscore').inner_text()
        total_cells = page.locator('.boxscore tr.totals td').all_inner_texts()
        assert '1' in total_cells
        assert 'FR' not in page.locator('.boxscore thead').inner_text()
        browser.close()
    print('OK · v5: 3 móviles, PC, reparto, faltas recibidas, Directo Equipo/descartar, jugadoras y gráficos')
finally:
    server.shutdown()
