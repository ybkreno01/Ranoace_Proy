# Trabajo de agentes

Antes de editar, revisa `README.md`, los tipos relacionados y todos los usos con `rg`. Mantén cambios pequeños y evita modificar archivos no relacionados.

## Regla crítica de guías

Las guías de Biblioteca (`kind: guide`) son plantillas maestras. Desde un proyecto solo se edita una copia `pguide`. No apuntes tareas, secciones ni el editor de proyecto directamente a una guía maestra. Una actualización desde Biblioteca debe ser una acción explícita del usuario.

Puntos a verificar al tocar este flujo: `Task.guideRef`, `Task.stepRef.pguideId` y `Section.guideTplId` se resuelven en `businessRules.ts` contra el mapa de guías. Confirma que apunten a una `pguide` del proyecto.

## Coordinación

1. Un agente trabaja por archivo o funcionalidad para evitar conflictos.
2. Antes de entregar, ejecuta `node .\node_modules\typescript\bin\tsc --noEmit` y `node .\node_modules\vite\bin\vite.js build`.
3. Reporta archivos cambiados, comportamiento validado y riesgos pendientes.
4. No hagas despliegues ni sobrescribas cambios ajenos sin revisar `git diff` y `git status`.
5. Documenta en `README.md` cualquier cambio de modelo, sincronización o flujo principal.

## Cambios que exigen cuidado

- **`src/types/index.ts`:** al agregar o cambiar un `kind`, actualiza `AnyRecord`, `firebase-blueprint.json` y la sección "Modelo de datos" del README.
- **`src/services/store.ts`:** toda escritura pasa por `putRecord`, `putRecords` o `deleteRecord`. No escribas en `localStorage` directamente.
- **Sincronización:** `pullLatestFromGoogleDrive` reemplaza el estado local. Cualquier cambio ahí puede borrar datos; conserva la copia `cci_pre_drive_sync_backup`.
- **`firestore.rules` y `firebase.ts`:** el tamaño de fragmento (500 000 caracteres) y el límite de 100 partes deben seguir alineados con las reglas.
- **Tokens y secretos:** no agregues secretos al repositorio ni registres tokens de Google en consola.

## Riesgos conocidos

- El token de acceso de Drive se guarda en `localStorage` y `sessionStorage` (`src/services/firebase.ts`).
- `firebase-blueprint.json` no lista `interactive_guide` ni `daily_plan`.
- `firebase.json` no incluye Firestore: desplegar Hosting no publica las reglas.
