#!/usr/bin/env python3
import json,os,subprocess,sys,time,urllib.request
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'capturas';OUT.mkdir(parents=True,exist_ok=True)
for p in OUT.glob('*.png'): p.unlink()
URL='http://127.0.0.1:8766';CHROME=os.environ.get('CHROME','/opt/pw-browsers/chromium-1228/chrome-linux64/chrome');fixture=json.loads((ROOT/'tests/fixtures/real_3_partidos.json').read_text())
def wait():
 for _ in range(60):
  try: urllib.request.urlopen(URL,timeout=.2);return
  except Exception: time.sleep(.1)
def make(browser,w,h,theme,view='team',live=False):
 p=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1);p.goto(URL);state=json.loads(json.dumps(fixture))
 if live: state['live']={'id':'live-final','opponent':'OLIMPICO 64','date':'2026-11-11','quarter':2,'players':state['roster'][:10],'events':[{'id':'e1','type':'steal','playerId':state['roster'][0]['id'],'playerName':state['roster'][0]['name'],'quarter':2}]}
 p.evaluate('(x)=>{localStorage.setItem("estadisticas_shared_v2",JSON.stringify(x.s));localStorage.setItem("estadisticas_theme",x.t)}',{'s':state,'t':theme});p.reload();p.evaluate('(v)=>setView(v)',view);p.wait_for_timeout(120);return p
server=subprocess.Popen([sys.executable,'-m','http.server','8766','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
try:
 wait()
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,**({'executable_path':CHROME} if CHROME and Path(CHROME).exists() else {}))
  for name,theme in [('01_PC_CLARO_EQUIPO.png','light'),('02_PC_OSCURO_EQUIPO.png','dark')]:
   p=make(browser,1440,900,theme);p.screenshot(path=str(OUT/name));p.close()
  for name,theme in [('03_PC_CLARO_PARTIDO.png','light'),('04_PC_OSCURO_PARTIDO.png','dark')]:
   p=make(browser,1440,900,theme,'games');p.locator('[data-detail^="game:"]').filter(has_text='OLIMPICO 64').first.click();p.screenshot(path=str(OUT/name));p.close()
  for name,theme in [('05_MOVIL_390x844_CLARO_EQUIPO.png','light'),('06_MOVIL_390x844_OSCURO_EQUIPO.png','dark')]:
   p=make(browser,390,844,theme);p.screenshot(path=str(OUT/name));p.close()
  p=make(browser,360,640,'light','live');p.screenshot(path=str(OUT/'07_MOVIL_360x640_CLARO_DIRECTO_CONFIG.png'));p.close()
  p=make(browser,360,640,'dark','live',True);p.screenshot(path=str(OUT/'08_MOVIL_360x640_OSCURO_DIRECTO_CURSO.png'));p.close()
  p=make(browser,412,915,'light','games');p.locator('[data-detail^="game:"]').filter(has_text='OLIMPICO 64').first.click();p.screenshot(path=str(OUT/'09_MOVIL_412x915_CLARO_PARTIDO.png'));p.close()
  p=make(browser,412,915,'dark','players');p.locator('[data-detail^="player:"]').filter(has_text='Sara Elzaurdi').first.click();p.screenshot(path=str(OUT/'10_MOVIL_412x915_OSCURO_JUGADORA.png'));p.close();browser.close()
 print('Capturas creadas:',len(list(OUT.glob('*.png'))))
finally:
 server.terminate();server.wait(timeout=3)
