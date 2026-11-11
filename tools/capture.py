#!/usr/bin/env python3
import json,os,subprocess,sys,time,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'capturas'
OUT.mkdir(parents=True,exist_ok=True)
for old in OUT.glob('*'): old.unlink() if old.is_file() else None
URL='http://127.0.0.1:8766';CHROME=os.environ.get('CHROME','/opt/pw-browsers/chromium-1228/chrome-linux64/chrome')
fixture=json.loads((ROOT/'tests/fixtures/real_3_partidos.json').read_text(encoding='utf-8'))
def wait():
 for _ in range(50):
  try: urllib.request.urlopen(URL,timeout=.2);return
  except: time.sleep(.1)
def page_with(browser,w,h,theme='light',view='team',live=False):
 p=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1);p.goto(URL)
 state=json.loads(json.dumps(fixture))
 if live: state['live']={'id':'example-live','opponent':'EJEMPLO · OLIMPICO 64','date':'2026-11-11','quarter':2,'players':state['roster'][:10],'events':[],'startedAt':'2026-11-11T10:00:00Z'}
 p.evaluate('(x)=>{localStorage.setItem("estadisticas_shared_v2",JSON.stringify(x.state));localStorage.setItem("estadisticas_theme",x.theme)}',{'state':state,'theme':theme});p.reload();p.evaluate('(v)=>setView(v)',view);p.wait_for_timeout(100);return p
s=subprocess.Popen([sys.executable,'-m','http.server','8766','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 wait()
 with sync_playwright() as pw:
  b=pw.chromium.launch(headless=True,executable_path=CHROME)
  # Nombres 01, 02, 03, 06 y 08 se conservan porque los usa la guía PDF.
  fixed=[('01_PC_CLARO_EQUIPO.png',1440,900,'light','team',False),('02_PC_OSCURO_EQUIPO.png',1440,900,'dark','team',False),('03_PC_CLARO_PARTIDOS.png',1440,900,'light','games',False),('04_PC_OSCURO_JUGADORAS.png',1440,900,'dark','players',False)]
  for name,w,h,theme,view,live in fixed:
   p=page_with(b,w,h,theme,view,live);p.screenshot(path=str(OUT/name),full_page=False);p.close()
  # Equipo y Directo en los tres móviles objetivo, claro y oscuro.
  for w,h in [(360,640),(390,844),(412,915)]:
   for theme in ['light','dark']:
    name=f'MOVIL_{w}x{h}_{theme.upper()}_EQUIPO.png';p=page_with(b,w,h,theme,'team');p.screenshot(path=str(OUT/name));p.close()
    live_name='06_MOVIL_CLARO_DIRECTO_EJEMPLO.png' if (w,h,theme)==(360,640,'light') else ('07_MOVIL_OSCURO_DIRECTO_EJEMPLO.png' if (w,h,theme)==(412,915,'dark') else f'MOVIL_{w}x{h}_{theme.upper()}_DIRECTO_EJEMPLO.png')
    p=page_with(b,w,h,theme,'live',True);p.screenshot(path=str(OUT/live_name));p.close()
  # Vista de partido y mapa de calor con datos reales.
  for theme,name in [('light','08_PC_CLARO_MAPA_PARTIDO.png'),('dark','18_PC_OSCURO_MAPA_PARTIDO.png')]:
   p=page_with(b,1440,900,theme,'games');p.locator('[data-detail^="game:"]').filter(has_text='OLIMPICO 64').first.click();p.screenshot(path=str(OUT/name));p.close()
  for theme,name in [('light','19_PC_CLARO_CALOR_ATAQUE.png'),('dark','20_PC_OSCURO_CALOR_DEFENSA.png')]:
   p=page_with(b,1440,900,theme,'team');p.locator('button.card[data-detail="heat-'+('attack' if theme=='light' else 'defense')+'"]').click();p.screenshot(path=str(OUT/name));p.close()
  b.close()
 print('Capturas creadas:',len(list(OUT.glob('*.png'))))
finally:
 s.terminate();s.wait(timeout=3)
