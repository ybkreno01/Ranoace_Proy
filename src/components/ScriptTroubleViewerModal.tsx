import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Copy,
  Check,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Code2,
  Sliders,
  Image as ImageIcon,
  FileText,
  ListChecks,
  Plus,
  Trash2,
  Pencil,
  Upload,
  Eye,
  Edit3,
  ExternalLink,
  ChevronDown,
  FileJson,
  Download,
} from 'lucide-react';
import { Script, Trouble, ScriptBlock, ChecklistItem } from '../types';
import { store } from '../services/store';
import { uploadImageToDrive } from '../services/googleDrive';
import { getAccessToken } from '../services/firebase';
import { DriveImage } from './common/DriveImage';
import { exportSingleItemAsJson } from '../services/singleItemTransfer';

interface ScriptTroubleViewerModalProps {
  isOpen: boolean;
  item: Script | Trouble | null;
  onClose: () => void;
  onEdit?: () => void;
}

export const ScriptTroubleViewerModal: React.FC<ScriptTroubleViewerModalProps> = ({
  isOpen,
  item,
  onClose,
  onEdit,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [showParamEditor, setShowParamEditor] = useState(false);
  const [activeMode, setActiveMode] = useState<'view' | 'edit'>('view');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [addingBlockType, setAddingBlockType] = useState<
    'text' | 'command' | 'image' | 'checklist' | 'warning' | null
  >(null);

  // New block draft states
  const [draftLabel, setDraftLabel] = useState('');
  const [draftText, setDraftText] = useState('');
  const [draftCode, setDraftCode] = useState('');
  const [draftLang, setDraftLang] = useState('bash');
  const [draftImageSrc, setDraftImageSrc] = useState('');
  const [draftCaption, setDraftCaption] = useState('');
  const [draftWarningLevel, setDraftWarningLevel] = useState<'Impacto' | 'Precaución' | 'Limitación'>('Precaución');
  const [draftChecklist, setDraftChecklist] = useState<string>('');

  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Current item state synced with store
  const state = store.getState();
  const currentItem = useMemo(() => {
    if (!item) return null;
    return (state.records[item.id] as Script | Trouble) || item;
  }, [item, state.records]);

  useEffect(() => {
    if (currentItem) {
      setTitleDraft(currentItem.name || '');
    }
  }, [currentItem]);

  // Global paste handler to automatically catch pasted images (Ctrl+V)
  useEffect(() => {
    if (!isOpen || !currentItem) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result as string;
              handleAddImageBlock(base64, `Captura pegada ${new Date().toLocaleTimeString()}`);
            };
            reader.readAsDataURL(file);
            return;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, currentItem]);

  // Extract placeholders like <IP>, <PUERTO>, {USER}, [HOST], etc.
  const detectedParams = useMemo(() => {
    if (!currentItem) return [];
    const blocksText = (currentItem.blocks || [])
      .map((b) => b.code || b.html || '')
      .join('\n');
    const extraText =
      currentItem.kind === 'script'
        ? (currentItem.params || '')
        : `${currentItem.test || ''}\n${currentItem.fix || ''}\n${currentItem.validation || ''}`;

    const textToScan = `${blocksText}\n${extraText}`;
    const matches = textToScan.match(/<[A-Za-z0-9_-]+>|\{[A-Za-z0-9_-]+\}/g) || [];
    return Array.from(new Set(matches));
  }, [currentItem]);

  if (!isOpen || !currentItem) return null;

  const isScript = currentItem.kind === 'script';
  const script = isScript ? (currentItem as Script) : null;
  const trouble = !isScript ? (currentItem as Trouble) : null;

  // Function to replace parameters in code string
  const applyParams = (rawText?: string) => {
    if (!rawText) return '';
    let replaced = rawText;
    Object.entries(paramValues).forEach(([placeholder, val]) => {
      if (val && val.trim()) {
        replaced = replaced.split(placeholder).join(val.trim());
      }
    });
    return replaced;
  };

  const handleCopy = (id: string, text: string) => {
    const finalContent = applyParams(text);
    navigator.clipboard.writeText(finalContent);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleCopyAll = () => {
    let fullText = '';
    if (script) {
      const scriptBlocks = (script.blocks || [])
        .map((b) => {
          if (b.type === 'text') return `# NOTA: ${b.label || ''}\n# ${b.html || ''}`;
          if (b.type === 'checklist')
            return `# CHECKLIST:\n${(b.items || []).map((c) => `- [${c.done ? 'x' : ' '}] ${c.text}`).join('\n')}`;
          return `# ${b.label || 'Comando'}\n${b.code || ''}`;
        })
        .join('\n\n');
      fullText = scriptBlocks;
    } else if (trouble) {
      const baseInfo = [
        `# DIAGNÓSTICO: ${trouble.name}`,
        `# SÍNTOMA: ${trouble.symptom}`,
        trouble.test ? `# COMANDO DE PRUEBA:\n${trouble.test}` : '',
        trouble.fix ? `# SOLUCIÓN:\n${trouble.fix}` : '',
        trouble.validation ? `# VALIDACIÓN:\n${trouble.validation}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      const extraBlocks = (trouble.blocks || [])
        .map((b) => `# ${b.label || 'Paso'}\n${b.code || b.html || ''}`)
        .join('\n\n');

      fullText = `${baseInfo}\n\n${extraBlocks}`.trim();
    }
    handleCopy('full-document', fullText);
  };

  const handleSaveTitle = () => {
    if (!titleDraft.trim()) return;
    store.putRecord({
      ...currentItem,
      name: titleDraft.trim(),
      updatedAt: new Date().toISOString(),
    });
    setIsEditingTitle(false);
  };

  const handleAddImageBlock = (imgSrc: string, captionText?: string) => {
    const newBlock: ScriptBlock = {
      id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'image',
      path: imgSrc,
      caption: captionText || 'Evidencia gráfica / Captura',
      label: captionText || 'Imagen adjunta',
    };
    const updatedBlocks = [...(currentItem.blocks || []), newBlock];
    store.putRecord({
      ...currentItem,
      blocks: updatedBlocks,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const driveToken = await getAccessToken();
      if (driveToken) {
        const uploaded = await uploadImageToDrive(file, file.name);
        handleAddImageBlock(uploaded.gdriveUrl, file.name);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          handleAddImageBlock(reader.result as string, file.name);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('Fallback to local image:', err);
      const reader = new FileReader();
      reader.onload = () => {
        handleAddImageBlock(reader.result as string, file.name);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handlePasteFromClipboardButton = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const cItem of clipboardItems) {
          const imageType = cItem.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await cItem.getType(imageType);
            try {
              const driveToken = await getAccessToken();
              if (driveToken) {
                const uploaded = await uploadImageToDrive(blob, `evidencia_${Date.now()}.png`);
                handleAddImageBlock(uploaded.gdriveUrl, 'Captura en Google Drive');
                return;
              }
            } catch (err) {
              console.warn('Fallback clipboard upload to local:', err);
            }
            const reader = new FileReader();
            reader.onload = () => {
              handleAddImageBlock(reader.result as string, 'Captura pegada del portapapeles');
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
      fileInputRef.current?.click();
    } catch {
      fileInputRef.current?.click();
    }
  };

  const handleSaveNewBlock = () => {
    if (!addingBlockType) return;
    const newBlockId = `blk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    let newBlock: ScriptBlock = {
      id: newBlockId,
      type: addingBlockType,
      label: draftLabel.trim() || undefined,
    };

    if (addingBlockType === 'text') {
      if (!draftText.trim()) return;
      newBlock.html = draftText.trim();
      newBlock.label = draftLabel.trim() || 'Nota / Instrucción';
    } else if (addingBlockType === 'command') {
      if (!draftCode.trim()) return;
      newBlock.code = draftCode.trim();
      newBlock.lang = draftLang;
      newBlock.label = draftLabel.trim() || 'Comando de ejecución';
    } else if (addingBlockType === 'image') {
      if (!draftImageSrc.trim()) return;
      newBlock.path = draftImageSrc.trim();
      newBlock.caption = draftCaption.trim() || 'Imagen';
    } else if (addingBlockType === 'warning') {
      if (!draftText.trim()) return;
      newBlock.html = draftText.trim();
      newBlock.level = draftWarningLevel;
      newBlock.label = draftLabel.trim() || `Advertencia: ${draftWarningLevel}`;
    } else if (addingBlockType === 'checklist') {
      const lines = draftChecklist
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length === 0) return;
      newBlock.items = lines.map((text, idx) => ({
        id: `chk-${Date.now()}-${idx}`,
        text,
        done: false,
      }));
      newBlock.label = draftLabel.trim() || 'Lista de verificación';
    }

    const updatedBlocks = [...(currentItem.blocks || []), newBlock];
    store.putRecord({
      ...currentItem,
      blocks: updatedBlocks,
      updatedAt: new Date().toISOString(),
    });

    // Reset draft
    setAddingBlockType(null);
    setDraftLabel('');
    setDraftText('');
    setDraftCode('');
    setDraftImageSrc('');
    setDraftCaption('');
    setDraftChecklist('');
  };

  const handleDeleteBlock = (blockId: string) => {
    const updatedBlocks = (currentItem.blocks || []).filter((b) => b.id !== blockId);
    store.putRecord({
      ...currentItem,
      blocks: updatedBlocks,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleToggleCheckItem = (blockId: string, itemId: string) => {
    const updatedBlocks = (currentItem.blocks || []).map((b) => {
      if (b.id !== blockId || !b.items) return b;
      return {
        ...b,
        items: b.items.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it)),
      };
    });
    store.putRecord({
      ...currentItem,
      blocks: updatedBlocks,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      <div
        ref={modalRef}
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/80 dark:bg-neutral-900/90">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                isScript
                  ? 'bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/60'
                  : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
              }`}
            >
              {isScript ? <Terminal className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300">
                  {isScript ? 'Script de Automatización' : 'Diagnóstico & Troubleshooting'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-cyan-400 font-semibold border border-blue-200 dark:border-blue-800/50">
                  {currentItem.os || 'Universal'}
                </span>
                {isScript && script?.lang && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold">
                    {script.lang}
                  </span>
                )}
                {isScript && script?.version && (
                  <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">
                    v{script.version}
                  </span>
                )}
              </div>

              {/* 1-Click Editable Title */}
              {isEditingTitle ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') setIsEditingTitle(false);
                    }}
                    autoFocus
                    className="text-base font-bold text-slate-900 dark:text-white bg-white dark:bg-neutral-800 border border-blue-500 rounded-lg px-2.5 py-0.5 focus:outline-hidden w-full max-w-lg"
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-1 text-emerald-600 hover:text-emerald-500 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200"
                    title="Guardar nombre"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingTitle(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                    title="Cancelar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-0.5 group">
                  <h2
                    onClick={() => setIsEditingTitle(true)}
                    className="text-base sm:text-lg font-bold text-slate-900 dark:text-neutral-100 truncate cursor-pointer hover:text-blue-600 dark:hover:text-cyan-400"
                    title="Haz clic para editar el título a 1 clic"
                  >
                    {currentItem.name}
                  </h2>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="opacity-60 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-opacity"
                    title="Editar título"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Top Actions: Copy All & Mode switch */}
          <div className="flex items-center gap-2 shrink-0">
            {/* View vs Edit Mode buttons */}
            <div className="flex items-center bg-slate-200/80 dark:bg-neutral-800 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setActiveMode('view')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  activeMode === 'view'
                    ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-cyan-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Modo Vista</span>
              </button>
              <button
                onClick={() => setActiveMode('edit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  activeMode === 'edit'
                    ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-cyan-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Añadir Bloques</span>
              </button>
            </div>

            <button
              onClick={handleCopyAll}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs ${
                copiedId === 'full-document'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-cyan-600 dark:hover:bg-cyan-500'
              }`}
              title="Copiar todo al portapapeles con comandos listos"
            >
              {copiedId === 'full-document' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Todo Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Todo</span>
                </>
              )}
            </button>

            {currentItem && (
              <button
                onClick={() => exportSingleItemAsJson(currentItem)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-800 rounded-lg transition-colors border border-slate-200 dark:border-neutral-700 cursor-pointer shadow-2xs"
                title="Exportar este elemento como archivo JSON individual para respaldar o modificar"
              >
                <Download className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                <span className="hidden sm:inline">Exportar JSON</span>
              </button>
            )}

            {onEdit && (
              <button
                onClick={onEdit}
                className="px-2.5 py-1.5 text-xs text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-800 rounded-lg transition-colors border border-slate-200 dark:border-neutral-700"
                title="Editar metadatos generales"
              >
                Propiedades
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Ribbon: Direct Block Addition Toolbar (Pegar imagen, Texto, Comando, Checklist, Alerta) */}
        <div className="px-5 py-2.5 bg-slate-100 dark:bg-neutral-950 border-b border-slate-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider mr-1">
              + Insertar:
            </span>

            <button
              onClick={handlePasteFromClipboardButton}
              className="flex items-center gap-1.5 px-2.5 py-1.5 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors shadow-2xs"
              title="Pegar imagen del portapapeles (Ctrl+V) o subir captura"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Pegar Imagen</span>
            </button>

            <button
              onClick={() => {
                setAddingBlockType('command');
                setActiveMode('edit');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 font-semibold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-800/60 hover:bg-violet-100 dark:hover:bg-violet-900/60 rounded-lg transition-colors shadow-2xs"
              title="Agregar bloque de comandos listos para copiar"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>+ Comando</span>
            </button>

            <button
              onClick={() => {
                setAddingBlockType('text');
                setActiveMode('edit');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors shadow-2xs"
              title="Agregar texto explicativo o instrucciones"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>+ Texto / Nota</span>
            </button>

            <button
              onClick={() => {
                setAddingBlockType('checklist');
                setActiveMode('edit');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-lg transition-colors shadow-2xs"
              title="Agregar lista de verificación de pasos"
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>+ Checklist</span>
            </button>

            <button
              onClick={() => {
                setAddingBlockType('warning');
                setActiveMode('edit');
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors shadow-2xs"
              title="Agregar alerta o advertencia técnica"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>+ Advertencia</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 dark:text-neutral-400 hidden sm:inline">
            Tip: Presiona <kbd className="font-mono bg-slate-200 dark:bg-neutral-800 px-1 rounded">Ctrl+V</kbd> para pegar capturas de pantalla directamente
          </span>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Quick Objective / Summary */}
          {isScript && script?.objective && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 block mb-1">
                Objetivo del Script
              </span>
              <p className="text-xs text-slate-700 dark:text-neutral-300 leading-relaxed">
                {script.objective}
              </p>
            </div>
          )}

          {/* Troubleshooting Base Summary (Symptom, Hypothesis, Test, Fix) */}
          {!isScript && trouble && (
            <div className="space-y-4">
              {/* Symptom Card */}
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2">
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-400 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Síntoma Observado / Falla</span>
                </div>
                <p className="text-xs text-rose-950 dark:text-rose-200 font-medium leading-relaxed">
                  {trouble.symptom}
                </p>

                {trouble.hypothesis && (
                  <div className="pt-2 border-t border-rose-200 dark:border-rose-900/40">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block mb-0.5">
                      Hipótesis / Causa Raíz Probable
                    </span>
                    <p className="text-xs text-rose-900 dark:text-rose-300">
                      {trouble.hypothesis}
                    </p>
                  </div>
                )}
              </div>

              {/* Fix Command Strip */}
              {trouble.fix && (
                <div className="border border-emerald-300 dark:border-emerald-800/70 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-md">
                  <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3 text-xs">
                    <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Comandos de Solución Definitiva (Fix)</span>
                    </span>

                    <button
                      onClick={() => handleCopy('trouble-fix', trouble.fix)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                        copiedId === 'trouble-fix'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                      }`}
                    >
                      {copiedId === 'trouble-fix' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>¡Solución Copiada!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Solución</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 bg-slate-950 text-slate-100 overflow-x-auto">
                    <pre className="font-mono text-xs leading-relaxed whitespace-pre font-normal text-emerald-400 font-semibold">
                      <code>{applyParams(trouble.fix)}</code>
                    </pre>
                  </div>
                </div>
              )}

              {/* Test & Validation Commands */}
              {(trouble.test || trouble.validation) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trouble.test && (
                    <div className="border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-xs">
                      <div className="px-3.5 py-2 bg-slate-100 dark:bg-neutral-800/90 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-blue-500" />
                          <span>Prueba / Test</span>
                        </span>
                        <button
                          onClick={() => handleCopy('trouble-test', trouble.test || '')}
                          className="text-[11px] font-mono px-2 py-0.5 rounded bg-white dark:bg-neutral-700 text-slate-700 dark:text-neutral-200 border"
                        >
                          {copiedId === 'trouble-test' ? '¡Copiado!' : 'Copiar'}
                        </button>
                      </div>
                      <div className="p-3 bg-slate-950 text-slate-100 overflow-x-auto">
                        <pre className="font-mono text-[11px] text-cyan-400">
                          <code>{applyParams(trouble.test)}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {trouble.validation && (
                    <div className="border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-xs">
                      <div className="px-3.5 py-2 bg-slate-100 dark:bg-neutral-800/90 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
                          <span>Validación de Éxito</span>
                        </span>
                        <button
                          onClick={() => handleCopy('trouble-valid', trouble.validation || '')}
                          className="text-[11px] font-mono px-2 py-0.5 rounded bg-white dark:bg-neutral-700 text-slate-700 dark:text-neutral-200 border"
                        >
                          {copiedId === 'trouble-valid' ? '¡Copiado!' : 'Copiar'}
                        </button>
                      </div>
                      <div className="p-3 bg-slate-950 text-slate-100 overflow-x-auto">
                        <pre className="font-mono text-[11px] text-amber-300">
                          <code>{applyParams(trouble.validation)}</code>
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Dynamic Parameters Bar */}
          {detectedParams.length > 0 && (
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/25 border border-blue-200 dark:border-blue-900/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-300">
                  <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                  <span>Sustitución de Variables y Parámetros en Tiempo Real</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-mono">
                    {detectedParams.length} detectadas
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowParamEditor(!showParamEditor)}
                  className="text-[11px] font-semibold text-blue-600 dark:text-cyan-400 hover:underline"
                >
                  {showParamEditor ? 'Ocultar campos' : 'Personalizar valores antes de copiar'}
                </button>
              </div>

              {(showParamEditor || Object.keys(paramValues).length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                  {detectedParams.map((param) => (
                    <div key={param} className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-600 dark:text-neutral-400 block font-semibold truncate">
                        {param}
                      </label>
                      <input
                        type="text"
                        value={paramValues[param] || ''}
                        onChange={(e) =>
                          setParamValues({ ...paramValues, [param]: e.target.value })
                        }
                        placeholder={`Valor para ${param}...`}
                        className="w-full bg-white dark:bg-neutral-900 border border-blue-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-neutral-100 font-mono focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* INLINE FORM TO ADD NEW BLOCK */}
          {addingBlockType && (
            <div className="p-4 bg-slate-50 dark:bg-neutral-800/80 border-2 border-dashed border-blue-400 dark:border-cyan-500 rounded-xl space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-neutral-700 text-xs font-bold text-slate-800 dark:text-neutral-200">
                <div className="flex items-center gap-2">
                  {addingBlockType === 'command' && <Terminal className="w-4 h-4 text-violet-500" />}
                  {addingBlockType === 'text' && <FileText className="w-4 h-4 text-blue-500" />}
                  {addingBlockType === 'image' && <ImageIcon className="w-4 h-4 text-emerald-500" />}
                  {addingBlockType === 'checklist' && <ListChecks className="w-4 h-4 text-amber-500" />}
                  {addingBlockType === 'warning' && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                  <span>
                    Nuevo Bloque:{' '}
                    {addingBlockType === 'command'
                      ? 'Comando de Terminal'
                      : addingBlockType === 'text'
                      ? 'Texto / Notas'
                      : addingBlockType === 'image'
                      ? 'Imagen / Captura'
                      : addingBlockType === 'checklist'
                      ? 'Checklist de Verificación'
                      : 'Advertencia'}
                  </span>
                </div>
                <button
                  onClick={() => setAddingBlockType(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-neutral-300 block mb-1">
                  Título o Etiqueta del Bloque (Opcional)
                </label>
                <input
                  type="text"
                  value={draftLabel}
                  onChange={(e) => setDraftLabel(e.target.value)}
                  placeholder="Ej. Paso 1: Reinicio de servicios, Evidencia de puertos..."
                  className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100"
                />
              </div>

              {/* Command Block fields */}
              {addingBlockType === 'command' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-neutral-300">
                      Lenguaje / Consola:
                    </label>
                    <select
                      value={draftLang}
                      onChange={(e) => setDraftLang(e.target.value)}
                      className="bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-neutral-100"
                    >
                      <option value="bash">Bash / Shell (.sh)</option>
                      <option value="powershell">PowerShell (.ps1)</option>
                      <option value="cmd">Windows CMD</option>
                      <option value="python">Python</option>
                      <option value="sql">SQL</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-neutral-300 block mb-1">
                      Comando / Código *
                    </label>
                    <textarea
                      rows={4}
                      value={draftCode}
                      onChange={(e) => setDraftCode(e.target.value)}
                      placeholder="sudo systemctl restart nginx&#10;netstat -tuln | grep 80"
                      className="w-full bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg p-3 border border-slate-700 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* Text Block fields */}
              {addingBlockType === 'text' && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-neutral-300 block mb-1">
                    Contenido del Texto / Explicación *
                  </label>
                  <textarea
                    rows={4}
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    placeholder="Describe el procedimiento, advertencias o contexto técnico..."
                    className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-neutral-100"
                  />
                </div>
              )}

              {/* Image Block fields */}
              {addingBlockType === 'image' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir desde Disco</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePasteFromClipboardButton}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Pegar de Portapapeles (Ctrl+V)</span>
                    </button>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-neutral-300 block mb-1">
                      O pega una URL de Imagen:
                    </label>
                    <input
                      type="text"
                      value={draftImageSrc}
                      onChange={(e) => setDraftImageSrc(e.target.value)}
                      placeholder="https://ejemplo.com/captura.png o data:image/png;base64,..."
                      className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-neutral-300 block mb-1">
                      Pie de Foto / Descripción:
                    </label>
                    <input
                      type="text"
                      value={draftCaption}
                      onChange={(e) => setDraftCaption(e.target.value)}
                      placeholder="Ej. Configuración correcta del puerto en panel de control"
                      className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-neutral-100"
                    />
                  </div>
                </div>
              )}

              {/* Warning Block fields */}
              {addingBlockType === 'warning' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-neutral-300">
                      Nivel de Severidad:
                    </label>
                    <select
                      value={draftWarningLevel}
                      onChange={(e) =>
                        setDraftWarningLevel(e.target.value as 'Impacto' | 'Precaución' | 'Limitación')
                      }
                      className="bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-neutral-100"
                    >
                      <option value="Precaución">Precaución</option>
                      <option value="Impacto">Impacto Alto</option>
                      <option value="Limitación">Limitación</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-neutral-300 block mb-1">
                      Mensaje de Advertencia *
                    </label>
                    <textarea
                      rows={3}
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      placeholder="Este comando reiniciará el socket web y desconectará sesiones activas..."
                      className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-neutral-100"
                    />
                  </div>
                </div>
              )}

              {/* Checklist Block fields */}
              {addingBlockType === 'checklist' && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 dark:text-neutral-300 block mb-1">
                    Elementos de la lista (un elemento por línea) *
                  </label>
                  <textarea
                    rows={4}
                    value={draftChecklist}
                    onChange={(e) => setDraftChecklist(e.target.value)}
                    placeholder="Verificar puertos en firewall&#10;Comprobar permisos de usuario&#10;Hacer respaldo previo"
                    className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-neutral-100"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-neutral-700">
                <button
                  type="button"
                  onClick={() => setAddingBlockType(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveNewBlock}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs"
                >
                  Insertar Bloque
                </button>
              </div>
            </div>
          )}

          {/* RENDER ALL RICH BLOCKS (Comandos, Texto, Imagen, Checklist, Advertencia) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 flex items-center gap-2">
                <Code2 className="w-4 h-4 text-violet-500" />
                <span>Bloques de Ejecución, Comandos y Evidencias</span>
                <span className="text-[11px] font-mono px-2 py-0.2 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400">
                  {(currentItem.blocks || []).length}
                </span>
              </h3>
            </div>

            {(currentItem.blocks || []).length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-neutral-800/40 rounded-xl border border-slate-200 dark:border-neutral-800 text-slate-400 space-y-2">
                <Terminal className="w-8 h-8 mx-auto text-slate-300 dark:text-neutral-600" />
                <p className="text-xs">
                  Aún no se han agregado bloques adicionales a esta ficha.
                </p>
                <div className="flex justify-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setAddingBlockType('command');
                      setActiveMode('edit');
                    }}
                    className="px-3 py-1 text-xs font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-500"
                  >
                    + Agregar Comando
                  </button>
                  <button
                    onClick={handlePasteFromClipboardButton}
                    className="px-3 py-1 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                  >
                    Pegar Imagen
                  </button>
                </div>
              </div>
            ) : (
              (currentItem.blocks || []).map((block, bIdx) => {
                const bType = block.type || 'command';
                const isCopied = copiedId === block.id;

                // 1. IMAGE BLOCK
                if (bType === 'image') {
                  return (
                    <div
                      key={block.id || bIdx}
                      className="border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-xs group"
                    >
                      <div className="px-4 py-2 bg-slate-100 dark:bg-neutral-800/90 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="font-semibold text-slate-800 dark:text-neutral-200 truncate">
                            {block.caption || block.label || `Captura / Evidencia #${bIdx + 1}`}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteBlock(block.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 transition-opacity"
                          title="Eliminar imagen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-3 bg-slate-50 dark:bg-neutral-950 flex flex-col items-center">
                        <DriveImage
                          src={block.path}
                          alt={block.caption || 'Evidencia'}
                          caption={block.caption}
                          showDriveBadge={true}
                        />
                      </div>
                    </div>
                  );
                }

                // 2. TEXT BLOCK
                if (bType === 'text') {
                  return (
                    <div
                      key={block.id || bIdx}
                      className="border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-xs group"
                    >
                      <div className="px-4 py-2 bg-slate-100 dark:bg-neutral-800/90 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-semibold text-slate-800 dark:text-neutral-200 truncate">
                            {block.label || `Nota / Explicación #${bIdx + 1}`}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteBlock(block.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 transition-opacity"
                          title="Eliminar bloque de texto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-4 text-xs text-slate-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                        {block.html}
                      </div>
                    </div>
                  );
                }

                // 3. WARNING / ALERT BLOCK
                if (bType === 'warning') {
                  return (
                    <div
                      key={block.id || bIdx}
                      className="border border-rose-200 dark:border-rose-900/60 rounded-xl overflow-hidden bg-rose-50/60 dark:bg-rose-950/20 p-4 shadow-xs group flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                            {block.level || 'Advertencia'} · {block.label || 'Precaución de Seguridad'}
                          </span>
                          <p className="text-xs text-rose-950 dark:text-rose-200 leading-relaxed whitespace-pre-wrap">
                            {block.html}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteBlock(block.id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 transition-opacity shrink-0"
                        title="Eliminar advertencia"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                }

                // 4. CHECKLIST BLOCK
                if (bType === 'checklist') {
                  return (
                    <div
                      key={block.id || bIdx}
                      className="border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-xs group"
                    >
                      <div className="px-4 py-2 bg-slate-100 dark:bg-neutral-800/90 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2">
                          <ListChecks className="w-3.5 h-3.5 text-amber-500" />
                          <span className="font-semibold text-slate-800 dark:text-neutral-200 truncate">
                            {block.label || `Lista de Verificación #${bIdx + 1}`}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteBlock(block.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 transition-opacity"
                          title="Eliminar checklist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="p-3 divide-y divide-slate-100 dark:divide-neutral-800 text-xs">
                        {(block.items || []).map((it) => (
                          <label
                            key={it.id}
                            className="flex items-center gap-2.5 py-2 px-1 hover:bg-slate-50 dark:hover:bg-neutral-800/50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={it.done}
                              onChange={() => handleToggleCheckItem(block.id, it.id)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-0"
                            />
                            <span
                              className={`${
                                it.done
                                  ? 'line-through text-slate-400 dark:text-neutral-500'
                                  : 'text-slate-800 dark:text-neutral-200'
                              }`}
                            >
                              {it.text}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }

                // 5. COMMAND / SCRIPT BLOCK (THE STANDARD WITH INSTANT COPY)
                const blockText = applyParams(block.code || '');

                return (
                  <div
                    key={block.id || bIdx}
                    className="border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900 shadow-xs group"
                  >
                    <div className="px-4 py-2 bg-slate-100 dark:bg-neutral-800/90 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <Terminal className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                        <span className="font-semibold text-slate-800 dark:text-neutral-200 truncate">
                          {block.label || `Comando ${bIdx + 1}`}
                        </span>
                        {block.lang && (
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300">
                            {block.lang}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopy(block.id, block.code || '')}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all ${
                            isCopied
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white dark:bg-neutral-700 text-slate-700 dark:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-600 border border-slate-300 dark:border-neutral-600'
                          }`}
                          title="Copiar comando al portapapeles"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>¡Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copiar Comando</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteBlock(block.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 p-1 transition-opacity ml-1"
                          title="Eliminar comando"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Code Pre Box */}
                    <div className="p-4 bg-slate-950 text-slate-100 overflow-x-auto selection:bg-cyan-500 selection:text-black">
                      <pre className="font-mono text-xs leading-relaxed whitespace-pre font-normal text-emerald-400">
                        <code>{blockText}</code>
                      </pre>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-950 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span>
              💡 Puedes agregar imágenes con <strong>Ctrl+V</strong> o usando el botón superior.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
