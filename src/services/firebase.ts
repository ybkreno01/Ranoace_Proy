import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  writeBatch,
  getDocFromServer,
  getDoc,
  getDocsFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AnyRecord } from '../types';

export enum OperationType {
  CREATE = 'create',
  READ = 'read',
  WRITE = 'write',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
}

export interface FirestoreErrorInfo {
  error: string;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      email: string | null;
    }[];
  };
  operationType: OperationType;
  path: string | null;
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

// Google Auth Provider with Google Drive scope
export const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory access token cache for Workspace APIs (never stored in localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// --- Renovación del permiso de Drive ---------------------------------------------------------
// El token OAuth que entrega Firebase dura 1 h y no se renueva solo. Google Identity Services
// (GIS) emite uno nuevo sin pedir datos (prompt vacío) si la cuenta ya autorizó drive.file.
// requestAccessToken abre una ventana emergente, así que solo se llama dentro de un clic del
// usuario (si no, el navegador la bloquea): installDriveTokenKeeper lo hace al primer clic
// cuando el token vence en menos de 10 min.
const TOKEN_KEY = 'cci_gdrive_access_token';
const TOKEN_EXP_KEY = 'cci_gdrive_token_exp';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const REFRESH_MARGIN_MS = 10 * 60 * 1000;
let gisTokenClient: any = null;
let gisLoading: Promise<void> | null = null;
let refreshInFlight = false;
let lastRefreshAttempt = 0;
const tokenListeners = new Set<() => void>();

function readTokenExpiry(): number {
  try {
    return Number(localStorage.getItem(TOKEN_EXP_KEY)) || 0;
  } catch {
    return 0;
  }
}

function storeToken(token: string, expiresInSec: number) {
  cachedAccessToken = token;
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXP_KEY, String(Date.now() + expiresInSec * 1000));
  } catch {}
}

function loadGis(): Promise<void> {
  if ((window as any).google?.accounts?.oauth2) return Promise.resolve();
  if (gisLoading) return gisLoading;
  gisLoading = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      gisLoading = null;
      reject(new Error('No se pudo cargar Google Identity Services'));
    };
    document.head.appendChild(s);
  });
  return gisLoading;
}

/** Prepara el cliente GIS por adelantado para poder pedir el token de forma síncrona en un gesto. */
export async function prepareDriveTokenClient(): Promise<void> {
  const clientId = (firebaseConfig as any).oAuthClientId;
  if (!clientId || gisTokenClient) return;
  await loadGis();
  gisTokenClient = (window as any).google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: DRIVE_SCOPE,
    callback: (resp: any) => {
      refreshInFlight = false;
      if (resp?.access_token) {
        storeToken(resp.access_token, Number(resp.expires_in) || 3600);
        tokenListeners.forEach((fn) => fn());
      }
    },
    error_callback: () => {
      refreshInFlight = false;
    },
  });
}

/** True si hay sesión de Google y el permiso de Drive falta o vence pronto. */
export function driveTokenNeedsRefresh(): boolean {
  if (!auth.currentUser) return false;
  if (!cachedAccessToken && !localStorage.getItem(TOKEN_KEY)) return true;
  return readTokenExpiry() - Date.now() < REFRESH_MARGIN_MS;
}

/** Pide un token nuevo sin consentimiento. Debe llamarse dentro de un gesto del usuario. */
export function refreshDriveTokenFromGesture(): boolean {
  if (!gisTokenClient || refreshInFlight || isSigningIn) return false;
  if (Date.now() - lastRefreshAttempt < 60 * 1000) return false;
  refreshInFlight = true;
  lastRefreshAttempt = Date.now();
  gisTokenClient.requestAccessToken({ prompt: '', hint: auth.currentUser?.email || undefined });
  return true;
}

/** Se ejecuta cada vez que se obtiene un token nuevo de Drive. */
export function onDriveTokenRefreshed(fn: () => void): () => void {
  tokenListeners.add(fn);
  return () => tokenListeners.delete(fn);
}

/** Renueva el permiso de Drive en el primer clic cuando está por vencer (no en teclas: la ventana quitaría el foco al escribir). */
export function installDriveTokenKeeper(): () => void {
  const handler = () => {
    if (driveTokenNeedsRefresh()) refreshDriveTokenFromGesture();
  };
  window.addEventListener('pointerdown', handler, true);
  return () => window.removeEventListener('pointerdown', handler, true);
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid,
      email: currentUser?.email,
      emailVerified: currentUser?.emailVerified,
      isAnonymous: currentUser?.isAnonymous,
      tenantId: currentUser?.tenantId,
      providerInfo:
        currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.');
    }
    return false;
  }
}

