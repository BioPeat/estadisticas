#!/usr/bin/env python3
from pathlib import Path
import json, subprocess, sys

ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
errors = []

def require(path, tokens):
    p = ROOT/path
    if not p.is_file():
        errors.append(f'falta {path}')
        return ''
    text = p.read_text(encoding='utf-8')
    for token in tokens:
        if token not in text: errors.append(f'{path}: falta {token!r}')
    return text

required = [
    'index.html','app.js','styles.css','sw.js','manifest.json','worker.js','configurar.html','actualizar.html',
    'AGENTS.md','CHANGELOG.md','CONTEXTO_ESTADISTICAS.md','MAPA_DEL_CODIGO.md','PROMPT_MAPA_TIRO.md','README.md','GEM_GEMINI.md','PROYECTO_CLAUDE.md',
    'assets/jszip.min.js','assets/icon-192.png','assets/icon-512.png','tests/smoke.py','tests/fixtures/real_3_partidos.json'
]
for path in required:
    if not (ROOT/path).is_file(): errors.append(f'falta {path}')

app = require('app.js', ["APP_VERSION = 'v5'", 'discardLive', 'team-choice', "playerId:playerId||null", 'topThreeShare', 'topScorer', "foulsDrawn:agg(opp, 'fouls')", 'pointShareChart', 'marginChart', 'sort-players', 'Racha ${current}'])
css = require('styles.css', ['env(safe-area-inset-bottom)', '.score-chart polyline.score-us', 'fill:none', '.team-choice', '.live-footer{grid-template-columns:1fr 1fr 1.35fr}', '.player-table-head{display:grid', '.rank-metric{display:block!important'])
index = require('index.html', ['viewport-fit=cover', 'assets/jszip.min.js', 'v5', 'theme-color'])
require('sw.js', ['estadisticas-v5-20261111'])
smoke = require('tests/smoke.py', ['confirm-discard-live', 'team-choice', "stats['foulsDrawn'] == 59", "topScorer", "getComputedStyle(e).fill", '(360,640)', '(412,915)'])

for forbidden in ['Concentración', 'Resto tras top 5 min', 'APP_VERSION = \'v4\'', 'estadisticas-v4-20261111']:
    if forbidden in app + index + css: errors.append(f'texto o versión retirada sigue presente: {forbidden}')

try:
    manifest = json.loads((ROOT/'manifest.json').read_text(encoding='utf-8'))
    assert manifest['display'] == 'standalone'
    assert manifest['background_color'] == '#f3f5f8'
    assert manifest['theme_color'] == '#f3f5f8'
    assert len(manifest['icons']) >= 2
except Exception as exc: errors.append(f'manifest.json: {exc}')

try:
    fixture = json.loads((ROOT/'tests/fixtures/real_3_partidos.json').read_text(encoding='utf-8'))
    assert len(fixture['games']) == 3
    assert all(g['opponentPlayers'] and g['teamTotals'] and g['opponentTotals'] for g in fixture['games'])
    assert sum(g['opponentTotals']['fouls'] for g in fixture['games']) == 59
    sara = sum(p['pts'] for g in fixture['games'] for p in g['players'] if p['name'] == 'ELZAURDI CARRERA, SARA')
    assert sara == 36
except Exception as exc: errors.append(f'fixture principal: {exc}')

for js in ['app.js','worker.js','sw.js']:
    check = subprocess.run(['node','--check',str(ROOT/js)],capture_output=True,text=True)
    if check.returncode: errors.append(f'{js}: ' + (check.stderr.strip() or 'sintaxis no válida'))

if errors:
    print('\n'.join('ERROR · ' + e for e in errors)); raise SystemExit(1)
print('OK · v5: estructura, tema/PWA, Directo, estadísticas, fixture real, textos y sintaxis')
