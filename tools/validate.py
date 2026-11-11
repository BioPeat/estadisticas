#!/usr/bin/env python3
from pathlib import Path
import json, re, subprocess, sys

ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1]
errors = []

def require(path, tokens):
    text = (ROOT / path).read_text(encoding='utf-8')
    for token in tokens:
        if token not in text:
            errors.append(f'{path}: falta {token!r}')
    return text

required = [
    'index.html','app.js','styles.css','sw.js','manifest.json','worker.js','configurar.html','actualizar.html',
    'AGENTS.md','CONTEXTO_ESTADISTICAS.md','MAPA_DEL_CODIGO.md','PROMPT_MAPA_TIRO.md','README.md','GEM_GEMINI.md','PROYECTO_CLAUDE.md',
    'assets/jszip.min.js','assets/icon-192.png','assets/icon-512.png','tests/smoke.py','tests/fixtures/real_3_partidos.json'
]
for path in required:
    if not (ROOT / path).is_file(): errors.append(f'falta {path}')

app = require('app.js', ["APP_VERSION = 'v4'", "STORE = 'estadisticas_shared_v2'", 'opponentPlayers', 'teamTotals', 'opponentTotals', 'liveDraft', 'validateTotals', 'Media del equipo', 'needsReimport'])
css = require('styles.css', ['env(safe-area-inset-bottom)', '.box-wrap', 'overflow-x:auto', 'touch-action:pan-x pan-y', '.shot-svg.against', '.roster-card.selected'])
index = require('index.html', ['viewport-fit=cover', 'assets/jszip.min.js', 'v4'])
require('sw.js', ['estadisticas-v4-20261111'])

for forbidden in ['El equipo en una mirada','Resultados, ataque, defensa y datos de Directo','Abrir ↗','Ver desglose','datos honestos','01 ·','02 ·','03 ·','04 ·']:
    if forbidden in app + index: errors.append(f'texto retirado sigue presente: {forbidden}')

try:
    manifest = json.loads((ROOT / 'manifest.json').read_text(encoding='utf-8'))
    assert manifest['display'] == 'standalone'
    assert len(manifest['icons']) >= 2
except Exception as exc: errors.append(f'manifest.json: {exc}')

try:
    fixture = json.loads((ROOT / 'tests/fixtures/real_3_partidos.json').read_text(encoding='utf-8'))
    assert len(fixture['games']) == 3
    assert all(g['opponentPlayers'] and g['teamTotals'] and g['opponentTotals'] for g in fixture['games'])
    assert len({g['opponent'] for g in fixture['games']}) == 3
except Exception as exc: errors.append(f'fixture principal: {exc}')

check = subprocess.run(['node','--check',str(ROOT/'app.js')],capture_output=True,text=True)
if check.returncode: errors.append('app.js: ' + (check.stderr.strip() or 'sintaxis no válida'))

if errors:
    print('\n'.join('ERROR · ' + e for e in errors)); raise SystemExit(1)
print('OK · estructura, contratos, textos, manifest, fixture y sintaxis')
