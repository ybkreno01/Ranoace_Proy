import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Copy,
  Download,
  RotateCcw,
  Maximize2,
  Minimize2,
  ExternalLink,
  Sparkles,
  Layers,
  FileCode,
  Tag,
  Check,
  FileJson,
} from 'lucide-react';
import { InteractiveGuide, CatalogItem } from '../types';
import { store } from '../services/store';
import { exportSingleItemAsJson } from '../services/singleItemTransfer';

interface InteractiveGuideViewerProps {
  guide: InteractiveGuide;
  onBack: () => void;
  onEdit: (guide: InteractiveGuide) => void;
  onDelete: (guide: InteractiveGuide) => void;
  brand?: CatalogItem | null;
}

export const InteractiveGuideViewer: React.FC<InteractiveGuideViewerProps> = ({
  guide,
  onBack,
  onEdit,
  onDelete,
  brand,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Reload iframe to clear current runbook state
  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
  };

  // Duplicate this guide
  const handleDuplicate = () => {
    const dup: InteractiveGuide = {
      ...guide,
      id: `interactive-guide-${Date.now()}`,
      name: `${guide.name} (Copia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.putRecord(dup);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Download HTML file
  const handleDownload = () => {
    const blob = new Blob([guide.htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${guide.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_runbook.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Open in a new window/tab
  const handleOpenInNewTab = () => {
    const blob = new Blob([guide.htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div
      className={`flex flex-col transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-white dark:bg-neutral-900 p-0 m-0'
          : 'space-y-4 max-w-7xl mx-auto p-4 sm:p-6'
      }`}
    >
      {/* Top Header & Interactive Toolbar */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            title="Volver a la biblioteca"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: brand?.color || '#10b981' }}
              />
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                {guide.name}
              </h2>
              {guide.version && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 font-semibold">
                  v{guide.version}
                </span>
              )}
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Runbook Dinámico
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-neutral-400 truncate mt-0.5">
              {guide.description || `${brand?.name || 'Segura'} · ${guide.folder || 'Alta Disponibilidad'}`}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap ml-auto">
          <button
            type="button"
            onClick={handleReload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            title="Reiniciar los valores y formulario del runbook"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            title="Descargar archivo HTML independiente"
          >
            <Download className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span className="hidden sm:inline">Descargar .html</span>
          </button>

          <button
            type="button"
            onClick={() => exportSingleItemAsJson(guide)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            title="Exportar esta guía como archivo JSON individual para respaldar o modificar"
          >
            <FileJson className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Exportar .json</span>
          </button>

          <button
            type="button"
            onClick={handleDuplicate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            title="Duplicar esta guía para crear una variación"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? '¡Duplicada!' : 'Duplicar'}</span>
          </button>

          <button
            type="button"
            onClick={() => onEdit(guide)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            title="Modificar nombre, descripción o código HTML"
          >
            <Pencil className="w-3.5 h-3.5 text-amber-500" />
            <span>Modificar</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(guide)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer border border-rose-200 dark:border-rose-900/50"
            title="Eliminar esta guía interactiva"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Eliminar</span>
          </button>

          <button
            type="button"
            onClick={handleOpenInNewTab}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Abrir en pestaña nueva"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Embedded Sandboxed IFrame Viewport */}
      <div
        className={`bg-white rounded-xl border border-slate-200 dark:border-neutral-800 overflow-hidden shadow-sm relative ${
          isFullscreen ? 'flex-1 h-[calc(100vh-65px)]' : 'h-[calc(100vh-210px)] min-h-[600px]'
        }`}
      >
        <iframe
          key={iframeKey}
          srcDoc={guide.htmlContent}
          title={guide.name}
          className="w-full h-full border-none select-text"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>
    </div>
  );
};
