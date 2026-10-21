import { getAccessToken, setCachedAccessToken } from './firebase';

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
}

const FOLDER_NAME = 'Centro de Control de Ingeniería (CCI)';

/**
 * Finds or creates the dedicated CCI folder in the user's Google Drive.
 */
export async function getOrCreateAppFolder(): Promise<{ id: string; name: string; url: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No hay sesión de Google activa o falta token de acceso a Google Drive.');
  }

  // 1. Search for existing folder
  const query = encodeURIComponent(
    `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!searchRes.ok) {
    if (searchRes.status === 401 || searchRes.status === 403) {
      await setCachedAccessToken(null);
      throw new Error(
        'La autorización de Google Drive ha expirado o requiere permisos. Por favor pulsa "Autorizar permisos de Google Drive" para reconectar.'
      );
    }
    const errorText = await searchRes.text();
    throw new Error(`Error al buscar carpeta en Google Drive: ${errorText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const folder = searchData.files[0];
    return {
      id: folder.id,
      name: folder.name,
      url: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
    };
  }

  // 2. Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Carpeta oficial para respaldos y configuración del Centro de Control de Ingeniería (CCI)',
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Error al crear carpeta en Google Drive: ${errorText}`);
  }

  const folderData = await createRes.json();
  return {
    id: folderData.id,
    name: folderData.name,
    url: `https://drive.google.com/drive/folders/${folderData.id}`,
  };
}

/**
 * Uploads a JSON backup file to the app folder in Google Drive.
 */
export async function uploadBackupToDrive(
  folderId: string,
  filename: string,
  content: object | string,
  description?: string
): Promise<DriveFileItem> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No hay sesión de Google activa.');
  }

  // Check if file already exists in the folder to update in-place (e.g. backup-latest.json)
  const existing = await findFileByNameInFolder(folderId, filename);

  const stringContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata: any = {
    name: filename,
    mimeType: 'application/json',
    description: description || 'Respaldo del Centro de Control de Ingeniería (CCI)',
  };

  if (!existing) {
    metadata.parents = [folderId];
  }

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    stringContent +
    closeDelimiter;

  const url = existing
    ? `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart&fields=id,name,mimeType,createdTime,modifiedTime,size,webViewLink`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,createdTime,modifiedTime,size,webViewLink';

  const method = existing ? 'PATCH' : 'POST';

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      await setCachedAccessToken(null);
      throw new Error(
        'La autorización de Google Drive ha expirado. Por favor pulsa "Autorizar permisos de Google Drive" para reconectar.'
      );
    }
    const errorText = await res.text();
    throw new Error(`Error al subir respaldo a Google Drive: ${errorText}`);
  }

  return await res.json();
}

/**
 * Lists all backup files in the app folder.
 */
export async function listBackupsFromDrive(folderId: string): Promise<DriveFileItem[]> {
  const token = await getAccessToken();
  if (!token) {
    return [];
  }

  const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&fields=files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      await setCachedAccessToken(null);
      return [];
    }
    const errorText = await res.text();
    throw new Error(`Error al listar respaldos de Google Drive: ${errorText}`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Finds a specific file by name in the app folder.
 */
export async function findFileByNameInFolder(
  folderId: string,
  filename: string
): Promise<DriveFileItem | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const query = encodeURIComponent(`'${folderId}' in parents and name = '${filename}' and trashed = false`);
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&fields=files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink)`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data.files && data.files.length > 0 ? data.files[0] : null;
  } catch (err) {
    console.warn('Error finding file in drive:', err);
    return null;
  }
}

/**
 * Downloads and parses the latest backup from Google Drive.
 */
export async function getLatestBackupFromDrive(folderId: string): Promise<{ file: DriveFileItem; pkg: any } | null> {
  const token = await getAccessToken();
  if (!token) return null;

  try {
    const allFiles = await listBackupsFromDrive(folderId);
    const jsonFiles = (allFiles || []).filter((f) => f.name.toLowerCase().endsWith('.json'));

    if (jsonFiles.length === 0) {
      // Try direct search for backup-latest.json
      const fallbackTarget = await findFileByNameInFolder(folderId, 'backup-latest.json');
      if (!fallbackTarget) return null;
      const raw = await downloadFileFromDrive(fallbackTarget.id);
      return { file: fallbackTarget, pkg: JSON.parse(raw) };
    }

    // Sort files by modifiedTime or createdTime descending
    jsonFiles.sort((a, b) => {
      const timeA = new Date(a.modifiedTime || a.createdTime || 0).getTime();
      const timeB = new Date(b.modifiedTime || b.createdTime || 0).getTime();
      return timeB - timeA;
    });

    const latestNamed = jsonFiles.find((f) => f.name === 'backup-latest.json');
    let target = latestNamed || jsonFiles[0];

    // If the top json file has a newer timestamp than backup-latest.json by more than 5 seconds, use the newer one
    if (latestNamed && jsonFiles[0] && jsonFiles[0].id !== latestNamed.id) {
      const topTime = new Date(jsonFiles[0].modifiedTime || jsonFiles[0].createdTime || 0).getTime();
      const latestTime = new Date(latestNamed.modifiedTime || latestNamed.createdTime || 0).getTime();
      if (topTime > latestTime + 5000) {
        target = jsonFiles[0];
      }
    }

    const raw = await downloadFileFromDrive(target.id);
    const pkg = JSON.parse(raw);
    return { file: target, pkg };
  } catch (err) {
    console.warn('Error fetching latest backup from Google Drive:', err);
    // Se propaga: un error de lectura NO equivale a "no hay respaldo" (evita sobrescribir el respaldo real con datos locales).
    throw err;
  }
}

/**
 * Downloads a file content from Google Drive by ID.
 */
export async function downloadFileFromDrive(fileId: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No hay sesión de Google activa.');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error al descargar archivo de Google Drive: ${errorText}`);
  }

  return await res.text();
}

