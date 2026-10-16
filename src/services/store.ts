import JSZip from 'jszip';
import { AnyRecord, AppState, Project, Settings, InteractiveGuide } from '../types';
import { defaultSettings, generateSeedRecords, pamSaaSPlantilla } from '../data/seedData';
import { sanitizeGuideImages } from './imageCompression';
import {
  auth,
  saveBatchRecordsToFirestore,
  deleteRecordFromFirestore,
  subscribeToUserRecords,
  getAccessToken,
} from './firebase';
import {
  getOrCreateAppFolder,
  uploadBackupToDrive,
  getLatestBackupFromDrive,
} from './googleDrive';

const LOCAL_STORAGE_KEY = 'cci_records_v1_5';
const LOCAL_SETTINGS_KEY = 'cci_settings_v1_5';

class Store {
  private state: AppState = {
    records: {},
    settings: defaultSettings,
    activeView: 'dashboard',
    selectedProjectId: null,
    selectedTaskId: null,
    selectedGuideId: null,
    searchQuery: '',
    isSearchOpen: false,
    saveStatus: 'saved',
    lastSavedAt: new Date().toLocaleTimeString(),
  };

  private listeners: Set<() => void> = new Set();
  private saveTimeout: any = null;
  private pendingChanges: Set<string> = new Set();
  private firestoreUnsubscribe: (() => void) | null = null;
  private isInitialized = false;
  private driveAutoSyncTimeout: any = null;
  private isDriveSyncing = false;
  private driveSyncQueued = false;

