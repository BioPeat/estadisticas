#!/usr/bin/env python3
"""Functional regression suite for Estadísticas v6.

Uses the complete three-game fixture and exercises every supported viewport. The
real XLSX files are tested before release; the JSON fixture keeps CI deterministic.
"""
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
STATE = json.loads((ROOT / 'tests/fixtures/real_3_partidos.json').read_text(encoding='utf-8'))

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=ROOT))
Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/'

try:
    with sync_playwright() as playwright:
        fallback = Path('/opt/pw-browsers/chromium-1228/chrome-linux64/chrome')
        browser = playwright.chromium.launch(
            headless=True,
            executable_path=str(fallback) if fallback.exists() else None,
        )

        for width, height in [(360, 640), (390, 844), (412, 915)]:
            page = browser.new_page(viewport={'width': width, 'height': height}, device_scale_factor=1)
            page.goto(url, wait_until='networkidle')
            page.evaluate('(state) => window.__ESTADISTICAS__.setState(state)', STATE)

            # Team panel: one real comparison per metric and no separate margin card.
            assert page.locator('.stat-card').count() == 8
            assert page.locator('.stat-card .stat-values strong').count() == 16
            assert page.locator('.stat-card .dual-trend.compact').count() >= 2
            assert page.locator('.stat-card .paired-bars').count() >= 2
            assert page.locator('.stat-card .mini-columns').count() >= 3
            assert page.locator('.stat-card .mini-rings').count() == 1
            assert page.locator('.margin-chart').count() == 0
            assert page.locator('.score-chart .score-margin').count() == 3
            assert page.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1')

            stats = page.evaluate('window.__ESTADISTICAS__.teamStats()')
            assert stats['topScorer']['name'] == 'ELZAURDI CARRERA, SARA'
            assert stats['topScorer']['pts'] == 36
            assert stats['foulsDrawn'] == 59
            point_rows = page.evaluate('window.__ESTADISTICAS__.teamMetricRows("points")')
            assert [(row['own'], row['opp']) for row in point_rows] == [(40, 65), (64, 36), (61, 48)]

            # Minutes: season, average, each specific match and the full detail.
            options = page.locator('#minutesScope option').all_inner_texts()
            assert options[0:2] == ['Temporada', 'Media por partido'] and len(options) == 5
            page.select_option('#minutesScope', index=2)
            assert page.locator('.minutes-card .minute-bars button').count() == len(STATE['games'][0]['players'])
            page.locator('[data-detail="minutes"]').click()
            assert page.locator('.minutes-heatmap .heat-row').count() >= 9
            assert page.locator('.minutes-evolution button').count() >= 9
            page.locator('.modal-sheet .icon-button').click()

            # Individual TL%: no-attempt matches are null and rendered hollow.
            assert page.evaluate('window.__ESTADISTICAS__.PLAYER_METRICS.ftp.value({ftm:0,fta:0})') is None
            page.locator('.bottom-nav [data-go="players"]').click()
            page.locator('.player-rank', has_text='Lara').click()
            page.select_option('#playerMetric', 'ftp')
            assert page.locator('.player-trend .missing').count() >= 1
            assert page.locator('.player-trend .team-average').count() >= 1
            assert page.locator('.player-trend .team-season').count() == 1
            assert page.locator('.trend-legend .average').is_visible()
            assert page.locator('.trend-legend .season').is_visible()
            page.locator('.modal-sheet .icon-button').click()

            # Full-screen Directo: large targets fill all available action space.
            page.locator('.bottom-nav [data-go="live"]').click()
            page.fill('#rival', 'Rival de prueba')
            page.click('[data-action="start-live"]')
            board = page.locator('.live-board').bounding_box()
            actions = page.locator('.live-actions').bounding_box()
            assert board['height'] <= height and actions['height'] > height * .35
            assert page.evaluate('document.documentElement.scrollHeight <= document.documentElement.clientHeight + 1')
            page.click('[data-action="add-live"][data-type="steal"]')
            page.click('.team-choice')
            event = page.evaluate('window.__ESTADISTICAS__.getState().live.events.at(-1)')
            assert event['playerId'] is None and event['type'] == 'steal'
            page.click('[data-action="discard-live"]')
            page.click('[data-action="confirm-discard-live"]')
            assert page.evaluate('window.__ESTADISTICAS__.getState().live') is None

            # Theme and Android safe-area regression: every surface changes together.
            logo_light = page.locator('.brand-mark svg').evaluate("e => [...e.querySelectorAll('[fill]')].map(x => x.getAttribute('fill')).join(',')")
            page.click('[data-action="toggle-theme"]')
            colors = page.evaluate("""() => ({
                html:getComputedStyle(document.documentElement).backgroundColor,
                body:getComputedStyle(document.body).backgroundColor,
                nav:getComputedStyle(document.querySelector('.bottom-nav')).backgroundColor,
                guard:getComputedStyle(document.querySelector('.safe-area-guard')).backgroundColor,
                meta:document.querySelector('meta[name=theme-color]').content,
                scheme:getComputedStyle(document.documentElement).colorScheme
            })""")
            logo_dark = page.locator('.brand-mark svg').evaluate("e => [...e.querySelectorAll('[fill]')].map(x => x.getAttribute('fill')).join(',')")
            assert colors['html'] == colors['body'] == 'rgb(11, 15, 22)'
            assert colors['nav'] == colors['guard'] == 'rgb(20, 27, 37)'
            assert colors['meta'] == '#0b0f16' and colors['scheme'] == 'dark'
            assert logo_light == logo_dark == '#10233f,#18365f,#ed304c,#7455dc,#18a985'
            page.close()

        # Desktop: detailed comparison, complete rival report and horizontal table.
        page = browser.new_page(viewport={'width': 1440, 'height': 980})
        page.goto(url, wait_until='networkidle')
        # A raw v5 state migrates in place: same key, no lost games or roster.
        page.evaluate("(state) => localStorage.setItem('estadisticas_shared_v2', JSON.stringify(state))", STATE)
        page.reload(wait_until='networkidle')
        migrated = page.evaluate('window.__ESTADISTICAS__.getState()')
        assert migrated['version'] == 6 and len(migrated['games']) == 3 and len(migrated['roster']) == 14
        assert page.evaluate("localStorage.getItem('estadisticas_shared_v2') !== null")
        page.locator('[data-detail="metric:ftp"]').click()
        assert page.locator('.metric-summary').is_visible()
        assert page.locator('.dual-trend:not(.compact) circle.own').count() == 3
        assert page.locator('.dual-trend:not(.compact) circle.opp').count() == 3
        page.locator('.modal-sheet .icon-button').click()
        page.locator('.sidebar [data-go="games"]').click()
        page.locator('.game-row').first.click()
        page.click('[data-action="game-team"][data-side="opp"]')
        assert page.locator('.boxscore tbody tr').count() >= 10
        assert page.locator('.box-wrap').evaluate('e => getComputedStyle(e).overflowX') == 'auto'
        browser.close()

    print('OK · v6: comparativas, minutos, TL null, doble referencia, Directo, tema, logo y actas')
finally:
    server.shutdown()