// Sign-in with Google and obtain Google Drive OAuth token
export async function googleSignIn(forceConsent = false): Promise<{ user: User; accessToken: string } | null> {
  try {
    isSigningIn = true;
    if (forceConsent) {
      provider.setCustomParameters({ prompt: 'consent', access_type: 'offline' });
    } else {
      provider.setCustomParameters({});
    }
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google');
    }
    // El token de Firebase dura 1 h; se registra con margen para renovarlo antes.
    storeToken(credential.accessToken, 55 * 60);
    prepareDriveTokenClient().catch((e) => console.warn('GIS:', e));
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

export async function getAccessToken(): Promise<string | null> {
  if (cachedAccessToken) return cachedAccessToken;
  try {
    const saved =
      sessionStorage.getItem('cci_gdrive_access_token') ||
      localStorage.getItem('cci_gdrive_access_token');
    if (saved) {
      cachedAccessToken = saved;
      return saved;
    }
  } catch {}
  return null;
}

export async function setCachedAccessToken(token: string | null) {
  cachedAccessToken = token;
  try {
    if (token) {
      sessionStorage.setItem('cci_gdrive_access_token', token);
      localStorage.setItem('cci_gdrive_access_token', token);
    } else {
      sessionStorage.removeItem('cci_gdrive_access_token');
      localStorage.removeItem('cci_gdrive_access_token');
      localStorage.removeItem(TOKEN_EXP_KEY);
    }
  } catch {}
}

export async function logOut(): Promise<void> {
  await signOut(auth);
  await setCachedAccessToken(null);
}

export function subscribeToAuth(callback: (user: User | null, token: string | null) => void) {
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      setCachedAccessToken(null);
    } else {
      prepareDriveTokenClient().catch((e) => console.warn('GIS:', e));
    }
    callback(user, cachedAccessToken);
  });
}

// Max chunk size in characters (~500 KB, safely below Firestore's 1,048,576 byte limit)
const MAX_CHUNK_SIZE = 500000;

// Reensambla los documentos (incluidos los fragmentados) de una consulta a Firestore
function assembleRecords(snapshot: any): Record<string, AnyRecord> {
  const recordsMap: Record<string, AnyRecord> = {};
  const chunkParts: Record<string, Record<number, string>> = {};
  const chunkedHeaders: Record<string, any> = {};

  snapshot.forEach((docSnap: any) => {
    const raw = docSnap.data();
    if (!raw) return;

    // Is this a chunk part?
    if (raw.isChunkPart && raw.parentId) {
      if (!chunkParts[raw.parentId]) {
        chunkParts[raw.parentId] = {};
      }
      chunkParts[raw.parentId][raw.index] = raw.chunkData || '';
      return;
    }

    // Is this a chunked main header?
    if (raw.isChunked) {
      chunkedHeaders[raw.id] = raw;
      return;
    }

    // Regular document
    if (raw.data) {
      try {
        const parsed = JSON.parse(raw.data);
        recordsMap[parsed.id] = parsed;
      } catch (e) {
        console.error('Failed to parse doc data', e);
      }
    }
  });

  // Reassemble chunked documents
  Object.entries(chunkedHeaders).forEach(([id, header]) => {
    const parts = chunkParts[id];
    if (parts) {
      const totalChunks = header.totalChunks || 0;
      let assembled = '';
      let complete = true;
      for (let i = 0; i < totalChunks; i++) {
        if (parts[i] === undefined) {
          complete = false;
          break;
        }
        assembled += parts[i];
      }

      if (complete && assembled) {
        try {
          const parsed = JSON.parse(assembled);
          recordsMap[id] = parsed;
        } catch (e) {
          console.error(`Failed to reassemble chunked doc ${id}`, e);
        }
      }
    }
  });

  return recordsMap;
}

/** Lectura única desde el servidor (ignora la caché local); la usa el botón "Guardar ahora". */
export async function fetchUserRecordsOnce(userId: string): Promise<Record<string, AnyRecord>> {
  const snap = await getDocsFromServer(collection(db, 'users', userId, 'records'));
  return assembleRecords(snap);
}

// Firestore operations for user records with chunking support for large documents
export function subscribeToUserRecords(
  userId: string,
  onRecords: (records: Record<string, AnyRecord>) => void,
  onError?: (err: any) => void
) {
  const collectionPath = `users/${userId}/records`;
  const recordsRef = collection(db, 'users', userId, 'records');

  return onSnapshot(
    recordsRef,
    (snapshot) => {
      onRecords(assembleRecords(snapshot));
    },
    (error) => {
      // No relanzar: una excepción dentro del callback de onSnapshot queda sin capturar.
      console.error('Firestore listener error', collectionPath, error);
      if (onError) onError(error);
    }
  );
}

