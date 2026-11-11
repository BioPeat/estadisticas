#!/usr/bin/env python3
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];errors=[]
def need(path,*tokens):
 p=ROOT/path
 if not p.exists(): errors.append(f'Falta {path}');return ''
 text=p.read_text(encoding='utf-8')
 for t in tokens:
  if t not in text: errors.append(f'{path}: falta {t!r}')
 return text
app=need('app.js',"APP_VERSION='v3'","STORE='estadisticas_shared_v2'",'opponentPlayers','BOX_COLS','Triple de esquina','live-running','applyTheme')
css=need('styles.css','body[data-view=live].live-running','.boxscore','.roster-grid','touch-action:pan-y','html[data-theme=dark]')
idx=need('index.html','viewport-fit=cover','black-translucent','assets/jszip.min.js')
need('actualizar.html','Aplicar y comprobar','Descargar archivo comprobado','estadisticas_shared_v2')
need('worker.js',"user.role==='viewer'",'INSERT OR IGNORE INTO events','SETUP_SECRET',"version:'w3'")
need('sw.js','estadisticas-v3');need('.github/workflows/check.yml','Estadísticas')
for p in ['manifest.json','tests/fixtures/real_3_partidos.json','tests/fixtures/mapa_olimpico.json','tests/fixtures/mapa_las_rozas.json','tests/fixtures/mapa_ensanche.json']:
 try: json.loads((ROOT/p).read_text(encoding='utf-8'))
 except Exception as e: errors.append(f'{p}: JSON no válido: {e}')
for p in ['tests/fixtures/jugadoras_fbm.xlsx','tests/fixtures/acta_ensanche.xlsx','tests/fixtures/acta_olimpico.xlsx','tests/fixtures/acta_las_rozas.xlsx']:
 if not (ROOT/p).exists(): errors.append(f'Falta fixture real {p}')
for p in ['index.html','app.js','styles.css']:
 text=(ROOT/p).read_text(encoding='utf-8')
 if 'real_3_partidos.json' in text or 'tests/fixtures' in text: errors.append(f'{p}: carga fixtures en producción')
# Assets se conservan en el repositorio del usuario y no se incluyen en el ZIP de sustitución.
for ref in re.findall(r'(?:src|href)="([^"]+)"',idx):
 if ref.startswith(('http:','https:')): errors.append(f'Recurso externo no permitido: {ref}')
 elif ref.startswith(('#','assets/')): continue
 elif not (ROOT/ref).exists(): errors.append(f'Recurso ausente: {ref}')
for js in ['app.js','worker.js','sw.js']:
 r=subprocess.run(['node','--check',str(ROOT/js)],capture_output=True,text=True)
 if r.returncode: errors.append(f'{js} no compila: '+r.stderr.strip())
# Errores conocidos que reabrirían los fallos de v2.
if re.search(r'body\[data-view=live\]\{overflow:hidden\}',css) and 'body[data-view=live].live-running' not in css: errors.append('Directo vuelve a bloquear el formulario')
if "['Cerca del aro'" in app[app.rfind('/* === Estadísticas v3'):]: errors.append('Quedan zonas antiguas en v3')
if errors:
 print('\n'.join('ERROR · '+e for e in errors));sys.exit(1)
print('TODO OK · v3 · migración · 2 equipos · tabla · 4 zonas · PWA · JavaScript')
