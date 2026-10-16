# Trabajo de agentes

Antes de editar, revisa `README.md`, los tipos relacionados y todos los usos con `rg`. Mantén cambios pequeños y evita modificar archivos no relacionados.

## Regla crítica de guías

Las guías de Biblioteca (`kind: guide`) son plantillas maestras. Desde un proyecto solo se edita una copia `pguide`. No apuntes tareas, secciones ni el editor de proyecto directamente a una guía maestra. Una actualización desde Biblioteca debe ser una acción explícita del usuario.

## Coordinación

1. Un agente trabaja por archivo o funcionalidad para evitar conflictos.
2. Antes de entregar, ejecuta `node .\node_modules\typescript\bin\tsc --noEmit` y `node .\node_modules\vite\bin\vite.js build`.
3. Reporta archivos cambiados, comportamiento validado y riesgos pendientes.
4. No hagas despliegues ni sobrescribas cambios ajenos sin revisar `git diff` y `git status`.
5. Documenta en `README.md` cualquier cambio de modelo, sincronización o flujo principal.
