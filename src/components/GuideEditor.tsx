import React, { useState, useRef } from 'react';
import {
  GripVertical,
  Pencil,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Plus,
  Image as ImageIcon,
  FileText,
  Terminal,
  FileCode,
  CheckSquare,
  Paperclip,
  Eye,
  AlertTriangle,
  Table as TableIcon,
  X,
  Check,
  Download,
  Upload,
  Clipboard,
  ExternalLink,
  BookOpen,
  FileJson,
} from 'lucide-react';
import { Guide, GuideSection, GuideStep, GuideBlock, ChecklistItem } from '../types';
import { store } from '../services/store';
import { compressBase64Image } from '../services/imageCompression';
import { uploadImageToDrive } from '../services/googleDrive';
import { getAccessToken } from '../services/firebase';
import { DriveImage } from './common/DriveImage';
import { ConfirmModal } from './modals/ConfirmModal';
import { exportSingleItemAsJson, parseSingleItemJson } from '../services/singleItemTransfer';
import { RichTextRenderer } from './common/RichTextRenderer';
import { RichTextEditor } from './common/RichTextEditor';

interface GuideEditorProps {
  guide: Guide;
  onBack?: () => void;
  isProjectCopy?: boolean;
  projectVars?: Record<string, string>;
}

export const GuideEditor: React.FC<GuideEditorProps> = ({
  guide,
  onBack,
  isProjectCopy = false,
  projectVars,
}) => {
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(null);
  const [draggedStepInfo, setDraggedStepInfo] = useState<{ sectionIdx: number; stepIdx: number } | null>(null);
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);

  // Hidden file input for uploading images directly into a step
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadTarget, setUploadTarget] = useState<{ sectionId: string; stepId: string } | null>(null);

  // In-app deletion and creation modal state (replaces prompt/confirm for iframe compatibility)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'section' | 'step';
    sectionId: string;
    stepId?: string;
    title: string;
  } | null>(null);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // Edit Section Title Modal
  const [editingSection, setEditingSection] = useState<{ id: string; title: string } | null>(null);

  // Edit Step Modal
  const [editingStep, setEditingStep] = useState<{
    sectionId: string;
    step: GuideStep;
    isNew: boolean;
  } | null>(null);

  // Edit Block Modal
  const [editingBlock, setEditingBlock] = useState<{
    sectionId: string;
    stepId: string;
    block: GuideBlock;
  } | null>(null);

  // Save entire guide update
  const saveGuide = (updatedSections: GuideSection[]) => {
    const updatedGuide: Guide = {
      ...guide,
      sections: updatedSections,
      updatedAt: new Date().toISOString(),
    };
    store.putRecord(updatedGuide);
  };

  // Section actions
  const handleOpenAddSection = () => {
    setNewSectionTitle('');
    setIsAddSectionModalOpen(true);
  };

  const handleConfirmAddSection = () => {
    if (!newSectionTitle.trim()) return;

    const newSec: GuideSection = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newSectionTitle.trim(),
      order: guide.sections.length,
      steps: [],
    };
    saveGuide([...guide.sections, newSec]);
    setIsAddSectionModalOpen(false);
    setNewSectionTitle('');
  };

  const handleUpdateSectionTitle = () => {
    if (!editingSection || !editingSection.title.trim()) return;
    const updated = guide.sections.map((s) =>
      s.id === editingSection.id ? { ...s, title: editingSection.title.trim() } : s
    );
    saveGuide(updated);
    setEditingSection(null);
  };

  const moveSection = (idx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= guide.sections.length) return;

    const sectionsCopy = [...guide.sections];
    const [moved] = sectionsCopy.splice(idx, 1);
    sectionsCopy.splice(newIdx, 0, moved);
    saveGuide(sectionsCopy);
  };

  const duplicateSection = (sec: GuideSection) => {
    const duplicated: GuideSection = {
      ...sec,
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${sec.title} (Copia)`,
      steps: sec.steps.map((st) => ({
        ...st,
        id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        blocks: st.blocks.map((b) => ({
          ...b,
          id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          items: b.items ? b.items.map((it) => ({ ...it, id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` })) : undefined,
        })),
      })),
    };
    const idx = guide.sections.findIndex((s) => s.id === sec.id);
    const sectionsCopy = [...guide.sections];
    sectionsCopy.splice(idx + 1, 0, duplicated);
    saveGuide(sectionsCopy);
  };

  const promptDeleteSection = (sec: GuideSection) => {
    setDeleteConfirm({
      type: 'section',
      sectionId: sec.id,
      title: `la sección "${sec.title}" y todos sus pasos`,
    });
  };

  const executeDeleteSection = (secId: string) => {
    saveGuide(guide.sections.filter((s) => s.id !== secId));
  };

  // Step actions
  const handleOpenAddStep = (sectionId: string) => {
    const newStep: GuideStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: 'Nuevo Paso',
      evaluable: true,
      weight: 1,
      mode: 'check',
      progress: 0,
      na: false,
      blocks: [],
    };
    setEditingStep({ sectionId, step: newStep, isNew: true });
  };

  const handleSaveStep = () => {
    if (!editingStep || !editingStep.step.title.trim()) return;
    const { sectionId, step, isNew } = editingStep;

    const updatedSections = guide.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      if (isNew) {
        return { ...sec, steps: [...sec.steps, step] };
      }
      return {
        ...sec,
        steps: sec.steps.map((s) => (s.id === step.id ? step : s)),
      };
    });

    saveGuide(updatedSections);
    setActiveStepId(step.id);
    setEditingStep(null);
  };

  const moveStep = (sectionId: string, stepIdx: number, direction: 'up' | 'down') => {
    const sec = guide.sections.find((s) => s.id === sectionId);
    if (!sec) return;

    const newIdx = direction === 'up' ? stepIdx - 1 : stepIdx + 1;
    if (newIdx < 0 || newIdx >= sec.steps.length) return;

    const stepsCopy = [...sec.steps];
    const [moved] = stepsCopy.splice(stepIdx, 1);
    stepsCopy.splice(newIdx, 0, moved);

    const updatedSections = guide.sections.map((s) =>
      s.id === sectionId ? { ...s, steps: stepsCopy } : s
    );
    saveGuide(updatedSections);
  };

  const duplicateStep = (sectionId: string, step: GuideStep) => {
    const duplicated: GuideStep = {
      ...step,
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: `${step.title} (Copia)`,
      blocks: step.blocks.map((b) => ({
        ...b,
        id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        items: b.items ? b.items.map((it) => ({ ...it, id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}` })) : undefined,
      })),
    };

    const updatedSections = guide.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      const idx = sec.steps.findIndex((s) => s.id === step.id);
      const stepsCopy = [...sec.steps];
      stepsCopy.splice(idx + 1, 0, duplicated);
      return { ...sec, steps: stepsCopy };
    });

    saveGuide(updatedSections);
  };

  const promptDeleteStep = (sectionId: string, step: GuideStep) => {
    setDeleteConfirm({
      type: 'step',
      sectionId,
      stepId: step.id,
      title: `el paso "${step.title}"`,
    });
  };

  const executeDeleteStep = (sectionId: string, stepId: string) => {
    const updatedSections = guide.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return { ...sec, steps: sec.steps.filter((s) => s.id !== stepId) };
    });
    saveGuide(updatedSections);
  };

  // Add block directly to step and immediately allow editing
  const handleAddBlockToStep = (sectionId: string, stepId: string, type: GuideBlock['type']) => {
    let defaultData: Partial<GuideBlock> = {};

    switch (type) {
      case 'text':
        defaultData = { html: 'Escribe aquí las instrucciones detalladas del procedimiento...' };
        break;
      case 'command':
        defaultData = { code: 'curl -Iv https://ejemplo.com/api', lang: 'bash', label: 'Comando de ejecución' };
        break;
      case 'script':
        defaultData = {
          code: '# Script automatizado\nWrite-Host "Iniciando despliegue..."\nGet-Service -Name "AgenteSegura"',
          filename: 'despliegue.ps1',
          lang: 'powershell',
          label: 'Script de instalación',
        };
        break;
      case 'checklist':
        defaultData = {
          label: 'Lista de verificación',
          items: [
            { id: `c-${Date.now()}-1`, text: 'Verificar conectividad y puertos abiertos', done: false },
            { id: `c-${Date.now()}-2`, text: 'Validar credenciales y certificados TLS', done: false },
          ],
        };
        break;
      case 'image':
        defaultData = { caption: 'Captura de pantalla o evidencia', path: '', widthPct: 100, label: 'Evidencia gráfica' };
        break;
      case 'file':
        defaultData = { filename: 'anexo_tecnico.pdf', label: 'Archivo adjunto' };
        break;
      case 'validation':
        defaultData = { expected: 'Servicio activo en puerto 443 con respuesta HTTP 200.', label: 'Validación de resultado' };
        break;
      case 'warning':
        defaultData = { level: 'Precaución', html: 'No reiniciar el servidor mientras se aplican las políticas.', label: 'Advertencia' };
        break;
      case 'table':
        defaultData = {
          label: 'Tabla de parámetros',
          rows: [
            ['Parámetro', 'Valor', 'Descripción'],
            ['PORT', '8443', 'Puerto TLS'],
            ['TIMEOUT', '30s', 'Tiempo de espera'],
          ],
        };
        break;
    }

    const newBlock: GuideBlock = {
      id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      ...defaultData,
    };

    const updatedSections = guide.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        steps: sec.steps.map((st) => {
          if (st.id !== stepId) return st;
          return { ...st, blocks: [...st.blocks, newBlock] };
        }),
      };
    });

    saveGuide(updatedSections);
    setActiveStepId(stepId);

    // Open editor right away so user can customize it!
    setEditingBlock({ sectionId, stepId, block: newBlock });
  };

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Upload image from file picker
  const handleTriggerUpload = (sectionId: string, stepId: string) => {
    setUploadTarget({ sectionId, stepId });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;

    setIsUploadingImage(true);
    try {
      let imagePath = '';
      let isDriveImage = false;
      const driveToken = await getAccessToken();

      if (driveToken) {
        // Direct upload to Google Drive without impacting server deployment or Firestore quotas
        const uploaded = await uploadImageToDrive(file, file.name);
        imagePath = uploaded.gdriveUrl;
        isDriveImage = true;
      } else {
        // Fallback local compression
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = async () => {
            const compressed = await compressBase64Image(reader.result as string, 1280, 0.75);
            resolve(compressed);
          };
          reader.readAsDataURL(file);
        });
        imagePath = await base64Promise;
      }

      const newBlock: GuideBlock = {
        id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        type: 'image',
        label: isDriveImage ? `Drive: ${file.name}` : `Imagen: ${file.name}`,
        caption: file.name,
        path: imagePath,
        widthPct: 100,
      };

      const updatedSections = guide.sections.map((sec) => {
        if (sec.id !== uploadTarget.sectionId) return sec;
        return {
          ...sec,
          steps: sec.steps.map((st) => {
            if (st.id !== uploadTarget.stepId) return st;
            return { ...st, blocks: [...st.blocks, newBlock] };
          }),
        };
      });

      saveGuide(updatedSections);
      setActiveStepId(uploadTarget.stepId);
      setUploadTarget(null);
    } catch (err) {
      console.error('Error uploading image to drive:', err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Paste image directly from clipboard
  const handlePasteImageIntoStep = async (sectionId: string, stepId: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            setIsUploadingImage(true);
            try {
              let imagePath = '';
              let isDriveImage = false;
              const driveToken = await getAccessToken();

              if (driveToken) {
                const uploaded = await uploadImageToDrive(blob, `captura_${Date.now()}.png`);
                imagePath = uploaded.gdriveUrl;
                isDriveImage = true;
              } else {
                const reader = new FileReader();
                const base64Promise = new Promise<string>((resolve) => {
                  reader.onload = async () => {
                    const compressed = await compressBase64Image(reader.result as string, 1280, 0.75);
                    resolve(compressed);
                  };
                  reader.readAsDataURL(blob);
                });
                imagePath = await base64Promise;
              }

              const newBlock: GuideBlock = {
                id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                type: 'image',
                label: isDriveImage ? 'Captura en Google Drive' : 'Captura pegada del portapapeles',
                caption: isDriveImage ? 'Almacenada en Google Drive (Fotos y Evidencias)' : undefined,
                path: imagePath,
                widthPct: 100,
              };

              const updatedSections = guide.sections.map((sec) => {
                if (sec.id !== sectionId) return sec;
                return {
                  ...sec,
                  steps: sec.steps.map((st) => {
                    if (st.id !== stepId) return st;
                    return { ...st, blocks: [...st.blocks, newBlock] };
                  }),
                };
              });

              saveGuide(updatedSections);
              setActiveStepId(stepId);
              return;
            } finally {
              setIsUploadingImage(false);
            }
          }
        }
      }
      // If clipboard permission is blocked or empty, open the file picker directly!
      handleTriggerUpload(sectionId, stepId);
    } catch {
      handleTriggerUpload(sectionId, stepId);
    }
  };

  // Toggle checklist item
  const handleToggleChecklist = (sectionId: string, stepId: string, blockId: string, itemId: string) => {
    const updatedSections = guide.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        steps: sec.steps.map((st) => {
          if (st.id !== stepId) return st;
          const updatedBlocks = st.blocks.map((b) => {
            if (b.id !== blockId || !b.items) return b;
            return {
              ...b,
              items: b.items.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it)),
            };
          });

          // Compute new progress if step has checklist items
          const allItems = updatedBlocks
            .filter((b) => b.type === 'checklist')
            .flatMap((b) => b.items || []);
          let newProg = st.progress;
          if (allItems.length > 0) {
            const doneCount = allItems.filter((i) => i.done).length;
            newProg = Math.round((doneCount / allItems.length) * 100);
          }

          return { ...st, blocks: updatedBlocks, progress: newProg };
        }),
      };
    });

    saveGuide(updatedSections);
  };

  // Toggle complete step directly (0% <-> 100%)
  const handleToggleStepComplete = (sectionId: string, stepId: string) => {
    const updatedSections = guide.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        steps: sec.steps.map((st) => {
          if (st.id !== stepId) return st;
          const nextProg = st.progress === 100 ? 0 : 100;
          const isDone = nextProg === 100;
          const updatedBlocks = st.blocks.map((b) => {
            if (b.type === 'checklist' && b.items) {
              return {
                ...b,
                items: b.items.map((it) => ({ ...it, done: isDone })),
              };
            }
            return b;
          });
          return { ...st, progress: nextProg, blocks: updatedBlocks };
        }),
      };
    });
    saveGuide(updatedSections);
  };

  // Reorder / move blocks
  const moveBlock = (sectionId: string, stepId: string, blockIdx: number, direction: 'up' | 'down') => {
    const updatedSections = guide.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        steps: sec.steps.map((st) => {
          if (st.id !== stepId) return st;
          const newIdx = direction === 'up' ? blockIdx - 1 : blockIdx + 1;
          if (newIdx < 0 || newIdx >= st.blocks.length) return st;
          const copy = [...st.blocks];
          const [moved] = copy.splice(blockIdx, 1);
          copy.splice(newIdx, 0, moved);
          return { ...st, blocks: copy };
        }),
      };
    });
    saveGuide(updatedSections);
  };

  // Delete block
  const deleteBlock = (sectionId: string, stepId: string, blockId: string) => {
    const updatedSections = guide.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        steps: sec.steps.map((st) => {
          if (st.id !== stepId) return st;
          return { ...st, blocks: st.blocks.filter((b) => b.id !== blockId) };
        }),
      };
    });
    saveGuide(updatedSections);
  };

  // Save block from edit modal
  const handleSaveBlock = () => {
    if (!editingBlock) return;
    const { sectionId, stepId, block } = editingBlock;

    const updatedSections = guide.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        steps: sec.steps.map((st) => {
          if (st.id !== stepId) return st;
          return {
            ...st,
            blocks: st.blocks.map((b) => (b.id === block.id ? block : b)),
          };
        }),
      };
    });

    saveGuide(updatedSections);
    setEditingBlock(null);
  };

  // Copy to clipboard helper with visual notification
  const handleCopyText = (text: string, blockId: string) => {
    let resolved = text;
    if (projectVars) {
      Object.entries(projectVars).forEach(([k, v]) => {
        resolved = resolved.replaceAll(`{{${k}}}`, v);
      });
    }
    navigator.clipboard.writeText(resolved);
    setCopiedBlockId(blockId);
    setTimeout(() => setCopiedBlockId(null), 2000);
  };

  // Download script helper
  const handleDownloadScript = (code: string, filename?: string) => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'script.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const jsonImportInputRef = useRef<HTMLInputElement>(null);

  const handleLoadJsonIntoGuide = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseSingleItemJson(text);
        if (parsed.isValid && parsed.item) {
          if (Array.isArray(parsed.item.sections)) {
            saveGuide(parsed.item.sections);
            alert(`Contenido de la guía "${parsed.name}" cargado con éxito en el editor. Puedes modificar y guardar tus cambios.`);
          } else {
            alert('El archivo JSON no contiene secciones válidas de guía.');
          }
        } else {
          alert(`Error al procesar JSON: ${parsed.error || 'Formato desconocido'}`);
        }
      } catch (err: any) {
        alert(`Error al cargar archivo: ${err?.message || 'Error desconocido'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Top Editor Utility Bar for Single Item JSON Export / Load */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-xs shadow-2xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-neutral-400">
          <BookOpen className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="font-semibold text-slate-800 dark:text-neutral-200 truncate">
            {guide.name}
          </span>
          <span className="text-slate-400">·</span>
          <span className="shrink-0">{guide.sections.length} secciones</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => jsonImportInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 rounded-lg font-semibold transition-colors cursor-pointer shadow-2xs"
            title="Cargar y reemplazar contenido desde un archivo JSON individual para modificarlo"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Cargar JSON a esta Guía</span>
          </button>

          <button
            type="button"
            onClick={() => exportSingleItemAsJson(guide)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-cyan-300 rounded-lg font-semibold transition-colors cursor-pointer shadow-2xs"
            title="Exportar esta guía completa como JSON individual para respaldar o compartir"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Guía JSON</span>
          </button>
        </div>

        <input
          ref={jsonImportInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleLoadJsonIntoGuide}
          className="hidden"
        />
      </div>

      {/* Hidden file picker for quick image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Sections List */}
      <div className="space-y-6">
        {guide.sections.map((section, secIdx) => (
          <div
            key={section.id}
            className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm transition-shadow hover:shadow-md"
          >
            {/* Section header with a clear visual anchor for long guides */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-neutral-800 border-l-4 border-l-blue-600 bg-gradient-to-r from-slate-100 via-blue-50/80 to-white dark:from-neutral-800 dark:via-neutral-800 dark:to-neutral-900">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 dark:text-neutral-500">
                  <GripVertical className="w-4 h-4" />
                </span>
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-[10px] font-bold tracking-wide text-white shadow-sm shadow-blue-600/30">
                  {String(secIdx + 1).padStart(2, '0')}
                </span>
                <h3 className="text-sm font-bold text-slate-800 dark:text-neutral-100 tracking-tight">
                  {section.title}
                </h3>
              </div>

              {/* Section Header Controls */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-700 dark:text-blue-300 font-semibold px-2.5 py-1 rounded-full bg-white/80 dark:bg-neutral-900 border border-blue-100 dark:border-blue-900/60">
                  {section.steps.length} pasos
                </span>

                <div className="flex items-center gap-1 text-slate-400 dark:text-neutral-400 ml-2">
                  <button
                    onClick={() => setEditingSection({ id: section.id, title: section.title })}
                    className="p-1.5 hover:text-cyan-500 rounded hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
                    title="Editar título de sección"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveSection(secIdx, 'up')}
                    disabled={secIdx === 0}
                    className="p-1.5 hover:text-slate-700 dark:hover:text-neutral-200 disabled:opacity-30 rounded hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
                    title="Subir sección"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveSection(secIdx, 'down')}
                    disabled={secIdx === guide.sections.length - 1}
                    className="p-1.5 hover:text-slate-700 dark:hover:text-neutral-200 disabled:opacity-30 rounded hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
                    title="Bajar sección"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => duplicateSection(section)}
                    className="p-1.5 hover:text-slate-700 dark:hover:text-neutral-200 rounded hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
                    title="Duplicar sección"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => promptDeleteSection(section)}
                    className="p-1.5 hover:text-rose-500 rounded hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
                    title="Eliminar sección"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Section Steps Body */}
            <div className="p-4 space-y-4">
              {section.steps.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 dark:text-neutral-500 border border-dashed border-slate-200 dark:border-neutral-800 rounded-lg">
                  Esta sección no tiene pasos aún. Haz clic en &ldquo;+ Paso&rdquo; abajo.
                </div>
              ) : (
                section.steps.map((step, stepIdx) => (
                  <div
                    key={step.id}
                    onClick={() => setActiveStepId(step.id)}
                    className={`border rounded-xl p-4 transition-all ${
                      activeStepId === step.id
                        ? 'border-cyan-500/60 bg-cyan-500/5 shadow-xs'
                        : 'border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 hover:border-slate-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    {/* Step Title & Actions Row (Matching Screenshot) */}
                    <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-slate-100 dark:border-neutral-800/80">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-slate-400 dark:text-neutral-500 cursor-grab">
                          <GripVertical className="w-4 h-4" />
                        </span>
                        {/* Direct Completion Checkbox */}
                        <label
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 cursor-pointer shrink-0"
                          title={step.progress === 100 ? 'Marcar paso como pendiente' : 'Marcar paso como completado (100%)'}
                        >
                          <input
                            type="checkbox"
                            checked={step.progress === 100}
                            onChange={() => handleToggleStepComplete(section.id, step.id)}
                            className="w-4 h-4 rounded border-slate-300 dark:border-neutral-700 text-blue-600 dark:text-cyan-500 focus:ring-0 cursor-pointer"
                          />
                        </label>
                        <h4 className={`text-sm font-semibold truncate ${step.progress === 100 ? 'line-through text-slate-400 dark:text-neutral-500' : 'text-slate-900 dark:text-neutral-100'}`}>
                          {step.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Auto / Mode Badge */}
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/60">
                          {step.mode}
                        </span>

                        <span className={`text-xs font-mono font-semibold tabular-nums px-2 py-0.5 rounded-md ${
                          step.progress === 100
                            ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : step.progress > 0
                            ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-cyan-300 border border-blue-300 dark:border-blue-800'
                            : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700'
                        }`}>
                          {step.progress || 0}%
                        </span>

                        <div className="flex items-center gap-1 text-slate-400 dark:text-neutral-400 ml-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingStep({ sectionId: section.id, step, isNew: false });
                            }}
                            className="p-1 hover:text-cyan-500 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                            title="Editar título y propiedades del paso"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveStep(section.id, stepIdx, 'up');
                            }}
                            disabled={stepIdx === 0}
                            className="p-1 hover:text-slate-700 dark:hover:text-neutral-200 disabled:opacity-30 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                            title="Subir paso"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveStep(section.id, stepIdx, 'down');
                            }}
                            disabled={stepIdx === section.steps.length - 1}
                            className="p-1 hover:text-slate-700 dark:hover:text-neutral-200 disabled:opacity-30 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                            title="Bajar paso"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateStep(section.id, step);
                            }}
                            className="p-1 hover:text-slate-700 dark:hover:text-neutral-200 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                            title="Duplicar paso"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              promptDeleteStep(section.id, step);
                            }}
                            className="p-1 hover:text-rose-500 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                            title="Eliminar paso"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Step Blocks Content */}
                    <div className="space-y-3 pl-2 sm:pl-6">
                      {step.desc && (
                        <div className="p-3 bg-blue-50/50 dark:bg-neutral-850/60 rounded-lg border border-blue-100 dark:border-neutral-800 text-xs text-slate-800 dark:text-neutral-200">
                          <RichTextRenderer content={step.desc} />
                        </div>
                      )}
                      {step.blocks.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-neutral-500 italic py-1">
                          Sin bloques de contenido en este paso. Usa la barra de herramientas abajo para agregar comandos, scripts, checklists, imágenes, o tablas.
                        </p>
                      ) : (
                        step.blocks.map((block, bIdx) => (
                          <div
                            key={block.id}
                            className="text-xs space-y-1.5 group/block p-2.5 rounded-lg border border-slate-100 dark:border-neutral-800/80 bg-slate-50/50 dark:bg-neutral-900/60 hover:border-cyan-500/30 transition-colors relative"
                          >
                            {/* Block header with label and block action buttons (Edit, Up, Down, Delete) */}
                            <div className="flex items-center justify-between gap-2 text-slate-500 dark:text-neutral-400 font-medium text-[11px] pb-1 border-b border-slate-100 dark:border-neutral-800/50">
                              <div className="flex items-center gap-1.5">
                                {block.type === 'checklist' && <CheckSquare className="w-3.5 h-3.5 text-cyan-500" />}
                                {block.type === 'text' && <FileText className="w-3.5 h-3.5 text-slate-400" />}
                                {block.type === 'command' && <Terminal className="w-3.5 h-3.5 text-emerald-500" />}
                                {block.type === 'script' && <FileCode className="w-3.5 h-3.5 text-violet-500" />}
                                {block.type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-amber-500" />}
                                {block.type === 'file' && <Paperclip className="w-3.5 h-3.5 text-blue-500" />}
                                {block.type === 'validation' && <Eye className="w-3.5 h-3.5 text-teal-500" />}
                                {block.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
                                {block.type === 'table' && <TableIcon className="w-3.5 h-3.5 text-indigo-500" />}
                                <span className="font-semibold">{block.label || block.type.toUpperCase()}</span>
                              </div>

                              <div className="flex items-center gap-1 opacity-80 group-hover/block:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setEditingBlock({ sectionId: section.id, stepId: step.id, block })}
                                  className="p-1 hover:text-cyan-500 rounded hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors"
                                  title="Editar contenido de este bloque"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => moveBlock(section.id, step.id, bIdx, 'up')}
                                  disabled={bIdx === 0}
                                  className="p-1 hover:text-slate-700 dark:hover:text-neutral-200 disabled:opacity-30 rounded hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors"
                                  title="Subir bloque"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => moveBlock(section.id, step.id, bIdx, 'down')}
                                  disabled={bIdx === step.blocks.length - 1}
                                  className="p-1 hover:text-slate-700 dark:hover:text-neutral-200 disabled:opacity-30 rounded hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors"
                                  title="Bajar bloque"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteBlock(section.id, step.id, block.id)}
                                  className="p-1 hover:text-rose-500 rounded hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors"
                                  title="Eliminar bloque"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Block 1: Checklist */}
                            {block.type === 'checklist' && (
                              <div className="space-y-1.5 pl-1 pt-1">
                                {block.items?.map((item) => (
                                  <label
                                    key={item.id}
                                    className="flex items-center gap-2.5 cursor-pointer text-slate-700 dark:text-neutral-300 select-none hover:text-slate-900 dark:hover:text-white"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={item.done}
                                      onChange={() =>
                                        handleToggleChecklist(section.id, step.id, block.id, item.id)
                                      }
                                      className="w-4 h-4 rounded border-slate-300 dark:border-neutral-700 text-cyan-600 focus:ring-0 cursor-pointer"
                                    />
                                    <span className={item.done ? 'line-through text-slate-400 dark:text-neutral-500' : ''}>
                                      {item.text}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {/* Block 2: Text */}
                            {block.type === 'text' && (
                              <div className="pt-1">
                                <RichTextRenderer content={block.html} />
                              </div>
                            )}

                            {/* Block 3: Command with 1-click Direct Copy */}
                            {block.type === 'command' && (
                              <div className="bg-slate-950 text-cyan-300 font-mono p-3 rounded-lg flex items-center justify-between border border-slate-800 gap-3">
                                <code className="text-xs break-all select-all flex-1">{block.code}</code>
                                <button
                                  onClick={() => handleCopyText(block.code || '', block.id)}
                                  className={`px-3 py-1 text-xs font-semibold rounded shrink-0 flex items-center gap-1.5 transition-colors ${
                                    copiedBlockId === block.id
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                  }`}
                                  title="Copiar comando al portapapeles"
                                >
                                  {copiedBlockId === block.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-white" />
                                      <span>¡Copiado!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Copiar</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            )}

                            {/* Block 4: Script with Direct Copy and Download */}
                            {block.type === 'script' && (
                              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                                  <span>Archivo: {block.filename || 'script.ps1'}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-violet-400">{block.lang}</span>
                                    <button
                                      onClick={() => handleCopyText(block.code || '', block.id)}
                                      className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1"
                                    >
                                      {copiedBlockId === block.id ? (
                                        <span className="text-emerald-400">¡Copiado!</span>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          <span>Copiar</span>
                                        </>
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleDownloadScript(block.code || '', block.filename)}
                                      className="px-2 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded flex items-center gap-1"
                                    >
                                      <Download className="w-3 h-3" />
                                      <span>Bajar</span>
                                    </button>
                                  </div>
                                </div>
                                <pre className="text-violet-300 font-mono text-[11px] overflow-x-auto max-h-48 whitespace-pre p-1">
                                  {block.code}
                                </pre>
                              </div>
                            )}

                            {/* Block 5: Warning */}
                            {block.type === 'warning' && (
                              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-lg text-amber-800 dark:text-amber-300 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                <div className="flex-1 space-y-1">
                                  <span className="font-bold block text-[11px] uppercase tracking-wider mb-0.5">
                                    {block.level || 'Advertencia'}
                                  </span>
                                  <RichTextRenderer content={block.html} />
                                </div>
                              </div>
                            )}

                            {/* Block 6: Image */}
                            {block.type === 'image' && (
                              <div className="space-y-2 pt-1">
                                {block.path ? (
                                  <DriveImage
                                    src={block.path}
                                    alt={block.caption || 'Captura'}
                                    caption={block.caption}
                                    widthPct={block.widthPct || 100}
                                    showDriveBadge={true}
                                  />
                                ) : (
                                  <div className="p-6 bg-slate-100 dark:bg-neutral-800/60 border border-dashed border-slate-300 dark:border-neutral-700 rounded-lg text-center space-y-2">
                                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                                      Sin imagen asignada todavía.
                                    </p>
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() => handleTriggerUpload(section.id, step.id)}
                                        className="px-3 py-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-300 dark:border-cyan-800 rounded-lg flex items-center gap-1.5"
                                      >
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>Subir Imagen de Disco</span>
                                      </button>
                                      <button
                                        onClick={() => handlePasteImageIntoStep(section.id, step.id)}
                                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg flex items-center gap-1.5"
                                      >
                                        <Clipboard className="w-3.5 h-3.5" />
                                        <span>Pegar de Portapapeles</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Block 7: Validation */}
                            {block.type === 'validation' && (
                              <div className="p-3 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 rounded-lg text-teal-800 dark:text-teal-300 space-y-1.5">
                                <div>
                                  <strong className="block text-[11px] uppercase tracking-wider mb-0.5 font-bold">Resultado Esperado:</strong>
                                  <RichTextRenderer content={block.expected} />
                                </div>
                                {block.observed && (
                                  <div className="pt-1.5 border-t border-teal-200/60 dark:border-teal-800/40">
                                    <strong className="block text-[11px] uppercase tracking-wider mb-0.5 font-bold">Resultado Observado:</strong>
                                    <RichTextRenderer content={block.observed} />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Block 8: Table */}
                            {block.type === 'table' && (
                              <div className="overflow-x-auto border border-slate-200 dark:border-neutral-800 rounded-lg">
                                <table className="w-full text-left text-xs">
                                  <tbody>
                                    {block.rows?.map((row, rIdx) => (
                                      <tr
                                        key={rIdx}
                                        className={
                                          rIdx === 0
                                            ? 'bg-slate-100 dark:bg-neutral-800 font-bold'
                                            : 'border-t border-slate-200 dark:border-neutral-800'
                                        }
                                      >
                                        {row.map((cell, cIdx) => (
                                          <td key={cIdx} className="p-2 border-r last:border-r-0 border-slate-200 dark:border-neutral-800">
                                            {cell}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {/* Block 9: File */}
                            {block.type === 'file' && (
                              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-lg flex items-center justify-between text-blue-900 dark:text-blue-300">
                                <div className="flex items-center gap-2">
                                  <Paperclip className="w-4 h-4" />
                                  <span className="font-semibold">{block.filename || 'archivo.pdf'}</span>
                                </div>
                                <span className="text-[11px] text-blue-500">Documento adjunto</span>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Exactly the Action Toolbar from the User's Screenshot! */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-neutral-800/80 flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-neutral-400">
                      <button
                        onClick={() => handlePasteImageIntoStep(section.id, step.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors font-medium border border-transparent hover:border-cyan-500/30"
                        title="Pegar imagen desde el portapapeles o subir archivo"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                        <span>Pegar imagen</span>
                      </button>

                      <button
                        onClick={() => handleAddBlockToStep(section.id, step.id, 'text')}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors font-medium border border-transparent hover:border-cyan-500/30"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Texto multilínea</span>
                      </button>

                      <button
                        onClick={() => handleAddBlockToStep(section.id, step.id, 'command')}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors font-medium border border-transparent hover:border-cyan-500/30"
                      >
                        <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Comando</span>
                      </button>

                      <button
                        onClick={() => handleAddBlockToStep(section.id, step.id, 'script')}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors font-medium border border-transparent hover:border-cyan-500/30"
                      >
                        <FileCode className="w-3.5 h-3.5 text-violet-500" />
                        <span>Script</span>
                      </button>

                      <button
                        onClick={() => handleAddBlockToStep(section.id, step.id, 'checklist')}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors font-medium border border-transparent hover:border-cyan-500/30"
                      >
                        <CheckSquare className="w-3.5 h-3.5 text-cyan-500" />
                        <span>Checklist</span>
                      </button>

                      <button
                        onClick={() => handleAddBlockToStep(section.id, step.id, 'image')}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors font-medium border border-transparent hover:border-cyan-500/30"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                        <span>Imagen</span>
                      </button>

                      <button
                        onClick={() => handleAddBlockToStep(section.id, step.id, 'file')}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors font-medium border border-transparent hover:border-cyan-500/30"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                        <span>Archivo</span>
                      </button>

                      <button
                        onClick={() => handleAddBlockToStep(section.id, step.id, 'validation')}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors font-medium border border-transparent hover:border-cyan-500/30"
                      >
                        <Eye className="w-3.5 h-3.5 text-teal-500" />
                        <span>Validación</span>
                      </button>

                      <button
                        onClick={() => handleAddBlockToStep(section.id, step.id, 'warning')}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors font-medium border border-transparent hover:border-cyan-500/30"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        <span>Advertencia</span>
                      </button>

                      <button
                        onClick={() => handleAddBlockToStep(section.id, step.id, 'table')}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors font-medium border border-transparent hover:border-cyan-500/30"
                      >
                        <TableIcon className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Tabla</span>
                      </button>
                    </div>
                  </div>
                ))
              )}

              {/* Bottom "+ Paso" Button (Matching Screenshot) */}
              <button
                onClick={() => handleOpenAddStep(section.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-neutral-200 bg-white dark:bg-neutral-800/80 hover:bg-slate-100 dark:hover:bg-neutral-700 border border-slate-300 dark:border-neutral-700 rounded-lg shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Paso</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Button to add a new section */}
      <div className="pt-2">
        <button
          onClick={handleOpenAddSection}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 border border-cyan-300 dark:border-cyan-800/60 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Sección</span>
        </button>
      </div>

      {/* Edit Section Modal */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl p-5 shadow-2xl space-y-4">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">Editar Título de Sección</h4>
            <input
              type="text"
              value={editingSection.title}
              onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
              className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-neutral-100 focus:outline-hidden focus:border-cyan-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingSection(null)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateSectionTitle}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Step Modal */}
      {editingStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">
              {editingStep.isNew ? 'Nuevo Paso del Procedimiento' : 'Editar Propiedades del Paso'}
            </h4>

            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Título del Paso *</label>
              <input
                type="text"
                value={editingStep.step.title}
                onChange={(e) =>
                  setEditingStep({
                    ...editingStep,
                    step: { ...editingStep.step, title: e.target.value },
                  })
                }
                placeholder="Ej. Configurar variables y puertos en el firewall"
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            <div>
              <RichTextEditor
                label="Instrucciones o Descripción del Paso (Formato Enriquecido)"
                value={editingStep.step.desc || ''}
                onChange={(val) =>
                  setEditingStep({
                    ...editingStep,
                    step: { ...editingStep.step, desc: val },
                  })
                }
                placeholder="Escribe el contexto, instrucciones paso a paso o notas del procedimiento... Usa negritas, cursivas, títulos, tamaños y listas."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 dark:text-neutral-300 block mb-1">Modo de Avance</label>
                <select
                  value={editingStep.step.mode}
                  onChange={(e) =>
                    setEditingStep({
                      ...editingStep,
                      step: { ...editingStep.step, mode: e.target.value as any },
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-2.5 py-2 text-slate-900 dark:text-neutral-200"
                >
                  <option value="check">Casilla (0 o 100%)</option>
                  <option value="checklist">Automático por Checklist</option>
                  <option value="manual">Manual con Comentario</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 dark:text-neutral-300 block mb-1">Peso en la Guía</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={editingStep.step.weight}
                  onChange={(e) =>
                    setEditingStep({
                      ...editingStep,
                      step: { ...editingStep.step, weight: Number(e.target.value) || 1 },
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-2.5 py-2 text-slate-900 dark:text-neutral-200 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-neutral-200">
                <input
                  type="checkbox"
                  checked={editingStep.step.evaluable}
                  onChange={(e) =>
                    setEditingStep({
                      ...editingStep,
                      step: { ...editingStep.step, evaluable: e.target.checked },
                    })
                  }
                  className="rounded border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-cyan-600 focus:ring-0"
                />
                <span>Paso evaluable (contribuye al porcentaje de avance de la guía)</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-neutral-800">
              <button
                onClick={() => setEditingStep(null)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveStep}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg"
              >
                Guardar Paso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Block Editor Modal for ALL block types */}
      {editingBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-2">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                <span>Editar Bloque: {editingBlock.block.type.toUpperCase()}</span>
              </h4>
              <button onClick={() => setEditingBlock(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Block Label */}
            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Etiqueta del Bloque (opcional)</label>
              <input
                type="text"
                value={editingBlock.block.label || ''}
                onChange={(e) =>
                  setEditingBlock({
                    ...editingBlock,
                    block: { ...editingBlock.block, label: e.target.value },
                  })
                }
                placeholder="Ej. Paso preparatorio, Salida de consola..."
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100"
              />
            </div>

            {/* Type Specific Fields */}
            {editingBlock.block.type === 'text' && (
              <div>
                <RichTextEditor
                  label="Contenido con Formato Enriquecido (Títulos H1/H2/H3, Negritas, Cursivas, Tamaños de Letra, Listas, Colores)"
                  value={editingBlock.block.html || ''}
                  onChange={(val) =>
                    setEditingBlock({
                      ...editingBlock,
                      block: { ...editingBlock.block, html: val },
                    })
                  }
                  placeholder="Escribe las instrucciones detalladas del procedimiento... Usa la barra superior para aplicar negritas, cursivas, títulos, tamaños de letra y listas para que se entienda claramente."
                  rows={8}
                />
              </div>
            )}

            {editingBlock.block.type === 'command' && (
              <div className="space-y-3">
                <div>
                  <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-mono">Línea de Comando</label>
                  <textarea
                    rows={3}
                    value={editingBlock.block.code || ''}
                    onChange={(e) =>
                      setEditingBlock({
                        ...editingBlock,
                        block: { ...editingBlock.block, code: e.target.value },
                      })
                    }
                    placeholder="curl -k -X POST https://{{IP_SERVIDOR}}:8443/api"
                    className="w-full bg-neutral-950 border border-slate-700 dark:border-neutral-700 rounded-lg p-3 text-cyan-300 font-mono text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 dark:text-neutral-400 block mb-1">Lenguaje / Shell</label>
                    <select
                      value={editingBlock.block.lang || 'bash'}
                      onChange={(e) =>
                        setEditingBlock({
                          ...editingBlock,
                          block: { ...editingBlock.block, lang: e.target.value },
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg p-2 text-slate-900 dark:text-neutral-200"
                    >
                      <option value="bash">Bash / Linux</option>
                      <option value="powershell">PowerShell / Windows</option>
                      <option value="cmd">CMD / Batch</option>
                      <option value="sql">SQL Query</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {editingBlock.block.type === 'script' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 dark:text-neutral-400 block mb-1">Nombre de Archivo</label>
                    <input
                      type="text"
                      value={editingBlock.block.filename || 'script.ps1'}
                      onChange={(e) =>
                        setEditingBlock({
                          ...editingBlock,
                          block: { ...editingBlock.block, filename: e.target.value },
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-neutral-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 dark:text-neutral-400 block mb-1">Lenguaje</label>
                    <select
                      value={editingBlock.block.lang || 'powershell'}
                      onChange={(e) =>
                        setEditingBlock({
                          ...editingBlock,
                          block: { ...editingBlock.block, lang: e.target.value },
                        })
                      }
                      className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-neutral-200"
                    >
                      <option value="powershell">PowerShell</option>
                      <option value="bash">Bash</option>
                      <option value="python">Python</option>
                      <option value="sql">SQL</option>
                      <option value="yaml">YAML</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-mono">Código del Script</label>
                  <textarea
                    rows={8}
                    value={editingBlock.block.code || ''}
                    onChange={(e) =>
                      setEditingBlock({
                        ...editingBlock,
                        block: { ...editingBlock.block, code: e.target.value },
                      })
                    }
                    className="w-full bg-neutral-950 border border-slate-700 dark:border-neutral-700 rounded-lg p-3 text-violet-300 font-mono text-xs whitespace-pre"
                  />
                </div>
              </div>
            )}

            {editingBlock.block.type === 'checklist' && (
              <div className="space-y-3">
                <label className="text-slate-700 dark:text-neutral-300 block font-medium">Elementos del Checklist</label>
                <div className="space-y-2">
                  {(editingBlock.block.items || []).map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={(e) => {
                          const updatedItems = (editingBlock.block.items || []).map((it) =>
                            it.id === item.id ? { ...it, done: e.target.checked } : it
                          );
                          setEditingBlock({
                            ...editingBlock,
                            block: { ...editingBlock.block, items: updatedItems },
                          });
                        }}
                        className="rounded border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-cyan-600"
                      />
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => {
                          const updatedItems = (editingBlock.block.items || []).map((it) =>
                            it.id === item.id ? { ...it, text: e.target.value } : it
                          );
                          setEditingBlock({
                            ...editingBlock,
                            block: { ...editingBlock.block, items: updatedItems },
                          });
                        }}
                        className="flex-1 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded px-2.5 py-1 text-slate-900 dark:text-neutral-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updatedItems = (editingBlock.block.items || []).filter(
                            (it) => it.id !== item.id
                          );
                          setEditingBlock({
                            ...editingBlock,
                            block: { ...editingBlock.block, items: updatedItems },
                          });
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newItem: ChecklistItem = {
                      id: `chk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                      text: 'Nuevo ítem de verificación',
                      done: false,
                    };
                    setEditingBlock({
                      ...editingBlock,
                      block: {
                        ...editingBlock.block,
                        items: [...(editingBlock.block.items || []), newItem],
                      },
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-cyan-700 dark:text-cyan-400 border border-slate-200 dark:border-neutral-700 rounded-lg text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Ítem al Checklist</span>
                </button>
              </div>
            )}

            {editingBlock.block.type === 'image' && (
              <div className="space-y-3">
                <div>
                  <label className="text-slate-700 dark:text-neutral-300 block mb-1">Pie de Foto / Título</label>
                  <input
                    type="text"
                    value={editingBlock.block.caption || ''}
                    onChange={(e) =>
                      setEditingBlock({
                        ...editingBlock,
                        block: { ...editingBlock.block, caption: e.target.value },
                      })
                    }
                    placeholder="Descripción de la captura de pantalla..."
                    className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100"
                  />
                </div>

                <div>
                  <label className="text-slate-700 dark:text-neutral-300 block mb-1">Ancho en Pantalla (%)</label>
                  <select
                    value={editingBlock.block.widthPct || 100}
                    onChange={(e) =>
                      setEditingBlock({
                        ...editingBlock,
                        block: { ...editingBlock.block, widthPct: Number(e.target.value) },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-2.5 py-2 text-slate-900 dark:text-neutral-200"
                  >
                    <option value={100}>100% (Ancho completo)</option>
                    <option value={75}>75% (Mediano-Grande)</option>
                    <option value={50}>50% (Medio)</option>
                    <option value={25}>25% (Miniatura)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-neutral-300 block mb-1">Seleccionar o Subir Imagen</label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const driveToken = await getAccessToken();
                        if (driveToken) {
                          try {
                            const uploaded = await uploadImageToDrive(file, file.name);
                            setEditingBlock({
                              ...editingBlock,
                              block: {
                                ...editingBlock.block,
                                path: uploaded.gdriveUrl,
                                caption: editingBlock.block.caption || file.name,
                              },
                            });
                            return;
                          } catch (err) {
                            console.warn('Fallback to local image:', err);
                          }
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          setEditingBlock({
                            ...editingBlock,
                            block: {
                              ...editingBlock.block,
                              path: reader.result as string,
                              caption: editingBlock.block.caption || file.name,
                            },
                          });
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="text-xs text-slate-500 dark:text-neutral-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
                    />
                  </div>
                  {editingBlock.block.path && (
                    <div className="mt-2 p-2 bg-slate-100 dark:bg-neutral-950 rounded-lg border border-slate-200 dark:border-neutral-800 flex justify-center">
                      <DriveImage
                        src={editingBlock.block.path}
                        alt="Vista previa"
                        className="max-h-48 object-contain rounded"
                        showDriveBadge={true}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {editingBlock.block.type === 'warning' && (
              <div className="space-y-3">
                <div>
                  <label className="text-slate-700 dark:text-neutral-300 block mb-1">Nivel de Advertencia</label>
                  <select
                    value={editingBlock.block.level || 'Precaución'}
                    onChange={(e) =>
                      setEditingBlock({
                        ...editingBlock,
                        block: { ...editingBlock.block, level: e.target.value as any },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-2.5 py-2 text-slate-900 dark:text-neutral-200"
                  >
                    <option value="Precaución">Precaución (Ámbar)</option>
                    <option value="Peligro">Peligro Crítico (Rojo)</option>
                    <option value="Información">Información Importante (Azul)</option>
                  </select>
                </div>
                <div>
                  <RichTextEditor
                    label="Mensaje de Advertencia (Formato Enriquecido)"
                    value={editingBlock.block.html || ''}
                    onChange={(val) =>
                      setEditingBlock({
                        ...editingBlock,
                        block: { ...editingBlock.block, html: val },
                      })
                    }
                    placeholder="Describe la advertencia técnica o precaución operativa..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {editingBlock.block.type === 'validation' && (
              <div className="space-y-3">
                <div>
                  <RichTextEditor
                    label="Resultado Esperado (Formato Enriquecido)"
                    value={editingBlock.block.expected || ''}
                    onChange={(val) =>
                      setEditingBlock({
                        ...editingBlock,
                        block: { ...editingBlock.block, expected: val },
                      })
                    }
                    placeholder="Describe el resultado esperado que confirma el éxito del paso..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-neutral-300 block mb-1">Resultado Observado (opcional)</label>
                  <textarea
                    rows={2}
                    value={editingBlock.block.observed || ''}
                    onChange={(e) =>
                      setEditingBlock({
                        ...editingBlock,
                        block: { ...editingBlock.block, observed: e.target.value },
                      })
                    }
                    className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg p-2.5 text-slate-900 dark:text-neutral-100"
                  />
                </div>
              </div>
            )}

            {editingBlock.block.type === 'table' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 dark:text-neutral-300 block font-medium">Contenido y Columnas de la Tabla</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const currentRows = editingBlock.block.rows || [
                          ['Columna 1', 'Columna 2'],
                          ['Dato 1', 'Dato 2'],
                        ];
                        const colCount = currentRows[0]?.length || 2;
                        const newColName = `Columna ${colCount + 1}`;
                        const newRows = currentRows.map((row, rIdx) => [
                          ...row,
                          rIdx === 0 ? newColName : 'Dato',
                        ]);
                        setEditingBlock({
                          ...editingBlock,
                          block: { ...editingBlock.block, rows: newRows },
                        });
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-900/60 dark:hover:bg-cyan-800 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700 rounded-lg text-xs font-medium transition-colors"
                      title="Agregar una nueva columna a la tabla"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Agregar Columna</span>
                    </button>
                    {(editingBlock.block.rows?.[0]?.length || 0) > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const currentRows = editingBlock.block.rows || [];
                          if (!currentRows[0] || currentRows[0].length <= 1) return;
                          const newRows = currentRows.map((row) => row.slice(0, -1));
                          setEditingBlock({
                            ...editingBlock,
                            block: { ...editingBlock.block, rows: newRows },
                          });
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-medium transition-colors"
                        title="Eliminar la última columna"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>- Eliminar Columna</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 overflow-x-auto p-2 bg-slate-50 dark:bg-neutral-900/80 rounded-xl border border-slate-200 dark:border-neutral-800">
                  {(editingBlock.block.rows || []).map((row, rIdx) => (
                    <div key={rIdx} className="flex items-center gap-2 min-w-[340px]">
                      <span className="font-mono text-slate-400 dark:text-neutral-500 text-[10px] w-6">#{rIdx + 1}</span>
                      {row.map((cell, cIdx) => (
                        <div key={cIdx} className="flex-1 min-w-[90px] relative">
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => {
                              const newRows = (editingBlock.block.rows || []).map((r, ri) =>
                                ri === rIdx
                                  ? r.map((c, ci) => (ci === cIdx ? e.target.value : c))
                                  : r
                              );
                              setEditingBlock({
                                ...editingBlock,
                                block: { ...editingBlock.block, rows: newRows },
                              });
                            }}
                            placeholder={rIdx === 0 ? `Encabezado ${cIdx + 1}` : 'Valor...'}
                            className={`w-full bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded px-2.5 py-1.5 text-slate-900 dark:text-neutral-200 text-xs ${
                              rIdx === 0 ? 'font-bold bg-slate-100 dark:bg-neutral-750 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800/60' : ''
                            }`}
                          />
                        </div>
                      ))}
                      {rIdx > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newRows = (editingBlock.block.rows || []).filter((_, ri) => ri !== rIdx);
                            setEditingBlock({
                              ...editingBlock,
                              block: { ...editingBlock.block, rows: newRows },
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:text-rose-400 dark:hover:bg-neutral-800 rounded transition-colors"
                          title="Eliminar esta fila"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const colCount = editingBlock.block.rows?.[0]?.length || 3;
                      const newRow = Array(colCount).fill('Dato');
                      setEditingBlock({
                        ...editingBlock,
                        block: {
                          ...editingBlock.block,
                          rows: [...(editingBlock.block.rows || []), newRow],
                        },
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-cyan-700 dark:text-cyan-400 rounded-lg text-xs font-medium border border-slate-200 dark:border-neutral-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Fila a la Tabla</span>
                  </button>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-neutral-800">
              <button
                onClick={() => setEditingBlock(null)}
                className="px-3.5 py-1.5 text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-neutral-800 bg-slate-100 dark:bg-neutral-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveBlock}
                className="px-4 py-1.5 font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-sm"
              >
                Guardar Bloque
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Section Modal */}
      {isAddSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                Nueva Sección de la Guía
              </h3>
              <button
                onClick={() => setIsAddSectionModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-neutral-300 block mb-1.5">
                Título de la Sección *
              </label>
              <input
                type="text"
                autoFocus
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmAddSection()}
                placeholder="Ej. 1. Preparación del Entorno y Verificaciones Previas"
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-neutral-100 focus:outline-hidden focus:border-cyan-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsAddSectionModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAddSection}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-sm"
              >
                Crear Sección
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal for Deleting Section / Step */}
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que deseas eliminar ${deleteConfirm?.title}? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={() => {
          if (!deleteConfirm) return;
          if (deleteConfirm.type === 'section') {
            executeDeleteSection(deleteConfirm.sectionId);
          } else if (deleteConfirm.type === 'step' && deleteConfirm.stepId) {
            executeDeleteStep(deleteConfirm.sectionId, deleteConfirm.stepId);
          }
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
};
