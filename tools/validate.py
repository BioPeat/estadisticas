#!/usr/bin/env python3
"""Validación estática, de datos e iconos para Estadísticas v9."""
from pathlib import Path
import argparse, json, subprocess, sys, zipfile
from PIL import Image

parser=argparse.ArgumentParser()
parser.add_argument('root',nargs='?',default=str(Path(__file__).resolve().parents[1]))
parser.add_argument('--excel-dir',help='Directorio opcional con las 3 actas FBM y la plantilla')
args=parser.parse_args(); ROOT=Path(args.root).resolve(); errors=[]

def require(path,tokens=()):
    file=ROOT/path
    if not file.is_file(): errors.append(f'falta {path}'); return ''
    try:text=file.read_text(encoding='utf-8')
    except UnicodeDecodeError:return ''
    for token in tokens:
        if token not in text: errors.append(f'{path}: falta {token!r}')
    return text

required=['index.html','app.js','styles.css','sw.js','manifest.json','worker.js','configurar.html','actualizar.html','.gitignore','AGENTS.md','CHANGELOG.md','CONTEXTO_ESTADISTICAS.md','MAPA_DEL_CODIGO.md','PROMPT_MAPA_TIRO.md','README.md','AUDITORIA_v9.md','GEM_GEMINI.md','PROYECTO_CLAUDE.md','assets/jszip.min.js','assets/icon-192.png','assets/icon-512.png','assets/icon-maskable-512.png','tests/smoke.py','tests/fixtures/real_3_partidos.json','tools/capture.py','tools/generar_guia_pdf.py','.github/workflows/check.yml']
for path in required:
    if not (ROOT/path).is_file(): errors.append(f'falta {path}')

app=require('app.js',["APP_VERSION = 'v9'","STORE = 'estadisticas_shared_v2'",'version: 9','state.version = 9','function renderLiveMetrics','Sin datos registrados todavía','data-manual-coverage','data-mode="compare"','comparison-card','Robos, pérdidas y rebote ofensivo','if (group.live) return true','manual-table-notice','r="${heat ? 68 : 24}"','source !== \'live-pending\'','window.__ESTADISTICAS__'])
css=require('styles.css',['v9 · manual siempre visible','.no-data','.coverage-badge','.manual-table-notice','.bottom-nav,.safe-area-guard{background:var(--paper)!important','.trend-scroller','#shotCourt .court{touch-action:none','.player-id b{max-width:100%;white-space:nowrap'])
index=require('index.html',['<small>v9</small>','data-logo="aro-vector"','safe-area-guard','assets/icon-192.png'])
sw=require('sw.js',["estadisticas-v9-20261112-manual-visible",'icon-maskable-512.png',"url.origin!==self.location.origin","request.mode==='navigate'"])
updater=require('actualizar.html',['Estadísticas v9','"changes"','find/replace','estadisticas_shared_v2','No devuelvas el archivo completo','Aro vector'])
smoke=require('tests/smoke.py',['(360, 640)','(390, 844)','(412, 915)','comparison-card','live-stat-card.is-empty','manual-table-notice','Sin datos registrados todavía','long_state','P25',"version'] == 9"])
for doc in ['AGENTS.md','GEM_GEMINI.md','PROYECTO_CLAUDE.md']:
    require(doc,['estadisticas_shared_v2','find','replace','Sin datos registrados todavía'])

for forbidden in ["APP_VERSION = 'v7'",'version: 7','state.version = 7',"estadisticas-v7-1-20261112-logo-aro-vector",'<small>v7.1</small>','r="${heat ? 62 : 21}"']:
    if forbidden in app+css+index+sw+updater: errors.append(f'código retirado sigue presente: {forbidden}')

try:
    manifest=json.loads((ROOT/'manifest.json').read_text())
    assert manifest['display']=='standalone'
    assert len(manifest['icons'])==3 and any(i.get('purpose')=='maskable' for i in manifest['icons'])
except Exception as exc: errors.append(f'manifest.json: {exc}')

try:
    fixture=json.loads((ROOT/'tests/fixtures/real_3_partidos.json').read_text())
    assert len(fixture['games'])==3 and len(fixture['roster'])==14
    assert [(g['us'],g['them']) for g in fixture['games']]==[(40,65),(64,36),(61,48)]
    assert all(g['opponentPlayers'] and g['teamTotals'] and g['opponentTotals'] for g in fixture['games'])
    assert all(not g.get('events') for g in fixture['games'])
except Exception as exc: errors.append(f'fixture: {exc}')

try:
    bg=(16,35,63); palette={(16,35,63),(247,249,252),(237,48,76),(24,169,133)}
    images={}
    for name,size in [('icon-192.png',(192,192)),('icon-512.png',(512,512)),('icon-maskable-512.png',(512,512))]:
        image=Image.open(ROOT/'assets'/name).convert('RGB'); images[name]=image
        assert image.size==size and image.getpixel((0,0))==bg
        assert palette.issubset(set(image.get_flattened_data()))
    normal=sum(px!=bg for px in images['icon-512.png'].get_flattened_data())
    maskable=sum(px!=bg for px in images['icon-maskable-512.png'].get_flattened_data())
    assert normal>maskable
except Exception as exc: errors.append(f'iconos Aro vector: {exc}')

for script in ['app.js','worker.js','sw.js']:
    check=subprocess.run(['node','--check',str(ROOT/script)],capture_output=True,text=True)
    if check.returncode: errors.append(f'{script}: {check.stderr.strip()}')
worker=require('worker.js',["version:'w2'",'/api/events','/api/invites'])

if args.excel_dir:
    excel=Path(args.excel_dir); books=sorted(excel.glob('*.xlsx'))
    if len(books)!=4: errors.append(f'Excel: se esperaban 4 archivos y hay {len(books)}')
    else:
        actas=plantillas=0
        for book in books:
            try:
                with zipfile.ZipFile(book) as z:
                    names=set(z.namelist()); assert 'xl/workbook.xml' in names
                    text=' '.join(z.read(name).decode('utf-8','ignore') for name in names if name in {'xl/sharedStrings.xml','xl/worksheets/sheet1.xml'})
                    if 'Estadísticas -' in text or 'Estad\u00edsticas -' in text: actas+=1
                    if 'Jugadores -' in text: plantillas+=1
            except Exception as exc: errors.append(f'{book.name}: {exc}')
        if actas!=3 or plantillas!=1: errors.append(f'Excel: identificados {actas} actas y {plantillas} plantillas')

if errors:
    print('\n'.join('ERROR · '+e for e in errors)); raise SystemExit(1)
print('OK · v9: estructura, datos, manual visible sin ceros inventados, temas, gráficos, iconos, Worker w2 y sintaxis')
