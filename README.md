# Centro de Control de Ingeniería

Aplicación React + TypeScript para gestionar proyectos, tareas, guías técnicas, planeación personal y respaldos. Se publica con Firebase Hosting. Los registros se guardan primero en el navegador (localStorage) y se sincronizan con Firestore y con un respaldo en Google Drive.

## Ejecutar y validar

```powershell
node .\node_modules\typescript\bin\tsc --noEmit
node .\node_modules\vite\bin\vite.js build
```

Desarrollo local: `npm run dev` (Vite, puerto 3000). `npm run lint` equivale a `tsc --noEmit`.

> **Nota:** el script `clean` de `package.json` usa `rm -rf` y no funciona en PowerShell.

El despliegue se realiza con Firebase Hosting para el proyecto `ai-studio-applet-webapp-4a4b6` (`.firebaserc`).

> **Importante:** `firebase.json` solo define `hosting`. Un despliegue de Hosting no publica `firestore.rules`; las reglas se publican por separado o se agrega la sección `firestore` a `firebase.json`.

## Conceptos principales

- **Biblioteca técnica:** contiene guías maestras (`kind: guide`) que funcionan como plantillas.
- **Guías de proyecto:** al asociar una plantilla, se crea una copia privada (`kind: pguide`) con `projectId`, `sourceId` y `sourceVersion`. Editar esa copia no debe cambiar la plantilla.
- **Actualizar desde Biblioteca:** acción explícita que reemplaza una copia de proyecto con la versión vigente de su plantilla.
- **Demos:** `kind: demo` usa la misma estructura y el mismo editor que una guía (`Guide`), se organiza por marca en la pestaña Demos de la Biblioteca y no se asocia a proyectos ni entra en el avance. Se exporta e importa como JSON como las guías.
- **Crear plantilla:** publica una copia enriquecida de un proyecto como una nueva guía maestra con nombre y versión.
- **Planeación diaria:** pendientes personales `daily_plan`, independientes de los proyectos.

Los registros se manejan desde `src/services/store.ts`; las vistas reaccionan a sus actualizaciones. Los tipos se definen en `src/types/index.ts`.

## Modelo de datos

Todo es un registro con `id`, `kind`, `createdAt`, `updatedAt` y `deletedAt` opcional. Los valores de `kind` están en `AnyRecord` (`src/types/index.ts`): `project`, `task`, `guide`, `pguide`, `demo`, `interactive_guide`, `script`, `trouble`, `plantpl`, `note`, `file`, `client`, `channel`, `brand`, `contact`, `worktype`, `tag`, `hist`, `daily_plan` y `settings`.

- **Borrado lógico:** `deleteRecord` marca `deletedAt` (Papelera). Al borrar un proyecto, sus hijos (`projectId`) se marcan con `deletedWith`; al restaurarlo, se restauran solo los hijos con ese `deletedWith`. El borrado permanente también elimina el registro en Firestore.
- **Clonar proyecto:** `handleCloneProject` (`App.tsx`) duplica el proyecto, sus tareas y sus `pguide`, y remapea `guideRef`, `stepRef`, `Section.guideTplId` y `deps` al clon. El clon nunca apunta a guías ni tareas del origen.
- **Fechas:** las vistas Mi trabajo, Kanban y Planeación diaria usan fecha local (no `toISOString()`, que usa UTC).
- **Planeación diaria:** captura rápida con Enter y lista de tareas de proyecto que vencen hoy o ya vencieron. Dos paneles: "Pendientes" (reordenables) y "Terminadas" (se restauran desmarcando; "Enviar a papelera" las limpia).
- **Plan detallado:** las columnas "Inicio" y "Fin" son selectores de fecha editables en la fila (el inicio nunca pasa del fin).
- **Plantillas de plan (`plantpl`):** el editor es una página completa (`PlanTplModal.tsx`, se muestra dentro de Biblioteca): tarjeta de encabezado, tarjetas por sección y tabla de actividades editable (día inicio, día fin, días, peso, guía asociada, hito). Se autoguarda 1.5 s después de cada cambio (requiere nombre) y también al salir. "Desde proyecto" importa el plan de un proyecto con fechas relativas a su inicio y sus guías: una `pguide` con `sourceId` se enlaza a su guía maestra; una `pguide` propia se publica como guía maestra nueva. "Usar en proyecto" guarda, abre el proyecto elegido y abre la ventana de aplicar plantilla (`sessionStorage` `cci_pending_tpl`).
- **Exportar/importar plantillas de plan:** el paquete incluye las guías maestras que referencia (`guideTplId` de secciones y actividades). Al importar como copia, esos ids se remapean.
- **Aplicar plantilla a un proyecto:** las tareas reciben `start`/`due` calculadas desde `project.start` + `d0`/`d1` (`addDaysYmd`, fecha local); sin fecha de inicio del proyecto se usan las fechas del proyecto.
- **Avance:** `src/services/businessRules.ts` calcula el avance de pasos, guías, tareas, secciones y proyectos con pesos. Sin secciones, el proyecto promedia sus tareas. Las tareas sin sección se combinan con `otherWeight`.

