#!/usr/bin/env python3
import json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def need(path,*tokens):
 text=(ROOT/path).read_text(encoding='utf-8')
 for t in tokens:
  if t not in text: errors.append(f'{path}: falta {t!r}')
 return text
for p in ['index.html','styles.css','app.js','worker.js','sw.js','manifest.json','actualizar.html','AGENTS.md','CONTEXTO_ESTADISTICAS.md','PROMPT_MAPA_TIRO.md']:
 if not (ROOT/p).exists(): errors.append(f'Falta {p}')
app=need('app.js',"APP_VERSION='v2'",'shotsFor','shotsAgainst','equipo de ARRIBA','checksAgree','Se rellena al apuntar en Directo')
css=need('styles.css','body[data-view=live]{overflow:hidden}','.shot.against','@media(max-width:380px) and (max-height:700px)')
need('worker.js',"user.role==='viewer'",'INSERT OR IGNORE INTO events','SETUP_SECRET')
for p in ['manifest.json','tests/fixtures/real_3_partidos.json','tests/fixtures/mapa_olimpico.json','tests/fixtures/mapa_las_rozas.json','tests/fixtures/mapa_ensanche.json']:
 try: json.loads((ROOT/p).read_text(encoding='utf-8'))
 except Exception as e: errors.append(f'{p}: JSON no válido: {e}')
# La producción no puede cargar fixtures ni valores manuales semilla.
for p in ['index.html','app.js','styles.css']:
 text=(ROOT/p).read_text(encoding='utf-8')
 if 'real_3_partidos.json' in text or 'tests/fixtures' in text: errors.append(f'{p}: carga fixtures de prueba')
if re.search(r'robos?\s*[:=]\s*[1-9]',app,re.I): errors.append('app.js: posible robo hardcodeado')
# Todos los recursos que carga index deben existir y ser locales.
idx=(ROOT/'index.html').read_text(encoding='utf-8')
for ref in re.findall(r'(?:src|href)="([^"]+)"',idx):
 if ref.startswith(('http:','https:')): errors.append(f'Recurso externo no permitido: {ref}')
 elif ref.startswith('#'): continue
 elif not (ROOT/ref).exists(): errors.append(f'Recurso ausente: {ref}')
r=subprocess.run(['node','--check',str(ROOT/'app.js')],capture_output=True,text=True)
if r.returncode: errors.append('app.js no compila: '+r.stderr)
if errors:
 print('\n'.join('ERROR · '+e for e in errors));sys.exit(1)
print('TODO OK · estructura · datos honestos · mapas dobles · PWA · JavaScript')
