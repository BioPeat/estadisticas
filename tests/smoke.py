#!/usr/bin/env python3
"""Functional regression suite for Estadísticas v7.1."""
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import copy
import json
import time
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
        browser = playwright.chromium.launch(headless=True, executable_path=str(fallback) if fallback.exists() else None)

        for width, height in [(360, 640), (390, 844), (412, 915)]:
            page = browser.new_page(viewport={'width': width, 'height': height}, device_scale_factor=1)
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(url, wait_until='networkidle')
            assert page.locator('[data-logo="aro-vector"]').count() == 1
            assert page.locator('.brand-mark svg text').count() == 0
            assert page.locator('.brand-mark svg').get_attribute('viewBox') == '0 0 512 512'
            page.evaluate('(state) => window.__ESTADISTICAS__.setState(state)', STATE)

            # Tarjetas con criterio: 7 comparativas y valoración BC-only.
            assert page.locator('.stat-card').count() == 8
            assert page.locator('.stat-card .stat-values strong').count() == 15
            assert page.locator('.stat-val .stat-values.own-only').is_visible()
            assert page.locator('.stat-val', has_text='por partido').is_visible()
            assert page.locator('.margin-chart').count() == 0
            assert page.locator('.score-chart .score-margin').count() == 3
            assert page.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1')

            stats = page.evaluate('window.__ESTADISTICAS__.teamStats()')
            assert stats['topScorer']['name'] == 'ELZAURDI CARRERA, SARA'
            assert stats['topScorer']['pts'] == 36
            assert stats['foulsDrawn'] == 59
            point_rows = page.evaluate('window.__ESTADISTICAS__.teamMetricRows("points")')
            assert [(row['own'], row['opp']) for row in point_rows] == [(40, 65), (64, 36), (61, 48)]

            # Portada seleccionable: medias y totales sin cambiar de contexto.
            page.click('[data-action="stats-mode"][data-mode="total"]')
            point_values = page.locator('.stat-points .stat-values strong').all_inner_texts()
            assert point_values == ['165', '149']
            assert page.locator('[data-action="stats-mode"][data-mode="total"]').get_attribute('class') == 'active'
            page.click('[data-action="stats-mode"][data-mode="average"]')

            # Series coincidentes: los dos puntos se separan y la línea rival se distingue.
            page.locator('[data-detail="metric:p3m"]').click()
            own_y = float(page.locator('.dual-trend:not(.compact) circle.own').nth(1).get_attribute('cy'))
            opp_y = float(page.locator('.dual-trend:not(.compact) circle.opp').nth(1).get_attribute('cy'))
            assert own_y != opp_y
            assert page.locator('.trend-scroller').is_visible()
            page.click('[data-action="metric-breakdown"][data-mode="average"]')
            assert page.locator('[data-action="metric-breakdown"][data-mode="average"]').get_attribute('class') == 'active'
            assert '/P' in page.locator('.breakdown-bars strong').first.inner_text()
            page.locator('.modal-sheet .icon-button').click()
            page.wait_for_timeout(20)
            assert page.evaluate('document.activeElement?.dataset?.detail') == 'metric:p3m'

            # Reparto completo: las 14 jugadoras, incluidas las de 0.
            page.locator('[data-detail="point-share"]').click()
            assert page.locator('.full-roster button').count() == len(STATE['roster']) == 14
            assert page.locator('.full-roster', has_text='0 · 0%').count() >= 1
            page.locator('.modal-sheet .icon-button').click()

            # Minutos: vistas de temporada/partido y tabla completa que se desplaza realmente.
            options = page.locator('#minutesScope option').all_inner_texts()
            assert options[0:2] == ['Temporada', 'Media por partido'] and len(options) == 5
            page.select_option('#minutesScope', index=2)
            assert page.locator('.minutes-card .minute-bars button').count() == len(STATE['games'][0]['players'])
            page.locator('[data-detail="minutes"]').click()
            assert page.locator('.minutes-heatmap .heat-row').count() == 14
            assert page.locator('.minutes-evolution button').count() == 14
            sizes = page.locator('.minutes-scroll').evaluate('e => ({client:e.clientWidth, scroll:e.scrollWidth})')
            assert sizes['scroll'] > sizes['client']
            page.locator('.minutes-scroll').evaluate('e => e.scrollLeft = 120')
            assert page.locator('.minutes-scroll').evaluate('e => e.scrollLeft') > 0
            page.locator('.modal-sheet .icon-button').click()

            # Faltas: menor partido como mejor y ratios normalizados por 40 minutos.
            page.locator('[data-detail="metric:fouls"]').click()
            assert page.locator('.best-worst', has_text='Mejor BC · menos').is_visible()
            assert page.locator('.best-worst div').first.locator('b').inner_text() == '13,0'
            assert page.locator('.per40-summary', has_text='Faltas BC / 40 min').is_visible()
            assert page.locator('.breakdown-bars', has_text='/40').is_visible()
            page.locator('.modal-sheet .icon-button').click()

            # Valoración: gráfica y media por partido no vacías.
            page.locator('[data-detail="metric:val"]').click()
            assert page.locator('.metric-summary', has_text='Media BC / partido').is_visible()
            assert page.locator('.dual-trend:not(.compact) circle.own').count() == 3
            page.locator('.modal-sheet .icon-button').click()

            # Individual: TL ausente, FAL/40 y VAL/P.
            assert page.evaluate('window.__ESTADISTICAS__.PLAYER_METRICS.ftp.value({ftm:0,fta:0})') is None
            page.locator('.bottom-nav [data-go="players"]').click()
            page.locator('.player-rank', has_text='Lara').click()
            assert page.locator('.detail-stats', has_text='FAL/40').is_visible()
            assert page.locator('.detail-stats', has_text='VAL/P').is_visible()
            page.select_option('#playerMetric', 'ftp')
            assert page.locator('.player-trend .missing').count() >= 1
            assert page.locator('.player-trend .team-average').count() >= 1
            assert page.locator('.player-trend .team-season').count() == 1
            page.locator('.modal-sheet .icon-button').click()

            # Mapa: textarea visible, JSON validado y puntos separados ataque/defensa.
            page.locator('.bottom-nav [data-go="games"]').click()
            page.locator('[data-action="open-shot"]').click()
            assert page.locator('#shotJson').is_visible()
            assert page.locator('[data-action="copy-shot-prompt"]').is_visible()
            payload = {"court":"half","ownIdentification":{"team":"BUEN CONSEJO","side":"left","color":"rojo","checksAgree":True,"conflict":""},"opponentIdentification":{"team":"RIVAL","side":"right","color":"azul","checksAgree":True,"conflict":""},"ownShots":[{"x":.42,"y":.18}],"opponentShots":[{"x":.55,"y":.22}]}
            page.fill('#shotJson', json.dumps(payload))
            page.click('[data-action="apply-shot-json"]')
            assert page.locator('#shotCourt .shot-svg:not(.against)').count() == 1
            assert page.locator('#shotCourt .shot-svg.against').count() == 1
            assert page.locator('#shotCourt .shot-svg').first.get_attribute('r') == '21'
            assert page.locator('#shotCourt .court').evaluate('e => getComputedStyle(e).touchAction') == 'none'
            assert 'revisa la pista' in page.locator('#shotAssignment').inner_text()
            page.locator('.modal-sheet .icon-button').click()

            # Directo llena el espacio útil y conserva Equipo (sin jugadora).
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

            # Franja: navegación y guardia siguen las superficies de cada tema.
            light = page.evaluate("""() => ({nav:getComputedStyle(document.querySelector('.bottom-nav')).backgroundColor,guard:getComputedStyle(document.querySelector('.safe-area-guard')).backgroundColor,meta:document.querySelector('meta[name=theme-color]').content})""")
            assert light['nav'] == light['guard'] == 'rgb(255, 255, 255)'
            page.click('[data-action="toggle-theme"]')
            dark = page.evaluate("""() => ({html:getComputedStyle(document.documentElement).backgroundColor,body:getComputedStyle(document.body).backgroundColor,nav:getComputedStyle(document.querySelector('.bottom-nav')).backgroundColor,guard:getComputedStyle(document.querySelector('.safe-area-guard')).backgroundColor,meta:document.querySelector('meta[name=theme-color]').content,scheme:getComputedStyle(document.documentElement).colorScheme})""")
            assert dark['html'] == dark['body'] == 'rgb(11, 15, 22)'
            assert dark['nav'] == dark['guard'] == 'rgb(20, 27, 37)'
            assert dark['meta'] == '#0b0f16' and dark['scheme'] == 'dark'
            page.locator('.bottom-nav [data-go="team"]').click()
            assert page.locator('.mix-card').evaluate('e => getComputedStyle(e).backgroundColor') == 'rgb(20, 27, 37)'
            assert not errors, errors
            page.close()

        # Métricas de Directo: solo partidos con eventos; nada de ceros por partidos no registrados.
        page = browser.new_page(viewport={'width': 390, 'height': 844})
        page.goto(url, wait_until='networkidle')
        live_state = copy.deepcopy(STATE)
        live_state['games'][0]['events'] = [
            {'id':'e1','type':'steal','quarter':1,'playerId':None,'playerName':None},
            {'id':'e2','type':'turnover','quarter':2,'playerId':None,'playerName':None},
            {'id':'e3','type':'orbFor','quarter':3,'playerId':None,'playerName':None},
            {'id':'e4','type':'orbAgainst','quarter':4,'playerId':None,'playerName':None},
        ]
        live_state['games'][1]['events'] = [{'id':'e5','type':'steal','quarter':1,'playerId':None,'playerName':None}]
        page.evaluate('(state) => window.__ESTADISTICAS__.setState(state)', live_state)
        assert page.locator('.live-stat-card').count() == 2
        assert page.evaluate('window.__ESTADISTICAS__.liveMetricRows("ball").length') == 2
        page.locator('[data-detail="live:ball"]').click()
        assert page.locator('.metric-summary', has_text='Robos BC').is_visible()
        assert page.locator('.metric-explain', has_text='No es una estadística completa del rival').is_visible()
        assert page.locator('.manual-player-list', has_text='Equipo').is_visible()
        sara_rows = page.evaluate("""() => {const p=window.__ESTADISTICAS__.playerAgg().find(x=>x.name.includes('SARA'));return window.__ESTADISTICAS__.playerMetricRows(p,'liveSteals').map(r=>r.value)}""")
        assert sara_rows == [0, 0, None]
        page.locator('.modal-sheet .icon-button').click()
        page.locator('.bottom-nav [data-go="games"]').click()
        page.locator('.game-row', has_text='ENSANCHE').click()
        headers = ' '.join(page.locator('.boxscore thead').all_inner_texts())
        assert all(label in headers for label in ['DIRECTO', 'ROB', 'PER', 'REB O', 'REB R'])
        assert page.locator('.boxscore tbody tr').first.inner_text().count('0') >= 3
        page.close()

        # Pendientes de Directo: no son 0-0, no alteran balance, racha ni numeración.
        page = browser.new_page(viewport={'width': 390, 'height': 844})
        page.goto(url, wait_until='networkidle')
        pending_state = copy.deepcopy(STATE)
        pending_state['games'].insert(1, {'id':'pending','opponent':'PENDIENTE','date':'2026-10-20','us':None,'them':None,'players':[],'events':[{'id':'p1','type':'steal','quarter':1}],'source':'live-pending','availability':{'manual':True}})
        page.evaluate('(state) => window.__ESTADISTICAS__.setState(state)', pending_state)
        assert page.evaluate('window.__ESTADISTICAS__.validGames().length') == 3
        assert page.evaluate('window.__ESTADISTICAS__.teamStats().played') == 3
        assert page.evaluate('window.__ESTADISTICAS__.currentStreak(window.__ESTADISTICAS__.validGames())') == 'V2'
        assert page.locator('#minutesScope option').all_inner_texts()[2:] == ['P1 · ENSANCHE DE VALLECAS PANGOSTUDIO.COM', 'P2 · C.B. LAS ROZAS', 'P3 · OLIMPICO 64']
        page.locator('.bottom-nav [data-go="games"]').click()
        pending_row = page.locator('.game-row', has_text='PENDIENTE')
        assert pending_row.locator('.game-result').inner_text() == 'P'
        assert 'Pendiente de acta' in pending_row.inner_text()
        pending_row.click()
        assert page.locator('.pending-hero', has_text='Esperando acta').is_visible()
        assert page.locator('#gameDetail', has_text='No cuenta en estadísticas').is_visible()
        page.close()

        # Sincronización: una operación creada mientras se envía no se borra con el lote anterior.
        page = browser.new_page(viewport={'width': 390, 'height': 844})
        def sync_route(route):
            if route.request.method == 'POST':
                assert 'initial-op' in (route.request.post_data or '')
                time.sleep(.12)
            route.fulfill(status=200, content_type='application/json', body=json.dumps({'events': [], 'lastSeq': 0}))
        page.route('https://sync.test/**', sync_route)
        page.goto(url, wait_until='networkidle')
        sync_state = copy.deepcopy(STATE)
        sync_state['settings']['api'] = 'https://sync.test'
        sync_state['settings']['token'] = 'token'
        sync_state['ops'] = [{'id':'initial-op','at':'2026-11-12T09:00:00Z','type':'set-roster','payload':{'roster':[]}}]
        page.evaluate('(state) => window.__ESTADISTICAS__.setState(state)', sync_state)
        page.evaluate("""() => {setTimeout(()=>window.__ESTADISTICAS__.getState().ops.push({id:'late-op',at:new Date().toISOString(),type:'set-roster',payload:{roster:[]}}),20);return window.__ESTADISTICAS__.syncNow()}""")
        assert [item['id'] for item in page.evaluate('window.__ESTADISTICAS__.getState().ops')] == ['late-op']
        page.close()

        # Veinticinco partidos: el detalle crece y se desplaza en vez de comprimir etiquetas.
        page = browser.new_page(viewport={'width': 390, 'height': 844})
        page.goto(url, wait_until='networkidle')
        long_state = copy.deepcopy(STATE)
        template = long_state['games'][0]
        long_state['games'] = []
        for index in range(25):
            game = copy.deepcopy(template)
            game['id'] = f'long-{index}'
            game['date'] = f'2026-{10 + index // 20:02d}-{1 + index % 20:02d}'
            game['opponent'] = f'RIVAL {index + 1}'
            game['us'], game['them'] = 40 + index % 9, 38 + index % 7
            long_state['games'].append(game)
        page.evaluate('(state) => window.__ESTADISTICAS__.setState(state)', long_state)
        page.locator('[data-detail="metric:points"]').click()
        sizes = page.locator('.trend-scroller').first.evaluate('e => ({client:e.clientWidth,scroll:e.scrollWidth})')
        assert sizes['scroll'] > sizes['client']
        assert page.locator('.dual-trend:not(.compact) text').filter(has_text='P25').count() == 1
        page.close()

        # Escritorio: migración v5/v6 a v7, rival completo y scroll del acta.
        page = browser.new_page(viewport={'width': 1440, 'height': 980})
        page.goto(url, wait_until='networkidle')
        page.evaluate("(state) => localStorage.setItem('estadisticas_shared_v2', JSON.stringify(state))", STATE)
        page.reload(wait_until='networkidle')
        migrated = page.evaluate('window.__ESTADISTICAS__.getState()')
        assert migrated['version'] == 7 and len(migrated['games']) == 3 and len(migrated['roster']) == 14
        assert page.evaluate("localStorage.getItem('estadisticas_shared_v2') !== null")
        page.locator('.sidebar [data-go="games"]').click()
        page.locator('.game-row').first.click()
        page.click('[data-action="game-team"][data-side="opp"]')
        assert page.locator('.boxscore tbody tr').count() >= 10
        assert page.locator('.box-wrap').evaluate('e => getComputedStyle(e).overflowX') == 'auto'
        browser.close()

    print('OK · v7.1: datos ausentes, escalas, series largas, solapes, listas, Directo, actas, mapas, temas y migración')
finally:
    server.shutdown()
