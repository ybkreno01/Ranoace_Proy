import { uploadImageToDrive } from './googleDrive';
import { AnyRecord } from '../types';

/**
 * Migración de imágenes incrustadas (data:image/...;base64) a Google Drive.
 *
 * Las fotos viven en la carpeta "Fotos y Evidencias" de Drive y el registro solo guarda
 * la referencia `gdrive://{ID}`, de modo que no ocupan localStorage, Firestore ni el
 * respaldo JSON. Solo se tocan campos cuyo valor completo es un data URL (por ejemplo,
 * `GuideBlock.path` de los bloques de imagen). El HTML enriquecido no se modifica.
 */

const MIGRATABLE_KINDS = new Set(['guide', 'pguide', 'demo', 'script', 'trouble']);
const MIN_DATA_URL_LENGTH = 20000; // ignora íconos pequeños
const DATA_URL_RE = /^data:image\/[a-zA-Z0-9.+-]+;base64,/;

export function isMigratableRecord(rec: AnyRecord | undefined | null): boolean {
  return !!rec && MIGRATABLE_KINDS.has(rec.kind) && !(rec as any).deletedAt;
}

const isEmbedded = (v: unknown): v is string =>
  typeof v === 'string' && v.length >= MIN_DATA_URL_LENGTH && DATA_URL_RE.test(v);

function collect(value: any, out: string[]): void {
  if (Array.isArray(value)) {
    for (const v of value) collect(v, out);
  } else if (value && typeof value === 'object') {
    for (const k of Object.keys(value)) {
      const v = value[k];
      if (isEmbedded(v)) out.push(v);
      else collect(v, out);
    }
  }
}

/** Lista de imágenes incrustadas (data URLs) de un registro. */
export function findEmbeddedImages(rec: AnyRecord): string[] {
  if (!isMigratableRecord(rec)) return [];
  const out: string[] = [];
  collect(rec, out);
  return out;
}

/** Devuelve una copia del registro con los data URLs sustituidos según el mapa. */
export function replaceEmbeddedImages(rec: AnyRecord, map: Map<string, string>): { record: AnyRecord; replaced: number } {
  let replaced = 0;
  const walk = (value: any): any => {
    if (Array.isArray(value)) return value.map(walk);
    if (value && typeof value === 'object') {
      const copy: any = {};
      for (const k of Object.keys(value)) {
        const v = value[k];
        if (isEmbedded(v) && map.has(v)) {
          copy[k] = map.get(v);
          replaced++;
        } else {
          copy[k] = walk(v);
        }
      }
      return copy;
    }
    return value;
  };
  const record = walk(rec) as AnyRecord;
  return { record: replaced > 0 ? record : rec, replaced };
}

async function sha256(text: string): Promise<string> {
  try {
    const buf = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return `${text.length}:${text.slice(-64)}`;
  }
}

function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  const meta = dataUrl.slice(5, comma); // image/png;base64
  const mime = meta.split(';')[0] || 'image/png';
  const bin = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Sube a Drive las imágenes únicas indicadas y devuelve el mapa dataURL → gdrive://ID.
 * Las imágenes repetidas (misma foto en la guía maestra y en copias de proyecto) se suben una vez.
 */
export async function uploadEmbeddedImages(
  dataUrls: string[],
  cache: Map<string, string>,
  onEach?: () => void
): Promise<{ map: Map<string, string>; failed: number; authError: boolean }> {
  const map = new Map<string, string>();
  let failed = 0;
  let authError = false;
  const byHash = new Map<string, string>();
  for (const url of dataUrls) {
    if (map.has(url)) continue;
    const h = await sha256(url);
    const known = cache.get(h) || byHash.get(h);
    if (known) {
      map.set(url, known);
      onEach?.();
      continue;
    }
    try {
      const blob = dataUrlToBlob(url);
      const ext = (blob.type.split('/')[1] || 'png').replace('jpeg', 'jpg');
      const up = await uploadImageToDrive(blob, `guia_${Date.now()}_${h.slice(0, 8)}.${ext}`);
      if (!up || !up.gdriveUrl) throw new Error('Respuesta de Drive sin identificador');
      cache.set(h, up.gdriveUrl);
      byHash.set(h, up.gdriveUrl);
      map.set(url, up.gdriveUrl);
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      if (/expirado|requiere permisos|sesión de Google/i.test(msg)) {
        authError = true;
        break;
      }
      console.warn('[Fotos→Drive] No se pudo subir una imagen:', msg);
    }
    onEach?.();
  }
  return { map, failed, authError };
}
