#!/usr/bin/env python3
"""Validación estática y de datos para Estadísticas v10 (assets opcionales)."""
from pathlib import Path
import argparse, hashlib, json, subprocess, zipfile
parser=argparse.ArgumentParser();parser.add_argument('root',nargs='?',default=str(Path(__file__).resolve().parents[1]));parser.add_argument('--excel-dir');parser.add_argument('--assets-dir');args=parser.parse_args();ROOT=Path(args.root).resolve();errors=[]
def require(path,tokens=()):
    file=ROOT/path
    if not file.is_file():errors.append(f'falta {path}');return ''
    try:text=file.read_text(encoding='utf-8')
    except UnicodeDecodeError:return ''
    for token in tokens:
        if token not in text:errors.append(f'{path}: falta {token!r}')
    return text
required=['index.html','app.js','styles.css','sw.js','manifest.json','worker.js','configurar.html','actualizar.html','.gitignore','AGENTS.md','CHANGELOG.md','PROYECTO_ESTADISTICAS.md','MAPA_DEL_CODIGO.md','PROMPT_MAPA_TIRO.md','README.md','AUDITORIA_v10.md','tests/smoke.py','tests/fixtures/real_3_partidos.json','tests/fixtures/dehesa_directo_sanitizado.json','tools/capture.py','tools/generar_guia_pdf.py','.github/workflows/check.yml']
for path in required:
    if not (ROOT/path).is_file():errors.append(f'falta {path}')
app=require('app.js',["APP_VERSION = 'v10'","STORE = 'estadisticas_shared_v2'",'version: 10','repairPendingGames','resolveEventPlayer','unassignedEventCounts','team-unassigned',"type:'merge-game'",'mergePendingManual','gameScore(game','dateManual','function renderLiveMetrics','window.__ESTADISTICAS__'])
css=require('styles.css',['score-difference','chart-window-label','width:max(100%,var(--table-width))','team-unassigned','.boxscore{font-size:11px}'])
index=require('index.html',['Estadísticas v10 de Buen Consejo','<small>v10</small>','data-logo="aro-vector"','safe-area-guard','assets/icon-192.png'])
sw=require('sw.js',['estadisticas-v10-20261116-audit2','icon-maskable-512.png',"url.origin!==self.location.origin","request.mode==='navigate'"])
updater=require('actualizar.html',['FLUJO REAL','CONTEXTO_ACTUAL_ESTADISTICAS.md','La IA no conoce por sí sola','repoZip','PROYECTO_ESTADISTICAS.md','assets no se borra'])
smoke=require('tests/smoke.py',['(360, 640)','(390, 844)','(412, 915)','dehesa_directo_sanitizado.json','ESTADISTICAS_REAL_XLSX','ESTADISTICAS_REAL_BACKUP','Últimos 8 de 25','Equipo / sin asignar'])
for doc in ['AGENTS.md','PROYECTO_ESTADISTICAS.md','README.md','AUDITORIA_v10.md']:require(doc,['estadisticas_shared_v2','v10'])
if 'winRate' in app or "label:'Victorias'" in app:errors.append('la tarjeta Victorias sigue en app.js')
for script in ['app.js','worker.js','sw.js']:
    check=subprocess.run(['node','--check',str(ROOT/script)],capture_output=True,text=True)
    if check.returncode:errors.append(f'{script}: {check.stderr.strip()}')
try:
    manifest=json.loads((ROOT/'manifest.json').read_text());assert manifest['display']=='standalone';assert len(manifest['icons'])==3 and any(i.get('purpose')=='maskable' for i in manifest['icons'])
except Exception as exc:errors.append(f'manifest.json: {exc}')
try:
    fixture=json.loads((ROOT/'tests/fixtures/dehesa_directo_sanitizado.json').read_text());events=fixture['pendingGame']['events'];assert len(events)==53
    assert [sum(1 for event in events if event['type']==kind) for kind in ['steal','turnover','orbFor','orbAgainst']]==[21,13,12,7]
    nulls={kind:sum(1 for event in events if event['type']==kind and not event.get('playerId') and not event.get('playerName')) for kind in ['steal','turnover','orbFor','orbAgainst']}
    assert nulls=={'steal':3,'turnover':1,'orbFor':1,'orbAgainst':7}
    assert 'settings' not in fixture and 'workers.dev' not in json.dumps(fixture).lower()
except Exception as exc:errors.append(f'fixture La Dehesa: {exc}')
expected_worker='cff2909d1950b34380961aad888658e341bc57e1361a689740c5a826b3defa87'
if (ROOT/'worker.js').is_file() and hashlib.sha256((ROOT/'worker.js').read_bytes()).hexdigest()!=expected_worker:errors.append('worker.js no coincide con el original recibido; no debe modificarse')
assets=Path(args.assets_dir).resolve() if args.assets_dir else ROOT/'assets'
if assets.is_dir():
    for name in ['jszip.min.js','icon-192.png','icon-512.png','icon-maskable-512.png']:
        if not (assets/name).is_file():errors.append(f'assets de prueba: falta {name}')
if args.excel_dir:
    books=sorted(Path(args.excel_dir).glob('*.xlsx'))
    if not books:errors.append('Excel: no hay archivos .xlsx')
    for book in books:
        try:
            with zipfile.ZipFile(book) as archive:assert 'xl/workbook.xml' in archive.namelist()
        except Exception as exc:errors.append(f'{book.name}: {exc}')
if errors:
    print('\n'.join('ERROR · '+error for error in errors));raise SystemExit(1)
print('OK · v10: reparto real, unión idempotente, tablas, marcador, actualizador, Worker original y sintaxis')
