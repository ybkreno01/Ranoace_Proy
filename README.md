# Centro de Control de Ingeniería

Aplicación React + TypeScript para gestionar proyectos, tareas, guías técnicas, planeación personal y respaldos. Se publica con Firebase Hosting y los registros del usuario se sincronizan con Firestore.

## Ejecutar y validar

```powershell
node .\node_modules\typescript\bin\tsc --noEmit
node .\node_modules\vite\bin\vite.js build
```

El despliegue se realiza con Firebase Hosting para el proyecto `ai-studio-applet-webapp-4a4b6`.

## Conceptos principales

- **Biblioteca técnica:** contiene guías maestras (`kind: guide`) que funcionan como plantillas.
- **Guías de proyecto:** al asociar una plantilla, se crea una copia privada (`kind: pguide`) con `projectId`, `sourceId` y `sourceVersion`. Editar esa copia no debe cambiar la plantilla.
- **Actualizar desde Biblioteca:** acción explícita que reemplaza una copia de proyecto con la versión vigente de su plantilla.
- **Crear plantilla:** publica una copia enriquecida de un proyecto como una nueva guía maestra con nombre y versión.
- **Planeación diaria:** pendientes personales `daily_plan`, independientes de los proyectos.

Los registros se manejan desde `src/services/store.ts`; las vistas reaccionan a sus actualizaciones. Los tipos se definen en `src/types/index.ts`.

## Estructura

- `src/App.tsx`: navegación y vistas principales.
- `src/components/ProjectDetailView.tsx`: plan, actividades y guías privadas de cada proyecto.
- `src/components/TechnicalLibraryView.tsx`: biblioteca de plantillas.
- `src/components/GuideEditor.tsx`: edición de secciones, pasos y bloques.
- `src/components/common/DriveImage.tsx`: imagen, redimensionamiento y visor ampliado.

Lee `AGENTS.md` antes de realizar cambios.
