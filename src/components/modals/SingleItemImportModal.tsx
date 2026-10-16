import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Copy,
  BookOpen,
  Terminal,
  AlertCircle,
  FolderKanban,
  Sparkles,
  ArrowRight,
  Eye,
} from 'lucide-react';
import {
  parseSingleItemJson,
  commitSingleItemImport,
  ParsedSingleItem,
} from '../../services/singleItemTransfer';

interface SingleItemImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFilterKind?: 'guide' | 'interactive_guide' | 'script' | 'trouble' | 'project';
  onItemImported?: (result: { kind: string; id: string; name: string }) => void;
}

export const SingleItemImportModal: React.FC<SingleItemImportModalProps> = ({
  isOpen,
  onClose,
  defaultFilterKind,
  onItemImported,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedSingleItem | null>(null);
  const [asCopy, setAsCopy] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) readFile(file);
  };

  const readFile = (file: File) => {
    setImportSuccess(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = parseSingleItemJson(text);
      setParsed(res);
    };
    reader.readAsText(file);
  };

  const handleImport = (openAfterImport: boolean = false) => {
    if (!parsed || !parsed.isValid) return;

    try {
      const outcome = commitSingleItemImport(parsed, { asCopy });
      setImportSuccess(`"${parsed.name}" importado con éxito (${outcome.count} registro${outcome.count > 1 ? 's' : ''}).`);

      if (onItemImported) {
        onItemImported({
          kind: outcome.kind,
          id: outcome.importedId,
          name: parsed.name,
        });
      }

      setTimeout(() => {
        onClose();
        setParsed(null);
        setImportSuccess(null);
      }, 1200);
    } catch (err: any) {
      alert(`Error al importar: ${err?.message || 'Error desconocido'}`);
    }
  };

  const getIconForKind = (kind: string) => {
    switch (kind) {
      case 'interactive_guide':
        return <Sparkles className="w-5 h-5 text-emerald-500" />;
      case 'guide':
        return <BookOpen className="w-5 h-5 text-amber-500" />;
      case 'script':
        return <Terminal className="w-5 h-5 text-violet-500" />;
      case 'trouble':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'project':
        return <FolderKanban className="w-5 h-5 text-blue-500" />;
      default:
        return <FileJson className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-cyan-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Importar Elemento Individual (JSON)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                Carga una guía, script, troubleshooting o proyecto específico sin alterar el resto
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {importSuccess ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">{importSuccess}</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Actualizando vistas y base de datos...</p>
            </div>
          ) : !parsed ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors text-center ${
                dragOver
                  ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-slate-300 dark:border-neutral-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-neutral-800/30'
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-neutral-800 flex items-center justify-center text-blue-600 dark:text-cyan-400">
                <FileJson className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-800 dark:text-neutral-200">
                  Arrastra tu archivo JSON individual aquí o haz clic para examinar
                </p>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Formatos compatibles: Guía Técnica, Guía Interactiva, Script, Troubleshooting o Proyecto (*.json)
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : !parsed.isValid ? (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-semibold">
                <AlertTriangle className="w-4 h-4" />
                <span>Archivo no válido</span>
              </div>
              <p className="text-[11px] text-rose-600 dark:text-rose-400">{parsed.error}</p>
              <button
                onClick={() => setParsed(null)}
                className="px-3 py-1 bg-white dark:bg-neutral-800 border border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-semibold"
              >
                Elegir otro archivo
              </button>
            </div>
          ) : (
            /* Parsed item preview & confirmation */
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-700/80 rounded-xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700">
                      {getIconForKind(parsed.kind)}
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-cyan-300 mb-1">
                        {parsed.kindLabel}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {parsed.name}
                      </h4>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 dark:text-neutral-500">
                    {parsed.records.length} reg.
                  </span>
                </div>

                {parsed.item?.description && (
                  <p className="text-[11px] text-slate-600 dark:text-neutral-400 line-clamp-2">
                    {parsed.item.description}
                  </p>
                )}

                {/* Key metadata grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-neutral-700 text-[11px] text-slate-600 dark:text-neutral-400">
                  <div>
                    <span className="font-medium text-slate-500 dark:text-neutral-500 block">ID Original:</span>
                    <span className="font-mono truncate block">{parsed.id}</span>
                  </div>
                  {parsed.item?.version && (
                    <div>
                      <span className="font-medium text-slate-500 dark:text-neutral-500 block">Versión:</span>
                      <span>v{parsed.item.version}</span>
                    </div>
                  )}
                  {parsed.item?.folder && (
                    <div>
                      <span className="font-medium text-slate-500 dark:text-neutral-500 block">Carpeta:</span>
                      <span>{parsed.item.folder}</span>
                    </div>
                  )}
                  {parsed.item?.env && (
                    <div>
                      <span className="font-medium text-slate-500 dark:text-neutral-500 block">Entorno:</span>
                      <span>{parsed.item.env}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Import Options: Replace vs Duplicate */}
              <div className="p-3 bg-slate-50 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-700/60 rounded-xl space-y-2">
                <span className="font-semibold text-slate-800 dark:text-neutral-200 block text-[11px]">
                  Modo de importación:
                </span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    checked={!asCopy}
                    onChange={() => setAsCopy(false)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-neutral-300">
                    Actualizar / Reemplazar registro si ya existe con este ID
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    checked={asCopy}
                    onChange={() => setAsCopy(true)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-slate-700 dark:text-neutral-300">
                    Crear como nueva copia independiente (Generar nuevos IDs)
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-neutral-900/80 border-t border-slate-200 dark:border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (parsed) setParsed(null);
              else onClose();
            }}
            className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            {parsed ? 'Cambiar archivo' : 'Cancelar'}
          </button>

          {parsed && parsed.isValid && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleImport(false)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs cursor-pointer"
              >
                <span>Importar a la aplicación</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
