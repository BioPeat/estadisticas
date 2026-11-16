#!/usr/bin/env python3
"""Regresión funcional de Estadísticas v11: móvil, gráficos, Directo y multiequipo."""
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright
import copy, json, os

ROOT=Path(__file__).resolve().parents[1]
STATE=json.loads((ROOT/'tests/fixtures/real_3_partidos.json').read_text(encoding='utf-8'))
DEHESA=json.loads((ROOT/'tests/fixtures/dehesa_directo_sanitizado.json').read_text(encoding='utf-8'))
REAL_PATH=os.environ.get('ESTADISTICAS_REAL_BACKUP','')
REAL=json.loads(Path(REAL_PATH).read_text(encoding='utf-8')) if REAL_PATH else None

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=ROOT))
Thread(target=server.serve_forever,daemon=True).start()
URL=f'http://127.0.0.1:{server.server_port}/'

def clean_state(value):
    out=copy.deepcopy(value)
    out['settings']={**out.get('settings',{}),'api':'','token':'','role':'admin','teamId':''}
    out['ops']=[];out['lastSeq']=0
    return out

def long_season(base,count=25):
    out=clean_state(base); template=copy.deepcopy(out['games'][0]);out['games']=[]
    for i in range(count):
        game=copy.deepcopy(template);game['id']=f'visual-{i+1}';game['opponent']=f'Fixture visual {i+1:02d}';game['date']=f'2026-{9+i//20:02d}-{1+i%20:02d}';game['us']=45+(i*7)%35;game['them']=43+(i*11)%37;game['events']=[];out['games'].append(game)
    return out

