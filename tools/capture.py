#!/usr/bin/env python3
"""Create the final v6 review set in mobile and desktop, light and dark."""
from pathlib import Path
from threading import Thread
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'captures'
OUT.mkdir(exist_ok=True)
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

                page.screenshot(path=OUT / f'{device}_{theme}_equipo.png', full_page=True)
                nav = '.bottom-nav' if device == 'movil' else '.sidebar'
                page.locator(f'{nav} [data-go="players"]').click()
                page.screenshot(path=OUT / f'{device}_{theme}_jugadoras.png', full_page=True)

                if device == 'movil':
                    page.locator(f'{nav} [data-go="live"]').click()
                    page.fill('#rival', 'Rival de prueba')
                    page.click('[data-action="start-live"]')
                    page.screenshot(path=OUT / f'{device}_{theme}_directo.png', full_page=False)
                else:
                    page.locator(f'{nav} [data-go="team"]').click()
                    page.locator('[data-detail="metric:ftp"]').click()
                    page.screenshot(path=OUT / f'{device}_{theme}_detalle_tl.png', full_page=False)
                    page.locator('.modal-sheet .icon-button').click()
                    page.locator('[data-detail="minutes"]').click()
                    page.screenshot(path=OUT / f'{device}_{theme}_detalle_minutos.png', full_page=False)
                page.close()
        browser.close()
finally:
    server.shutdown()

print(f'OK · 14 capturas finales en {OUT}')
