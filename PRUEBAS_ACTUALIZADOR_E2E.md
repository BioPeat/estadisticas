# Pruebas del actualizador universal

Comando: `python tests/updater_e2e.py`.

## Cobertura verificada
- Contexto íntegro: compara cada contenido original con su bloque BEGIN/END, longitud y checksum.
- Tamaño actual: menor que 700 KB; actualizar.html muestra KB y estimación de tokens. Es apto como un único adjunto. Al superar 700 KB, genera un ZIP de partes por fronteras de archivo; prueba forzada a 80 KB produce varias partes sin recortar ningún archivo.
- Petición 1: cambio visual en styles.css + index.html, creación y borrado de documentación.
- Petición 2: app.js completo, de gran tamaño, dividido en dos JSON y reunido en orden.
- Petición 3: worker.js + documentación + actualizar.html; subida virtual v12→v13 con APP_VERSION, recursos `?v=13`, CACHE y CHANGELOG.
- Autocambio: el contexto posterior incluido en el ZIP contiene actualizar.html y Worker ya modificados.
- Errores: find ausente/no único y partes faltantes/duplicadas explican exactamente qué pedir a la IA.
