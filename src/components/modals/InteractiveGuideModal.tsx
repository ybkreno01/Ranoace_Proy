import React, { useState, useEffect } from 'react';
import {
  X,
  FileCode,
  Upload,
  Sparkles,
  Eye,
  Check,
  AlertCircle,
  Code2,
  Folder,
  Tag,
  Bookmark,
  FileJson,
  Download,
} from 'lucide-react';
import { store } from '../../services/store';
import { InteractiveGuide, CatalogItem } from '../../types';
import { SEGURA_CLUSTER_HTML } from '../../data/seguraClusterInteractiveGuide';
import { parseSingleItemJson, exportSingleItemAsJson } from '../../services/singleItemTransfer';

interface InteractiveGuideModalProps {
  isOpen: boolean;
  guide?: InteractiveGuide | null;
  onClose: () => void;
  onSaved?: (guide: InteractiveGuide) => void;
}

export const InteractiveGuideModal: React.FC<InteractiveGuideModalProps> = ({
  isOpen,
  guide,
  onClose,
  onSaved,
}) => {
  const state = store.getState();
  const brands = Object.values(state.records).filter(
    (r): r is CatalogItem => r.kind === 'brand' && !r.deletedAt
  );

  const [name, setName] = useState('');
  const [version, setVersion] = useState('1.0');
  const [brandId, setBrandId] = useState('brand-segura');
  const [folder, setFolder] = useState('Alta Disponibilidad / Clúster');
  const [description, setDescription] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'editor' | 'preview'>('editor');

  useEffect(() => {
    if (guide) {
      setName(guide.name || '');
      setVersion(guide.version || '1.0');
      setBrandId(guide.brandId || 'brand-segura');
      setFolder(guide.folder || 'Alta Disponibilidad / Clúster');
      setDescription(guide.description || '');
      setHtmlContent(guide.htmlContent || '');
      setError(null);
    } else {
      // Default new guide
      setName('');
      setVersion('1.0');
      setBrandId(brands[0]?.id || 'brand-segura');
      setFolder('Alta Disponibilidad / Clúster');
      setDescription('');
      setHtmlContent('');
      setError(null);
    }
    setActiveSubTab('editor');
  }, [guide, isOpen]);

  if (!isOpen) return null;

  // Handle uploading an HTML or JSON file from local disk
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      // Check if it's a JSON export of an interactive guide
      if (file.name.endsWith('.json') || content.trim().startsWith('{')) {
        const parsed = parseSingleItemJson(content);
        if (parsed.isValid && parsed.item) {
          setName(parsed.name || '');
          if (parsed.item.version) setVersion(parsed.item.version);
          if (parsed.item.brandId) setBrandId(parsed.item.brandId);
          if (parsed.item.folder) setFolder(parsed.item.folder);
          if (parsed.item.description) setDescription(parsed.item.description);
          if (parsed.item.htmlContent) setHtmlContent(parsed.item.htmlContent);
          return;
        }
      }

      // Default HTML handling
      setHtmlContent(content);

      // Try extracting <title> from HTML if name is empty
      const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && (!name || name === '')) {
        setName(titleMatch[1].trim());
      }

      // Try extracting brand if "segura" appears in HTML
      if (content.toLowerCase().includes('segura')) {
        const segBrand = brands.find((b) => b.name.toLowerCase().includes('segura'));
        if (segBrand) setBrandId(segBrand.id);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Quick preset: Load Segura Cluster example
  const handleLoadSeguraExample = () => {
    setName('Constructor de Clúster Segura');
    setVersion('2.0');
    setBrandId('brand-segura');
    setFolder('Alta Disponibilidad / Clúster');
    setDescription(
      'Segura® PAM On-Premises · runbook de alta disponibilidad, nodo por nodo con generador de comandos y matriz de pruebas dinámicas.'
    );
    setHtmlContent(SEGURA_CLUSTER_HTML);
  };

  const handleSave = () => {
    if (!name.trim()) {
      setError('Por favor ingresa un nombre para la guía interactiva.');
      return;
    }
    if (!htmlContent.trim()) {
      setError('El contenido HTML de la guía no puede estar vacío.');
      return;
    }

    const now = new Date().toISOString();
    const guideId = guide?.id || `interactive-guide-${Date.now()}`;

    const newGuide: InteractiveGuide = {
      id: guideId,
      kind: 'interactive_guide',
      name: name.trim(),
      version: version.trim() || '1.0',
      brandId,
      folder: folder.trim() || 'General',
      description: description.trim(),
      htmlContent,
      fav: guide?.fav || false,
      tags: guide?.tags || ['tag-pam'],
      createdAt: guide?.createdAt || now,
      updatedAt: now,
    };

    store.putRecord(newGuide);

    if (onSaved) {
      onSaved(newGuide);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between bg-slate-50/60 dark:bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400 flex items-center justify-center">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {guide ? 'Modificar Guía Interactiva' : 'Importar / Crear Guía Interactiva'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Runbook dinámico con campos interactivos y generador de comandos en tiempo real
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-400 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Preset Action */}
          {!guide && (
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                <div>
                  <span className="font-bold text-blue-900 dark:text-cyan-200 block">
                    Ejemplo disponible: Constructor de Clúster Segura
                  </span>
                  <span className="text-[11px] text-blue-700 dark:text-cyan-300">
                    Carga el runbook interactivo de alta disponibilidad Segura® PAM con 1 clic.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLoadSeguraExample}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors shrink-0 shadow-2xs cursor-pointer"
              >
                Cargar Plantilla Segura
              </button>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                Nombre de la Guía Interactiva *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Constructor de Clúster Segura"
                className="w-full bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                Versión
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="2.0"
                className="w-full bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                Marca / Tecnología
              </label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 cursor-pointer"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                Carpeta / Categoría
              </label>
              <input
                type="text"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="Ej. Alta Disponibilidad / Clúster"
                className="w-full bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 dark:text-neutral-300 block mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Runbook de alta disponibilidad con topología dinámica"
                className="w-full bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>

          {/* HTML Source & Subtabs (Editor vs Preview) */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-neutral-800 pb-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-800 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('editor')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors cursor-pointer ${
                    activeSubTab === 'editor'
                      ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-cyan-400 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-neutral-400'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Código HTML / JS</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSubTab('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors cursor-pointer ${
                    activeSubTab === 'preview'
                      ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-cyan-400 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-neutral-400'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Vista Previa Interactiva</span>
                </button>
              </div>

              {/* Upload File Button */}
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-neutral-200 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                  <span>Cargar Archivo (.html o .json)</span>
                  <input
                    type="file"
                    accept=".html,.htm,.json,text/html,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {activeSubTab === 'editor' ? (
              <div className="space-y-1">
                <textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  placeholder="<!doctype html><html>... Código completo HTML, CSS y JavaScript del runbook interactivo..."
                  rows={12}
                  className="w-full bg-slate-900 text-slate-100 font-mono text-xs rounded-xl p-3 border border-slate-700 focus:outline-hidden focus:border-blue-500 leading-relaxed resize-y select-text"
                />
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  El código HTML se ejecuta encapsulado de forma segura en un entorno interactivo independiente.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden h-[400px] bg-white">
                {htmlContent ? (
                  <iframe
                    srcDoc={htmlContent}
                    title="Vista previa de guía interactiva"
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    No hay contenido HTML cargado para previsualizar.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between bg-slate-50/60 dark:bg-neutral-950/60">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            {guide && (
              <button
                type="button"
                onClick={() => exportSingleItemAsJson(guide)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 rounded-lg border border-slate-200 dark:border-neutral-700 transition-colors cursor-pointer shadow-2xs"
                title="Exportar esta guía como archivo JSON individual"
              >
                <Download className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                <span>Exportar JSON</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{guide ? 'Guardar Cambios' : 'Importar y Guardar Guía'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
