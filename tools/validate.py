#!/usr/bin/env python3
"""Fast static and data-contract validation for Estadísticas v7."""
from pathlib import Path
import hashlib
import json
import subprocess
import sys
from PIL import Image

ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
errors = []

def require(path, tokens=()):
    file = ROOT / path
    if not file.is_file():
        errors.append(f'falta {path}')
        return ''
    text = file.read_text(encoding='utf-8')
    for token in tokens:
        if token not in text:
            errors.append(f'{path}: falta {token!r}')
    return text

required = [
    'index.html','app.js','styles.css','sw.js','manifest.json','worker.js','configurar.html','actualizar.html','.gitignore',
    'AGENTS.md','CHANGELOG.md','CONTEXTO_ESTADISTICAS.md','MAPA_DEL_CODIGO.md','PROMPT_MAPA_TIRO.md','README.md',
    'GEM_GEMINI.md','PROYECTO_CLAUDE.md','assets/jszip.min.js','assets/icon-192.png','assets/icon-512.png','assets/icon-maskable-512.png',
    'tests/smoke.py','tests/fixtures/real_3_partidos.json','tools/capture.py','tools/generar_guia_pdf.py','.github/workflows/check.yml'
]
for path in required:
    if not (ROOT / path).is_file():
        errors.append(f'falta {path}')

app = require('app.js', [
    "APP_VERSION = 'v7'", "STORE = 'estadisticas_shared_v2'", 'version: 7', 'state.version = 7',
    'TEAM_METRICS','lowerBetter:true','per40:true','fouls40','Valoración por partido',
    'openPointShareDetail','openMinutesDetail','minutes-scroll','LIVE_METRICS','recordedLiveGames','liveMetricRows',
    'No es una estadística completa del rival','shot-ai-workflow','id="shotJson"','Leer y colocar puntos',
    'checksAgree===false','playerId:playerId || null','window.__ESTADISTICAS__'
])
css = require('styles.css', [
    'env(safe-area-inset-bottom)','.safe-area-guard','.bottom-nav,.safe-area-guard{background:#10233f!important',
    '.minutes-scroll','touch-action:pan-x pan-y','width:max-content','.shot-ai-workflow','.stat-values.own-only'
])
index = require('index.html', ['viewport-fit=cover','assets/jszip.min.js','<small>v7</small>','safe-area-guard','#10233f','#18365f','#ed304c','#7455dc','#18a985'])
require('sw.js', ['estadisticas-v7-20261112-final','icon-maskable-512.png'])
updater = require('actualizar.html', ['CAMBIOS SEGUROS POR BLOQUES','"changes"','find/replace','aparece ${count} veces','estadisticas_shared_v2','No devuelvas el archivo completo'])
smoke = require('tests/smoke.py', ['(360, 640)','(390, 844)','(412, 915)','full-roster','scrollLeft = 120','Mejor BC · menos','FAL/40','#shotJson','liveMetricRows','version\'] == 7'])

for doc in ['AGENTS.md','GEM_GEMINI.md','PROYECTO_CLAUDE.md']:
    require(doc, ['estadisticas_shared_v2','FAL/40','Robos/pérdidas','find','replace'])

for forbidden in [
    "APP_VERSION = 'v6'", "version: 6", 'state.version = 6', 'estadisticas-v6-20261111-final',
    'id="shotJsonWrap" hidden', "act==='show-shot-json'", 'Devuelve solo el archivo completo',
    '<small>v6</small>', 'marginChart(', 'data-detail="adv:margins"'
]:
    if forbidden in app + css + index + require('sw.js') + updater + require('GEM_GEMINI.md') + require('PROYECTO_CLAUDE.md'):
        errors.append(f'código retirado sigue presente: {forbidden}')

try:
    manifest = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))
    assert manifest['display'] == 'standalone'
    assert manifest['background_color'] == manifest['theme_color'] == '#10233f'
    assert any(icon.get('purpose') == 'maskable' for icon in manifest['icons'])
    assert len(manifest['icons']) == 3
except Exception as exc:
    errors.append(f'manifest.json: {exc}')

try:
    fixture = json.loads((ROOT / 'tests/fixtures/real_3_partidos.json').read_text(encoding='utf-8'))
    assert len(fixture['games']) == 3 and len(fixture['roster']) == 14
    assert all(g['opponentPlayers'] and g['teamTotals'] and g['opponentTotals'] for g in fixture['games'])
    assert [(g['us'], g['them']) for g in fixture['games']] == [(40,65),(64,36),(61,48)]
    assert sum(g['opponentTotals']['fouls'] for g in fixture['games']) == 59
    sara = sum(p['pts'] for g in fixture['games'] for p in g['players'] if p['name'] == 'ELZAURDI CARRERA, SARA')
    assert sara == 36
except Exception as exc:
    errors.append(f'fixture principal: {exc}')

try:
    expected_corner = (16,35,63)
    for name, expected in [('icon-192.png',(192,192)),('icon-512.png',(512,512)),('icon-maskable-512.png',(512,512))]:
        image = Image.open(ROOT / 'assets' / name).convert('RGB')
        assert image.size == expected
        assert image.getpixel((0,0)) == expected_corner
except Exception as exc:
    errors.append(f'iconos: {exc}')

for script in ['app.js','worker.js','sw.js']:
    check = subprocess.run(['node','--check',str(ROOT / script)], capture_output=True, text=True)
    if check.returncode:
        errors.append(f'{script}: {check.stderr.strip() or "sintaxis no válida"}')

worker = require('worker.js', ["version:'w2'",'/api/events','/api/invites'])
if "version:'w2'" not in worker:
    errors.append('worker.js: contrato Cloudflare inesperado')

if errors:
    print('\n'.join('ERROR · ' + error for error in errors))
    raise SystemExit(1)
print('OK · v7: estructura, PWA, datos, métricas, mapa, parches IA, documentación, iconos, Worker y sintaxis')
