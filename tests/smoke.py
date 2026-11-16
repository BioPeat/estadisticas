#!/usr/bin/env python3
"""Functional regression suite for Estadísticas v10."""
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import copy
import json
import time
import os
import tempfile
import zipfile
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
STATE = json.loads((ROOT / 'tests/fixtures/real_3_partidos.json').read_text(encoding='utf-8'))
DEHESA_FIXTURE = json.loads((ROOT / 'tests/fixtures/dehesa_directo_sanitizado.json').read_text(encoding='utf-8'))

def dehesa_events():
    return copy.deepcopy(DEHESA_FIXTURE['pendingGame']['events'])

def row_live_values(page):
    return page.locator('.boxscore tbody tr').evaluate_all("rows => Object.fromEntries(rows.map(row => { const cells=[...row.querySelectorAll('td')].map(cell=>cell.innerText.trim()); return [cells[0].split(String.fromCharCode(10)).join(' '), cells.slice(-4)]; }))")

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

            # Panel completo: estadísticas oficiales y manuales siempre visibles.
            assert page.locator('.stats-grid:not(.live-stats-grid) .stat-card').count() == 11
            assert page.locator('.stat-winRate').count() == 0
            assert page.locator('.live-stat-card').count() == 2
            assert page.locator('.live-stat-card.is-empty').count() == 2
            assert page.locator('.live-data-block', has_text='Sin datos registrados todavía').is_visible()
            assert page.locator('.stat-val .stat-values').is_visible()
            assert page.locator('.stat-val', has_text='por partido').is_visible()
            assert page.locator('.margin-chart').count() == 0
            assert page.locator('.score-chart .score-margin').count() == 3
            assert page.locator('.score-chart .score-difference').count() == 1
            assert page.evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1')

            stats = page.evaluate('window.__ESTADISTICAS__.teamStats()')
            assert stats['topScorer']['name'] == 'ELZAURDI CARRERA, SARA'
            assert stats['topScorer']['pts'] == 36
            assert stats['foulsDrawn'] == 59
            point_rows = page.evaluate('window.__ESTADISTICAS__.teamMetricRows("points")')
            assert [(row['own'], row['opp']) for row in point_rows] == [(40, 65), (64, 36), (61, 48)]
            three_share = page.evaluate('window.__ESTADISTICAS__.aggregateMetric("threeShare", window.__ESTADISTICAS__.teamMetricRows("threeShare"), "own", "total")')
            assert round(three_share, 3) == round(24 / 165 * 100, 3)

            # Portada seleccionable: medias y totales sin cambiar de contexto.
            page.click('[data-action="stats-mode"][data-mode="total"]')
            point_values = page.locator('.stat-points .stat-values strong').all_inner_texts()
            assert point_values == ['165', '149']
            assert page.locator('[data-action="stats-mode"][data-mode="total"]').get_attribute('class') == 'active'
            page.click('[data-action="stats-mode"][data-mode="average"]')
            page.click('[data-action="stats-mode"][data-mode="compare"]')
            assert page.locator('.stats-grid:not(.live-stats-grid) .comparison-card').count() == 11
            assert page.locator('.stat-ftp .comparison-value', has_text='pp').is_visible()
            assert page.locator('[data-action="stats-mode"][data-mode="compare"]').get_attribute('class') == 'active'
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
            assert page.locator('.minutes-heatmap .heat-head').inner_text().split()[1:3] == ['Media', 'Cuota']
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
            assert page.locator('.manual-player-block', has_text='Sin datos registrados todavía').is_visible()
            page.select_option('#playerMetric', 'ftp')
            assert page.locator('.player-trend .missing').count() >= 1
            assert page.locator('.player-trend .team-average').count() >= 1
            assert page.locator('.player-trend .team-season').count() == 1
            page.locator('.modal-sheet .icon-button').click()

            # Mapa: textarea visible, JSON validado y puntos separados ataque/defensa.
            page.locator('.bottom-nav [data-go="games"]').click()
            away_row = page.locator('.game-row', has_text='C.B. LAS ROZAS')
            assert away_row.locator('.game-score').inner_text().replace(' ', '') == '36–64'
            page.locator('[data-action="open-shot"]').click()
            assert page.locator('#shotJson').is_visible()
            assert page.locator('[data-action="copy-shot-prompt"]').is_visible()
            payload = {"court":"half","ownIdentification":{"team":"BUEN CONSEJO","side":"left","color":"rojo","checksAgree":True,"conflict":""},"opponentIdentification":{"team":"RIVAL","side":"right","color":"azul","checksAgree":True,"conflict":""},"ownShots":[{"x":.42,"y":.18}],"opponentShots":[{"x":.55,"y":.22}]}
            page.fill('#shotJson', json.dumps(payload))
            page.click('[data-action="apply-shot-json"]')
            assert page.locator('#shotCourt .shot-svg:not(.against)').count() == 1
            assert page.locator('#shotCourt .shot-svg.against').count() == 1
            assert page.locator('#shotCourt .shot-svg').first.get_attribute('r') == '24'
            assert page.locator('#shotCourt .court').evaluate('e => getComputedStyle(e).touchAction') == 'none'
            assert 'revisa la pista' in page.locator('#shotAssignment').inner_text()
            page.locator('.modal-sheet .icon-button').click()

            # Directo llena el espacio útil y conserva Equipo (sin jugadora).
            page.locator('.bottom-nav [data-go="live"]').click()
            expected_today = page.evaluate("() => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}")
            assert page.input_value('#liveDate') == expected_today and page.input_value('#liveDate') != '2026-11-11'
            page.fill('#rival', 'Rival de prueba')
            page.click('[data-action="start-live"]')
            assert page.evaluate('window.__ESTADISTICAS__.getState().live.date') == expected_today
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
            page.locator('.bottom-nav [data-go="games"]').click()
            page.locator('.game-row').first.click()
            headers = ' '.join(page.locator('.boxscore thead').all_inner_texts())
            assert all(label in headers for label in ['DIRECTO', 'ROB', 'PER', 'REB O', 'REB R'])
            assert page.locator('.manual-table-notice', has_text='Sin datos registrados todavía').is_visible()
            page.locator('.modal-sheet .icon-button').click()
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

        # v10: el Directo de La Dehesa fechado cuatro días antes se repara al cargar.
        page = browser.new_page(viewport={'width': 390, 'height': 844})
        page.goto(url, wait_until='networkidle')
        dehesa = copy.deepcopy(STATE)
        dehesa['roster'] = copy.deepcopy(DEHESA_FIXTURE['roster'])
        acta=copy.deepcopy(DEHESA_FIXTURE['actaGame']);acta['id']='dehesa-acta';acta['events']=[];acta['availability']={**acta.get('availability',{}),'manual':False};dehesa['games'].append(acta)
        dehesa['games'].append({'id':'dehesa-live','opponent':'La dehesa','date':'2026-11-11','us':None,'them':None,'players':[],'events':dehesa_events(),'source':'live-pending','availability':{'manual':True}})
        page.evaluate('(state) => window.__ESTADISTICAS__.setState(state)', dehesa)
        repaired = page.evaluate('window.__ESTADISTICAS__.getState()')
        assert not any(game.get('source') == 'live-pending' for game in repaired['games'])
        game = next(game for game in repaired['games'] if game['id'] == 'dehesa-acta')
        assert len(game['events']) == 53 and game['availability']['manual'] is True
        assert any(op['type'] == 'merge-game' and op['payload']['sourceId'] == 'dehesa-live' for op in repaired['ops'])
        page.locator('.bottom-nav [data-go="games"]').click()
        row = page.locator('.game-row', has_text='LA DEHESA CDSCM')
        assert row.locator('.game-score').inner_text().replace(' ', '') == '66–69'
        assert page.locator('.game-row', has_text='Pendiente de acta').count() == 0
        row.click()
        assert page.locator('.score-hero strong').inner_text() == '66–69'
        live_rows = row_live_values(page)
        expected = {
            '7 Sara':['10','1','1','—'], '10 Lucía':['2','2','2','—'], '19 Julia':['2','2','0','—'],
            '13 Teresa':['1','0','2','—'], '16 Alba':['1','0','0','—'], '12 Lara':['1','1','0','—'],
            '65 Gloria':['1','0','2','—'], '9 Beatriz':['0','3','0','—'], '6 Eider':['0','2','3','—'],
            '8 Claudia':['0','1','1','—'], 'Equipo / sin asignar':['3','1','1','7'], 'TOTALES':['21','13','12','7']
        }
        for label, values in expected.items():
            key = next(name for name in live_rows if label in name)
            assert live_rows[key] == values, (label, live_rows[key])
        for index in range(3):
            individual=sum(int(values[index]) for label,values in expected.items() if label not in ['Equipo / sin asignar','TOTALES'] and values[index] != '—')
            assert individual + int(expected['Equipo / sin asignar'][index]) == int(expected['TOTALES'][index])
        page.locator('.modal-sheet .icon-button').click()
        page.locator('.bottom-nav [data-go="team"]').click()
        assert page.locator('.coverage-badge', has_text='1 de 4 con datos').is_visible()
        stats=page.evaluate('window.__ESTADISTICAS__.teamStats()')
        assert [stats['steals'],stats['turnovers'],stats['orbLive'],stats['oppOrbLive']] == [21,13,12,7]
        page.locator('[data-detail="live:ball"]').click()
        assert page.locator('.manual-player-list', has_text='Equipo (sin asignar)').is_visible()
        page.locator('.modal-sheet .icon-button').click()
        page.locator('.bottom-nav [data-go="players"]').click()
        page.locator('.player-rank', has_text='Sara').click()
        manual_text=page.locator('.manual-player-block').inner_text()
        assert 'Robos\n10' in manual_text and 'Pérdidas\n1' in manual_text and 'REB O\n1' in manual_text
        page.close()

        # El selector manual une un pendiente a un acta concreta y deduplica IDs.
        page = browser.new_page(viewport={'width': 390, 'height': 844})
        page.goto(url, wait_until='networkidle')
        manual_state = copy.deepcopy(STATE)
        manual_state['games'].append({'id':'manual-pending','opponent':'Nombre distinto','date':'2026-09-01','us':None,'them':None,'players':[],'events':[{'id':'same','type':'steal','quarter':1},{'id':'same','type':'steal','quarter':1},{'id':'unique','type':'turnover','quarter':2}],'source':'live-pending','availability':{'manual':True}})
        page.evaluate('(state) => window.__ESTADISTICAS__.setState(state)', manual_state)
        page.locator('.bottom-nav [data-go="games"]').click()
        page.locator('.game-row', has_text='Nombre distinto').click()
        page.select_option('#pendingTarget', STATE['games'][0]['id'])
        page.click('[data-action="merge-pending-manual"]')
        merged = page.evaluate('(id) => window.__ESTADISTICAS__.getState().games.find(game=>game.id===id)', STATE['games'][0]['id'])
        assert [event['id'] for event in merged['events']] == ['same', 'unique']
        assert page.locator('.game-row', has_text='Nombre distinto').count() == 0
        page.close()

        # Importación real opcional: usa el Excel de La Dehesa cuando se facilita.
        real_xlsx = os.environ.get('ESTADISTICAS_REAL_XLSX')
        if real_xlsx and Path(real_xlsx).is_file():
            page = browser.new_page(viewport={'width': 390, 'height': 844})
            page.goto(url, wait_until='networkidle')
            real_state = copy.deepcopy(STATE)
            real_state['roster'] = copy.deepcopy(DEHESA_FIXTURE['roster'])
            real_state['games'].append({'id':'real-live','opponent':'La dehesa','date':'2026-11-11','us':None,'them':None,'players':[],'events':dehesa_events(),'source':'live-pending','availability':{'manual':True}})
            page.evaluate('(state) => window.__ESTADISTICAS__.setState(state)', real_state)
            page.locator('.bottom-nav [data-go="games"]').click()
            with page.expect_file_chooser() as chooser_info:
                page.click('[data-action="import-games"]')
            chooser_info.value.set_files(real_xlsx)
            page.wait_for_selector('[data-action="confirm-import"]')
            page.fill('[data-import-date="0"]', '2026-11-15')
            assert page.locator('[data-import-pending="0"] option:checked').get_attribute('value') == 'real-live'
            page.click('[data-action="confirm-import"]')
            imported = page.evaluate("window.__ESTADISTICAS__.getState().games.find(game=>game.opponent==='LA DEHESA CDSCM')")
            assert imported['home'] is False and imported['us'] == 69 and imported['them'] == 66
            assert len(imported['events']) == 53
            assert [sum(1 for event in imported['events'] if event['type']==kind) for kind in ['steal','turnover','orbFor','orbAgainst']] == [21,13,12,7]
            assert imported['source'] == 'fbm'
            page.close()

        # Migración de la copia real: conserva configuración sin exponerla y repara La Dehesa.
        real_backup_path = os.environ.get('ESTADISTICAS_REAL_BACKUP')
        if real_backup_path and Path(real_backup_path).is_file():
            backup=json.loads(Path(real_backup_path).read_text(encoding='utf-8'))
            expected_api=backup.get('settings',{}).get('api',''); expected_token=backup.get('settings',{}).get('token','')
            page=browser.new_page(viewport={'width':390,'height':844})
            page.goto(url,wait_until='networkidle')
            page.evaluate('(state)=>window.__ESTADISTICAS__.setState(state)',backup)
            assert page.evaluate('(value)=>window.__ESTADISTICAS__.getState().settings.api===value',expected_api)
            assert page.evaluate('(value)=>window.__ESTADISTICAS__.getState().settings.token===value',expected_token)
            migrated=page.evaluate('window.__ESTADISTICAS__.getState()')
            assert migrated['version']==10 and not any(game.get('source')=='live-pending' for game in migrated['games'])
            game=next(game for game in migrated['games'] if game.get('opponent')=='LA DEHESA CDSCM')
            assert len(game.get('events',[]))==53
            page.evaluate("window.__ESTADISTICAS__.getState().settings.api='';window.__ESTADISTICAS__.getState().settings.token='' ")
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
        chart=page.locator('.score-chart')
        assert chart.locator('g').count() == 8
        assert page.locator('.chart-window-label').inner_text() == 'Últimos 8 de 25'
        xs=[float(value) for value in chart.locator('circle.score-us').evaluate_all("nodes=>nodes.map(node=>node.getAttribute('cx'))")]
        assert min(xs) <= 55 and max(xs) >= 700 and max(xs)-min(xs) > 640
        assert chart.locator('text.game-label', has_text='P25').count() == 1
        assert page.locator('.chart-wrap').evaluate('e=>e.scrollWidth <= e.clientWidth + 1')
        page.close()

        # Tabla de minutos: la misma rejilla en 4 y 25 partidos, tres móviles y ambos temas.
        for game_count in [4,25]:
            matrix_state=copy.deepcopy(STATE); template=matrix_state['games'][0]; matrix_state['games']=[]
            for index in range(game_count):
                game=copy.deepcopy(template);game['id']=f'min-{game_count}-{index}';game['date']=f'2026-{9+index//20:02d}-{1+index%20:02d}';game['opponent']=f'RIVAL M{index+1}';matrix_state['games'].append(game)
            for width,height in [(360,640),(390,844),(412,915)]:
                for dark in [False,True]:
                    page=browser.new_page(viewport={'width':width,'height':height})
                    page.goto(url,wait_until='networkidle');page.evaluate('(state)=>window.__ESTADISTICAS__.setState(state)',matrix_state)
                    if dark: page.click('[data-action="toggle-theme"]')
                    page.locator('[data-detail="minutes"]').click()
                    head=page.locator('.heat-head > *');row=page.locator('.heat-row').first.locator(':scope > *')
                    assert head.count()==row.count()==3+game_count
                    for index in range(min(4,head.count())):
                        hb=head.nth(index).bounding_box();rb=row.nth(index).bounding_box()
                        assert abs(hb['x']-rb['x'])<.6 and abs(hb['width']-rb['width'])<.6
                    assert head.nth(0).inner_text()=='Jugadora' and head.nth(1).inner_text()=='Media' and head.nth(2).inner_text()=='Cuota' and head.nth(3).inner_text()=='P1'
                    size=page.locator('.minutes-scroll').evaluate('e=>({client:e.clientWidth,scroll:e.scrollWidth})')
                    assert size['scroll']>size['client']
                    page.locator('.minutes-scroll').evaluate('e=>e.scrollLeft=e.scrollWidth')
                    assert page.locator('.minutes-scroll').evaluate('e=>e.scrollLeft')>0
                    page.close()

        # Escritorio: migración v5/v6 a v7, rival completo y scroll del acta.
        page = browser.new_page(viewport={'width': 1440, 'height': 980})
        page.goto(url, wait_until='networkidle')
        page.evaluate("(state) => localStorage.setItem('estadisticas_shared_v2', JSON.stringify(state))", STATE)
        page.reload(wait_until='networkidle')
        migrated = page.evaluate('window.__ESTADISTICAS__.getState()')
        assert migrated['version'] == 10 and len(migrated['games']) == 3 and len(migrated['roster']) == 14
        assert page.evaluate("localStorage.getItem('estadisticas_shared_v2') !== null")
        page.locator('.sidebar [data-go="games"]').click()
        page.locator('.game-row').first.click()
        page.click('[data-action="game-team"][data-side="opp"]')
        assert page.locator('.boxscore tbody tr').count() >= 10
        assert page.locator('.box-wrap').evaluate('e => getComputedStyle(e).overflowX') == 'auto'
        page.close()

        # Actualizador v10: contexto actual explícito + petición realista multiarchivo + ZIP.
        page = browser.new_page(viewport={'width': 1280, 'height': 900})
        page.goto(url + 'actualizar.html', wait_until='networkidle')
        page.set_input_files('#repoFolder', str(ROOT))
        page.wait_for_function("document.querySelector('#fileSummary').classList.contains('ok')")
        with page.expect_download() as context_download:
            page.click('#context')
        context_target=Path(tempfile.gettempdir())/'CONTEXTO_ACTUAL_ESTADISTICAS.md'
        context_download.value.save_as(context_target)
        context_text=context_target.read_text(encoding='utf-8')
        assert 'BEGIN FILE: app.js' in context_text and 'BEGIN FILE: styles.css' in context_text and 'no supongas que conoces github' in context_text.lower()
        patch={'version':'v10','files':[
            {'path':'README.md','changes':[{'find':'# Estadísticas · Buen Consejo v10','replace':'# Estadísticas · Buen Consejo v10\n'}]},
            {'path':'styles.css','changes':[{'find':'@font-face{font-family:InterFallback;src:local("Arial")}', 'replace':'@font-face{font-family:InterFallback;src:local("Arial")}\n/* actualización multiarchivo probada */'}]},
            {'path':'sw.js','changes':[{'find':"const CACHE='estadisticas-v10-20261116-audit2';",'replace':"const CACHE='estadisticas-v10-20261116-audit2-prueba';"}]},
            {'path':'docs/PRUEBA_ACTUALIZADOR.md','content':'# Prueba\nCambio multiarchivo.'}
        ]}
        page.fill('#answer', json.dumps(patch,ensure_ascii=False))
        page.click('#build')
        page.wait_for_function("document.querySelector('#download').disabled === false")
        assert page.locator('#status').get_attribute('class') == 'status ok'
        with page.expect_download() as download_info: page.click('#download')
        target = Path(tempfile.gettempdir())/'actualizacion-estadisticas-v10-prueba.zip'
        download_info.value.save_as(target)
        with zipfile.ZipFile(target) as archive:
            assert {'README.md','styles.css','sw.js','docs/PRUEBA_ACTUALIZADOR.md','PROYECTO_ESTADISTICAS.md','LEEME_ACTUALIZACION.txt'}.issubset(archive.namelist())
            assert b'No tienes que sustituir archivos de conocimiento' in archive.read('LEEME_ACTUALIZACION.txt')
        context_target.unlink(missing_ok=True);target.unlink(missing_ok=True)
        browser.close()

    print('OK · v10: Directo unido, local–visitante, tablas, comparación y manual visible sin inventar ceros, comparación, series largas, actas, mapas, temas y migración')
finally:
    server.shutdown()
