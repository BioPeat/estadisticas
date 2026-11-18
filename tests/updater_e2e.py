#!/usr/bin/env python3
"""Pruebas E2E del actualizador universal: contexto íntegro, multipartes, versión y autocambio."""
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright
import json, zipfile, tempfile
ROOT=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=ROOT));Thread(target=server.serve_forever,daemon=True).start();URL=f'http://127.0.0.1:{server.server_port}/actualizar.html'

def open_updater(browser):
    page=browser.new_page(viewport={'width':1280,'height':900});page.goto(URL,wait_until='networkidle');page.set_input_files('#repoFolder',str(ROOT));page.wait_for_function("document.querySelector('#fileSummary').classList.contains('ok')");return page

def build_download(page,payload=None,parts=None):
    if parts:
        for part in parts:
            page.fill('#answer',json.dumps(part,ensure_ascii=False));page.click('#addPart')
        assert page.locator('.part').count()==len(parts)
    else: page.fill('#answer',json.dumps(payload,ensure_ascii=False))
    page.click('#build');page.wait_for_function("document.querySelector('#status').classList.contains('ok')")
    with page.expect_download() as info: page.click('#download')
    target=Path(tempfile.mkstemp(suffix='.zip')[1]);info.value.save_as(target);return target

try:
  with sync_playwright() as pw:
    candidate=Path('/opt/pw-browsers/chromium-1228/chrome-linux64/chrome');launch={'headless':True};launch.update({'executable_path':str(candidate)} if candidate.exists() else {});browser=pw.chromium.launch(**launch)
    # Contexto completo actual: todos los archivos fuente, sin cortes, y partición por límites.
    page=open_updater(browser)
    data=page.evaluate("() => {const a=window.__ACTUALIZAR__, rows=a.sourceFiles(a.files);return {master:a.master(a.files),parts:a.contextParts(a.files,80000),rows:rows.map(([p,t])=>[p,t]),stats:a.contextStats(a.files)}}")
    assert data['stats']['chars']<700000, data['stats']
    assert len(data['master'])>data['stats']['chars']
    for path,text in data['rows']:
        assert data['master'].count(f'===== BEGIN FILE: {path} ·')==1
        assert text in data['master']
        joined='\n'.join(data['parts']);assert joined.count(f'===== BEGIN FILE: {path} ·')==1 and text in joined
    assert len(data['parts'])>=3
    page.close()

    # 1) Cambio visual multiarchivo + crear y borrar archivos.
    page=open_updater(browser);page.evaluate("window.__ACTUALIZAR__.files.set('docs/OBSOLETO.md','# antiguo')")
    patch={'schema':'estadisticas-update','updateId':'visual-multi','targetVersion':'v12.3','files':[
      {'path':'styles.css','changes':[{'find':'/* v12 · universal, legible, sin solapes y compartir sin configuración */','replace':'/* v12 · universal, legible, sin solapes y compartir sin configuración */\n/* E2E: ajuste visual multiarchivo */'}]},
      {'path':'index.html','changes':[{'find':'Estadísticas v12.3 universal y multiequipo','replace':'Estadísticas v12.3 universal, clara y multiequipo'}]},
      {'path':'docs/NUEVO_DISENO.md','content':'# Diseño\nCambio visual coordinado.\n'},
      {'path':'docs/OBSOLETO.md','delete':True}]}
    z=build_download(page,patch)
    with zipfile.ZipFile(z) as archive:
      names=set(archive.namelist());assert {'styles.css','index.html','docs/NUEVO_DISENO.md','docs/OBSOLETO.md.BORRAR.txt','PROYECTO_ESTADISTICAS.md','CONTEXTO_SIGUIENTE_ESTADISTICAS.md'}<=names
      assert 'E2E: ajuste visual' in archive.read('styles.css').decode()
    z.unlink();page.close()

    # 2) Cambio grande: app.js completo repartido en dos respuestas, unido sin programar.
    page=open_updater(browser);app=(ROOT/'app.js').read_text(encoding='utf-8')+'\n// E2E CAMBIO GRANDE APP COMPLETA\n';readme=(ROOT/'README.md').read_text(encoding='utf-8')+'\nPrueba multipartes validada.\n'
    parts=[
      {'schema':'estadisticas-update','updateId':'app-grande','part':1,'totalParts':2,'targetVersion':'v12.3','files':[{'path':'app.js','content':app}]},
      {'schema':'estadisticas-update','updateId':'app-grande','part':2,'totalParts':2,'targetVersion':'v12.3','files':[{'path':'README.md','content':readme}]}
    ]
    z=build_download(page,parts=parts)
    with zipfile.ZipFile(z) as archive:
      assert archive.read('app.js').decode()==app
      assert archive.read('README.md').decode()==readme
    z.unlink();page.close()

    # 3) Worker + documentación + actualización de versión y del propio actualizar.html.
    page=open_updater(browser)
    app=(ROOT/'app.js').read_text(encoding='utf-8').replace("APP_VERSION = 'v12.3'","APP_VERSION = 'v13'").replace('version: 12.3,','version: 13,').replace('version:12.3','version:13').replace('state.version = 12.3','state.version = 13')
    index=(ROOT/'index.html').read_text(encoding='utf-8').replace('v12.3','v13').replace('?v=12.3','?v=13')
    sw=(ROOT/'sw.js').read_text(encoding='utf-8').replace('estadisticas-v12.3-','estadisticas-v13-').replace('?v=12.3','?v=13')
    worker=(ROOT/'worker.js').read_text(encoding='utf-8').replace('w5-v12.3','w5-v13')+'\n// E2E worker y documentación\n'
    updater=(ROOT/'actualizar.html').read_text(encoding='utf-8').replace('<html lang="es">','<html lang="es" data-e2e="worker-doc">',1)
    changelog=(ROOT/'CHANGELOG.md').read_text(encoding='utf-8').replace('# CHANGELOG\n','# CHANGELOG\n\n## v13\n- Prueba E2E de versión, Worker y documentación.\n',1)
    docs=(ROOT/'CONTEXTO_ESTADISTICAS.md').read_text(encoding='utf-8')+'\nPrueba E2E worker-doc.\n'
    patch={'schema':'estadisticas-update','updateId':'worker-doc-v13','targetVersion':'v13','files':[
      {'path':'app.js','content':app},{'path':'index.html','content':index},{'path':'sw.js','content':sw},{'path':'worker.js','content':worker},{'path':'actualizar.html','content':updater},{'path':'CHANGELOG.md','content':changelog},{'path':'CONTEXTO_ESTADISTICAS.md','content':docs}]}
    z=build_download(page,patch)
    with zipfile.ZipFile(z) as archive:
      names=set(archive.namelist());assert {'app.js','index.html','sw.js','worker.js','actualizar.html','CHANGELOG.md','CONTEXTO_ESTADISTICAS.md','CONTEXTO_SIGUIENTE_ESTADISTICAS.md'}<=names
      assert "APP_VERSION = 'v13'" in archive.read('app.js').decode()
      assert 'estadisticas-v13-' in archive.read('sw.js').decode()
      assert 'data-e2e="worker-doc"' in archive.read('actualizar.html').decode()
      next_context=archive.read('CONTEXTO_SIGUIENTE_ESTADISTICAS.md').decode();assert 'E2E worker y documentación' in next_context and 'data-e2e="worker-doc"' in next_context
    z.unlink()
    # Errores orientan al usuario hacia texto exacto o content.
    msg=page.evaluate("() => {try{window.__ACTUALIZAR__.applyChanges('abc', [{find:'no existe',replace:'x'}], 'app.js')}catch(e){return e.message}}")
    assert 'content' in msg and 'no existe' in msg
    page.close();browser.close()
finally: server.shutdown()
print('OK · actualizador E2E: contexto íntegro/partido, visual multiarchivo, app grande multipartes, Worker+docs+autocambio+v13')