export async function saveRecordToFirestore(userId: string, record: AnyRecord): Promise<void> {
  const path = `users/${userId}/records/${record.id}`;
  try {
    const rawData = JSON.stringify(record);

    if (rawData.length > MAX_CHUNK_SIZE) {
      // Document exceeds safe size: chunk it!
      await saveChunkedRecord(userId, record, rawData);
    } else {
      const docRef = doc(db, 'users', userId, 'records', record.id);
      const payload = {
        id: record.id,
        kind: record.kind,
        userId,
        isChunked: false,
        data: rawData,
        updatedAt: record.updatedAt || new Date().toISOString(),
        createdAt: (record as any).createdAt || new Date().toISOString(),
      };
      await setDoc(docRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Saves a large record by splitting it into multiple chunk documents
async function saveChunkedRecord(userId: string, record: AnyRecord, rawData: string) {
  const totalChunks = Math.ceil(rawData.length / MAX_CHUNK_SIZE);
  const batch = writeBatch(db);

  // 1. Write chunk part documents
  for (let i = 0; i < totalChunks; i++) {
    const chunkStr = rawData.slice(i * MAX_CHUNK_SIZE, (i + 1) * MAX_CHUNK_SIZE);
    const chunkDocRef = doc(db, 'users', userId, 'records', `${record.id}__c${i}`);
    batch.set(chunkDocRef, {
      id: `${record.id}__c${i}`,
      isChunkPart: true,
      parentId: record.id,
      index: i,
      chunkData: chunkStr,
      userId,
      updatedAt: record.updatedAt || new Date().toISOString(),
    });
  }

  // 2. Write main header document
  const mainDocRef = doc(db, 'users', userId, 'records', record.id);
  batch.set(mainDocRef, {
    id: record.id,
    kind: record.kind,
    userId,
    isChunked: true,
    totalChunks,
    updatedAt: record.updatedAt || new Date().toISOString(),
    createdAt: (record as any).createdAt || new Date().toISOString(),
  });

  await batch.commit();
}

export async function saveBatchRecordsToFirestore(
  userId: string,
  records: AnyRecord[]
): Promise<void> {
  if (records.length === 0) return;

  // Process in small sub-batches to adhere to Firestore write limits
  const BATCH_SIZE = 25;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const slice = records.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    const chunkedToSaveLater: { record: AnyRecord; data: string }[] = [];
    let hasRegularOps = false;

    for (const record of slice) {
      const rawData = JSON.stringify(record);

      if (rawData.length > MAX_CHUNK_SIZE) {
        chunkedToSaveLater.push({ record, data: rawData });
      } else {
        const docRef = doc(db, 'users', userId, 'records', record.id);
        batch.set(docRef, {
          id: record.id,
          kind: record.kind,
          userId,
          isChunked: false,
          data: rawData,
          updatedAt: record.updatedAt || new Date().toISOString(),
          createdAt: (record as any).createdAt || new Date().toISOString(),
        });
        hasRegularOps = true;
      }
    }

    if (hasRegularOps) {
      try {
        await batch.commit();
      } catch (err) {
        console.error('Batch commit failed, saving documents individually...', err);
        // Fallback: save individually so that one bad record does not break the rest
        for (const record of slice) {
          const rawData = JSON.stringify(record);
          if (rawData.length <= MAX_CHUNK_SIZE) {
            try {
              await saveRecordToFirestore(userId, record);
            } catch (innerErr) {
              console.warn(`Could not save record ${record.id}:`, innerErr);
            }
          }
        }
      }
    }

    // Save any oversized records with chunking
    for (const { record, data } of chunkedToSaveLater) {
      try {
        await saveChunkedRecord(userId, record, data);
      } catch (chunkErr) {
        console.warn(`Could not save chunked record ${record.id}:`, chunkErr);
      }
    }
  }
}

export async function deleteRecordFromFirestore(userId: string, recordId: string): Promise<void> {
  const path = `users/${userId}/records/${recordId}`;
  try {
    const docRef = doc(db, 'users', userId, 'records', recordId);
    // Si es un registro fragmentado, eliminar también sus partes {id}__c{n}.
    let totalChunks = 0;
    try {
      const snap = await getDoc(docRef);
      const header = snap.exists() ? snap.data() : null;
      if (header?.isChunked && typeof header.totalChunks === 'number') {
        totalChunks = header.totalChunks;
      }
    } catch (readErr) {
      console.warn(`No se pudo leer el encabezado de ${recordId} antes de borrar:`, readErr);
    }
    if (totalChunks > 0) {
      const batch = writeBatch(db);
      for (let i = 0; i < totalChunks; i++) {
        batch.delete(doc(db, 'users', userId, 'records', `${recordId}__c${i}`));
      }
      batch.delete(docRef);
      await batch.commit();
    } else {
      await deleteDoc(docRef);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
