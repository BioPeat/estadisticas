#!/usr/bin/env python3
"""Validación estática, sintáctica, de fixtures y de secretos para Estadísticas v12.3."""
from pathlib import Path
import argparse, json, subprocess, zipfile
parser=argparse.ArgumentParser();parser.add_argument('root',nargs='?',default=str(Path(__file__).resolve().parents[1]));parser.add_argument('--excel-dir');parser.add_argument('--private-backup');parser.add_argument('--allow-assets',action='store_true');args=parser.parse_args()
ROOT=Path(args.root).resolve();errors=[]
required=['index.html','app.js','styles.css','config.js','sw.js','manifest.json','worker.js','configurar.html','actualizar.html','instalar.html','landing/equipo.webp','landing/directo.webp','landing/jugadora.webp','landing/compartir.webp','.gitignore','AGENTS.md','CHANGELOG.md','README.md','AUDITORIA_v12.md','tests/smoke.py','tests/updater_e2e.py','tests/worker_mock.mjs','tests/fixtures/real_3_partidos.json','tests/fixtures/dehesa_directo_sanitizado.json','tools/capture.py','tools/generar_guia_pdf.py','.github/workflows/check.yml']
for rel in required:
 if not (ROOT/rel).is_file():errors.append(f'falta {rel}')
def text(rel):
 try:return (ROOT/rel).read_text(encoding='utf-8')
 except Exception as exc:errors.append(f'{rel}: {exc}');return ''
def need(rel,*tokens):
 value=text(rel)
 for token in tokens:
  if token not in value:errors.append(f'{rel}: falta {token!r}')
 return value
app=need('app.js',"APP_VERSION = 'v12.3'","STORE = 'estadisticas_shared_v2'","MULTI_STORE = 'estadisticas_multiteam_v11'",'openScoreChartDetail','playerShareData','robPerDisplay','recordedLiveGames','createWorkspace','switchWorkspace','detectGender','genderTerms','PALETTES','/api/v3/teams','ensureCloudTeam','snapshotOps','Posesiones extra')
css=need('styles.css','score-chart-scroller','score-margin','metric-evolution','workspace-row','negative-value','--team','--rival','share-simple','possession-card')
need('instalar.html','beforeinstallprompt','Instalar gratis','Abrir en el navegador','Añadir a pantalla de inicio','landing/equipo.webp','sw.js?v=12.3')
need('index.html','Estadísticas v12.3 universal y multiequipo','data-logo="aro-vector"','id="teamButton"','config.js','<small>v12.3</small>')
need('worker.js',"version:'w5-v12.3'","legacy:'w2-compatible'",'CREATE TABLE IF NOT EXISTS access_tokens','CREATE TABLE IF NOT EXISTS events','CREATE TABLE IF NOT EXISTS teams','CREATE TABLE IF NOT EXISTS team_events','CREATE TABLE IF NOT EXISTS rate_limits','/api/setup','/api/events')
need('sw.js','estadisticas-v12.3-','./config.js','./instalar.html','./landing/equipo.webp')
need('actualizar.html','SOLO UNA VEZ','EN CADA ACTUALIZACIÓN','CONTEXTO_ACTUAL_ESTADISTICAS.md','contextParts','totalParts','targetVersion','CONTEXTO_SIGUIENTE_ESTADISTICAS.md','assets/ nunca se modifica')
need('tests/updater_e2e.py','visual-multi','app-grande','worker-doc-v13','contextParts')
need('tests/worker_mock.mjs','w2','límite atómico','token caducado','DELETE')
need('worker.js','Origen no permitido','Petición demasiado grande','schema_meta','X-Request-Id','TOKEN_TTL_DAYS')
need('tests/smoke.py','(360,640)','(390,844)','(412,915)','long_season','Equipo aislado','team-prueba','ESTADISTICAS_REAL_BACKUP','newTeamGender','Junior Masculino A')
need('.gitignore','captures/','__pycache__/','*.pyc')
for script in ['app.js','worker.js','sw.js','config.js']:
 run=subprocess.run(['node','--check',str(ROOT/script)],capture_output=True,text=True)
 if run.returncode:errors.append(f'{script}: {run.stderr.strip()}')
try:
 manifest=json.loads(text('manifest.json'));assert manifest['display']=='standalone';assert len(manifest['icons'])==3
except Exception as exc:errors.append(f'manifest.json: {exc}')
try:
 fixture=json.loads(text('tests/fixtures/dehesa_directo_sanitizado.json'));events=fixture['pendingGame']['events'];assert len(events)==53
 assert [sum(e.get('type')==kind for e in events) for kind in ['steal','turnover','orbFor','orbAgainst']]==[21,13,12,7]
 assert 'settings' not in fixture and 'workers.dev' not in json.dumps(fixture).lower()
except Exception as exc:errors.append(f'fixture La Dehesa: {exc}')
# El código entregable no incluye assets: el usuario conserva su carpeta actual.
if not args.allow_assets and (ROOT/'assets').exists():errors.append('assets/ está presente; la entrega debe excluirla')
# Busca exactamente los secretos de la copia privada sin imprimirlos.
if args.private_backup:
 try:
  private=json.loads(Path(args.private_backup).read_text(encoding='utf-8'));secrets=[private.get('settings',{}).get(k,'') for k in ('token',)];secrets=[x for x in secrets if isinstance(x,str) and len(x)>=8]
  for file in ROOT.rglob('*'):
   if not file.is_file() or file.suffix.lower() in {'.png','.jpg','.jpeg','.pdf','.zip','.xlsx'}:continue
   raw=file.read_text(encoding='utf-8',errors='ignore')
   if any(secret in raw for secret in secrets):errors.append(f'{file.relative_to(ROOT)}: contiene un secreto de la copia privada')
 except Exception as exc:errors.append(f'comprobación privada: {exc}')
if args.excel_dir:
 books=sorted(Path(args.excel_dir).glob('*.xlsx'))
 if len(books)<4:errors.append(f'Excel: se esperaban al menos 4 y hay {len(books)}')
 for book in books:
  try:
   with zipfile.ZipFile(book) as archive:assert 'xl/workbook.xml' in archive.namelist()
  except Exception as exc:errors.append(f'{book.name}: {exc}')
if errors:
 print('\n'.join('ERROR · '+item for item in errors));raise SystemExit(1)
print('OK · v12.3: sintaxis, multiequipo, Worker compatible, gráficos, fixtures, Excel y secretos')