  constructor() {
    this.init();
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.persistLocal();
      });
      window.addEventListener('pagehide', () => {
        this.persistLocal();
      });
    }
  }

  private init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Load local storage first
    try {
      const localRecords = localStorage.getItem(LOCAL_STORAGE_KEY);
      const localSettings = localStorage.getItem(LOCAL_SETTINGS_KEY);

      if (localRecords) {
        this.state.records = JSON.parse(localRecords);
        if (!this.state.records['plantpl-pam-saas']) {
          this.state.records['plantpl-pam-saas'] = pamSaaSPlantilla;
        }
        if (this.state.records['type-poc']) {
          (this.state.records['type-poc'] as any).name = 'PoC / PLC (Prueba de Concepto)';
        }
        if (!this.state.records['brand-aikido']) {
          this.state.records['brand-aikido'] = {
            id: 'brand-aikido',
            kind: 'brand',
            name: 'Aikido',
            color: '#5850ec',
            aliases: ['aikido', 'aikido security'],
            createdAt: '2026-10-01T08:00:00.000Z',
            updatedAt: '2026-10-09T08:00:00.000Z',
          };
        }
        if (!this.state.records['brand-veracode']) {
          this.state.records['brand-veracode'] = {
            id: 'brand-veracode',
            kind: 'brand',
            name: 'Veracode',
            color: '#00a3e0',
            aliases: ['veracode'],
            createdAt: '2026-10-01T08:00:00.000Z',
            updatedAt: '2026-10-09T08:00:00.000Z',
          };
        }
        if (!this.state.records['brand-greenradius']) {
          this.state.records['brand-greenradius'] = {
            id: 'brand-greenradius',
            kind: 'brand',
            name: 'GreenRadius + Yubikey',
            color: '#16a34a',
            aliases: ['greenradius', 'greenrdius', 'yubikey'],
            createdAt: '2026-10-01T08:00:00.000Z',
            updatedAt: '2026-10-09T08:00:00.000Z',
          };
        }
      } else {
        // First run only: Seed default initial records
        this.state.records = generateSeedRecords();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.state.records));
      }

      if (localSettings) {
        this.state.settings = { ...defaultSettings, ...JSON.parse(localSettings) };
      }

      // Optimize and downscale any oversized images in stored guides (prevents Firestore 1MB limits)
      this.optimizeStoredGuides();

      // Ensure default interactive guide exists if not present
      if (!this.state.records['interactive-guide-segura-cluster']) {
        const seedMap = generateSeedRecords();
        if (seedMap['interactive-guide-segura-cluster']) {
          this.state.records['interactive-guide-segura-cluster'] = seedMap['interactive-guide-segura-cluster'];
          this.persistLocal();
        }
      }

      // Automatically check and pull latest backup from Google Drive if authorized
      this.pullLatestFromGoogleDrive().catch((e) =>
        console.warn('Initial Google Drive sync check:', e)
      );
    } catch (e) {
      console.error('Failed to load local storage', e);
      this.state.records = generateSeedRecords();
    }
  }

  private async optimizeStoredGuides() {
    let changed = false;
    for (const [id, record] of Object.entries(this.state.records)) {
      if (record.kind === 'guide' || record.kind === 'pguide') {
        const raw = JSON.stringify(record);
        if (raw.length > 300000) {
          const sanitized = await sanitizeGuideImages(record);
          if (sanitized !== record) {
            this.state.records[id] = sanitized;
            changed = true;
          }
        }
      }
    }
    if (changed) {
      this.persistLocal();
      this.notify();
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public getState(): AppState {
    return this.state;
  }

  public setActiveView(view: string, projectId?: string | null, guideId?: string | null) {
    this.state.activeView = view;
    if (projectId !== undefined) this.state.selectedProjectId = projectId;
    if (guideId !== undefined) this.state.selectedGuideId = guideId;
    this.notify();
  }

  public setSelectedProject(id: string | null) {
    this.state.selectedProjectId = id;
    this.notify();
  }

  public setSelectedTask(id: string | null) {
    this.state.selectedTaskId = id;
    this.notify();
  }

  public setSelectedGuide(id: string | null) {
    this.state.selectedGuideId = id;
    this.notify();
  }

  public setSearchOpen(open: boolean) {
    this.state.isSearchOpen = open;
    this.notify();
  }

  public setSearchQuery(query: string) {
    this.state.searchQuery = query;
    this.notify();
  }

  // Connect to Firestore real-time sync when authenticated
  public handleAuthChange(userId: string | null) {
    if (this.firestoreUnsubscribe) {
      this.firestoreUnsubscribe();
      this.firestoreUnsubscribe = null;
    }

    if (userId) {
      // Immediately pull and consume latest data from Google Drive if authorized
      this.pullLatestFromGoogleDrive(true).catch((e) =>
        console.warn('[GoogleDrive] Initial pull on auth change:', e)
      );

      this.firestoreUnsubscribe = subscribeToUserRecords(
        userId,
        (cloudRecords) => {
          if (Object.keys(cloudRecords).length > 0) {
            // Merge with local state, strictly preserving newer updates based on updatedAt
            const merged = { ...this.state.records };
            for (const [id, cRec] of Object.entries(cloudRecords)) {
              const lRec = merged[id];
              if (!lRec) {
                merged[id] = cRec;
              } else {
                const cTime = new Date((cRec as any).updatedAt || 0).getTime();
                const lTime = new Date((lRec as any).updatedAt || 0).getTime();
                if (cTime >= lTime) {
                  merged[id] = cRec;
                }
              }
            }
            this.state.records = merged;
            if (this.state.records['settings']) {
              this.state.settings = {
                ...this.state.settings,
                ...(this.state.records['settings'] as Settings),
              };
            }
            this.persistLocal();
            this.state.saveStatus = 'saved';
            this.state.lastSavedAt = new Date().toLocaleTimeString();
            this.notify();
          } else {
            // First time cloud user: sync existing local records up to Firestore
            (async () => {
              const records = { ...this.state.records };
              for (const [id, rec] of Object.entries(records)) {
                if (rec.kind === 'guide' || rec.kind === 'pguide') {
                  records[id] = await sanitizeGuideImages(rec);
                }
              }
              this.state.records = records;
              this.persistLocal();
              const initialList = Object.values(records);
              if (initialList.length > 0) {
                await saveBatchRecordsToFirestore(userId, initialList);
              }
            })().catch((err) =>
              console.error('Initial batch sync error', err)
            );
          }
        },
        (error) => {
          console.error('Firestore listener error', error);
          this.state.saveStatus = 'offline';
          this.notify();
        }
      );
    } else {
      // When logging out: GUARANTEE that all user records and changes remain intact in memory & localStorage!
      this.persistLocal();
      this.notify();
    }
  }

  public putRecord(record: AnyRecord, immediate = false) {
    const updated = {
      ...record,
      updatedAt: new Date().toISOString(),
    };
    this.state.records = { ...this.state.records, [record.id]: updated };
    if (record.id === 'settings') {
      this.state.settings = updated as Settings;
    }
    this.pendingChanges.add(record.id);

    // Guaranteed immediate persistence to localStorage so changes are never lost even on abrupt close or logout
    this.persistLocal();

    this.state.saveStatus = 'saving';
    this.notify();

    if (immediate) {
      this.flushSave();
    } else {
      if (this.saveTimeout) clearTimeout(this.saveTimeout);
      this.saveTimeout = setTimeout(() => this.flushSave(), 250);
    }
  }

  public putRecords(records: AnyRecord[], immediate = false) {
    const now = new Date().toISOString();
    const nextRecords = { ...this.state.records };
    for (const r of records) {
      const updated = {
        ...r,
        updatedAt: now,
      };
      nextRecords[r.id] = updated;
      if (r.id === 'settings') {
        this.state.settings = updated as Settings;
      }
      this.pendingChanges.add(r.id);
    }
    this.state.records = nextRecords;

    // Guaranteed immediate persistence to localStorage
    this.persistLocal();

    this.state.saveStatus = 'saving';
    this.notify();

    if (immediate) {
      this.flushSave();
    } else {
      if (this.saveTimeout) clearTimeout(this.saveTimeout);
      this.saveTimeout = setTimeout(() => this.flushSave(), 250);
    }
  }

  public deleteRecord(id: string, soft = true) {
    const record = this.state.records[id];
    if (!record) return;

    if (soft) {
      // Soft-delete to Papelera
      const now = new Date().toISOString();
      const updated = {
        ...record,
        deletedAt: now,
        updatedAt: now,
      };
      this.state.records[id] = updated;
      this.pendingChanges.add(id);

      // If deleting a project, cascade soft-delete to its contents (RF-16)
      if (record.kind === 'project') {
        Object.values(this.state.records).forEach((r: any) => {
          if (r.projectId === id && !r.deletedAt) {
            this.state.records[r.id] = {
              ...r,
              deletedAt: now,
              deletedWith: id,
              updatedAt: now,
            };
            this.pendingChanges.add(r.id);
          }
        });
      }
    } else {
      // Permanent purge
      delete this.state.records[id];
      const user = auth.currentUser;
      if (user) {
        deleteRecordFromFirestore(user.uid, id).catch(console.error);
      }
    }

    // Guaranteed immediate persistence to localStorage
    this.persistLocal();

    this.state.saveStatus = 'saving';
    this.notify();
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.flushSave(), 250);
  }

  public restoreRecord(id: string) {
    const record = this.state.records[id];
    if (!record || !record.deletedAt) return;

    const now = new Date().toISOString();
    const updated = {
      ...record,
      deletedAt: null,
      updatedAt: now,
    };
    delete (updated as any).deletedWith;
    this.state.records[id] = updated;
    this.pendingChanges.add(id);

    // Guaranteed immediate persistence to localStorage
    this.persistLocal();

    // If restoring a project, also restore tasks/guides that were deleted with it
    if (record.kind === 'project') {
      Object.values(this.state.records).forEach((r: any) => {
        if (r.projectId === id && r.deletedWith === id) {
          const restoredChild = {
            ...r,
            deletedAt: null,
            updatedAt: now,
          };
          delete restoredChild.deletedWith;
          this.state.records[r.id] = restoredChild;
          this.pendingChanges.add(r.id);
        }
      });
    }

    this.state.saveStatus = 'saving';
    this.notify();
    this.flushSave();
  }

  public emptyTrash() {
    const user = auth.currentUser;
    const deletedIds = Object.keys(this.state.records).filter(
      (id) => !!this.state.records[id].deletedAt
    );

    for (const id of deletedIds) {
      delete this.state.records[id];
      if (user) {
        deleteRecordFromFirestore(user.uid, id).catch(console.error);
      }
    }

    this.persistLocal();
    this.state.saveStatus = 'saved';
    this.state.lastSavedAt = new Date().toLocaleTimeString();
    this.notify();
  }

  private async flushSave() {
    this.persistLocal();

    const user = auth.currentUser;
    if (user && this.pendingChanges.size > 0) {
      const recordsToSync: AnyRecord[] = [];
      for (const id of Array.from(this.pendingChanges)) {
        let rec = this.state.records[id];
        if (rec) {
          if (rec.kind === 'guide' || rec.kind === 'pguide') {
            rec = await sanitizeGuideImages(rec);
            this.state.records[id] = rec;
          }
          recordsToSync.push(rec);
        }
      }

      this.pendingChanges.clear();

      saveBatchRecordsToFirestore(user.uid, recordsToSync)
        .then(() => {
          this.state.saveStatus = 'saved';
          this.state.lastSavedAt = new Date().toLocaleTimeString();
          this.notify();
        })
        .catch((err) => {
          console.error('Firestore save batch error', err);
          this.state.saveStatus = 'error';
          this.notify();
        });
    } else {
      this.pendingChanges.clear();
      this.state.saveStatus = 'saved';
      this.state.lastSavedAt = new Date().toLocaleTimeString();
      this.notify();
    }

    // Schedule automatic Google Drive synchronization in background
    this.scheduleGoogleDriveAutoSync();
  }

  private scheduleGoogleDriveAutoSync() {
    if (this.driveAutoSyncTimeout) {
      clearTimeout(this.driveAutoSyncTimeout);
    }
    this.driveAutoSyncTimeout = setTimeout(() => {
      this.autoSyncToGoogleDrive().catch((err) => {
        console.warn('Silently skipped background Google Drive sync:', err);
      });
    }, 2000);
  }

  public async autoSyncToGoogleDrive(): Promise<boolean> {
    if (this.isDriveSyncing) {
      // Hay un respaldo en curso: reintenta al terminar para no perder cambios recientes.
      this.driveSyncQueued = true;
      return false;
    }
    const token = await getAccessToken();
    if (!token) {
      this.setDriveStatus('disconnected');
      return false;
    }

    try {
      this.isDriveSyncing = true;
      const folder = await getOrCreateAppFolder();
      const pkg = this.generateBackupPackage('respaldo');
      await uploadBackupToDrive(folder.id, 'backup-latest.json', pkg, 'Último respaldo activo CCI');

      this.state.settings = {
        ...this.state.settings,
        googleDriveFolderId: folder.id,
        googleDriveFolderName: folder.name,
        lastDriveSync: new Date().toISOString(),
      };
      this.persistLocal();
      this.state.driveStatus = 'ok';
      this.notify();
      return true;
    } catch (err) {
      console.warn('Auto-sync to Google Drive error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (/expirado|requiere permisos/i.test(msg)) {
        this.setDriveStatus('expired');
      }
      return false;
    } finally {
      this.isDriveSyncing = false;
      if (this.driveSyncQueued) {
        this.driveSyncQueued = false;
        this.scheduleGoogleDriveAutoSync();
      }
    }
  }

  private setDriveStatus(status: 'ok' | 'expired' | 'disconnected') {
    if (this.state.driveStatus === status) return;
    this.state.driveStatus = status;
    this.notify();
  }

  public flushSyncLocal() {
    this.persistLocal();
  }

  public async flushPendingSave(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    await this.flushSave();
    if (this.driveAutoSyncTimeout) {
      clearTimeout(this.driveAutoSyncTimeout);
      this.driveAutoSyncTimeout = null;
    }
    await this.autoSyncToGoogleDrive();
  }

  public async pullLatestFromGoogleDrive(force = false): Promise<{ updated: boolean; count: number }> {
    try {
      const token = await getAccessToken();
      if (!token) {
        this.setDriveStatus('disconnected');
        return { updated: false, count: 0 };
      }

      const folder = await getOrCreateAppFolder();
      const latest = await getLatestBackupFromDrive(folder.id);
      if (!latest || !latest.pkg || !Array.isArray(latest.pkg.records)) {
        // If drive has no backup yet, push current local state to drive immediately so it is initialized
        console.log('[GoogleDrive] No se encontró respaldo previo en Drive; guardando estado inicial...');
        await this.autoSyncToGoogleDrive();
        return { updated: false, count: 0 };
      }

      const driveGeneratedAt = latest.pkg.generatedAt || latest.file.modifiedTime;
      const lastLocalSync = this.state.settings.lastDriveSync;
      const currentRecordCount = Object.keys(this.state.records).length;
      const driveRecordCount = latest.pkg.records.length;

      let shouldUpdate = force;
      if (!shouldUpdate) {
        if (!lastLocalSync || currentRecordCount === 0) {
          shouldUpdate = true;
        } else if (driveGeneratedAt && (!lastLocalSync || new Date(driveGeneratedAt).getTime() > new Date(lastLocalSync).getTime())) {
          shouldUpdate = true;
        } else if (driveRecordCount > currentRecordCount) {
          shouldUpdate = true;
        }
      }

      if (shouldUpdate) {
        console.log(`[GoogleDrive] Consumiendo datos autorizados de Google Drive (${driveRecordCount} registros desde ${latest.file.name})...`);

        // Save safety backup of local state before consuming Drive
        try {
          localStorage.setItem('cci_pre_drive_sync_backup', JSON.stringify(this.state.records));
        } catch {}

        const incomingRecords = latest.pkg.records as AnyRecord[];
        const newRecords: Record<string, AnyRecord> = {};

        for (const rec of incomingRecords) {
          if (rec.id && rec.kind) {
            newRecords[rec.id] = rec;
          }
        }

        // If there were any non-seed local records modified after the Drive backup timestamp, keep them
        const driveTime = new Date(driveGeneratedAt || 0).getTime();
        Object.entries(this.state.records).forEach(([id, rec]) => {
          if (!newRecords[id] && !id.startsWith('plantpl-') && !id.startsWith('type-')) {
            const lTime = new Date((rec as any).updatedAt || 0).getTime();
            if (lTime > driveTime) {
              newRecords[id] = rec;
            }
          }
        });

        this.state.records = newRecords;
        if (newRecords['settings']) {
          this.state.settings = {
            ...this.state.settings,
            ...(newRecords['settings'] as Settings),
          };
        }

        this.state.settings = {
          ...this.state.settings,
          googleDriveFolderId: folder.id,
          googleDriveFolderName: folder.name,
          lastDriveSync: new Date().toISOString(),
        };

        // Guarantee immediate local persistence so data survives browser refresh or logout
        this.persistLocal();
        this.state.saveStatus = 'saved';
        this.state.lastSavedAt = new Date().toLocaleTimeString();
        this.notify();

        // Also save to Firestore if user is authenticated
        const user = auth.currentUser;
        if (user) {
          const allRecs = Object.values(this.state.records);
          saveBatchRecordsToFirestore(user.uid, allRecs).catch(console.error);
        }

        return { updated: true, count: Object.keys(newRecords).length };
      }
      return { updated: false, count: 0 };
    } catch (err) {
      console.warn('pullLatestFromGoogleDrive error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (/expirado|requiere permisos/i.test(msg)) {
        this.setDriveStatus('expired');
      }
      return { updated: false, count: 0 };
    }
  }

  private persistLocal() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.state.records));
      localStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(this.state.settings));
    } catch (e) {
      console.error('Failed to persist to localStorage', e);
    }
  }

  // Backup and Export logic
  public generateBackupPackage(scope: 'respaldo' | 'proyecto' | 'guia' | 'plantilla', targetId?: string) {
    let recordsToExport: AnyRecord[] = [];

    if (scope === 'respaldo') {
      recordsToExport = Object.values(this.state.records);
    } else if (scope === 'proyecto' && targetId) {
      recordsToExport = Object.values(this.state.records).filter(
        (r: any) => r.id === targetId || r.projectId === targetId
      );
    } else if (scope === 'guia' && targetId) {
      const guide = this.state.records[targetId];
      if (guide) recordsToExport = [guide];
    } else if (scope === 'plantilla' && targetId) {
      const plantpl = this.state.records[targetId];
      if (plantpl) recordsToExport = [plantpl];
    }

    return {
      format: 'CentroControlIngenieria',
      formatVersion: 1,
      scope,
      exportedAt: new Date().toISOString(),
      records: recordsToExport,
      files: [],
    };
  }

  public async exportAsZip(scope: 'respaldo' | 'proyecto', targetId?: string): Promise<Blob> {
    const pkg = this.generateBackupPackage(scope, targetId);
    const zip = new JSZip();
    zip.file('paquete.json', JSON.stringify(pkg, null, 2));

    // Include dummy README in backup zip
    zip.file(
      'LEEME.txt',
      `Centro de Control de Ingeniería (CCI) v1.5\nRespaldo generado el: ${new Date().toLocaleString()}\nTotal registros: ${pkg.records.length}`
    );

    return await zip.generateAsync({ type: 'blob' });
  }

  public async syncToGoogleDrive(): Promise<{ success: boolean; filename: string; url: string }> {
    const folder = await getOrCreateAppFolder();
    const pkg = this.generateBackupPackage('respaldo');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;

    // 1. Upload timestamped backup
    await uploadBackupToDrive(folder.id, filename, pkg, 'Copia de seguridad periódica CCI');

    // 2. Upload latest backup
    await uploadBackupToDrive(folder.id, 'backup-latest.json', pkg, 'Último respaldo activo CCI');

    // Update settings
    this.putRecord({
      ...this.state.settings,
      googleDriveFolderId: folder.id,
      googleDriveFolderName: folder.name,
      lastDriveSync: new Date().toISOString(),
    });

    return { success: true, filename, url: folder.url };
  }

  public importPackage(
    pkg: any,
    mode: 'restore' | 'merge' = 'merge',
    conflict: 'skip' | 'duplicate' | 'replace' = 'replace'
  ): { count: number; skipped: number } {
    if (!pkg || pkg.format !== 'CentroControlIngenieria' || !Array.isArray(pkg.records)) {
      throw new Error('Formato de archivo inválido. Debe ser un paquete de Centro de Control de Ingeniería.');
    }

    // Auto-create local backup before importing (RF-59)
    try {
      localStorage.setItem('cci_pre_import_backup', JSON.stringify(this.state.records));
    } catch (e) {
      console.warn('Could not save pre-import backup to localStorage', e);
    }

    let importedCount = 0;
    let skippedCount = 0;
    const incomingRecords = pkg.records as AnyRecord[];

    if (mode === 'restore') {
      // Overwrite all current records with the package
      const newRecords: Record<string, AnyRecord> = {};
      for (const rec of incomingRecords) {
        if (rec.id && rec.kind) {
          newRecords[rec.id] = rec;
          importedCount++;
        }
      }
      this.state.records = newRecords;
      if (newRecords['settings']) {
        this.state.settings = newRecords['settings'] as Settings;
      }
    } else {
      // Merge mode
      for (const rec of incomingRecords) {
        if (!rec.id || !rec.kind) continue;

        if (this.state.records[rec.id]) {
          if (conflict === 'skip') {
            skippedCount++;
            continue;
          } else if (conflict === 'duplicate') {
            const newId = `${rec.id}-${Math.random().toString(36).substring(2, 6)}`;
            const dup = { ...rec, id: newId, name: `${(rec as any).name || ''} (Copia)` };
            this.state.records[newId] = dup as AnyRecord;
            this.pendingChanges.add(newId);
            importedCount++;
            continue;
          }
        }

        // Replace or new
        this.state.records[rec.id] = rec;
        this.pendingChanges.add(rec.id);
        importedCount++;
      }
    }

    this.flushSave();
    return { count: importedCount, skipped: skippedCount };
  }

  // Helper getters
  public getProjects(): Project[] {
    return Object.values(this.state.records).filter(
      (r): r is Project => r.kind === 'project' && !r.deletedAt
    );
  }

  public getProjectTasks(projectId: string): any[] {
    return Object.values(this.state.records).filter(
      (r: any) => r.kind === 'task' && r.projectId === projectId && !r.deletedAt
    );
  }

  public getAllTasks(): any[] {
    return Object.values(this.state.records).filter(
      (r: any) => r.kind === 'task' && !r.deletedAt
    );
  }

  public getInteractiveGuides(): InteractiveGuide[] {
    return Object.values(this.state.records).filter(
      (r): r is InteractiveGuide => r.kind === 'interactive_guide' && !r.deletedAt
    );
  }

  public getTrashItems(): AnyRecord[] {
    return Object.values(this.state.records).filter((r) => !!r.deletedAt);
  }
}

export const store = new Store();
