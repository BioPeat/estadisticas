#!/usr/bin/env python3
"""Regresión funcional de Estadísticas v12.3: móvil, gráficos, Directo y multiequipo."""
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
REAL=json.loads(Path(REAL_PATH).read_text(encoding='utf-8')) if REAL_PATH and Path(REAL_PATH).is_file() else None
if REAL_PATH and REAL is None: print(f'Aviso: no existe {REAL_PATH}; se omite esa prueba opcional.')
SECOND_PATH=os.environ.get('ESTADISTICAS_SECOND_BACKUP','')
SECOND=json.loads(Path(SECOND_PATH).read_text(encoding='utf-8')) if SECOND_PATH and Path(SECOND_PATH).is_file() else None
if SECOND_PATH and SECOND is None: print(f'Aviso: no existe {SECOND_PATH}; se omite esa prueba opcional.')

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
    candidate=Path('/opt/pw-browsers/chromium-1228/chrome-linux64/chrome')
    launch={'headless':True}
    if candidate.exists(): launch['executable_path']=str(candidate)
    browser=pw.chromium.launch(**launch)
    # Tres tamaños, claro/oscuro y datos sin Directo.
    for width,height in [(360,640),(390,844),(412,915)]:
      page=browser.new_page(viewport={'width':width,'height':height});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
      page.goto(URL,wait_until='networkidle');page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)',clean_state(STATE))
      assert page.evaluate('window.__ESTADISTICAS__.APP_VERSION')=='v12.3'
      assert page.locator('[data-logo="aro-vector"]').count()==1
      assert page.evaluate('window.__ESTADISTICAS__.getState().team.gender')=='female'
      assert page.evaluate('window.__ESTADISTICAS__.getState().team.color')=='red'
      assert page.locator('.team-players-label').first.inner_text()=='Jugadoras'
      colors=page.evaluate("() => {const root=getComputedStyle(document.documentElement),us=getComputedStyle(document.querySelector('.score-label.us')),them=getComputedStyle(document.querySelector('.score-label.them'));return {team:root.getPropertyValue('--team').trim(),rival:root.getPropertyValue('--rival').trim(),us:us.fill,them:them.fill}}")
      assert colors['us']!=colors['them']
      assert page.locator('.live-stat-card').count()==0
      assert page.locator('.live-data-block').count()==0
      assert page.locator('.stats-grid .stat-card').count()>=11
      assert page.locator('.stat-card .dual-trend.compact').count()>=10
      assert page.locator('.score-margin').count()==3
      assert float(page.locator('.score-margin').first.evaluate("e=>getComputedStyle(e).fontSize.replace('px','')"))>=15
      assert page.evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1')
      if width==390:
        page.select_option('#pointShareScope','average')
        assert '/P' in page.locator('.point-share .share-bars').inner_text()
        page.select_option('#pointShareScope','season')
        page.click('.bottom-nav [data-go="games"]');page.locator('.game-row').first.click()
        assert page.evaluate("() => {const th=document.querySelector('.boxscore thead th.identity');return th ? th.scrollWidth<=th.clientWidth+2 : true}")
        page.click('.modal-sheet .icon-button');page.click('.bottom-nav [data-go="team"]')
        page.click('[data-action="open-settings"]')
        assert page.locator('.palette-swatch').count()>=5
        page.click('.palette-swatch[data-color="purple"]');page.click('[data-action="save-settings"]')
        diff_colors=page.evaluate("() => {const pos=document.querySelector('.balance-mini i.positive'),lbl=document.querySelector('.score-label.us');return {pos:pos?getComputedStyle(pos).backgroundColor:'',us:lbl?getComputedStyle(lbl).fill:''}}")
        assert diff_colors['pos']==diff_colors['us'] and diff_colors['pos']!='rgb(198, 40, 61)'
        page.click('[data-action="open-settings"]');page.click('.palette-swatch[data-color="red"]');page.click('[data-action="save-settings"]')
      page.click('[data-action="toggle-theme"]');assert page.locator('html').get_attribute('data-theme')=='dark'
      assert not errors,errors
      page.close()

    # Copia real: Directo integrado, Eider, ratio y cuotas explícitas.
    if REAL:
      page=browser.new_page(viewport={'width':390,'height':844});page.goto(URL,wait_until='networkidle');page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)',clean_state(REAL))
      assert page.evaluate('window.__ESTADISTICAS__.getState().games.length')==4
      assert page.evaluate('window.__ESTADISTICAS__.recordedLiveGames().length')==1
      page.click('[data-action="open-settings"]');assert page.locator('text=Servidor de sincronización').count()==0;assert page.locator('text=Conexión avanzada').count()==0;assert page.locator('text=Token').count()==0;assert page.locator('[data-action="share-install"]').is_visible();page.click('.modal-sheet .icon-button')
      assert page.locator('.stats-grid .live-stat-card').count()==3
      assert page.locator('.live-data-block').count()==0
      assert page.locator('.live-stat-card .paired-bars').count()==2
      assert page.locator('.possession-card').count()==1
      assert page.evaluate("window.__ESTADISTICAS__.liveMetricRows('possession')[0].own")==13
      page.click('.bottom-nav [data-go="players"]');page.locator('.player-rank',has_text='Eider').click()
      assert page.locator('.share-mode',has_text='Por partido').is_visible()
      assert page.locator('.donut',has_text='Cuota puntos · por partido').is_visible()
      assert page.locator('.detail-stats',has_text='Ratio robos/pérdidas').is_visible()
      assert page.locator('.detail-stats',has_text='Balance (ROB + REB O) − pérdidas').is_visible()
      assert page.locator('.inline-data-note',has_text='nunca es negativo').is_visible()
      assert page.locator('.detail-stats',has_text='FAL/40').count()==0
      page.click('[data-action="player-share"][data-mode="season"]')
      assert page.locator('.donut',has_text='temporada').count()==2
      page.close()

    # Segundo equipo real: seis partidos, masculino y sin Directo.
    if SECOND:
      page=browser.new_page(viewport={'width':412,'height':915});page.goto(URL,wait_until='networkidle');page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)',clean_state(SECOND))
      assert page.evaluate('window.__ESTADISTICAS__.getState().games.length')==6
      assert page.evaluate('window.__ESTADISTICAS__.getState().team.gender')=='male'
      assert page.evaluate('window.__ESTADISTICAS__.recordedLiveGames().length')==0
      assert page.locator('.live-stat-card').count()==0
      page.click('.bottom-nav [data-go="players"]');assert page.locator('.team-players-label').first.inner_text()=='Jugadores'
      assert page.evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1')
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
    page=browser.new_page(viewport={'width':390,'height':844});page.goto(URL,wait_until='networkidle');page.evaluate("localStorage.setItem('estadisticas_service_api','http://127.0.0.1:1')");page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)',clean_state(STATE))
    original_id=page.evaluate('window.__ESTADISTICAS__.getWorkspaceBook().activeId')
    page.click('[data-action="open-teams"]');page.fill('#newTeamName','Equipo aislado');page.fill('#newTeamSeason','27/28');page.click('[data-action="create-team"]');assert 'Elige femenino' in page.locator('#toast').inner_text()
    page.select_option('#newTeamGender','male');page.select_option('#newTeamColor','blue');page.click('[data-action="create-team"]')
    page.wait_for_function('window.__ESTADISTICAS__.getWorkspaceBook().workspaces.length===2')
    assert page.evaluate('window.__ESTADISTICAS__.getState().games.length')==0
    assert page.evaluate('window.__ESTADISTICAS__.getWorkspaceBook().workspaces.length')==2
    isolated_id=page.evaluate('window.__ESTADISTICAS__.getWorkspaceBook().activeId');assert isolated_id!=original_id
    isolated=clean_state(STATE);isolated['team']={'name':'Equipo aislado','season':'27/28','gender':'male','color':'blue'};isolated['games']=isolated['games'][:1]
    page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)',isolated);page.click('.bottom-nav [data-go="players"]');assert page.locator('.team-players-label').first.inner_text()=='Jugadores';page.evaluate('(id)=>window.__ESTADISTICAS__.switchWorkspace(id)',original_id)
    assert page.evaluate('window.__ESTADISTICAS__.getState().games.length')==3
    assert page.evaluate('window.__ESTADISTICAS__.getState().team.gender')=='female'
    page.evaluate('(id)=>window.__ESTADISTICAS__.switchWorkspace(id)',isolated_id);assert page.evaluate('window.__ESTADISTICAS__.getState().games.length')==1
    page.click('[data-action="open-teams"]');page.fill('#newTeamName','Equipo sin detectar');page.select_option('#newTeamGender','neutral');page.select_option('#newTeamColor','purple');page.click('[data-action="create-team"]')
    page.wait_for_function('window.__ESTADISTICAS__.getWorkspaceBook().workspaces.length===3')
    assert page.evaluate('window.__ESTADISTICAS__.getState().team.gender')=='neutral'
    page.click('.bottom-nav [data-go="players"]');assert page.locator('.team-players-label').first.inner_text()=='Jugadores'
    page.close()

    # Enlaces v12: crea/abre solo su equipo y aplica el rol lector.
    context=browser.new_context(viewport={'width':390,'height':844})
    page=context.new_page();page.route('https://sync.test/**',lambda route:route.fulfill(status=200,content_type='application/json',body='{"events":[],"lastSeq":0}'))
    page.goto(URL+'?api=https%3A%2F%2Fsync.test&token=token-prueba&role=viewer&team=team-prueba&name=Equipo%20Compartido&season=27%2F28&gender=male&color=purple',wait_until='networkidle')
    settings=page.evaluate('window.__ESTADISTICAS__.getState().settings');assert settings['teamId']=='team-prueba' and settings['role']=='viewer'
    assert page.evaluate('window.__ESTADISTICAS__.getState().team.name')=='Equipo Compartido'
    assert page.evaluate('window.__ESTADISTICAS__.getState().team.gender')=='male'
    assert page.evaluate('window.__ESTADISTICAS__.getState().team.color')=='purple'
    assert page.locator('[data-action="import-games"]:visible').count()==0
    assert 'token=' not in page.url
    page.goto(URL+'?open=2#api=https%3A%2F%2Fsync.test&token=editor-otro&role=editor&team=team-otro&name=Segundo%20Equipo&season=27%2F28&gender=female&color=teal',wait_until='networkidle')
    assert page.evaluate('window.__ESTADISTICAS__.getState().settings.teamId')=='team-otro'
    assert page.evaluate('window.__ESTADISTICAS__.getState().settings.role')=='editor'
    assert page.evaluate('window.__ESTADISTICAS__.getWorkspaceBook().workspaces.length')==2
    first_id=page.evaluate("window.__ESTADISTICAS__.getWorkspaceBook().workspaces.find(w=>w.data.settings.teamId==='team-prueba').id")
    page.evaluate('(id)=>window.__ESTADISTICAS__.switchWorkspace(id)',first_id)
    assert page.evaluate('window.__ESTADISTICAS__.getState().settings.role')=='viewer'
    assert page.evaluate('window.__ESTADISTICAS__.getState().team.name')=='Equipo Compartido'
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

    # Creación en nube simulada: el propietario recibe un espacio aislado v12.
    context=browser.new_context(viewport={'width':390,'height':844})
    context.add_init_script(script="localStorage.setItem('estadisticas_service_api','https://sync.test')")
    page=context.new_page();auth_errors=[]
    def cloud(route):
      request=route.request
      if request.method=='POST' and request.url.endswith('/api/v3/teams'):
        route.fulfill(status=201,content_type='application/json',body='{"team":{"id":"cloud-1","name":"Nube A","season":"27/28"},"admin":{"token":"admin-prueba","role":"admin"}}')
      elif request.headers.get('authorization')!='Bearer admin-prueba':
        auth_errors.append(request.headers.get('authorization'));route.fulfill(status=401,content_type='application/json',body='{"error":"no"}')
      else: route.fulfill(status=200,content_type='application/json',body='{"events":[],"lastSeq":0}')
    page.route('https://sync.test/**',cloud);page.goto(URL,wait_until='networkidle')
    page.click('[data-action="open-teams"]');page.fill('#newTeamName','Nube A');page.fill('#newTeamSeason','27/28');page.select_option('#newTeamGender','female');page.select_option('#newTeamColor','teal');page.click('[data-action="create-team"]')
    page.wait_for_function("window.__ESTADISTICAS__.getState().settings.teamId==='cloud-1'")
    page.wait_for_timeout(600);assert not auth_errors,auth_errors
    cloud_settings=page.evaluate('window.__ESTADISTICAS__.getState().settings')
    assert cloud_settings['teamId']=='cloud-1' and cloud_settings['role']=='admin'
    assert page.evaluate('window.__ESTADISTICAS__.getState().team.gender')=='female'
    assert page.evaluate('window.__ESTADISTICAS__.getState().team.color')=='teal'
    context.close()

    # Un equipo local con siete operaciones sube todos sus datos al compartir por primera vez.
    context=browser.new_context(viewport={'width':390,'height':844})
    context.add_init_script(script="localStorage.setItem('estadisticas_service_api','https://sync.test')")
    page=context.new_page();posted=[]
    def promote(route):
      r=route.request
      if r.method=='POST' and r.url.endswith('/api/v3/teams'):
        route.fulfill(status=201,content_type='application/json',body='{"team":{"id":"cloud-local","name":"Local","season":"26/27"},"admin":{"token":"owner-test","role":"admin"}}')
      elif '/api/v3/teams/' in r.url and r.headers.get('authorization')!='Bearer owner-test':
        route.fulfill(status=401,content_type='application/json',body='{"error":"Enlace no válido"}')
      elif r.method=='POST' and r.url.endswith('/events'):
        posted.extend(json.loads(r.post_data or '{}').get('events',[]));route.fulfill(status=200,content_type='application/json',body='{"ok":true,"accepted":20}')
      elif r.method=='GET' and '/events?' in r.url:
        route.fulfill(status=200,content_type='application/json',body='{"events":[],"lastSeq":0}')
      elif r.method=='POST' and r.url.endswith('/invites'):
        route.fulfill(status=201,content_type='application/json',body='{"id":"invite-1","role":"editor","token":"editor-test"}')
      else: route.fulfill(status=200,content_type='application/json',body='{}')
    page.route('https://sync.test/**',promote);page.goto(URL,wait_until='networkidle')
    local=clean_state(STATE);local['team']={'name':'Equipo local','season':'26/27','gender':'male','color':'blue'};local['ops']=[{'id':f'pending-{i}','at':'2026-11-16T12:00:00Z','type':'set-team','payload':{'team':local['team']}} for i in range(7)]
    page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)',local);page.click('[data-action="open-settings"]')
    assert page.locator('text=La primera vez subiremos automáticamente').is_visible();page.click('[data-action="create-invite"][data-role="editor"]');page.wait_for_selector('#inviteLink')
    assert page.evaluate('window.__ESTADISTICAS__.getState().settings.teamId')=='cloud-local'
    assert any(e['type']=='set-roster' for e in posted) and sum(e['type']=='replace-game' for e in posted)==3
    assert '#api=' in page.locator('#inviteLink').input_value() and 'role=editor' in page.locator('#inviteLink').input_value()
    context.close()

    # Importación real de los tres Excel de partido y la plantilla, si se facilitan.
    excel_dir=os.environ.get('ESTADISTICAS_EXCEL_DIR','')
    if excel_dir:
      books=sorted(str(path) for path in Path(excel_dir).glob('estadisticaPartido*.xlsx'))
      roster=next(iter(Path(excel_dir).glob('jugadores*.xlsx')),None)
      assert len(books)>=3 and roster
      page=browser.new_page(viewport={'width':390,'height':844});page.goto(URL,wait_until='networkidle');page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)',clean_state({'version':12.3,'team':{'name':'Buen Consejo','season':'26/27','gender':'neutral','color':'blue'}}))
      assert page.evaluate("window.__ESTADISTICAS__.detectGender([['2ª Div Aut Fem ORO']])")=='female'
      assert page.evaluate("window.__ESTADISTICAS__.detectGender([['Junior Masculino A']])")=='male'
      assert page.evaluate("window.__ESTADISTICAS__.detectGender([['Junior Preferente']])") is None
      page.click('[data-action="import-games"]');page.set_input_files('#fileInput',books);page.wait_for_selector('[data-action="confirm-import"]');page.click('[data-action="confirm-import"]')
      assert page.evaluate('window.__ESTADISTICAS__.validGames().length')==3
      page.click('.bottom-nav [data-go="players"]');page.click('[data-action="import-roster"]');page.set_input_files('#fileInput',str(roster));page.wait_for_function("window.__ESTADISTICAS__.getState().team.gender==='female'")
      assert page.evaluate('window.__ESTADISTICAS__.getState().roster.length')>=10
      assert page.evaluate('window.__ESTADISTICAS__.getState().team.gender')=='female'
      page.close()

    # Conflicto de dos clientes: el reemplazo antiguo no pisa el nuevo y Directo se fusiona por id.
    page=browser.new_page(viewport={'width':390,'height':844});page.goto(URL,wait_until='networkidle')
    conflict=page.evaluate("""() => {const api=window.__ESTADISTICAS__,base={id:'g-conflict',opponent:'Antiguo',revision:2,updatedAt:'2026-11-18T10:00:00Z',mapRevision:1,mapUpdatedAt:'2026-11-18T09:00:00Z',events:[{id:'e-a',type:'steal'}],shotsFor:[{id:'s-new',x:.2,y:.3}],shotsAgainst:[]},stale={...base,opponent:'Muy antiguo',revision:1,updatedAt:'2026-11-18T08:00:00Z',events:[{id:'e-b',type:'turnover'}],mapRevision:0,mapUpdatedAt:'2026-11-18T07:00:00Z',shotsFor:[{id:'s-old',x:.7,y:.7}]},fresh={...base,opponent:'Cliente B nuevo',revision:3,updatedAt:'2026-11-18T11:00:00Z',events:[{id:'e-c',type:'orbFor'}]};const afterStale=api.mergeGameVersions(base,stale),afterFresh=api.mergeGameVersions(afterStale,fresh);return {staleName:afterStale.opponent,staleEvents:afterStale.events.map(e=>e.id).sort(),staleShots:afterStale.shotsFor.map(e=>e.id),freshName:afterFresh.opponent,freshEvents:afterFresh.events.map(e=>e.id).sort()}}""")
    assert conflict['staleName']=='Antiguo' and conflict['staleEvents']==['e-a','e-b'] and conflict['staleShots']==['s-new']
    assert conflict['freshName']=='Cliente B nuevo' and conflict['freshEvents']==['e-a','e-b','e-c']
    # Quitar de plantilla conserva todas las filas históricas de los partidos.
    page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)',clean_state(STATE));before=page.evaluate('window.__ESTADISTICAS__.getState().games.reduce((n,g)=>n+g.players.length,0)')
    page.click('.bottom-nav [data-go="players"]');page.click('[data-action="manage-roster"]');assert page.locator('.roster-manage-row').count()>0
    page.locator('.roster-manage-row [data-action="remove-roster-player"]').first.click();page.click('[data-action="confirm-remove-roster-player"]')
    assert page.evaluate('window.__ESTADISTICAS__.getState().games.reduce((n,g)=>n+g.players.length,0)')==before
    page.close()

    # Seguridad: datos remotos hostiles no ejecutan código (auditoría A-003/A-004).
    page=browser.new_page(viewport={'width':390,'height':844});page.goto(URL,wait_until='networkidle')
    hostile=clean_state(STATE);hostile['team']['season']='"><img src=x onerror="window.__xss=1">';hostile['games'][0]['date']='<img src=x onerror="window.__xss=2">';hostile['games'][0]['id']='x" onmouseover="window.__xss=3'
    page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)',hostile);page.click('.bottom-nav [data-go="games"]');page.click('.bottom-nav [data-go="team"]');page.wait_for_timeout(300)
    assert page.evaluate('window.__xss===undefined'),'XSS ejecutado'
    assert page.evaluate("window.__ESTADISTICAS__.getState().games.every(g=>/^[A-Za-z0-9_-]+$/.test(g.id))")
    # Sin mapas: «Sin mapa» en vez de «0 canastas» (A-060).
    assert page.locator('.map-card .empty-chart').count()==2
    page.close()

    # Parciales por cuarto en mapa de tiro, Equipo, detalle y Partido (3 tamaños, claro/oscuro).
    for width,height in [(360,640),(390,844),(412,915)]:
      page=browser.new_page(viewport={'width':width,'height':height});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
      page.goto(URL,wait_until='networkidle')
      qstate=clean_state(STATE);qstate['games'][0]['opponent']='CORAZONISTAS';qstate['games'][0]['us']=75;qstate['games'][0]['them']=56
      page.evaluate('(s)=>window.__ESTADISTICAS__.setState(s)',qstate)
      if width==390:
        page.click('.bottom-nav [data-go="games"]');page.click('[data-action="open-shot"]')
        assert page.locator('[data-action="paste-shot-json"]').is_visible()
        page.select_option('#shotGame',qstate['games'][0]['id'])
        prompt_text=page.evaluate('window.__ESTADISTICAS__.shotPrompt()')
        assert '"quarters"' in prompt_text and 'IZQUIERDA' in prompt_text and 'DERECHA' in prompt_text
        shot_payload={'court':'half','ownIdentification':{'team':'BUEN CONSEJO','side':'right','color':'gris','checksAgree':True,'conflict':''},'opponentIdentification':{'team':'CORAZONISTAS','side':'left','color':'rojo','checksAgree':True,'conflict':''},'quarters':[{'quarter':1,'own':15,'opponent':15},{'quarter':2,'own':29,'opponent':8},{'quarter':3,'own':16,'opponent':17},{'quarter':4,'own':15,'opponent':16}],'ownShots':[{'x':0.42,'y':0.18}],'opponentShots':[{'x':0.55,'y':0.22}]}
        page.fill('#shotJson',json.dumps(shot_payload))
        page.click('[data-action="apply-shot-json"]')
        assert 'cuadran (75–56)' in page.locator('#shotAssignment').inner_text()
        assert 'coincide con el acta' in page.locator('#shotQuartersSum').inner_text()
        page.click('[data-action="swap-shot-teams"]')
        assert 'invertida respecto al acta' in page.locator('#shotQuartersSum').inner_text()
        page.click('[data-action="swap-shot-teams"]')
        page.click('[data-action="save-shots"]')
        assert page.evaluate("window.__ESTADISTICAS__.getState().ops.some(op=>op.type==='shot-set'&&Array.isArray(op.payload.quarters)&&op.payload.quarters.length===4)")
        page.locator('.game-row',has_text='CORAZONISTAS').click()
        assert page.locator('.game-quarters-strip').is_visible()
        assert page.locator('.game-quarter-pill').count()==4
        assert '+21' in page.locator('.game-halves-summary').inner_text() and '-2' in page.locator('.game-halves-summary').inner_text()
        page.click('.modal-sheet .icon-button');page.click('.bottom-nav [data-go="team"]')
      else:
        page.evaluate("""() => {const s=window.__ESTADISTICAS__.getState();s.games[0].quarters=[{quarter:1,us:15,them:15},{quarter:2,us:29,them:8},{quarter:3,us:16,them:17},{quarter:4,us:15,them:16}];window.__ESTADISTICAS__.setState(s);}""")
      assert page.locator('.quarter-stat-card').count()==3
      for mode in ['average','total','compare']:
        page.click(f'[data-action="stats-mode"][data-mode="{mode}"]')
        assert page.locator('.quarter-stat-card').count()==3
      assert page.evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1')
      page.locator('[data-detail="quarters:margin"]').click()
      assert page.locator('#modalTitle',has_text='Parciales por cuarto').is_visible()
      assert 'Q2' in page.locator('.metric-summary').inner_text()
      assert page.locator('.quarter-matrix tbody tr').count()==1
      page.click('[data-action="quarter-mode"][data-mode="total"]')
      assert '+21' in page.locator('.metric-summary').inner_text()
      assert page.evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1')
      page.click('.modal-sheet .icon-button')
      page.click('[data-action="toggle-theme"]');assert page.locator('html').get_attribute('data-theme')=='dark'
      assert page.evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1')
      assert not errors,errors
      page.close()

    # Landing de instalación: cuatro tamaños, temas, CTA real y fallback iOS.
    for width,height in [(360,640),(390,844),(412,915),(1440,900)]:
      page=browser.new_page(viewport={'width':width,'height':height});page.goto(URL+'instalar.html',wait_until='networkidle')
      assert page.locator('svg[aria-label="Logo de Estadísticas"]').count()==1
      assert page.locator('#install',has_text='Instalar gratis').is_visible()
      assert page.locator('a#openApp').get_attribute('href')=='./?from=landing'
      assert page.locator('.benefit').count()==6 and page.locator('.step').count()==3 and page.locator('.shot').count()==4
      assert page.evaluate('document.documentElement.scrollWidth<=document.documentElement.clientWidth+1')
      page.click('#theme');assert page.locator('html').get_attribute('data-theme')=='dark'
      if width==390:
        page.evaluate("""() => {window.__promptCalls=0;const e=new Event('beforeinstallprompt');e.prompt=()=>{window.__promptCalls++};e.userChoice=Promise.resolve({outcome:'accepted'});window.dispatchEvent(e)}""")
        page.click('#install');page.wait_for_function('window.__promptCalls===1')
      page.close()
    ios=browser.new_context(viewport={'width':390,'height':844},user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1')
    page=ios.new_page();page.goto(URL+'instalar.html',wait_until='networkidle');page.click('#install');assert page.locator('#installHelp',has_text='Compartir').is_visible();assert page.locator('#installHelp',has_text='Añadir a pantalla de inicio').is_visible();ios.close()

    # actualizar.html: petición realista que modifica dos archivos en una sola respuesta.
    page=browser.new_page(viewport={'width':1280,'height':900});page.goto(URL+'actualizar.html',wait_until='networkidle');page.set_input_files('#repoFolder',str(ROOT));page.wait_for_function("document.querySelector('#fileSummary').classList.contains('ok')")
    config_text=(ROOT/'config.js').read_text(encoding='utf-8')
    patch={'version':'v12.3','files':[{'path':'config.js','changes':[{'find':config_text,'replace':config_text+'\n// Cambio multiarchivo de prueba validado.'}]},{'path':'docs/NOTA_MULTIARCHIVO.md','content':'# Prueba\nArchivo nuevo creado junto con un cambio en config.js.\n'}]}
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
print('OK · v12.3: móvil, temas, Directo, cuotas, ratio, 25 partidos, multiequipo, género, colores, enlaces, Excel, actualizador y migración')
