#!/usr/bin/env python3
"""Fast static and data-contract validation for Estadísticas v6."""
from pathlib import Path
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
    'index.html', 'app.js', 'styles.css', 'sw.js', 'manifest.json', 'worker.js',
    'configurar.html', 'actualizar.html', '.gitignore', 'AGENTS.md', 'CHANGELOG.md',
    'CONTEXTO_ESTADISTICAS.md', 'MAPA_DEL_CODIGO.md', 'PROMPT_MAPA_TIRO.md',
    'README.md', 'GEM_GEMINI.md', 'PROYECTO_CLAUDE.md', 'assets/jszip.min.js',
    'assets/icon-192.png', 'assets/icon-512.png', 'assets/icon-maskable-512.png',
    'tests/smoke.py', 'tests/fixtures/real_3_partidos.json', 'tools/capture.py',
    'tools/generar_guia_pdf.py', '.github/workflows/check.yml'
]
for path in required:
    if not (ROOT / path).is_file():
        errors.append(f'falta {path}')

app = require('app.js', [
    "APP_VERSION = 'v6'", "STORE = 'estadisticas_shared_v2'", 'TEAM_METRICS',
    'teamMetricRows', 'openTeamMetricDetail', 'openMinutesDetail', 'minutesHeatmap',
    "value:player=>player.fta ? player.ftm/player.fta*100 : null", 'team-season',
    'discardLive', 'playerId:playerId || null', 'shotPrompt'
])
css = require('styles.css', [
    'env(safe-area-inset-bottom)', '.safe-area-guard', '.stats-grid', '.stat-card',
    '.minutes-heatmap', '.team-season', '.live-board', 'minmax(0,1fr)',
    '.brand-mark svg'
])
index = require('index.html', [
    'viewport-fit=cover', 'assets/jszip.min.js', 'v6', 'safe-area-guard',
    '#10233f', '#18365f', '#ed304c', '#7455dc', '#18a985'
])
require('sw.js', ['estadisticas-v6-20261111-final', 'icon-maskable-512.png'])
require('actualizar.html', ['CAMBIOS SEGUROS CON IA', 'Aplicar y comprobar', 'estadisticas_shared_v2', 'El logo definitivo'])
smoke = require('tests/smoke.py', [
    '(360, 640)', '(390, 844)', '(412, 915)', 'margin-chart', 'minutes-heatmap',
    'PLAYER_METRICS.ftp.value', 'team-season', 'safe-area-guard', 'logo_light'
])

for forbidden in [
    'APP_VERSION = \'v5\'', 'estadisticas-v5-20261111', 'marginChart(',
    'data-detail="adv:margins"', "value:p => p.fta ? p.ftm / p.fta * 100 : 0",
    'window-controls-overlay', '<small>v5</small>'
]:
    if forbidden in app + css + index + require('manifest.json') + require('sw.js'):
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
    assert len(fixture['games']) == 3
    assert all(g['opponentPlayers'] and g['teamTotals'] and g['opponentTotals'] for g in fixture['games'])
    assert [(g['us'], g['them']) for g in fixture['games']] == [(40,65),(64,36),(61,48)]
    assert sum(g['opponentTotals']['fouls'] for g in fixture['games']) == 59
    sara = sum(p['pts'] for g in fixture['games'] for p in g['players'] if p['name'] == 'ELZAURDI CARRERA, SARA')
    assert sara == 36
except Exception as exc:
    errors.append(f'fixture principal: {exc}')

try:
    for name, expected in [('icon-192.png',(192,192)),('icon-512.png',(512,512)),('icon-maskable-512.png',(512,512))]:
        image = Image.open(ROOT / 'assets' / name).convert('RGB')
        assert image.size == expected
        assert image.getpixel((0,0)) == (16,35,63)
except Exception as exc:
    errors.append(f'iconos: {exc}')

for script in ['app.js', 'worker.js', 'sw.js']:
    check = subprocess.run(['node', '--check', str(ROOT / script)], capture_output=True, text=True)
    if check.returncode:
        errors.append(f'{script}: {check.stderr.strip() or "sintaxis no válida"}')

# Worker is intentionally unchanged at protocol version w2.
worker = require('worker.js', ["version:'w2'", '/api/events', '/api/invites'])
if "version:'w2'" not in worker:
    errors.append('worker.js: contrato Cloudflare inesperado')

if errors:
    print('\n'.join('ERROR · ' + error for error in errors))
    raise SystemExit(1)
print('OK · v6: estructura, PWA, logo, estadísticas, fixture, documentación y sintaxis')
