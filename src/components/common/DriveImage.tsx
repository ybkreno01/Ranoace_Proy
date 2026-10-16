import React, { useState, useEffect } from 'react';
import { Cloud, ExternalLink, Maximize2, X, Download } from 'lucide-react';
import { getDriveImageBlobUrl } from '../../services/googleDrive';

interface DriveImageProps {
  src?: string;
  alt?: string;
  caption?: string;
  className?: string;
  style?: React.CSSProperties;
  widthPct?: number;
  showDriveBadge?: boolean;
  driveFileId?: string;
}

export const DriveImage: React.FC<DriveImageProps> = ({
  src,
  alt = 'Fotografía / Evidencia',
  caption,
  className = '',
  style,
  widthPct = 100,
  showDriveBadge = true,
  driveFileId,
}) => {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);

  const isDrive =
    Boolean(driveFileId) ||
    Boolean(src && (src.startsWith('gdrive://') || src.includes('drive.google.com') || src.includes('googleusercontent.com')));

  // Extract file ID if applicable
  const fileId =
    driveFileId ||
    (src && src.startsWith('gdrive://') ? src.replace('gdrive://', '') : null) ||
    (src && src.includes('id=') ? new URLSearchParams(src.split('?')[1]).get('id') : null);

  useEffect(() => {
    if (!src && !fileId) {
      setResolvedSrc(null);
      return;
    }

    // If it's a gdrive:// file ID, resolve via Google Drive API
    if (fileId) {
      setIsLoading(true);
      setLoadError(false);
      getDriveImageBlobUrl(fileId)
        .then((url) => {
          setResolvedSrc(url);
          setIsLoading(false);
        })
        .catch(() => {
          // Fallback direct Google Drive thumbnail
          setResolvedSrc(`https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`);
          setIsLoading(false);
        });
      return;
    }

    // Direct url or data:image
    setResolvedSrc(src || null);
    setIsLoading(false);
  }, [src, fileId]);

  if (!src && !fileId) {
    return null;
  }

  return (
    <div className={`relative group flex flex-col items-center ${className}`} style={{ width: `${widthPct}%`, ...style }}>
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="w-full h-48 bg-slate-100 dark:bg-neutral-800 rounded-lg animate-pulse flex flex-col items-center justify-center gap-2 border border-slate-200 dark:border-neutral-700">
          <Cloud className="w-6 h-6 text-blue-500 animate-bounce" />
          <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
            Cargando foto desde Google Drive...
          </span>
        </div>
      )}

      {/* Rendered Image */}
      {resolvedSrc && !isLoading && (
        <div className="relative inline-block max-w-full">
          <img
            src={resolvedSrc}
            alt={alt}
            onError={() => setLoadError(true)}
            className="rounded-lg border border-slate-200 dark:border-neutral-800 max-h-96 w-auto object-contain shadow-xs cursor-zoom-in"
            onClick={() => setIsZoomed(true)}
          />

          {/* Drive Cloud Badge */}
          {isDrive && showDriveBadge && (
            <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-900/85 text-white backdrop-blur-xs text-[10px] font-semibold shadow-xs">
              <Cloud className="w-3 h-3 text-cyan-300" />
              <span>Consumido desde Google Drive</span>
            </div>
          )}

          {/* Overlay Quick Actions */}
          <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/70 backdrop-blur-xs rounded-lg p-1">
            <button
              type="button"
              onClick={() => setIsZoomed(true)}
              className="p-1 text-white hover:text-cyan-300 rounded cursor-pointer"
              title="Ampliar foto"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            {fileId && (
              <a
                href={`https://drive.google.com/file/d/${fileId}/view`}
                target="_blank"
                rel="noreferrer"
                className="p-1 text-white hover:text-cyan-300 rounded cursor-pointer"
                title="Ver en Google Drive"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <a
              href={resolvedSrc}
              download={alt || 'foto_drive.png'}
              className="p-1 text-white hover:text-cyan-300 rounded cursor-pointer"
              title="Descargar imagen"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Load error notice */}
      {loadError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-600 dark:text-rose-400 text-center w-full">
          No se pudo cargar la imagen desde Google Drive. Valida permisos o reconecta sesión.
        </div>
      )}

      {/* Caption */}
      {caption && (
        <span className="text-[11px] text-slate-500 dark:text-neutral-400 italic block mt-1.5 text-center">
          {caption}
        </span>
      )}

      {/* Zoom Modal */}
      {isZoomed && resolvedSrc && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setIsZoomed(false)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
              title="Cerrar vista ampliada"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={resolvedSrc}
              alt={alt}
              className="max-h-[80vh] w-auto rounded-lg shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-300">
              {caption && <span>{caption}</span>}
              {fileId && (
                <a
                  href={`https://drive.google.com/file/d/${fileId}/view`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-cyan-400 underline hover:text-cyan-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir en Google Drive</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
