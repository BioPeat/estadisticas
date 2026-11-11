#!/usr/bin/env python3
"""Create the final v7 review set in mobile and desktop, light and dark."""
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'captures'
OUT.mkdir(exist_ok=True)
for old in OUT.glob('*.png'):
    old.unlink()
STATE = json.loads((ROOT / 'tests/fixtures/real_3_partidos.json').read_text(encoding='utf-8'))

class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(Quiet, directory=ROOT))
Thread(target=server.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{server.server_port}/'

try:
    with sync_playwright() as playwright:
        fallback = Path('/opt/pw-browsers/chromium-1228/chrome-linux64/chrome')
        browser = playwright.chromium.launch(headless=True, executable_path=str(fallback) if fallback.exists() else None)
        for device, size in [('movil', {'width':390,'height':844}), ('pc', {'width':1440,'height':980})]:
            for theme in ('claro','oscuro'):
                page = browser.new_page(viewport=size, device_scale_factor=1)
                page.goto(url, wait_until='networkidle')
                page.evaluate('(state) => window.__ESTADISTICAS__.setState(state)', STATE)
                if theme == 'oscuro':
                    page.click('[data-action="toggle-theme"]')
                nav = '.bottom-nav' if device == 'movil' else '.sidebar'

                page.screenshot(path=OUT / f'{device}_{theme}_equipo.png', full_page=False)
                page.screenshot(path=OUT / f'{device}_{theme}_equipo_completo.png', full_page=True)
                if device == 'movil':
                    page.locator('[data-detail="point-share"]').click()
                    page.screenshot(path=OUT / f'{device}_{theme}_reparto_completo.png', full_page=False)
                    page.locator('.modal-sheet .icon-button').click()
                    page.locator('[data-detail="minutes"]').click()
                    page.locator('.minutes-scroll').evaluate('e => e.scrollLeft = e.scrollWidth')
                    page.screenshot(path=OUT / f'{device}_{theme}_minutos_desplazado.png', full_page=False)
                    page.locator('.modal-sheet .icon-button').click()
                    page.locator('[data-detail="metric:fouls"]').click()
                    page.screenshot(path=OUT / f'{device}_{theme}_faltas.png', full_page=False)
                    page.locator('.modal-sheet .icon-button').click()
                    page.locator(f'{nav} [data-go="games"]').click()
                    page.locator('[data-action="open-shot"]').click()
                    page.screenshot(path=OUT / f'{device}_{theme}_mapa_pegado.png', full_page=False)
                    page.locator('.modal-sheet .icon-button').click()
                    page.locator(f'{nav} [data-go="live"]').click()
                    page.fill('#rival', 'Rival de prueba')
                    page.click('[data-action="start-live"]')
                    page.screenshot(path=OUT / f'{device}_{theme}_directo.png', full_page=False)
                else:
                    page.locator('[data-detail="metric:val"]').click()
                    page.screenshot(path=OUT / f'{device}_{theme}_valoracion.png', full_page=False)
                    page.locator('.modal-sheet .icon-button').click()
                    page.locator('[data-detail="minutes"]').click()
                    page.screenshot(path=OUT / f'{device}_{theme}_detalle_minutos.png', full_page=False)
                page.close()
        browser.close()
finally:
    server.shutdown()

print(f'OK · {len(list(OUT.glob("*.png")))} capturas finales en {OUT}')
