# Pruebas E2E del actualizador universal · v12.3

`python tests/updater_e2e.py` comprueba contexto íntegro con checksum, división por archivos, cambios múltiples, creación/borrado, sustitución completa multipartes, actualización coordinada de Worker/documentación/versión y mensajes de error. El actualizador sigue excluyendo `assets/` y genera `PROYECTO_ESTADISTICAS.md` y el contexto siguiente.