try:
  with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/opt/pw-browsers/chromium-1228/chrome-linux64/chrome')
    # Tres tamaños, claro/oscuro y datos sin Directo.
    for width,height in [(360,640),(390,844),(412,915)]:
      page=browser.new_page(viewport={'width':width,'height':height});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
      page.goto(URL,wait_until='networkidle');page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)',clean_state(STATE))
      assert page.evaluate('window.__ESTADISTICAS__.APP_VERSION')=='v11'
      assert page.locator('[data-logo="aro-vector"]').count()==1
      assert page.evaluate('window.__ESTADISTICAS__.getState().team.gender')=='female'
      assert page.evaluate('window.__ESTADISTICAS__.getState().team.color')=='red'
      assert page.locator('.team-players-label').first.inner_text()=='Jugadoras'
      colors=page.evaluate("() => {const root=getComputedStyle(document.documentElement),us=getComputedStyle(document.querySelector('.score-label.us')),them=getComputedStyle(document.querySelector('.score-label.them'));return {team:root.getPropertyValue('--team').trim(),rival:root.getPropertyValue('--rival').trim(),us:us.fill,them:them.fill}}")
      assert colors['us']!=colors['them']
      assert page.locator('.live-stat-card').count()==0
      assert page.locator('.live-data-block').count()==0
      assert page.locator('.stats-grid .stat-card').count()>=11
      assert page.locator('.stat-card .dual-trend.compact').count()>=11
      assert page.locator('.score-margin').count()==3
      assert float(page.locator('.score-margin').first.evaluate("e=>getComputedStyle(e).fontSize.replace('px','')"))>=15
      assert page.evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1')
      page.click('[data-action="toggle-theme"]');assert page.locator('html').get_attribute('data-theme')=='dark'
      assert not errors,errors
      page.close()

    # Copia real: Directo integrado, Eider, ratio y cuotas explícitas.
    if REAL:
      page=browser.new_page(viewport={'width':390,'height':844});page.goto(URL,wait_until='networkidle');page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)',clean_state(REAL))
      assert page.evaluate('window.__ESTADISTICAS__.getState().games.length')==4
      assert page.evaluate('window.__ESTADISTICAS__.recordedLiveGames().length')==1
      assert page.locator('.stats-grid .live-stat-card').count()==2
      assert page.locator('.live-data-block').count()==0
      assert page.locator('.live-stat-card .dual-trend.compact').count()==2
      page.click('.bottom-nav [data-go="players"]');page.locator('.player-rank',has_text='Eider').click()
      assert page.locator('.share-mode',has_text='Por partido').is_visible()
      assert page.locator('.donut',has_text='Cuota puntos · por partido').is_visible()
      assert page.locator('.detail-stats',has_text='ROB/PER').is_visible()
      assert page.locator('.detail-stats',has_text='Balance ROB−PER').is_visible()
      assert page.locator('.negative-value',has_text='-2').is_visible()
      assert page.locator('.inline-data-note',has_text='nunca es negativo').is_visible()
      page.click('[data-action="player-share"][data-mode="season"]')
      assert page.locator('.donut',has_text='temporada').count()==2
      page.close()

    # 25 partidos: todos los puntos, desplazamiento y vista ampliada.
    page=browser.new_page(viewport={'width':390,'height':844});page.goto(URL,wait_until='networkidle');page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)',long_season(STATE))
    assert page.locator('.score-chart g[data-detail^="game:"]').count()==25
    dims=page.locator('.score-chart-scroller').evaluate('e=>({client:e.clientWidth,scroll:e.scrollWidth})');assert dims['scroll']>dims['client']
    page.locator('.score-chart-scroller').evaluate('e=>e.scrollLeft=500');assert page.locator('.score-chart-scroller').evaluate('e=>e.scrollLeft')>0
    page.locator('.score-chart-scroller').click(position={'x':8,'y':8});assert page.locator('#modalTitle',has_text='Marcador completo').is_visible()
    assert page.locator('.modal .score-chart g[data-detail^="game:"]').count()==25
    page.close()

    # Multiequipo local: cambio e aislamiento total.
    page=browser.new_page(viewport={'width':390,'height':844});page.goto(URL,wait_until='networkidle');page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)',clean_state(STATE))
    original_id=page.evaluate('window.__ESTADISTICAS__.getWorkspaceBook().activeId')
    page.click('[data-action="open-teams"]');page.fill('#newTeamName','Equipo aislado');page.fill('#newTeamSeason','27/28');page.click('[data-action="create-team"]');assert 'Elige femenino' in page.locator('#toast').inner_text()
    page.select_option('#newTeamGender','male');page.select_option('#newTeamColor','blue');page.click('[data-action="create-team"]')
    assert page.evaluate('window.__ESTADISTICAS__.getState().games.length')==0
    assert page.evaluate('window.__ESTADISTICAS__.getWorkspaceBook().workspaces.length')==2
    isolated_id=page.evaluate('window.__ESTADISTICAS__.getWorkspaceBook().activeId');assert isolated_id!=original_id
    isolated=clean_state(STATE);isolated['team']={'name':'Equipo aislado','season':'27/28','gender':'male','color':'blue'};isolated['games']=isolated['games'][:1]
    page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)',isolated);page.click('.bottom-nav [data-go="players"]');assert page.locator('.team-players-label').first.inner_text()=='Jugadores';page.evaluate('(id)=>window.__ESTADISTICAS__.switchWorkspace(id)',original_id)
    assert page.evaluate('window.__ESTADISTICAS__.getState().games.length')==3
    assert page.evaluate('window.__ESTADISTICAS__.getState().team.gender')=='female'
    page.evaluate('(id)=>window.__ESTADISTICAS__.switchWorkspace(id)',isolated_id);assert page.evaluate('window.__ESTADISTICAS__.getState().games.length')==1
    page.click('[data-action="open-teams"]');page.fill('#newTeamName','Equipo sin detectar');page.select_option('#newTeamGender','neutral');page.select_option('#newTeamColor','purple');page.click('[data-action="create-team"]')
    assert page.evaluate('window.__ESTADISTICAS__.getState().team.gender')=='neutral'
    page.click('.bottom-nav [data-go="players"]');assert page.locator('.team-players-label').first.inner_text()=='Jugadores'
    page.close()

    # Enlace v11: crea/abre solo su equipo y aplica el rol lector.
    context=browser.new_context(viewport={'width':390,'height':844})
    page=context.new_page();page.route('https://sync.test/**',lambda route:route.fulfill(status=200,content_type='application/json',body='{"events":[],"lastSeq":0}'))
    page.goto(URL+'?api=https%3A%2F%2Fsync.test&token=token-prueba&role=viewer&team=team-prueba&name=Equipo%20Compartido&season=27%2F28&gender=male&color=purple',wait_until='networkidle')
    settings=page.evaluate('window.__ESTADISTICAS__.getState().settings');assert settings['teamId']=='team-prueba' and settings['role']=='viewer'
    assert page.evaluate('window.__ESTADISTICAS__.getState().team.name')=='Equipo Compartido'
    assert page.evaluate('window.__ESTADISTICAS__.getState().team.gender')=='male'
    assert page.evaluate('window.__ESTADISTICAS__.getState().team.color')=='purple'
    assert page.locator('[data-action="import-games"]:visible').count()==0
    assert 'token=' not in page.url
    context.close()

    # Migración exacta del almacén v10: un equipo, mismos datos, sin recrear enlace.
    if REAL:
      legacy=copy.deepcopy(REAL)
      context=browser.new_context(viewport={'width':390,'height':844})
      context.add_init_script(script="localStorage.setItem('estadisticas_shared_v2', JSON.stringify("+json.dumps(legacy)+")); localStorage.removeItem('estadisticas_multiteam_v11');")
      page=context.new_page();page.goto(URL,wait_until='domcontentloaded')
      assert page.evaluate('window.__ESTADISTICAS__.getWorkspaceBook().workspaces.length')==1
      assert page.evaluate('window.__ESTADISTICAS__.getState().games.length')==4
      assert page.evaluate('window.__ESTADISTICAS__.getState().settings.token.length>0')
      assert page.evaluate('window.__ESTADISTICAS__.getState().team.gender')=='female'
      assert page.evaluate('window.__ESTADISTICAS__.getState().team.color')=='red'
      context.close()

    # Creación en nube simulada: el propietario recibe un espacio aislado v11.
    context=browser.new_context(viewport={'width':390,'height':844})
    context.add_init_script(script="localStorage.setItem('estadisticas_service_api','https://sync.test')")
    page=context.new_page()
    def cloud(route):
      request=route.request
      if request.method=='POST' and request.url.endswith('/api/v3/teams'):
        route.fulfill(status=201,content_type='application/json',body='{"team":{"id":"cloud-1","name":"Nube A","season":"27/28"},"admin":{"token":"admin-prueba","role":"admin"}}')
      else: route.fulfill(status=200,content_type='application/json',body='{"events":[],"lastSeq":0}')
    page.route('https://sync.test/**',cloud);page.goto(URL,wait_until='networkidle')
    page.click('[data-action="open-teams"]');page.fill('#newTeamName','Nube A');page.fill('#newTeamSeason','27/28');page.select_option('#newTeamGender','female');page.select_option('#newTeamColor','teal');page.click('[data-action="create-team"]')
    page.wait_for_function("window.__ESTADISTICAS__.getState().settings.teamId==='cloud-1'")
    cloud_settings=page.evaluate('window.__ESTADISTICAS__.getState().settings')
    assert cloud_settings['teamId']=='cloud-1' and cloud_settings['role']=='admin'
    assert page.evaluate('window.__ESTADISTICAS__.getState().team.gender')=='female'
    assert page.evaluate('window.__ESTADISTICAS__.getState().team.color')=='teal'
    context.close()

    # Importación real de los tres Excel de partido y la plantilla, si se facilitan.
    excel_dir=os.environ.get('ESTADISTICAS_EXCEL_DIR','')
    if excel_dir:
      books=sorted(str(path) for path in Path(excel_dir).glob('estadisticaPartido*.xlsx'))
      roster=next(iter(Path(excel_dir).glob('jugadores*.xlsx')),None)
      assert len(books)>=3 and roster
      page=browser.new_page(viewport={'width':390,'height':844});page.goto(URL,wait_until='networkidle');page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)',clean_state({'version':11,'team':{'name':'Buen Consejo','season':'26/27','gender':'neutral','color':'blue'}}))
      assert page.evaluate("window.__ESTADISTICAS__.detectGender([['2ª Div Aut Fem ORO']])")=='female'
      assert page.evaluate("window.__ESTADISTICAS__.detectGender([['Junior Masculino A']])")=='male'
      assert page.evaluate("window.__ESTADISTICAS__.detectGender([['Junior Preferente']])") is None
      page.click('[data-action="import-games"]');page.set_input_files('#fileInput',books);page.wait_for_selector('[data-action="confirm-import"]');page.click('[data-action="confirm-import"]')
      assert page.evaluate('window.__ESTADISTICAS__.validGames().length')==3
      page.click('.bottom-nav [data-go="players"]');page.click('[data-action="import-roster"]');page.set_input_files('#fileInput',str(roster));page.wait_for_function("window.__ESTADISTICAS__.getState().team.gender==='female'")
      assert page.evaluate('window.__ESTADISTICAS__.getState().roster.length')>=10
      assert page.evaluate('window.__ESTADISTICAS__.getState().team.gender')=='female'
      page.close()

    # actualizar.html: petición realista que modifica dos archivos en una sola respuesta.
    page=browser.new_page(viewport={'width':1280,'height':900});page.goto(URL+'actualizar.html',wait_until='networkidle');page.set_input_files('#repoFolder',str(ROOT));page.wait_for_function("document.querySelector('#fileSummary').classList.contains('ok')")
    patch={'version':'v11','files':[{'path':'config.js','changes':[{'find':"window.ESTADISTICAS_CONFIG = { serviceApi: '' };",'replace':"window.ESTADISTICAS_CONFIG = { serviceApi: '' };\n// Cambio multiarchivo de prueba validado."}]},{'path':'docs/NOTA_MULTIARCHIVO.md','content':'# Prueba\nArchivo nuevo creado junto con un cambio en config.js.\n'}]}
    page.fill('#answer',json.dumps(patch,ensure_ascii=False));page.click('#build');page.wait_for_function("document.querySelector('#status').classList.contains('ok')")
    with page.expect_download() as download_info: page.click('#download')
    download=download_info.value;target=Path(download.suggested_filename);download.save_as(target)
    import zipfile
    with zipfile.ZipFile(target) as archive:
      names=set(archive.namelist());assert {'config.js','docs/NOTA_MULTIARCHIVO.md','PROYECTO_ESTADISTICAS.md'}<=names
    target.unlink(missing_ok=True);page.close()

    browser.close()
finally:
  server.shutdown()
print('OK · v11: móvil, temas, Directo, cuotas, ratio, 25 partidos, multiequipo, género, colores, enlaces, Excel, actualizador y migración')
