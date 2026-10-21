import React, { useState, useEffect, useMemo } from 'react';
import {
  HardDriveDownload,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Download,
  Trash2,
  RefreshCw,
  Folder,
  ExternalLink,
  FileJson,
  FileArchive,
  RotateCcw,
  Image as ImageIcon,
  Copy,
  Check,
} from 'lucide-react';
import { store } from '../services/store';
import { auth, googleSignIn, getAccessToken } from '../services/firebase';
import {
  getOrCreateAppFolder,
  listBackupsFromDrive,
  listPhotosFromDrive,
  uploadImageToDrive,
  downloadFileFromDrive,
  DriveFileItem,
} from '../services/googleDrive';
import { DriveImage } from './common/DriveImage';
import { ConfirmModal } from './modals/ConfirmModal';

export const GoogleDriveBackupsView: React.FC = () => {
  const state = store.getState();
  const [driveFolder, setDriveFolder] = useState<{ id: string; name: string; url: string } | null>(
    null
  );
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [drivePhotos, setDrivePhotos] = useState<DriveFileItem[]>([]);
  const [activeDriveTab, setActiveDriveTab] = useState<'backups' | 'photos'>('backups');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [copiedPhotoId, setCopiedPhotoId] = useState<string | null>(null);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const embedded = useMemo(() => store.countEmbeddedImages(), [state.records]);
  const [migrating, setMigrating] = useState<{ done: number; total: number } | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Restore confirmation modal
  const [restoreConfirmFile, setRestoreConfirmFile] = useState<DriveFileItem | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const currentUser = auth.currentUser;
  const [isDriveAuthorized, setIsDriveAuthorized] = useState<boolean>(false);

  const loadDriveInfo = async () => {
    if (!currentUser) {
      setIsDriveAuthorized(false);
      setDriveFolder(null);
      setDriveFiles([]);
      setDrivePhotos([]);
      return;
    }

    const token = await getAccessToken();
    if (!token) {
      setIsDriveAuthorized(false);
      setDriveFolder(null);
      setDriveFiles([]);
      setDrivePhotos([]);
      setDriveError(null);
      return;
    }

    setIsDriveAuthorized(true);
    setIsLoadingDrive(true);
    setDriveError(null);
    try {
      const folder = await getOrCreateAppFolder();
      setDriveFolder(folder);
      const [files, photos] = await Promise.all([
        listBackupsFromDrive(folder.id),
        listPhotosFromDrive(folder.id).catch(() => []),
      ]);
      setDriveFiles(files);
      setDrivePhotos(photos);
    } catch (err: any) {
      const msg = err?.message || 'Error al conectar con Google Drive.';
      if (
        msg.includes('expirado') ||
        msg.includes('permisos') ||
        msg.includes('token') ||
        msg.includes('sesión')
      ) {
        setIsDriveAuthorized(false);
      }
      setDriveError(msg);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  useEffect(() => {
    loadDriveInfo();
  }, [currentUser]);

  const [isPullingFromDrive, setIsPullingFromDrive] = useState(false);

  const handleAuthorizeDrive = async () => {
    try {
      setDriveError(null);
      setIsLoadingDrive(true);
      const res = await googleSignIn(true);
      if (res?.accessToken) {
        setIsDriveAuthorized(true);
        // Immediately consume data from authorized Google Drive
        const pullRes = await store.pullLatestFromGoogleDrive(true);
        await loadDriveInfo();
        if (pullRes.updated) {
          setSyncSuccessMsg(`¡Google Drive conectado! Se consumieron ${pullRes.count} registros actualizados desde tu Drive.`);
        } else {
          setSyncSuccessMsg('¡Google Drive conectado exitosamente! Tus datos están sincronizados.');
        }
      }
    } catch (err: any) {
      // User closed popup or cancelled
      if (err?.code !== 'auth/popup-closed-by-user') {
        setDriveError(err?.message || 'No se pudo completar la autorización con Google Drive.');
      }
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handlePullFromDrive = async () => {
    setIsPullingFromDrive(true);
    setSyncSuccessMsg(null);
    setDriveError(null);
    try {
      const res = await store.pullLatestFromGoogleDrive(true);
      if (res.updated) {
        setSyncSuccessMsg(`¡Datos consumidos exitosamente desde Google Drive! (${res.count} registros actualizados/sincronizados)`);
      } else {
        setSyncSuccessMsg('Tu aplicación ya cuenta con la información más reciente de Google Drive.');
      }
      await loadDriveInfo();
    } catch (err: any) {
      setDriveError(`Error al consumir datos desde Google Drive: ${err?.message || err}`);
    } finally {
      setIsPullingFromDrive(false);
    }
  };

  const handleSyncToDrive = async () => {
    setIsSyncingDrive(true);
    setSyncSuccessMsg(null);
    setDriveError(null);
    try {
      let token = await getAccessToken();
      if (!token) {
        const signinRes = await googleSignIn(true);
        token = signinRes?.accessToken || null;
      }
      if (!token) {
        throw new Error('Se requiere autorizar el acceso a Google Drive para continuar.');
      }
      setIsDriveAuthorized(true);
      const res = await store.syncToGoogleDrive();
      setSyncSuccessMsg(`Respaldo guardado exitosamente en Google Drive: ${res.filename}`);
      await loadDriveInfo();
    } catch (err: any) {
      const msg = err?.message || 'Error al guardar respaldo en Google Drive.';
      if (
        msg.includes('expirado') ||
        msg.includes('permisos') ||
        msg.includes('token') ||
        msg.includes('sesión')
      ) {
        setIsDriveAuthorized(false);
      }
      setDriveError(msg);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const handleRestoreFromDrive = async () => {
    if (!restoreConfirmFile) return;
    setIsRestoring(true);
    try {
      const jsonContent = await downloadFileFromDrive(restoreConfirmFile.id);
      const parsed = JSON.parse(jsonContent);
      store.importPackage(parsed, 'restore');
      setRestoreConfirmFile(null);
      setSyncSuccessMsg('Respaldo restaurado exitosamente desde Google Drive.');
    } catch (err: any) {
      setDriveError(`Error al restaurar respaldo: ${err?.message || err}`);
    } finally {
      setIsRestoring(false);
    }
  };

  // Local JSON Download
  const handleDownloadLocalJSON = () => {
    const pkg = store.generateBackupPackage('respaldo');
    const blob = new Blob([JSON.stringify(pkg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CentroControl_Respaldo_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Local ZIP Download
  const handleDownloadLocalZIP = async () => {
    const zipBlob = await store.exportAsZip('respaldo');
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CentroControl_Respaldo_${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Local Import File
  const handleLocalFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const res = store.importPackage(parsed, 'merge', 'replace');
        alert(`Paquete importado con éxito: ${res.count} registros incorporados.`);
      } catch (err: any) {
        alert(`Error al importar archivo: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Mueve las fotos incrustadas en guías/demos/scripts a Drive para liberar espacio en la app
  const handleMigrateImages = async () => {
    setDriveError(null);
    setMigrating({ done: 0, total: embedded.images });
    try {
      const res = await store.migrateImagesToDrive((done, total) => setMigrating({ done, total }));
      if (res.authError && res.migrated === 0) {
        setDriveError('La autorización de Google Drive no está activa. Reconecta Drive e inténtalo de nuevo.');
      } else {
        setSyncSuccessMsg(
          `${res.migrated} foto(s) movidas a Google Drive${res.failed > 0 ? `; ${res.failed} no se pudieron subir y se conservan en la app` : ''}.`
        );
        await loadDriveInfo();
      }
    } catch (err: any) {
      setDriveError(err?.message || 'Error al mover fotos a Google Drive');
    } finally {
      setMigrating(null);
    }
  };

  // Upload photo directly to Google Drive 'Fotos y Evidencias'
  const handlePhotoUploadInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    setDriveError(null);
    try {
      await uploadImageToDrive(file, file.name);
      setSyncSuccessMsg(`Foto subida exitosamente a Google Drive: ${file.name}`);
      await loadDriveInfo();
    } catch (err: any) {
      setDriveError(err?.message || 'Error al subir foto a Google Drive');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleCopyPhotoTag = (photo: DriveFileItem) => {
    navigator.clipboard.writeText(`gdrive://${photo.id}`);
    setCopiedPhotoId(photo.id);
    setTimeout(() => setCopiedPhotoId(null), 2000);
  };

  return (
    <div className="p-6 space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Google Drive y Gestión de Respaldos
        </h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
          Almacenamiento persistente, sincronización en nube de Google Drive y copias de seguridad portables (RF-57 a RF-61)
        </p>
      </div>

      {/* Google Drive Primary Integration Card */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-cyan-950/60 border border-blue-200 dark:border-cyan-800/80 text-blue-600 dark:text-cyan-400">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
                Sincronización con Google Drive
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Guarda tus proyectos y preferencias en una carpeta dedicada de tu Google Drive personal
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!currentUser ? (
              <button
                onClick={() => googleSignIn()}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 rounded-lg transition-colors shadow-xs"
              >
                Conectar cuenta Google
              </button>
            ) : !isDriveAuthorized ? (
              <button
                onClick={handleAuthorizeDrive}
                disabled={isLoadingDrive}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>{isLoadingDrive ? 'Conectando...' : 'Conectar con Google Drive'}</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handlePullFromDrive}
                  disabled={isPullingFromDrive || isSyncingDrive}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-neutral-100 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 border border-slate-300 dark:border-neutral-700 disabled:opacity-50 rounded-lg transition-colors shadow-2xs cursor-pointer"
                  title="Cargar y consumir los datos más recientes almacenados en tu Google Drive"
                >
                  <Download className={`w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 ${isPullingFromDrive ? 'animate-bounce' : ''}`} />
                  <span>{isPullingFromDrive ? 'Consumiendo de Drive...' : 'Consumir Datos de Drive'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSyncToDrive}
                  disabled={isSyncingDrive || isPullingFromDrive}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 disabled:opacity-50 rounded-lg transition-colors shadow-xs cursor-pointer"
                  title="Guardar un respaldo manual inmediato en Google Drive"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                  <span>{isSyncingDrive ? 'Guardando en Drive...' : 'Respaldar en Drive Ahora'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Persistence Guarantee Banner */}
        <div className="p-3.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-3 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-slate-700 dark:text-neutral-300 space-y-0.5">
            <p className="font-semibold text-emerald-900 dark:text-emerald-300">
              Persistencia y Sincronización Garantizada
            </p>
            <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed">
              Cada cambio que realizas (proyectos, tareas, cronogramas, guías, scripts, fotos) se guarda inmediatamente a nivel local y se sincroniza en tu Google Drive autorizado en <code className="font-mono text-emerald-700 dark:text-emerald-400">backup-latest.json</code>. <strong>Si sales de tu sesión o cierras la ventana, todos los cambios se mantienen completamente intactos</strong> y se recuperan automáticamente cuando vuelvas a entrar.
            </p>
          </div>
        </div>

        {/* Status Info */}
        {currentUser && !isDriveAuthorized && (
          <div className="p-4 rounded-lg bg-blue-50/70 dark:bg-cyan-950/20 border border-blue-200 dark:border-cyan-800/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-slate-700 dark:text-neutral-300">
              <Cloud className="w-5 h-5 text-blue-600 dark:text-cyan-400 shrink-0" />
              <div>
                <p className="font-medium text-slate-900 dark:text-neutral-200">Permisos de Google Drive requeridos</p>
                <p className="text-slate-500 dark:text-neutral-400 text-[11px] mt-0.5">
                  Sesión activa como <strong className="text-slate-700 dark:text-neutral-300">{currentUser.email || 'Usuario'}</strong>. Autoriza el acceso a Google Drive para sincronizar y gestionar tus respaldos en la nube.
                </p>
              </div>
            </div>
            <button
              onClick={handleAuthorizeDrive}
              disabled={isLoadingDrive}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shrink-0 transition-colors shadow-xs"
            >
              {isLoadingDrive ? 'Autorizando...' : 'Autorizar Google Drive'}
            </button>
          </div>
        )}

        {currentUser && isDriveAuthorized && (
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700/60 text-xs space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-700 dark:text-neutral-300">
                <Folder className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                <span>
                  Carpeta en Google Drive:{' '}
                  <strong className="text-slate-900 dark:text-white">
                    {driveFolder?.name || 'Centro de Control de Ingeniería (CCI)'}
                  </strong>
                </span>
              </div>
              {driveFolder && (
                <a
                  href={driveFolder.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 text-xs font-medium"
                >
                  <span>Abrir carpeta en Google Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {state.settings.lastDriveSync && (
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                Última sincronización exitosa:{' '}
                {new Date(state.settings.lastDriveSync).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {syncSuccessMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{syncSuccessMsg}</span>
          </div>
        )}

        {driveError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{driveError}</span>
            </div>
            <button
              onClick={handleAuthorizeDrive}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white rounded-md text-xs font-semibold shrink-0 self-start sm:self-auto transition-colors"
            >
              Autorizar permisos de Google Drive
            </button>
          </div>
        )}

        {/* Google Drive Content Tabs: Backups vs Photos */}
        {currentUser && (
          <div className="pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-neutral-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveDriveTab('backups')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeDriveTab === 'backups'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>Respaldos del Sistema ({driveFiles.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDriveTab('photos')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeDriveTab === 'photos'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Fotos y Evidencias en Drive ({drivePhotos.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {activeDriveTab === 'photos' && (
                  <label className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg cursor-pointer transition-colors shadow-2xs">
                    <Upload className="w-3 h-3" />
                    <span>{isUploadingPhoto ? 'Subiendo a Drive...' : 'Subir Foto a Drive'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingPhoto}
                      onChange={handlePhotoUploadInput}
                      className="hidden"
                    />
                  </label>
                )}

                <button
                  onClick={loadDriveInfo}
                  disabled={isLoadingDrive}
                  className="text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white text-xs flex items-center gap-1 cursor-pointer"
                  title="Refrescar lista desde Google Drive"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingDrive ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>
              </div>
            </div>

            {!isDriveAuthorized ? (
              <div className="p-6 text-center bg-slate-50 dark:bg-neutral-950/40 border border-slate-200 dark:border-neutral-800 rounded-lg text-xs text-slate-500 dark:text-neutral-500">
                Conecta tu cuenta con permisos de Google Drive para listar y restaurar tus respaldos y fotos en la nube.
              </div>
            ) : activeDriveTab === 'backups' ? (
              driveFiles.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 dark:bg-neutral-950/40 border border-slate-200 dark:border-neutral-800 rounded-lg text-xs text-slate-500 dark:text-neutral-500">
                  Aún no has generado respaldos en tu carpeta de Google Drive. Presiona &ldquo;Respaldar en Google Drive Ahora&rdquo;.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {driveFiles.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 bg-slate-50 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 rounded-lg flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <FileJson className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                          <span className="font-medium text-slate-800 dark:text-neutral-200 truncate">{file.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-neutral-500 font-mono mt-0.5 block">
                          Modificado: {new Date(file.modifiedTime).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => setRestoreConfirmFile(file)}
                          className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-white bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60 rounded transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restaurar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* Photos & Evidence in Google Drive */
              <div className="space-y-4">
                {embedded.images > 0 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-200 flex flex-wrap items-center justify-between gap-3">
                    <span>
                      <strong>{embedded.images} foto(s) incrustadas en {embedded.records} guía(s)/ficha(s)</strong> ocupan unos {(embedded.bytes / 1048576).toFixed(1)} MB en la app y en el respaldo. Muévelas a Drive para liberar espacio; en las guías se ven igual.
                      {migrating && <> Subiendo {migrating.done} de {migrating.total}…</>}
                    </span>
                    <button
                      type="button"
                      onClick={handleMigrateImages}
                      disabled={!!migrating || !isDriveAuthorized}
                      className="px-3 py-1.5 font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 rounded-lg cursor-pointer"
                      title={isDriveAuthorized ? 'Sube las fotos a Fotos y Evidencias y deja solo la referencia' : 'Conecta Google Drive primero'}
                    >
                      {migrating ? 'Moviendo…' : 'Mover fotos a Drive'}
                    </button>
                  </div>
                )}
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-lg text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    <strong>Cero penalización en hosting:</strong> Todas las fotos, capturas y evidencias se guardan y consumen directamente desde tu carpeta de Google Drive <em>(Fotos y Evidencias)</em>. Puedes copiar el identificador <code>gdrive://...</code> o el enlace para usarlo en cualquier guía o script.
                  </span>
                </div>

                {drivePhotos.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-neutral-950/40 border border-slate-200 dark:border-neutral-800 rounded-lg text-xs text-slate-500 dark:text-neutral-500 space-y-2">
                    <p>Aún no hay fotos guardadas en tu carpeta de Google Drive.</p>
                    <p className="text-[11px]">
                      Sube una captura con el botón superior o pégala directamente con <strong>Ctrl+V</strong> en cualquier Guía Técnica o Ficha de Troubleshooting.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {drivePhotos.map((photo) => {
                      const isCopied = copiedPhotoId === photo.id;
                      return (
                        <div
                          key={photo.id}
                          className="bg-white dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700 rounded-xl overflow-hidden shadow-2xs group flex flex-col"
                        >
                          <div className="h-40 bg-slate-100 dark:bg-neutral-900 overflow-hidden relative flex items-center justify-center">
                            <DriveImage
                              driveFileId={photo.id}
                              alt={photo.name}
                              className="w-full h-full object-cover"
                              showDriveBadge={false}
                            />
                          </div>

                          <div className="p-3 flex-1 flex flex-col justify-between gap-2 text-xs">
                            <div>
                              <span className="font-semibold text-slate-800 dark:text-neutral-200 truncate block">
                                {photo.name}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono block mt-0.5">
                                {new Date(photo.modifiedTime).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-neutral-700/60">
                              <button
                                type="button"
                                onClick={() => handleCopyPhotoTag(photo)}
                                className="flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded bg-slate-100 dark:bg-neutral-700 hover:bg-slate-200 dark:hover:bg-neutral-600 text-slate-700 dark:text-neutral-200 font-medium text-[11px] transition-colors cursor-pointer"
                                title="Copiar referencia gdrive://ID para pegar en guías"
                              >
                                {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                <span>{isCopied ? '¡Copiado!' : 'Copiar ID'}</span>
                              </button>

                              {photo.webViewLink && (
                                <a
                                  href={photo.webViewLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 rounded text-slate-400 hover:text-slate-800 dark:hover:text-white"
                                  title="Ver en Google Drive"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Local JSON / ZIP Export & Import Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">Exportar Paquete Local</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            Descarga una copia completa en tu disco duro (formato JSON o ZIP compatible con CCI v1.5).
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleDownloadLocalJSON}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-neutral-200 bg-slate-50 dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700 rounded-lg transition-colors"
            >
              <FileJson className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>Descargar .JSON</span>
            </button>
            <button
              onClick={handleDownloadLocalZIP}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-neutral-200 bg-slate-50 dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700 rounded-lg transition-colors"
            >
              <FileArchive className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Descargar .ZIP</span>
            </button>
          </div>
        </div>

        {/* Import Card */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Upload className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">Importar Respaldo</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            Carga un archivo JSON de respaldo. Se realiza una copia automática previa antes de aplicar cambios.
          </p>

          <div className="pt-2">
            <label className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 rounded-lg cursor-pointer transition-colors shadow-xs">
              <Upload className="w-4 h-4" />
              <span>Seleccionar Archivo de Respaldo (.json)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleLocalFileImport}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Restore from Google Drive */}
      <ConfirmModal
        isOpen={!!restoreConfirmFile}
        title="Restaurar Respaldo desde Google Drive"
        message={`¿Estás seguro de que deseas restaurar el archivo "${restoreConfirmFile?.name}"?\n\nEsta operación reemplazará los datos actuales con el contenido del respaldo seleccionado. Se guardará una copia previa local por seguridad.`}
        confirmText={isRestoring ? 'Restaurando...' : 'Sí, restaurar datos'}
        cancelText="Cancelar"
        isDestructive={false}
        onConfirm={handleRestoreFromDrive}
        onCancel={() => setRestoreConfirmFile(null)}
      />
    </div>
  );
};