## Persistencia y sincronización

Orden de escritura en `store.ts`:

1. `putRecord` / `putRecords` escriben de inmediato en localStorage (`cci_records_v1_5`, `cci_settings_v1_5`).
2. Tras 250 ms, `flushSave` envía los cambios pendientes a Firestore si hay sesión.
3. Después, `scheduleGoogleDriveAutoSync` actualiza `backup-latest.json` en Drive (retardo de 2 s) si existe token de Google. Si llega un cambio mientras una subida está en curso, se marca `driveSyncQueued` y se repite la subida al terminar, para que ningún cambio quede fuera del respaldo.

Reglas de sincronización entre equipos (`store.ts`):

- **Mezcla por `updatedAt` en todos los sentidos.** Ni el respaldo de Drive ni la nube pisan un registro local más nuevo. `reconcileCloud` sube a Firestore lo local que es más nuevo o que la nube no tiene (escrituras fallidas, datos traídos de Drive). Nunca baja la versión de la nube.
- **Reintento:** si falla una escritura a Firestore (error o 15 s sin respuesta), los ids vuelven a `pendingChanges` y se reintenta a los 15 s.
- **Antes de subir a Drive** se lee y mezcla el respaldo si es la primera vez en la sesión o si otro equipo lo modificó (`cci_drive_remote_modified` en localStorage). Si la lectura falla, no se sube nada (`drivePullOk`): un error de lectura no equivale a "no hay respaldo".
- **Datos de ejemplo (semillas) sin modificar** (`isPristineSeed`) no se suben y se descartan cuando la nube o Drive ya tienen datos reales.
- **Guardar ahora:** el botón de la barra superior llama a `store.syncNow()`: vacía lo pendiente, lee la nube desde el servidor (`fetchUserRecordsOnce`), mezcla, sube lo local más nuevo, mezcla Drive y sube el respaldo. Informa el resultado de la nube y de Drive por separado.
- **Limitación conocida:** el borrado permanente no se propaga entre equipos (no hay tombstones). Un equipo que nunca vio el borrado puede reponer el registro.

### Fotos y evidencias

Las imágenes nuevas se suben a la carpeta `Fotos y Evidencias` de Drive y el registro solo guarda `gdrive://{ID}`. Sin sesión de Drive se guardan comprimidas en base64 como respaldo temporal. `services/imageMigration.ts` mueve las imágenes base64 que ya existían (campos cuyo valor completo es un data URL de 20 000+ caracteres en `guide`, `pguide`, `demo`, `script` y `trouble`) a Drive: se ejecuta sola en segundo plano tras un respaldo correcto (cada 5 min como máximo) y a mano con "Mover fotos a Drive" en Google Drive y Respaldos > Fotos y Evidencias. El registro solo cambia después de que Drive confirma la subida; las imágenes repetidas se suben una vez (hash SHA-256). El HTML enriquecido no se modifica.