/**
 * Subfolder name for photos, screenshots, and evidence in Google Drive
 */
const PHOTOS_FOLDER_NAME = 'Fotos y Evidencias';

/**
 * Finds or creates the 'Fotos y Evidencias' folder in the user's Drive.
 */
export async function getOrCreatePhotosFolder(parentFolderId: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error('No hay sesión de Google activa');

  const query = encodeURIComponent(
    `'${parentFolderId}' in parents and name = '${PHOTOS_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // Create subfolder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: PHOTOS_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Error al crear subcarpeta de fotos en Google Drive: ${errText}`);
  }

  const created = await createRes.json();
  return created.id;
}

/**
 * Cache for blob object URLs loaded from Google Drive
 */
const driveBlobUrlCache = new Map<string, string>();

/**
 * Gets an authenticated blob object URL for a Google Drive file ID.
 */
export async function getDriveImageBlobUrl(fileId: string): Promise<string> {
  if (driveBlobUrlCache.has(fileId)) {
    return driveBlobUrlCache.get(fileId)!;
  }

  const token = await getAccessToken();
  if (!token) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
  }

  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      driveBlobUrlCache.set(fileId, objUrl);
      return objUrl;
    }
  } catch (err) {
    console.warn('[GoogleDrive] Fallback thumbnail for image:', err);
  }

  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
}

/**
 * Uploads an image file or blob directly to Google Drive 'Fotos y Evidencias' folder.
 * Returns the file ID, Google Drive thumbnail/view link, and gdrive protocol URL.
 */
let cachedPhotosFolderId: string | null = null;

export async function uploadImageToDrive(
  fileOrBlob: File | Blob,
  customFilename?: string
): Promise<{
  id: string;
  name: string;
  gdriveUrl: string;
  webViewLink?: string;
  thumbnailLink?: string;
}> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No hay sesión de Google activa para subir a Google Drive.');
  }

  if (!cachedPhotosFolderId) {
    const appFolder = await getOrCreateAppFolder();
    cachedPhotosFolderId = await getOrCreatePhotosFolder(appFolder.id);
  }
  const photosFolderId = cachedPhotosFolderId;

  const timestamp = Date.now();
  const mimeType = fileOrBlob.type || 'image/png';
  const ext = mimeType.split('/')[1] || 'png';
  const filename =
    customFilename ||
    (fileOrBlob instanceof File && fileOrBlob.name) ||
    `foto_${timestamp}.${ext}`;

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadata = {
    name: filename,
    parents: [photosFolderId],
    mimeType: mimeType,
    description: 'Fotografía / Evidencia gráfica de Centro de Control de Ingeniería',
  };

  const buffer = await fileOrBlob.arrayBuffer();

  const metadataPart = new Blob([JSON.stringify(metadata)], { type: 'application/json; charset=UTF-8' });
  const multipartBlob = new Blob([
    delimiter,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    metadataPart,
    delimiter,
    `Content-Type: ${mimeType}\r\n\r\n`,
    buffer,
    closeDelimiter,
  ]);

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,thumbnailLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBlob,
    }
  );

  if (!res.ok) {
    if (res.status === 404) cachedPhotosFolderId = null;
    if (res.status === 401 || res.status === 403) {
      await setCachedAccessToken(null);
      throw new Error('La autorización de Google Drive ha expirado. Por favor reconecta.');
    }
    const errText = await res.text();
    throw new Error(`Error al subir imagen a Google Drive: ${errText}`);
  }

  const uploadedFile = await res.json();

  // Pre-cache object URL for instant local render without refetch
  const objUrl = URL.createObjectURL(fileOrBlob);
  driveBlobUrlCache.set(uploadedFile.id, objUrl);

  return {
    id: uploadedFile.id,
    name: uploadedFile.name,
    gdriveUrl: `gdrive://${uploadedFile.id}`,
    webViewLink: uploadedFile.webViewLink,
    thumbnailLink: uploadedFile.thumbnailLink || `https://drive.google.com/thumbnail?id=${uploadedFile.id}&sz=w1600`,
  };
}

/**
 * Lists all photos in the 'Fotos y Evidencias' folder.
 */
export async function listPhotosFromDrive(parentFolderId?: string): Promise<DriveFileItem[]> {
  const token = await getAccessToken();
  if (!token) return [];

  const baseFolder = parentFolderId ? { id: parentFolderId } : await getOrCreateAppFolder();
  const photosFolderId = await getOrCreatePhotosFolder(baseFolder.id);

  const query = encodeURIComponent(`'${photosFolderId}' in parents and trashed = false`);
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=createdTime desc&fields=files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink,thumbnailLink)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) return [];
  const data = await res.json();
  return data.files || [];
}

/**
 * Deletes a file in Google Drive. Requires prior explicit user confirmation in UI.
 */
export async function deleteFileFromDrive(fileId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No hay sesión de Google activa.');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Error al eliminar archivo de Google Drive: ${errorText}`);
  }
}