### Firestore

- Ruta: `users/{uid}/records/{id}`. Cada documento guarda el registro serializado como JSON en el campo `data`.
- Registros de más de 500 000 caracteres se parten en documentos `{id}__c{n}` (`isChunkPart`) más un encabezado con `isChunked` y `totalChunks`. Las reglas permiten hasta 100 partes de 1 MiB.
- `firestore.rules` niega todo por defecto y solo permite al propietario (`request.auth.uid == userId`) leer y escribir con la forma validada.
- Al iniciar sesión, los registros de la nube se combinan con los locales y gana el `updatedAt` más reciente. Si la nube está vacía, se suben los locales.

### Google Drive

- Inicio de sesión con Google y el scope `drive.file`.
- Se usa una carpeta propia de la app. `backup-latest.json` es el respaldo activo; `syncToGoogleDrive` además crea `backup-{timestamp}.json`.
- Al iniciar sesión se ejecuta `pullLatestFromGoogleDrive(true)`, que reemplaza el estado local con el respaldo de Drive. Conserva los registros locales no semilla modificados después de la fecha del respaldo.
- Antes de reemplazar, se guarda una copia en `localStorage` (`cci_pre_drive_sync_backup`). Antes de importar un paquete, `cci_pre_import_backup`.

> **Advertencia:** el token de acceso de Drive se guarda en `sessionStorage` y `localStorage` (`cci_gdrive_access_token`) en `src/services/firebase.ts`.

### Sesión, modo local y estado de Drive

- La pantalla de acceso ofrece "Continuar sin conexión" (`cci_local_mode` en localStorage): usa la app solo con datos del navegador, sin Firestore ni Drive. Al acceder con Google después, los datos locales se combinan con los de la nube por `updatedAt`.
- Si Firebase Auth no responde en 4 s, la app deja de mostrar "Validando acceso…".
- `AppState.driveStatus` (`ok`, `expired`, `disconnected`) lo actualiza `store.ts` en cada sincronización o lectura de Drive. El botón de Drive del encabezado muestra "Drive: reconectar" si la autorización venció y "Drive: sin sesión" si falta el token.

### Paquetes de exportación

`generateBackupPackage` produce `{ format: 'CentroControlIngenieria', formatVersion: 1, scope, exportedAt, records, files }` con `scope` `respaldo`, `proyecto`, `guia` o `plantilla`. `importPackage` admite `restore` (reemplaza todo) y `merge` con conflicto `skip`, `duplicate` o `replace`.

### Datos semilla

En el arranque, `store.ts` agrega si faltan: la plantilla `plantpl-pam-saas`, las marcas Aikido, Veracode y GreenRadius + Yubikey, y la guía interactiva `interactive-guide-segura-cluster`. Una primera ejecución sin datos usa `generateSeedRecords()`.

## Estructura

- `src/App.tsx`: navegación y vistas principales.
- `src/services/store.ts`: estado, persistencia, sincronización y respaldos.
- `src/services/firebase.ts`: autenticación, Firestore y chunking.
- `src/services/googleDrive.ts`: carpeta, respaldos e imágenes en Drive.
- `src/services/businessRules.ts`: fórmulas de avance.
- `src/components/ProjectDetailView.tsx`: plan, actividades y guías privadas de cada proyecto.
- `src/components/TechnicalLibraryView.tsx`: biblioteca de plantillas.
- `src/components/GuideEditor.tsx`: edición de secciones, pasos y bloques.
- `src/components/common/DriveImage.tsx`: imagen, redimensionamiento y visor ampliado.
- `firebase-blueprint.json`: descripción del modelo para AI Studio; su lista de `kind` no incluye `interactive_guide` ni `daily_plan`.

Lee `AGENTS.md` antes de realizar cambios.
