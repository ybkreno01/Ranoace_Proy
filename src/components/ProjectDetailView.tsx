import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Activity,
  AlertTriangle,
  Plus,
  Trash2,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Layers,
  BookOpen,
  CheckSquare,
  Paperclip,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Edit,
  Code2,
  RefreshCw,
  LayoutGrid,
  List,
  Sparkles,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Info,
  Check,
  X,
  Sliders,
  PieChart,
  Terminal,
  SlidersHorizontal,
  Eye,
  Play,
  Unlink,
  Users,
  Mail,
  Phone,
  Building2,
  ClipboardList,
  Filter,
  Search,
  Share2,
  Pencil,
} from 'lucide-react';
import { store } from '../services/store';
import { Project, Task, TaskStatus, Guide, Note, ProjectFile, PlanTpl, Section, Script, Trouble, CatalogItem } from '../types';
import {
  calculateProjectProgress,
  calculateActivityContribution,
  calculateGuideProgress,
} from '../services/businessRules';
import { GuideEditor } from './GuideEditor';
import { ProjectVisualProgressBoard } from './ProjectVisualProgressBoard';
import { ProjectExecutiveSummary } from './ProjectExecutiveSummary';
import { ConfirmModal } from './modals/ConfirmModal';
import { ScriptTroubleViewerModal } from './ScriptTroubleViewerModal';
import { exportSingleItemAsJson } from '../services/singleItemTransfer';
import { RichTextRenderer } from './common/RichTextRenderer';
import { BrandLogo } from './common/BrandLogo';

interface ProjectDetailViewProps {
  project: Project;
  onBack: () => void;
  onOpenTaskModal: (task?: Task, projectId?: string, sectionId?: string) => void;
  onOpenNoteModal: (projectId: string) => void;
  onOpenScriptModal?: (script?: Script | null) => void;
  onOpenTroubleModal?: (trouble?: Trouble | null) => void;
  onOpenProjectModal?: (project: Project) => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  onBack,
  onOpenTaskModal,
  onOpenNoteModal,
  onOpenScriptModal,
  onOpenTroubleModal,
  onOpenProjectModal,
}) => {
  const state = store.getState();
  const [activeTab, setActiveTab] = useState<
    'plan' | 'stakeholders' | 'summary' | 'guides' | 'scripts' | 'visual'
  >('plan');

  // Plan subview toggle: 'board' (Tablero por etapas) vs 'detailed' (Plan detallado) vs 'visual' (Gráficos)
  const [planSubView, setPlanSubView] = useState<'board' | 'detailed' | 'visual'>('board');

  // 1-Click Editable Project Title state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(project.name);

  useEffect(() => {
    setTitleDraft(project.name);
  }, [project.name]);

  // Stakeholders / Notes / Tasks sub-tab state
  const [stakeholdersSubTab, setStakeholdersSubTab] = useState<'all' | 'notes' | 'tasks' | 'contacts'>('all');
  const [noteTypeFilter, setNoteTypeFilter] = useState<string>('all');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskOwner, setQuickTaskOwner] = useState('');
  const [quickTaskPriority, setQuickTaskPriority] = useState<'Baja' | 'Media' | 'Alta' | 'Crítica'>('Media');
  const [isAddStakeholderModalOpen, setIsAddStakeholderModalOpen] = useState(false);
  const [newStakeholderName, setNewStakeholderName] = useState('');
  const [newStakeholderRole, setNewStakeholderRole] = useState('');
  const [newStakeholderEmail, setNewStakeholderEmail] = useState('');
  const [newStakeholderPhone, setNewStakeholderPhone] = useState('');
  const [newStakeholderCompany, setNewStakeholderCompany] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [stakeholderToDelete, setStakeholderToDelete] = useState<{ id: string; name: string } | null>(null);

  // Section editor modal state
  const [editingSectionModal, setEditingSectionModal] = useState<{
    isOpen: boolean;
    section: Section | null;
  }>({ isOpen: false, section: null });
  const [sectionFormName, setSectionFormName] = useState('');
  const [sectionFormWeight, setSectionFormWeight] = useState<number>(10);
  const [sectionFormGuideId, setSectionFormGuideId] = useState<string>('');

  // Template import modal state
  const [isImportTemplateModalOpen, setIsImportTemplateModalOpen] = useState(false);
  const [selectedTemplateToImport, setSelectedTemplateToImport] = useState<string>('');
  const [importMode, setImportMode] = useState<'replace' | 'append' | 'singleSection'>('replace');
  const [selectedSingleSectionId, setSelectedSingleSectionId] = useState<string>('');

  // Clear work plan confirmation modal
  const [isClearPlanModalOpen, setIsClearPlanModalOpen] = useState(false);

  // Active guide in guides tab
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);

  // Task Activity Detail Modal ("Ver Detalle") state
  const [detailTaskModal, setDetailTaskModal] = useState<{
    isOpen: boolean;
    task: Task | null;
  }>({ isOpen: false, task: null });
  const [detailTaskGuideId, setDetailTaskGuideId] = useState<string>('');
  const [newChecklistText, setNewChecklistText] = useState('');

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Drag and drop state for activities
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (secId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [secId]: prev[secId] === undefined ? false : !prev[secId],
    }));
  };

  // Get project tasks
  const projectTasks = useMemo(() => {
    return Object.values(state.records).filter(
      (r: any) => r.kind === 'task' && r.projectId === project.id && !r.deletedAt
    ) as Task[];
  }, [state.records, project.id]);

  // All guides for linking & calculations
  const allGuides = useMemo(() => {
    const list: Record<string, Guide> = {};
    Object.values(state.records).forEach((r: any) => {
      if ((r.kind === 'guide' || r.kind === 'pguide') && !r.deletedAt) {
        list[r.id] = r;
      }
    });
    return list;
  }, [state.records]);

  // Project progress calculation
  const calc = useMemo(() => {
    return calculateProjectProgress(project, projectTasks, allGuides);
  }, [project, projectTasks, allGuides]);

  const sections = project.plan?.sections || [];

  // Library guides are templates. Convert any legacy direct project reference into
  // a private project copy before it can be opened in the editor.
  useEffect(() => {
    const legacyIds = new Set<string>([
      ...projectTasks.map((task) => task.guideRef),
      ...sections.map((section) => section.guideTplId),
    ].filter((id): id is string => Boolean(id) && state.records[id!]?.kind === 'guide'));
    if (!legacyIds.size) return;

    const copies: Guide[] = [];
    const copyIds = new Map<string, string>();
    legacyIds.forEach((sourceId) => {
      const source = state.records[sourceId] as Guide;
      const existing = Object.values(state.records).find((record: any) => record.kind === 'pguide' && record.projectId === project.id && record.sourceId === sourceId) as Guide | undefined;
      const copyId = existing?.id || `pguide-${project.id}-${sourceId}`;
      copyIds.set(sourceId, copyId);
      if (!existing) copies.push({ ...source, id: copyId, kind: 'pguide', name: `${source.name} (${project.name})`, projectId: project.id, sourceId, sourceVersion: source.version });
    });
    if (copies.length) store.putRecords(copies);
    const updatedTasks = projectTasks.filter((task) => task.guideRef && copyIds.has(task.guideRef)).map((task) => ({ ...task, guideRef: copyIds.get(task.guideRef!) }));
    if (updatedTasks.length) store.putRecords(updatedTasks);
    const updatedSections = sections.map((section) => section.guideTplId && copyIds.has(section.guideTplId) ? { ...section, guideTplId: copyIds.get(section.guideTplId) } : section);
    if (updatedSections.some((section, index) => section !== sections[index])) store.putRecord({ ...project, plan: { ...project.plan, sections: updatedSections } });
  }, [project, projectTasks, sections, state.records]);

  // A project exposes only its private guide copies; templates stay in Library.
  const projectGuides = useMemo(() => {
    return Object.values(state.records).filter(
      (r: any) =>
        !r.deletedAt &&
        r.kind === 'pguide' && r.projectId === project.id
    ) as Guide[];
  }, [state.records, project.id]);

  const libraryGuides = useMemo(() => {
    return Object.values(state.records).filter(
      (r: any) => r.kind === 'guide' && !r.deletedAt
    ) as Guide[];
  }, [state.records]);

  // Scripts and Troubleshooting in project
  const projectScripts = useMemo(() => {
    return Object.values(state.records).filter(
      (r: any) => r.kind === 'script' && !r.deletedAt && (r.projects || []).includes(project.id)
    ) as Script[];
  }, [state.records, project.id]);

  const libraryScripts = useMemo(() => {
    return Object.values(state.records).filter(
      (r: any) => r.kind === 'script' && !r.deletedAt
    ) as Script[];
  }, [state.records]);

  const projectTroubles = useMemo(() => {
    return Object.values(state.records).filter(
      (r: any) => r.kind === 'trouble' && !r.deletedAt && (r.projects || []).includes(project.id)
    ) as Trouble[];
  }, [state.records, project.id]);

  const libraryTroubles = useMemo(() => {
    return Object.values(state.records).filter(
      (r: any) => r.kind === 'trouble' && !r.deletedAt
    ) as Trouble[];
  }, [state.records]);

  // Notes / Minutas for this project
  const projectNotes = useMemo(() => {
    return Object.values(state.records).filter(
      (r: any) => r.kind === 'note' && r.projectId === project.id && !r.deletedAt
    ) as Note[];
  }, [state.records, project.id]);

  // Stakeholders / Contacts for this project
  const projectStakeholders = useMemo(() => {
    const contactIds = new Set(project.contacts || []);
    const list: Array<{
      id: string;
      name: string;
      email?: string;
      phone?: string;
      role?: string;
      company?: string;
      color?: string;
    }> = [];

    // Catalog contacts linked to this project
    Object.values(state.records).forEach((r: any) => {
      if (r.kind === 'contact' && !r.deletedAt && (contactIds.has(r.id) || contactIds.has(r.email))) {
        list.push({
          id: r.id,
          name: r.name,
          email: r.email,
          phone: r.phone,
          role: r.role,
          company: r.group || r.orgId,
          color: r.color,
        });
      }
    });

    // Custom strings in project.contacts
    const matched = new Set(list.map((c) => c.id));
    (project.contacts || []).forEach((c, idx) => {
      if (!matched.has(c) && c && c.trim()) {
        const isEmail = c.includes('@');
        list.push({
          id: `custom-contact-${idx}-${c}`,
          name: isEmail ? c.split('@')[0] : c,
          email: isEmail ? c : undefined,
          role: 'Involucrado del Proyecto',
          company: 'Equipo',
        });
      }
    });

    return list;
  }, [state.records, project.contacts]);

  // Modals state for guides and scripts
  const [guideToDelete, setGuideToDelete] = useState<Guide | null>(null);
  const [isLinkGuideModalOpen, setIsLinkGuideModalOpen] = useState(false);
  const [scriptViewerItem, setScriptViewerItem] = useState<Script | Trouble | null>(null);
  const [itemToUnlink, setItemToUnlink] = useState<{ item: Script | Trouble; type: 'script' | 'trouble' } | null>(null);
  const [isLinkScriptModalOpen, setIsLinkScriptModalOpen] = useState(false);
  const [isLinkTroubleModalOpen, setIsLinkTroubleModalOpen] = useState(false);
  const [scriptFilterTab, setScriptFilterTab] = useState<'all' | 'scripts' | 'troubles'>('all');

  // Columns visibility state for Activities Table in Plan Detallado
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    priority: true,
    owner: true,
    guide: true,
    duration: true,
    weight: true,
    dates: true,
    progress: true,
    contribution: true,
  });

  // Templates from technical library
  const allTemplates = useMemo(() => {
    return Object.values(state.records).filter(
      (r: any) => r.kind === 'plantpl' && !r.deletedAt
    ) as PlanTpl[];
  }, [state.records]);

  // Brands and clients
  const brand = useMemo(() => {
    return project.brandId ? (state.records[project.brandId] as any) : null;
  }, [state.records, project.brandId]);

  const client = useMemo(() => {
    return project.clientId ? (state.records[project.clientId] as any) : null;
  }, [state.records, project.clientId]);

  const brandColor = brand?.color || '#06b6d4';

  // Status counts for progress dashboard
  const statusCounts = useMemo(() => {
    const counts = {
      Pendiente: 0,
      'En curso': 0,
      'En espera': 0,
      'En validación': 0,
      Completado: 0,
    };
    projectTasks.forEach((t) => {
      if (counts[t.status] !== undefined) {
        counts[t.status]++;
      } else {
        counts.Pendiente++;
      }
    });
    return counts;
  }, [projectTasks]);

  // Inline progress update
  const handleInlineProgressChange = (task: Task, progressVal: number) => {
    const p = Math.max(0, Math.min(100, progressVal));
    const isCompleted = p === 100;
    const nowStr = new Date().toISOString().split('T')[0];

    const updated: Task = {
      ...task,
      progress: p,
      status: isCompleted ? 'Completado' : p > 0 ? 'En curso' : 'Pendiente',
      realStart: p > 0 && !task.realStart ? nowStr : task.realStart,
      realEnd: p === 100 ? nowStr : undefined,
      updatedAt: new Date().toISOString(),
    };
    store.putRecord(updated);
  };

  // Duplicate task
  const handleDuplicateTask = (task: Task) => {
    const newId = `task-${project.id}-${Date.now()}`;
    const duplicated: Task = {
      ...task,
      id: newId,
      title: `${task.title} (Copia)`,
      status: 'Pendiente',
      progress: 0,
      realStart: undefined,
      realEnd: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.putRecord(duplicated);
    showToast(`Actividad duplicada: "${duplicated.title}"`);
  };

  // Delete task
  const handleDeleteTask = (task: Task) => {
    store.deleteRecord(task.id, true);
    showToast(`Actividad eliminada.`);
  };

  // Reorder task within section or move with arrows
  const handleMoveTaskOrder = (task: Task, direction: 'up' | 'down') => {
    const sectionTasks = projectTasks
      .filter((t) => t.sectionId === task.sectionId)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const currentIndex = sectionTasks.findIndex((t) => t.id === task.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sectionTasks.length) return;

    const targetTask = sectionTasks[targetIndex];
    const updatedTasks = [
      { ...task, order: targetIndex },
      { ...targetTask, order: currentIndex },
    ];
    store.putRecords(updatedTasks);
  };

  // Drag and drop task reordering
  const handleTaskDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleTaskDropOnSection = (e: React.DragEvent, targetSectionId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = projectTasks.find((t) => t.id === taskId);
    if (task && task.sectionId !== targetSectionId) {
      store.putRecord({
        ...task,
        sectionId: targetSectionId,
        updatedAt: new Date().toISOString(),
      });
      showToast(`Actividad movida a la nueva etapa`);
    }
    setDraggedTaskId(null);
  };

  // Reorder section
  const handleMoveSectionOrder = (sectionId: string, direction: 'up' | 'down') => {
    const idx = sections.findIndex((s) => s.id === sectionId);
    if (idx === -1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const newSections = [...sections];
    const [moved] = newSections.splice(idx, 1);
    newSections.splice(targetIdx, 0, moved);

    const reordered = newSections.map((s, i) => ({ ...s, order: i }));
    store.putRecord({
      ...project,
      plan: {
        ...project.plan,
        sections: reordered,
      },
    });
  };

  // Open Section Modal
  const handleOpenAddSection = () => {
    setSectionFormName(`Etapa ${sections.length + 1}: `);
    setSectionFormWeight(15);
    setSectionFormGuideId('');
    setEditingSectionModal({ isOpen: true, section: null });
  };

  const handleOpenEditSection = (sec: Section) => {
    setSectionFormName(sec.name);
    setSectionFormWeight(sec.weight);
    setSectionFormGuideId(sec.guideTplId || '');
    setEditingSectionModal({ isOpen: true, section: sec });
  };

  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionFormName.trim()) return;

    if (editingSectionModal.section) {
      const updated = sections.map((s) =>
        s.id === editingSectionModal.section?.id
          ? {
              ...s,
              name: sectionFormName.trim(),
              weight: Number(sectionFormWeight) || 0,
              guideTplId: sectionFormGuideId || undefined,
            }
          : s
      );
      store.putRecord({
        ...project,
        plan: {
          ...project.plan,
          sections: updated,
        },
      });
      showToast('Etapa actualizada.');
    } else {
      const newSec: Section = {
        id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: sectionFormName.trim(),
        weight: Number(sectionFormWeight) || 10,
        phaseId: 'ph-1',
        order: sections.length,
        guideTplId: sectionFormGuideId || undefined,
      };
      store.putRecord({
        ...project,
        plan: {
          ...project.plan,
          sections: [...sections, newSec],
        },
      });
      showToast('Nueva etapa creada.');
    }

    setEditingSectionModal({ isOpen: false, section: null });
  };

  const handleDeleteSection = (secId: string) => {
    const updated = sections.filter((s) => s.id !== secId);
    store.putRecord({
      ...project,
      plan: {
        ...project.plan,
        sections: updated,
      },
    });
    showToast('Etapa eliminada del plan.');
  };

  // Import / Apply Template to this project
  const handleApplyTemplate = () => {
    const tpl = allTemplates.find((t) => t.id === selectedTemplateToImport);
    if (!tpl) return;

    const now = new Date().toISOString();

    if (importMode === 'replace') {
      // Replaces plan completely
      // 1. Soft-delete old project tasks
      projectTasks.forEach((t) => store.deleteRecord(t.id, true));

      // 2. Set new sections
      const newSections: Section[] = (tpl.sections || []).map((s, idx) => ({
        id: s.id,
        name: s.name,
        weight: s.weight,
        phaseId: s.phaseId,
        order: idx,
        guideTplId: s.guideTplId,
      }));

      store.putRecord({
        ...project,
        planTplId: tpl.id,
        plan: {
          phases: (tpl.phases || []).map((p, idx) => ({ id: p.id, name: p.name, order: idx })),
          sections: newSections,
        },
      });

      // 3. Create tasks from template acts
      (tpl.acts || []).forEach((act, idx) => {
        const taskId = `task-${project.id}-${act.id}-${Date.now().toString(36)}`;
        store.putRecord({
          id: taskId,
          kind: 'task',
          title: act.title,
          description: `<p>Actividad del plan para <b>${act.title}</b>.</p>`,
          projectId: project.id,
          sectionId: act.sectionId,
          order: idx,
          owner: act.owner || 'Ingeniero Responsable',
          status: 'Pendiente',
          priority: act.milestone ? 'Alta' : 'Media',
          start: project.start,
          due: project.target,
          dueOriginal: project.target,
          progress: 0,
          progressMode: 'auto',
          weight: act.weight || 1,
          milestone: act.milestone || false,
          checklist: act.checklist || [],
          deps: [],
          guideRef: act.guideTplId,
          createdAt: now,
          updatedAt: now,
        });
      });

      setIsImportTemplateModalOpen(false);
      showToast(`Plantilla "${tpl.name}" aplicada exitosamente.`);
    } else if (importMode === 'append') {
      // Append sections and acts to existing
      const currentCount = sections.length;
      const appendedSections: Section[] = (tpl.sections || []).map((s, idx) => ({
        id: `sec-app-${Date.now()}-${s.id}`,
        name: s.name,
        weight: s.weight,
        phaseId: s.phaseId,
        order: currentCount + idx,
        guideTplId: s.guideTplId,
      }));

      const sectionIdMap: Record<string, string> = {};
      (tpl.sections || []).forEach((s, idx) => {
        sectionIdMap[s.id] = appendedSections[idx].id;
      });

      store.putRecord({
        ...project,
        plan: {
          ...project.plan,
          sections: [...sections, ...appendedSections],
        },
      });

      (tpl.acts || []).forEach((act, idx) => {
        const mappedSectionId = sectionIdMap[act.sectionId] || act.sectionId;
        const taskId = `task-${project.id}-${Date.now()}-${idx}`;
        store.putRecord({
          id: taskId,
          kind: 'task',
          title: act.title,
          description: `<p>Actividad anexada: <b>${act.title}</b>.</p>`,
          projectId: project.id,
          sectionId: mappedSectionId,
          order: idx,
          owner: act.owner || 'Ingeniero Responsable',
          status: 'Pendiente',
          priority: act.milestone ? 'Alta' : 'Media',
          start: project.start,
          due: project.target,
          dueOriginal: project.target,
          progress: 0,
          progressMode: 'auto',
          weight: act.weight || 1,
          milestone: act.milestone || false,
          checklist: act.checklist || [],
          deps: [],
          createdAt: now,
          updatedAt: now,
        });
      });

      setIsImportTemplateModalOpen(false);
      showToast(`Etapas de "${tpl.name}" anexadas al proyecto.`);
    } else if (importMode === 'singleSection') {
      // Import only a single section
      const targetSec = (tpl.sections || []).find((s) => s.id === selectedSingleSectionId);
      if (!targetSec) return;

      const newSecId = `sec-single-${Date.now()}`;
      const newSec: Section = {
        id: newSecId,
        name: targetSec.name,
        weight: targetSec.weight,
        phaseId: targetSec.phaseId,
        order: sections.length,
        guideTplId: targetSec.guideTplId,
      };

      store.putRecord({
        ...project,
        plan: {
          ...project.plan,
          sections: [...sections, newSec],
        },
      });

      // Add acts belonging to this section
      const actsToImport = (tpl.acts || []).filter((a) => a.sectionId === targetSec.id);
      actsToImport.forEach((act, idx) => {
        const taskId = `task-${project.id}-${Date.now()}-${idx}`;
        store.putRecord({
          id: taskId,
          kind: 'task',
          title: act.title,
          description: `<p>${act.title}</p>`,
          projectId: project.id,
          sectionId: newSecId,
          order: idx,
          owner: act.owner || 'Ingeniero Responsable',
          status: 'Pendiente',
          priority: act.milestone ? 'Alta' : 'Media',
          start: project.start,
          due: project.target,
          dueOriginal: project.target,
          progress: 0,
          progressMode: 'auto',
          weight: act.weight || 1,
          milestone: act.milestone || false,
          checklist: act.checklist || [],
          deps: [],
          createdAt: now,
          updatedAt: now,
        });
      });

      setIsImportTemplateModalOpen(false);
      showToast(`Etapa "${targetSec.name}" y sus actividades añadidas.`);
    }
  };

  // Clear work plan completely
  const handleClearWorkPlan = () => {
    projectTasks.forEach((t) => store.deleteRecord(t.id, true));
    store.putRecord({
      ...project,
      planTplId: undefined,
      plan: {
        phases: [],
        sections: [],
      },
    });
    setIsClearPlanModalOpen(false);
    showToast('Plan de trabajo y actividades eliminados por completo.');
  };

  // Sync guides from templates or library
  const handleSyncGuidesFromTemplate = () => {
    let count = 0;
    projectGuides.filter((guide) => guide.kind === 'pguide' && guide.sourceId).forEach((guide) => {
      const sourceGuide = state.records[guide.sourceId!] as Guide | undefined;
      if (sourceGuide && sourceGuide.kind === 'guide' && !sourceGuide.deletedAt) {
        store.putRecord({
          ...sourceGuide,
          id: guide.id,
          kind: 'pguide',
          name: guide.name,
          projectId: project.id,
          sourceId: sourceGuide.id,
          sourceVersion: sourceGuide.version,
          updatedAt: new Date().toISOString(),
        });
        count++;
      }
    });
    showToast(count ? `Guías actualizadas desde Biblioteca (${count}).` : 'No hay copias de guía para actualizar.');
  };

  const handleExportProjectGuideAsTemplate = (guide: Guide) => {
    const name = window.prompt('Nombre para la nueva plantilla:', guide.name.replace(` (${project.name})`, ''))?.trim();
    if (!name) return;
    const version = window.prompt('Versión de la plantilla:', guide.version || '1.0')?.trim() || '1.0';
    const now = new Date().toISOString();
    store.putRecord({
      ...guide,
      id: `guide-${Date.now()}`,
      kind: 'guide',
      name,
      version,
      projectId: undefined,
      sourceId: undefined,
      sourceVersion: undefined,
      createdAt: now,
      updatedAt: now,
    });
    showToast(`La guía se guardó en Biblioteca como plantilla "${name}" v${version}.`);
  };

  // Delete / Unlink guide from project
  const handleConfirmDeleteGuide = () => {
    if (!guideToDelete) return;
    const g = guideToDelete;

    // 1. If it's a project copy (pguide), delete record
    if (g.kind === 'pguide') {
      store.deleteRecord(g.id, true);
    }

    // 2. Clear references in project tasks
    const tasksToUpdate = projectTasks.filter((t) => t.guideRef === g.id);
    if (tasksToUpdate.length > 0) {
      store.putRecords(
        tasksToUpdate.map((t) => ({ ...t, guideRef: undefined }))
      );
    }

    // 3. Clear references in sections
    const hasSectionRef = sections.some((s) => s.guideTplId === g.id);
    if (hasSectionRef) {
      const updatedSections = sections.map((s) =>
        s.guideTplId === g.id ? { ...s, guideTplId: undefined } : s
      );
      store.putRecord({
        ...project,
        plan: {
          ...project.plan,
          sections: updatedSections,
        },
      });
    }

    if (selectedGuideId === g.id) {
      setSelectedGuideId(null);
    }

    setGuideToDelete(null);
    showToast(`Guía "${g.name}" eliminada / desvinculada de este proyecto.`);
  };

  // Associating a template always creates a project-private copy.
  const handleLinkGuideToProject = (sourceGuide: Guide) => {
    const existing = Object.values(state.records).find((record: any) => record.kind === 'pguide' && !record.deletedAt && record.projectId === project.id && record.sourceId === sourceGuide.id) as Guide | undefined;
    if (existing) {
      setSelectedGuideId(existing.id);
      showToast('Esta plantilla ya tiene una copia en el proyecto.');
      setIsLinkGuideModalOpen(false);
      return;
    }
    const projectGuide: Guide = { ...sourceGuide, id: `pguide-${project.id}-${sourceGuide.id}`, kind: 'pguide', name: `${sourceGuide.name} (${project.name})`, projectId: project.id, sourceId: sourceGuide.id, sourceVersion: sourceGuide.version };
    store.putRecord(projectGuide);
    setSelectedGuideId(projectGuide.id);
    showToast('Copia editable de la guía creada para el proyecto.');
    setIsLinkGuideModalOpen(false);
  };

  // Unlink Script or Troubleshooting from project
  const handleConfirmUnlinkScriptTrouble = () => {
    if (!itemToUnlink) return;
    const { item } = itemToUnlink;
    const updatedProjects = (item.projects || []).filter((pid) => pid !== project.id);
    store.putRecord({
      ...item,
      projects: updatedProjects,
      updatedAt: new Date().toISOString(),
    });
    setItemToUnlink(null);
    showToast(`Elemento desvinculado de este proyecto.`);
  };

  // Link Script from library
  const handleLinkScriptToProject = (scriptId: string) => {
    const sc = state.records[scriptId] as Script;
    if (!sc) return;
    const updatedProjects = Array.from(new Set([...(sc.projects || []), project.id]));
    store.putRecord({
      ...sc,
      projects: updatedProjects,
      updatedAt: new Date().toISOString(),
    });
    setIsLinkScriptModalOpen(false);
    showToast(`Script "${sc.name}" vinculado a este proyecto.`);
  };

  // Link Trouble from library
  const handleLinkTroubleToProject = (troubleId: string) => {
    const tr = state.records[troubleId] as Trouble;
    if (!tr) return;
    const updatedProjects = Array.from(new Set([...(tr.projects || []), project.id]));
    store.putRecord({
      ...tr,
      projects: updatedProjects,
      updatedAt: new Date().toISOString(),
    });
    setIsLinkTroubleModalOpen(false);
    showToast(`Caso de diagnóstico "${tr.name}" vinculado a este proyecto.`);
  };

  // 1-Click Editable Project Title save
  const handleSaveProjectTitle = () => {
    if (!titleDraft.trim() || titleDraft.trim() === project.name) {
      setIsEditingTitle(false);
      return;
    }
    store.putRecord({
      ...project,
      name: titleDraft.trim(),
      updatedAt: new Date().toISOString(),
    });
    setIsEditingTitle(false);
    showToast('Título del proyecto actualizado.');
  };

  // Quick add stakeholder to this project
  const handleCreateStakeholder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStakeholderName.trim()) return;

    const contactId = `contact-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newContact: CatalogItem = {
      id: contactId,
      kind: 'contact',
      name: newStakeholderName.trim(),
      email: newStakeholderEmail.trim() || undefined,
      phone: newStakeholderPhone.trim() || undefined,
      role: newStakeholderRole.trim() || 'Involucrado del Proyecto',
      group: newStakeholderCompany.trim() || undefined,
      color: '#3b82f6',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save contact record in store
    store.putRecord(newContact);

    // Link contact to project
    const updatedContacts = Array.from(new Set([...(project.contacts || []), contactId]));
    store.putRecord({
      ...project,
      contacts: updatedContacts,
      updatedAt: new Date().toISOString(),
    });

    // Reset and close
    setNewStakeholderName('');
    setNewStakeholderRole('');
    setNewStakeholderEmail('');
    setNewStakeholderPhone('');
    setNewStakeholderCompany('');
    setIsAddStakeholderModalOpen(false);
    showToast(`Involucrado "${newContact.name}" agregado al proyecto.`);
  };

  // Remove / Unlink stakeholder
  const handleConfirmDeleteStakeholder = () => {
    if (!stakeholderToDelete) return;
    const updatedContacts = (project.contacts || []).filter(
      (c) => c !== stakeholderToDelete.id && c !== stakeholderToDelete.name
    );
    store.putRecord({
      ...project,
      contacts: updatedContacts,
      updatedAt: new Date().toISOString(),
    });
    setStakeholderToDelete(null);
    showToast('Involucrado desvinculado del proyecto.');
  };

  // Copy all stakeholder emails
  const handleCopyAllEmails = () => {
    const emails = projectStakeholders
      .map((s) => s.email)
      .filter((em): em is string => !!em && em.includes('@'));
    if (emails.length === 0) {
      showToast('No hay correos registrados para copiar.');
      return;
    }
    const emailList = Array.from(new Set(emails)).join(', ');
    navigator.clipboard.writeText(emailList);
    showToast(`Copiados ${emails.length} correos al portapapeles.`);
  };

  // Quick add task / pendiente
  const handleQuickAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    const firstSectionId = sections[0]?.id || `sec-${Date.now()}`;
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      kind: 'task',
      title: quickTaskTitle.trim(),
      projectId: project.id,
      sectionId: firstSectionId,
      order: projectTasks.length + 1,
      owner: quickTaskOwner.trim() || 'Sin asignar',
      status: 'Pendiente',
      priority: quickTaskPriority,
      progress: 0,
      progressMode: 'auto',
      weight: 10,
      milestone: false,
      checklist: [],
      deps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.putRecord(newTask);
    setQuickTaskTitle('');
    showToast(`Pendiente "${newTask.title}" agregado.`);
  };

  // Confirm delete note
  const handleConfirmDeleteNote = () => {
    if (!noteToDelete) return;
    store.deleteRecord(noteToDelete.id, true);
    setNoteToDelete(null);
    showToast('Nota / Minuta eliminada.');
  };

  // Open "Ver Detalle" modal for a task
  const handleOpenTaskDetail = (task: Task) => {
    setDetailTaskModal({ isOpen: true, task });
    setDetailTaskGuideId(task.guideRef || '');
    setNewChecklistText('');
  };

  // Toggle checklist item in Detail Modal
  const handleToggleChecklistItem = (itemIndex: number) => {
    if (!detailTaskModal.task) return;
    const currentList = [...(detailTaskModal.task.checklist || [])];
    if (!currentList[itemIndex]) return;

    currentList[itemIndex] = {
      ...currentList[itemIndex],
      done: !currentList[itemIndex].done,
    };

    const doneCount = currentList.filter((c) => c.done).length;
    const autoProgress = Math.round((doneCount / currentList.length) * 100);

    const updated: Task = {
      ...detailTaskModal.task,
      checklist: currentList,
      progress: detailTaskModal.task.progressMode === 'auto' ? autoProgress : detailTaskModal.task.progress,
      status: autoProgress === 100 ? 'Completado' : autoProgress > 0 ? 'En curso' : detailTaskModal.task.status,
      updatedAt: new Date().toISOString(),
    };

    store.putRecord(updated);
    setDetailTaskModal({ isOpen: true, task: updated });
  };

  // Adjust task status in Detail Modal
  const handleDetailTaskStatusChange = (newStatus: TaskStatus) => {
    if (!detailTaskModal.task) return;
    const isCompleted = newStatus === 'Completado';
    const nowStr = new Date().toISOString().split('T')[0];
    let newProg = detailTaskModal.task.progress;
    if (isCompleted) {
      newProg = 100;
    } else if (newStatus === 'Pendiente' && newProg === 100) {
      newProg = 0;
    } else if (newStatus === 'En curso' && (newProg === 100 || newProg === 0)) {
      newProg = 50;
    }

    const updated: Task = {
      ...detailTaskModal.task,
      status: newStatus,
      progress: newProg,
      realEnd: isCompleted ? nowStr : undefined,
      updatedAt: new Date().toISOString(),
    };

    store.putRecord(updated);
    setDetailTaskModal({ isOpen: true, task: updated });
    showToast(`Estado actualizado a "${newStatus}"`);
  };

  // Add checklist item in Detail Modal
  const handleAddChecklistItem = () => {
    if (!detailTaskModal.task || !newChecklistText.trim()) return;
    const currentList = [...(detailTaskModal.task.checklist || [])];
    currentList.push({
      id: `chk-${Date.now()}`,
      text: newChecklistText.trim(),
      done: false,
    });

    const updated: Task = {
      ...detailTaskModal.task,
      checklist: currentList,
      updatedAt: new Date().toISOString(),
    };

    store.putRecord(updated);
    setDetailTaskModal({ isOpen: true, task: updated });
    setNewChecklistText('');
  };

  // Associate or remove guide from detail task
  const handleAssociateGuideToTask = (guideId: string) => {
    if (!detailTaskModal.task) return;
    setDetailTaskGuideId(guideId);
    const updated: Task = {
      ...detailTaskModal.task,
      guideRef: guideId || undefined,
      updatedAt: new Date().toISOString(),
    };
    store.putRecord(updated);
    setDetailTaskModal({ isOpen: true, task: updated });
    showToast(guideId ? 'Guía técnica asociada a la actividad.' : 'Guía desvinculada.');
  };

  // Fulfill step in associated guide directly from Activity Detail Modal
  const handleFulfillGuideStep = (stepId: string) => {
    if (!detailTaskModal.task || !detailTaskGuideId) return;
    const targetGuide = allGuides[detailTaskGuideId];
    if (!targetGuide) return;

    // Toggle step completion in guide copy
    let completedSteps = 0;
    let totalSteps = 0;

    const updatedSections = (targetGuide.sections || []).map((sec) => ({
      ...sec,
      steps: (sec.steps || []).map((st) => {
        totalSteps++;
        if (st.id === stepId) {
          const nextProg = st.progress === 100 ? 0 : 100;
          const isDone = nextProg === 100;
          if (isDone) completedSteps++;
          // Also toggle all items in checklist blocks within this step
          const updatedBlocks = (st.blocks || []).map((b) => {
            if (b.type === 'checklist' && b.items) {
              return {
                ...b,
                items: b.items.map((it) => ({ ...it, done: isDone })),
              };
            }
            return b;
          });
          return { ...st, progress: nextProg, blocks: updatedBlocks };
        }
        if (st.progress === 100) completedSteps++;
        return st;
      }),
    }));

    const guideCopy: Guide = {
      ...targetGuide,
      sections: updatedSections,
      updatedAt: new Date().toISOString(),
    };
    store.putRecord(guideCopy);

    // Update task progress to reflect guide fulfillment
    const guideProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    const updatedTask: Task = {
      ...detailTaskModal.task,
      progress: guideProgress,
      status: guideProgress === 100 ? 'Completado' : guideProgress > 0 ? 'En curso' : 'Pendiente',
      updatedAt: new Date().toISOString(),
    };
    store.putRecord(updatedTask);
    setDetailTaskModal({ isOpen: true, task: updatedTask });
  };

  // Toggle individual checklist item inside a guide step from the Detail Modal
  const handleToggleGuideChecklistItem = (stepId: string, blockId: string, itemId: string) => {
    if (!detailTaskModal.task || !detailTaskGuideId) return;
    const targetGuide = allGuides[detailTaskGuideId];
    if (!targetGuide) return;

    let completedSteps = 0;
    let totalSteps = 0;

    const updatedSections = (targetGuide.sections || []).map((sec) => ({
      ...sec,
      steps: (sec.steps || []).map((st) => {
        totalSteps++;
        if (st.id !== stepId) {
          if (st.progress === 100) completedSteps++;
          return st;
        }

        const updatedBlocks = (st.blocks || []).map((b) => {
          if (b.id !== blockId || !b.items) return b;
          return {
            ...b,
            items: b.items.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it)),
          };
        });

        // Compute step progress
        const allItems = updatedBlocks
          .filter((b) => b.type === 'checklist')
          .flatMap((b) => b.items || []);
        let newProg = st.progress;
        if (allItems.length > 0) {
          const doneCount = allItems.filter((i) => i.done).length;
          newProg = Math.round((doneCount / allItems.length) * 100);
        }
        if (newProg === 100) completedSteps++;
        return { ...st, blocks: updatedBlocks, progress: newProg };
      }),
    }));

    const guideCopy: Guide = {
      ...targetGuide,
      sections: updatedSections,
      updatedAt: new Date().toISOString(),
    };
    store.putRecord(guideCopy);

    const guideProgress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
    const updatedTask: Task = {
      ...detailTaskModal.task,
      progress: guideProgress,
      status: guideProgress === 100 ? 'Completado' : guideProgress > 0 ? 'En curso' : 'Pendiente',
      updatedAt: new Date().toISOString(),
    };
    store.putRecord(updatedTask);
    setDetailTaskModal({ isOpen: true, task: updatedTask });
  };

  const handleScrollToSection = (secId: string) => {
    if (planSubView !== 'detailed') {
      setPlanSubView('detailed');
    }
    setExpandedSections((prev) => ({ ...prev, [secId]: true }));
    setTimeout(() => {
      const el = document.getElementById(`section-row-${secId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Volver a lista de proyectos"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: brandColor }}
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                {brand?.name || 'Marca'} · {client?.name || 'Cliente'}
              </span>
              <span className="text-slate-300 dark:text-neutral-700">·</span>
              {/* Quick Status Selector */}
              <select
                value={project.status}
                onChange={(e) => {
                  store.putRecord({
                    ...project,
                    status: e.target.value as any,
                    updatedAt: new Date().toISOString(),
                  });
                  showToast(`Estado actualizado: ${e.target.value}`);
                }}
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 border border-slate-200 dark:border-neutral-700 cursor-pointer focus:outline-hidden"
                title="Cambiar estado del proyecto a 1 clic"
              >
                <option value="Borrador">Borrador</option>
                <option value="Planificado">Planificado</option>
                <option value="En ejecución">En ejecución</option>
                <option value="En espera">En espera</option>
                <option value="Completado">Completado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            {/* Title with 1-Click Inline Edit */}
            {isEditingTitle ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveProjectTitle();
                    if (e.key === 'Escape') {
                      setTitleDraft(project.name);
                      setIsEditingTitle(false);
                    }
                  }}
                  autoFocus
                  className="text-lg sm:text-xl font-bold text-slate-900 dark:text-neutral-100 bg-white dark:bg-neutral-800 border-2 border-blue-500 dark:border-cyan-400 rounded-lg px-2.5 py-1 focus:outline-hidden w-full max-w-xl shadow-xs"
                />
                <button
                  onClick={handleSaveProjectTitle}
                  className="p-1.5 text-emerald-600 hover:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg border border-emerald-200 transition-colors"
                  title="Guardar nombre"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setTitleDraft(project.name);
                    setIsEditingTitle(false);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
                  title="Cancelar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 mt-0.5 group">
                <BrandLogo
                  brand={brand}
                  brandId={project.brandId}
                  projectName={project.name}
                  size="lg"
                />
                <h1
                  onClick={() => setIsEditingTitle(true)}
                  className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight cursor-pointer hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
                  title="Haz clic para editar el nombre del proyecto directamente"
                >
                  {project.name}
                </h1>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="opacity-60 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-all rounded hover:bg-slate-100 dark:hover:bg-neutral-800"
                  title="Editar nombre a 1 clic"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                {onOpenProjectModal && (
                  <button
                    onClick={() => onOpenProjectModal(project)}
                    className="p-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors ml-1 hidden sm:inline-flex items-center gap-1"
                    title="Editar expediente completo"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Expediente</span>
                  </button>
                )}
                <button
                  onClick={() => exportSingleItemAsJson(project)}
                  className="p-1 text-xs text-slate-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-cyan-400 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors ml-1 inline-flex items-center gap-1 cursor-pointer"
                  title="Exportar este proyecto como archivo JSON individual con todas sus tareas, entregables y minutas"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                  <span className="hidden sm:inline">Exportar</span>
                  <span>JSON</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Global Progress Header Metric */}
        <div className="flex items-center gap-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl px-4 py-2.5 shadow-2xs">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-neutral-400 block">
              Avance Ponderado
            </span>
            <span className="text-xl font-bold font-mono text-blue-600 dark:text-cyan-400 tabular-nums">
              {calc.progress}%
            </span>
          </div>
          <div className="w-12 h-12 relative flex items-center justify-center shrink-0">
            <svg className="w-12 h-12 -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="19"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-slate-100 dark:text-neutral-800"
              />
              <circle
                cx="24"
                cy="24"
                r="19"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray="119.38"
                strokeDashoffset={119.38 - (119.38 * calc.progress) / 100}
                className="text-blue-600 dark:text-cyan-400 transition-all duration-500"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-slate-700 dark:text-neutral-200">
              {calc.progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-neutral-800 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('plan')}
          className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'plan'
              ? 'border-blue-600 dark:border-cyan-400 text-blue-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Plan de Trabajo & Etapas</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-neutral-800">
            {sections.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('stakeholders')}
          className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'stakeholders'
              ? 'border-blue-600 dark:border-cyan-400 text-blue-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Notas, Pendientes & Involucrados</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-cyan-400 font-bold">
            {projectNotes.length + projectStakeholders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'summary'
              ? 'border-blue-600 dark:border-cyan-400 text-blue-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Vista Resumen Ejecutivo</span>
        </button>

        <button
          onClick={() => setActiveTab('guides')}
          className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'guides'
              ? 'border-blue-600 dark:border-cyan-400 text-blue-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Guías del Proyecto</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-neutral-800">
            {projectGuides.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('scripts')}
          className={`px-4 py-2.5 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'scripts'
              ? 'border-blue-600 dark:border-cyan-400 text-blue-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-neutral-200'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Scripts & Diagnóstico</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-neutral-800">
            {projectScripts.length + projectTroubles.length}
          </span>
        </button>
      </div>

      {/* TAB 1: PLAN DE TRABAJO */}
      {activeTab === 'plan' && (
        <div className="space-y-5">
          {/* Sticky Chevron Stages Stepper as shown in reference image */}
          {sections.length > 0 && (
            <div className="sticky top-0 z-20 bg-slate-50/95 dark:bg-neutral-950/95 backdrop-blur-md pt-1 pb-1 -mt-1">
              <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-2.5 sm:p-3 shadow-xs space-y-2">
                <div className="flex items-center justify-between px-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-slate-800 dark:text-neutral-200 text-xs">
                      Línea de Etapas del Proyecto ({sections.length} etapas)
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-neutral-500 hidden sm:inline">
                      · Haz clic en cualquier etapa para acceder directamente
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono">
                    <span className="text-slate-500 dark:text-neutral-400">
                      Avance Ponderado:{' '}
                      <strong className="text-blue-600 dark:text-cyan-400 font-bold">{calc.progress}%</strong>
                    </span>
                  </div>
                </div>

                {/* Horizontal Scrollable Chevron Track */}
                <div className="overflow-x-auto pb-1 scrollbar-thin">
                  <div className="flex items-center min-w-max py-0.5 px-0.5 bg-slate-100 dark:bg-neutral-800/80 rounded-lg">
                    {sections.map((sec, idx) => {
                      const secCalc = calc.sections.find((s) => s.sectionId === sec.id);
                      const secProg = secCalc?.calculatedProgress || 0;
                      const isFirst = idx === 0;

                      // Exact color logic matching reference image:
                      // 100% -> Deep green (#057a44)
                      // > 0% -> Vibrant royal blue (#1d63ea)
                      // 0% -> Dark teal / petrol (#0e7490)
                      const bgClass =
                        secProg >= 100
                          ? 'bg-[#057a44] hover:bg-[#04683a]'
                          : secProg > 0
                          ? 'bg-[#1d63ea] hover:bg-[#1554c9]'
                          : 'bg-[#0e7490] hover:bg-[#0c627a]';

                      return (
                        <div
                          key={sec.id}
                          onClick={() => handleScrollToSection(sec.id)}
                          style={{
                            clipPath: isFirst
                              ? 'polygon(0% 0%, calc(100% - 15px) 0%, 100% 50%, calc(100% - 15px) 100%, 0% 100%)'
                              : 'polygon(0% 0%, calc(100% - 15px) 0%, 100% 50%, calc(100% - 15px) 100%, 0% 100%, 15px 50%)',
                          }}
                          className={`${bgClass} ${
                            !isFirst ? '-ml-2.5 sm:-ml-3' : ''
                          } text-white shrink-0 cursor-pointer transition-all duration-150 min-w-[130px] sm:min-w-[150px] max-w-[185px] h-[70px] flex flex-col justify-between ${
                            isFirst ? 'pl-3.5 pr-6' : 'pl-6 pr-6'
                          } py-2 select-none shadow-xs hover:brightness-110 active:scale-98`}
                          title={`Etapa ${idx + 1}: ${sec.name} (${secProg}%)`}
                        >
                          <span className="text-[10px] font-mono font-bold opacity-90 leading-none">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="text-[11px] font-bold leading-tight truncate" title={sec.name}>
                            {sec.name.replace(/^\d+[\s.-]*/, '')}
                          </span>
                          <span className="text-xs font-mono font-extrabold tracking-tight leading-none">
                            {secProg} %
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Work Plan Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-3 shadow-2xs">
            {/* View Switcher: Tablero Gráficos vs Por Etapas vs Plan Detallado */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-800 p-1 rounded-lg">
              <button
                onClick={() => setPlanSubView('visual')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  planSubView === 'visual'
                    ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-cyan-400 shadow-2xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" />
                <span>Gráficos</span>
              </button>
              <button
                onClick={() => setPlanSubView('board')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  planSubView === 'board'
                    ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-cyan-400 shadow-2xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Por Etapas</span>
              </button>
              <button
                onClick={() => setPlanSubView('detailed')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  planSubView === 'detailed'
                    ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-cyan-400 shadow-2xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Plan Detallado</span>
              </button>
            </div>

            {/* Plan Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                onClick={handleOpenAddSection}
                className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-slate-700 dark:text-neutral-200 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Etapa</span>
              </button>

              <button
                onClick={() => {
                  setSelectedTemplateToImport(allTemplates[0]?.id || '');
                  setIsImportTemplateModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-blue-700 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-950/60 hover:bg-blue-100 dark:hover:bg-cyan-900/60 border border-blue-200 dark:border-cyan-800/60 rounded-lg transition-colors"
                title="Aplicar o anexar plantilla de la biblioteca técnica"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Aplicar Plantilla</span>
              </button>

              <button
                onClick={handleSyncGuidesFromTemplate}
                className="flex items-center gap-1.5 px-2.5 py-1.5 font-medium text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-800 rounded-lg transition-colors"
                title="Actualizar guías técnicas vinculadas con las últimas versiones"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Actualizar Guías</span>
              </button>

              {sections.length > 0 && (
                <button
                  onClick={() => setIsClearPlanModalOpen(true)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Eliminar o limpiar plan de trabajo completamente"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* SUBVIEW 0: TABLERO VISUAL DE GRÁFICOS */}
          {planSubView === 'visual' && (
            <ProjectVisualProgressBoard
              project={project}
              tasks={projectTasks}
              calc={calc}
              brand={brand}
              client={client}
              allGuides={allGuides}
              onNavigateToTask={(t) => handleOpenTaskDetail(t)}
            />
          )}

          {/* SUBVIEW 1: TABLERO DE AVANCE (Progress Dashboard Cards & Metrics) */}
          {planSubView === 'board' && (
            <div className="space-y-6">
              {/* Graphic Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-3.5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-400 block">
                    Total Actividades
                  </span>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-neutral-100 tabular-nums">
                    {projectTasks.length}
                  </span>
                  <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                    En {sections.length} etapas
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-3.5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                    Completadas
                  </span>
                  <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {statusCounts.Completado}
                  </span>
                  <div className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                    {projectTasks.length > 0
                      ? Math.round((statusCounts.Completado / projectTasks.length) * 100)
                      : 0}
                    % del total
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-blue-200 dark:border-blue-900/60 rounded-xl p-3.5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
                    En Curso
                  </span>
                  <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                    {statusCounts['En curso']}
                  </span>
                  <div className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-1">
                    En ejecución activa
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3.5 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                    En Espera
                  </span>
                  <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                    {statusCounts['En espera']}
                  </span>
                  <div className="text-[11px] text-amber-600/80 dark:text-amber-400/80 mt-1">
                    Bloqueos o terceros
                  </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 border border-purple-200 dark:border-purple-900/60 rounded-xl p-3.5 shadow-2xs col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                    En Validación
                  </span>
                  <span className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 tabular-nums">
                    {statusCounts['En validación']}
                  </span>
                  <div className="text-[11px] text-purple-600/80 dark:text-purple-400/80 mt-1">
                    Pruebas / QA
                  </div>
                </div>
              </div>

              {/* Status Visual Stacked Bar */}
              {projectTasks.length > 0 && (
                <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-neutral-300">
                    <span>Distribución de Estados en el Plan</span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-neutral-400">
                      {calc.progress}% Avance Ponderado Global
                    </span>
                  </div>
                  <div className="h-3 w-full bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden flex">
                    <div
                      style={{
                        width: `${(statusCounts.Completado / projectTasks.length) * 100}%`,
                      }}
                      className="bg-emerald-500 h-full transition-all"
                      title={`Completadas: ${statusCounts.Completado}`}
                    />
                    <div
                      style={{
                        width: `${(statusCounts['En curso'] / projectTasks.length) * 100}%`,
                      }}
                      className="bg-blue-500 h-full transition-all"
                      title={`En curso: ${statusCounts['En curso']}`}
                    />
                    <div
                      style={{
                        width: `${(statusCounts['En validación'] / projectTasks.length) * 100}%`,
                      }}
                      className="bg-purple-500 h-full transition-all"
                      title={`En validación: ${statusCounts['En validación']}`}
                    />
                    <div
                      style={{
                        width: `${(statusCounts['En espera'] / projectTasks.length) * 100}%`,
                      }}
                      className="bg-amber-500 h-full transition-all"
                      title={`En espera: ${statusCounts['En espera']}`}
                    />
                  </div>
                </div>
              )}

              {/* Stages Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sections.length === 0 ? (
                  <div className="col-span-full p-12 text-center bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-3">
                    <Layers className="w-10 h-10 text-slate-400 dark:text-neutral-600 mx-auto" />
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-neutral-200">
                      No hay etapas o secciones configuradas
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-md mx-auto">
                      Aplica la plantilla estándar PAM SaaS o crea tus etapas manualmente para estructurar el plan de trabajo.
                    </p>
                    <button
                      onClick={() => {
                        setSelectedTemplateToImport(allTemplates[0]?.id || '');
                        setIsImportTemplateModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Aplicar Plantilla Oficial</span>
                    </button>
                  </div>
                ) : (
                  sections.map((sec, secIdx) => {
                    const acts = projectTasks
                      .filter((t) => t.sectionId === sec.id)
                      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                    const completedActs = acts.filter((t) => t.status === 'Completado');
                    const secCalc = calc.sections.find((s) => s.sectionId === sec.id);
                    const secProg = secCalc?.calculatedProgress || 0;
                    const secContrib = secCalc?.contributionToProject || 0;
                    const linkedGuide = sec.guideTplId ? allGuides[sec.guideTplId] : null;

                    return (
                      <div
                        key={sec.id}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleTaskDropOnSection(e, sec.id)}
                        className="rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                      >
                        {/* Dark Navy Header as seen in the image */}
                        <div className="bg-slate-900 dark:bg-slate-950 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-blue-500/20 text-cyan-300 border border-cyan-500/30 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {secIdx + 1}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-100 truncate" title={sec.name}>
                              {sec.name}
                            </h4>
                          </div>
                          <span className="shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-cyan-300 border border-white/15">
                            Peso: {sec.weight}%
                          </span>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 flex flex-col justify-between flex-1 space-y-3.5">
                          {/* Circular Gauge and Key Stage Stats */}
                          <div className="flex items-center justify-between gap-4">
                            {/* Circular Gauge SVG */}
                            <div className="relative w-18 h-18 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
                              <svg className="w-full h-full transform" viewBox="0 0 88 88">
                                <circle
                                  cx="44"
                                  cy="44"
                                  r="34"
                                  stroke="currentColor"
                                  strokeWidth="7"
                                  className="text-slate-100 dark:text-neutral-800"
                                  fill="none"
                                />
                                <circle
                                  cx="44"
                                  cy="44"
                                  r="34"
                                  stroke={
                                    secProg === 100
                                      ? '#10b981'
                                      : secProg >= 70
                                      ? '#06b6d4'
                                      : secProg > 0
                                      ? '#3b82f6'
                                      : '#94a3b8'
                                  }
                                  strokeWidth="7"
                                  strokeDasharray={213.63}
                                  strokeDashoffset={213.63 - (213.63 * Math.min(100, Math.max(0, secProg))) / 100}
                                  strokeLinecap="round"
                                  transform="rotate(-90 44 44)"
                                  fill="none"
                                  className="transition-all duration-700 ease-out"
                                />
                              </svg>
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
                                <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                                  {secProg}%
                                </span>
                                <span className="text-[8px] uppercase font-bold tracking-wider text-slate-400 dark:text-neutral-500">
                                  Avance
                                </span>
                              </div>
                            </div>

                            {/* Metrics Columns */}
                            <div className="flex-1 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 dark:text-neutral-400 text-[11px]">Actividades:</span>
                                <span className="font-mono font-bold text-slate-800 dark:text-neutral-200">
                                  {completedActs.length} / {acts.length}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 dark:text-neutral-400 text-[11px]">Aporte Global:</span>
                                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  +{secContrib}%
                                </span>
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-neutral-800">
                                <span className="text-slate-500 dark:text-neutral-400 text-[11px]">Estado:</span>
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    secProg === 100
                                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                      : secProg > 0
                                      ? 'bg-blue-50 dark:bg-cyan-950/60 text-blue-600 dark:text-cyan-400 border-blue-200 dark:border-cyan-800'
                                      : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 border-slate-200 dark:border-neutral-700'
                                  }`}
                                >
                                  {secProg === 100 ? (
                                    <Check className="w-3 h-3 text-emerald-500" />
                                  ) : secProg > 0 ? (
                                    <Activity className="w-3 h-3 text-blue-500 dark:text-cyan-400" />
                                  ) : (
                                    <Clock className="w-3 h-3 text-slate-400" />
                                  )}
                                  <span>{secProg === 100 ? 'Cumplida' : secProg > 0 ? 'En Ejecución' : 'Por Iniciar'}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                        {/* Stage Activities Mini-list */}
                        <div className="bg-slate-50/80 dark:bg-neutral-950/70 border border-slate-200/80 dark:border-neutral-800/80 rounded-lg p-3 space-y-2 text-xs">
                          <div className="flex items-center justify-between text-slate-600 dark:text-neutral-400 pb-1.5 border-b border-slate-200/60 dark:border-neutral-800/60">
                            <span>
                              Actividades: {completedActs.length}/{acts.length}
                            </span>
                            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                              +{secContrib}% aporte
                            </span>
                          </div>

                          <div className="space-y-1.5 max-h-36 overflow-y-auto">
                            {acts.length === 0 ? (
                              <div className="py-2 text-center text-slate-400 dark:text-neutral-600 italic text-[11px]">
                                Sin actividades. Arrastra una aquí o pulsa &ldquo;+ Actividad&rdquo;.
                              </div>
                            ) : (
                              acts.slice(0, 5).map((act) => (
                                <div
                                  key={act.id}
                                  draggable
                                  onDragStart={(e) => handleTaskDragStart(e, act.id)}
                                  className="flex items-center justify-between gap-2 p-1.5 rounded hover:bg-slate-200/50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                  onClick={() => handleOpenTaskDetail(act)}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={act.status === 'Completado'}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleInlineProgressChange(
                                          act,
                                          act.status === 'Completado' ? 0 : 100
                                        );
                                      }}
                                      className="rounded border-slate-300 dark:border-neutral-700 text-blue-600 cursor-pointer"
                                    />
                                    <span
                                      className={`text-[11px] truncate ${
                                        act.status === 'Completado'
                                          ? 'line-through text-slate-400 dark:text-neutral-500'
                                          : 'text-slate-700 dark:text-neutral-300'
                                      }`}
                                    >
                                      {act.title}
                                    </span>
                                  </div>
                                  <span className="font-mono text-[10px] text-slate-500 dark:text-neutral-400 shrink-0">
                                    {act.progress}%
                                  </span>
                                </div>
                              ))
                            )}
                            {acts.length > 5 && (
                              <button
                                onClick={() => setPlanSubView('detailed')}
                                className="w-full text-center text-[10px] text-blue-600 dark:text-cyan-400 hover:underline pt-1"
                              >
                                Ver todas ({acts.length}) en plan detallado →
                              </button>
                            )}
                          </div>

                          {/* Linked Guide Badge */}
                          {linkedGuide && (
                            <div className="pt-2 border-t border-slate-200/60 dark:border-neutral-800/80 flex items-center justify-between text-[11px]">
                              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 truncate">
                                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{linkedGuide.name}</span>
                              </span>
                              <button
                                onClick={() => {
                                  setSelectedGuideId(linkedGuide.id);
                                  setActiveTab('guides');
                                }}
                                className="text-blue-600 dark:text-cyan-400 hover:underline shrink-0"
                              >
                                Ver guía
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                        {/* Card Controls */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200/80 dark:border-neutral-800/80 bg-slate-50/50 dark:bg-neutral-900/50 text-xs">
                          <button
                            onClick={() => onOpenTaskModal(undefined, project.id, sec.id)}
                            className="flex items-center gap-1 text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 font-semibold"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Actividad</span>
                          </button>

                          <div className="flex items-center gap-1 text-slate-400 dark:text-neutral-500">
                            <button
                              onClick={() => handleMoveSectionOrder(sec.id, 'up')}
                              disabled={secIdx === 0}
                              className="p-1 hover:text-slate-800 dark:hover:text-white disabled:opacity-30"
                              title="Mover etapa hacia arriba"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveSectionOrder(sec.id, 'down')}
                              disabled={secIdx === sections.length - 1}
                              className="p-1 hover:text-slate-800 dark:hover:text-white disabled:opacity-30"
                              title="Mover etapa hacia abajo"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditSection(sec)}
                              className="p-1 hover:text-slate-800 dark:hover:text-white"
                              title="Editar propiedades de la etapa"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSection(sec.id)}
                              className="p-1 hover:text-rose-500"
                              title="Eliminar etapa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* SUBVIEW 2: PLAN DETALLADO (Hierarchical Activities Table with Drag and Detailed Modals) */}
          {planSubView === 'detailed' && (
            <div className="space-y-4">
              {sections.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-3">
                  <Layers className="w-10 h-10 text-slate-400 dark:text-neutral-600 mx-auto" />
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-neutral-200">
                    No hay etapas en el plan de trabajo
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-md mx-auto">
                    Comienza aplicando una plantilla oficial o agregando una etapa manualmente.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedTemplateToImport(allTemplates[0]?.id || '');
                      setIsImportTemplateModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Aplicar Plantilla</span>
                  </button>
                </div>
              ) : (
                sections.map((sec, secIdx) => {
                  const acts = projectTasks
                    .filter((t) => t.sectionId === sec.id)
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                  const isExpanded = expandedSections[sec.id] !== false;
                  const secCalc = calc.sections.find((s) => s.sectionId === sec.id);

                  return (
                    <div
                      key={sec.id}
                      id={`section-row-${sec.id}`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleTaskDropOnSection(e, sec.id)}
                      className="bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-xl overflow-hidden shadow-xs transition-shadow scroll-mt-28"
                    >
                      {/* Section Bar - Dark Distinct Background as requested */}
                      <div
                        onClick={() => toggleSection(sec.id)}
                        className="flex items-center justify-between p-3.5 bg-slate-900 hover:bg-slate-850 dark:bg-slate-950 dark:hover:bg-slate-900 text-white cursor-pointer select-none transition-colors border-b border-slate-800"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-cyan-300 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span className="w-5 h-5 rounded-full bg-blue-500/20 text-cyan-300 border border-cyan-500/30 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {secIdx + 1}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-100 truncate tracking-tight">
                            {sec.name}
                          </h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-cyan-300 border border-white/15 font-bold">
                            Peso: {sec.weight}%
                          </span>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-5 text-xs font-mono">
                          <span className="text-slate-300 dark:text-slate-400 hidden sm:inline">
                            {acts.length} actividades
                          </span>
                          <span className="text-cyan-300 font-bold tabular-nums">
                            {secCalc?.calculatedProgress || 0}% avance
                          </span>
                          <span className="text-emerald-400 font-bold tabular-nums hidden sm:inline">
                            +{secCalc?.contributionToProject || 0}% al proyecto
                          </span>
                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onOpenTaskModal(undefined, project.id, sec.id)}
                              className="px-2.5 py-1 text-[11px] font-sans font-semibold text-cyan-300 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                              title="Añadir actividad a esta etapa"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Actividad</span>
                            </button>
                            <button
                              onClick={() => handleMoveSectionOrder(sec.id, 'up')}
                              disabled={secIdx === 0}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                              title="Subir etapa"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveSectionOrder(sec.id, 'down')}
                              disabled={secIdx === sections.length - 1}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                              title="Bajar etapa"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditSection(sec)}
                              className="p-1 text-slate-400 hover:text-white transition-colors"
                              title="Editar etapa"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteSection(sec.id)}
                              className="p-1 text-rose-400 hover:text-rose-300 transition-colors"
                              title="Eliminar etapa"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Activities List */}
                      {isExpanded && (
                        <div className="overflow-x-auto">
                          <div className="px-3 py-2 bg-slate-50/70 dark:bg-neutral-800/50 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
                              {acts.length} actividades en esta etapa
                            </span>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setShowColumnMenu(!showColumnMenu)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-100 transition-colors shadow-2xs"
                              >
                                <SlidersHorizontal className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
                                <span>Columnas</span>
                              </button>
                              {showColumnMenu && (
                                <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-xl p-3 z-30 space-y-1.5 text-xs">
                                  <div className="font-bold text-slate-900 dark:text-neutral-100 pb-1 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between text-[11px]">
                                    <span>Personalizar Columnas</span>
                                    <button onClick={() => setShowColumnMenu(false)} className="text-slate-400 hover:text-slate-600">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <label className="flex items-center gap-2 cursor-pointer py-0.5 text-slate-700 dark:text-neutral-300">
                                    <input
                                      type="checkbox"
                                      checked={visibleColumns.priority}
                                      onChange={(e) => setVisibleColumns({ ...visibleColumns, priority: e.target.checked })}
                                      className="rounded border-slate-300 text-blue-600 cursor-pointer"
                                    />
                                    <span>Prioridad</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer py-0.5 text-slate-700 dark:text-neutral-300">
                                    <input
                                      type="checkbox"
                                      checked={visibleColumns.guide}
                                      onChange={(e) => setVisibleColumns({ ...visibleColumns, guide: e.target.checked })}
                                      className="rounded border-slate-300 text-blue-600 cursor-pointer"
                                    />
                                    <span>Guía Vinculada</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer py-0.5 text-slate-700 dark:text-neutral-300">
                                    <input
                                      type="checkbox"
                                      checked={visibleColumns.duration}
                                      onChange={(e) => setVisibleColumns({ ...visibleColumns, duration: e.target.checked })}
                                      className="rounded border-slate-300 text-blue-600 cursor-pointer"
                                    />
                                    <span>Duración / Estimado</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer py-0.5 text-slate-700 dark:text-neutral-300">
                                    <input
                                      type="checkbox"
                                      checked={visibleColumns.owner}
                                      onChange={(e) => setVisibleColumns({ ...visibleColumns, owner: e.target.checked })}
                                      className="rounded border-slate-300 text-blue-600 cursor-pointer"
                                    />
                                    <span>Responsable</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer py-0.5 text-slate-700 dark:text-neutral-300">
                                    <input
                                      type="checkbox"
                                      checked={visibleColumns.dates}
                                      onChange={(e) => setVisibleColumns({ ...visibleColumns, dates: e.target.checked })}
                                      className="rounded border-slate-300 text-blue-600 cursor-pointer"
                                    />
                                    <span>Fechas Programadas</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer py-0.5 text-slate-700 dark:text-neutral-300">
                                    <input
                                      type="checkbox"
                                      checked={visibleColumns.weight}
                                      onChange={(e) => setVisibleColumns({ ...visibleColumns, weight: e.target.checked })}
                                      className="rounded border-slate-300 text-blue-600 cursor-pointer"
                                    />
                                    <span>Peso</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer py-0.5 text-slate-700 dark:text-neutral-300">
                                    <input
                                      type="checkbox"
                                      checked={visibleColumns.progress}
                                      onChange={(e) => setVisibleColumns({ ...visibleColumns, progress: e.target.checked })}
                                      className="rounded border-slate-300 text-blue-600 cursor-pointer"
                                    />
                                    <span>Avance %</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer py-0.5 text-slate-700 dark:text-neutral-300">
                                    <input
                                      type="checkbox"
                                      checked={visibleColumns.contribution}
                                      onChange={(e) => setVisibleColumns({ ...visibleColumns, contribution: e.target.checked })}
                                      className="rounded border-slate-300 text-blue-600 cursor-pointer"
                                    />
                                    <span>Aporte al Proyecto</span>
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>

                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/50 dark:bg-neutral-900/90 text-slate-500 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-800">
                              <tr>
                                <th className="px-3 py-2.5 w-10 text-center">Estado</th>
                                <th className="px-3 py-2.5">Actividad</th>
                                {visibleColumns.priority && <th className="px-3 py-2.5">Prioridad</th>}
                                {visibleColumns.owner && <th className="px-3 py-2.5">Responsable</th>}
                                {visibleColumns.guide && <th className="px-3 py-2.5">Guía Técnica</th>}
                                {visibleColumns.duration && <th className="px-3 py-2.5 text-center">Duración</th>}
                                {visibleColumns.weight && <th className="px-3 py-2.5 text-center">Peso</th>}
                                {visibleColumns.dates && <th className="px-3 py-2.5">Fechas Programadas</th>}
                                {visibleColumns.progress && <th className="px-3 py-2.5 text-center">Avance %</th>}
                                {visibleColumns.contribution && <th className="px-3 py-2.5 text-right">Aporte</th>}
                                <th className="px-3 py-2.5 text-right w-36">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/70">
                              {acts.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan={11}
                                    className="p-6 text-center text-slate-400 dark:text-neutral-500 italic"
                                  >
                                    Sin actividades en esta sección. Haz clic en &ldquo;+ Actividad&rdquo; para agregar.
                                  </td>
                                </tr>
                              ) : (
                                acts.map((act, actIdx) => {
                                  const contrib = calculateActivityContribution(act, project, acts);
                                  const isCompleted = act.status === 'Completado';

                                  return (
                                    <tr
                                      key={act.id}
                                      draggable
                                      onDragStart={(e) => handleTaskDragStart(e, act.id)}
                                      className="hover:bg-slate-50/80 dark:hover:bg-neutral-800/40 transition-colors group"
                                    >
                                      {/* Status Checkbox */}
                                      <td className="px-3 py-2.5 text-center">
                                        <input
                                          type="checkbox"
                                          checked={isCompleted}
                                          onChange={() =>
                                            handleInlineProgressChange(
                                              act,
                                              isCompleted ? 0 : 100
                                            )
                                          }
                                          className="rounded border-slate-300 dark:border-neutral-700 text-blue-600 focus:ring-0 cursor-pointer"
                                        />
                                      </td>

                                      {/* Title & Badges */}
                                      <td className="px-3 py-2.5">
                                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                                          <GripVertical className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-600 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                          <button
                                            onClick={() => handleOpenTaskDetail(act)}
                                            className={`font-medium text-left hover:text-blue-600 dark:hover:text-cyan-400 transition-colors flex-1 min-w-0 ${
                                              isCompleted
                                                ? 'text-slate-400 dark:text-neutral-500 line-through'
                                                : 'text-slate-800 dark:text-neutral-200'
                                            }`}
                                          >
                                            {act.title}
                                          </button>

                                          <select
                                            value={act.status}
                                            onChange={(e) => {
                                              const newStatus = e.target.value as TaskStatus;
                                              const isComp = newStatus === 'Completado';
                                              const nowStr = new Date().toISOString().split('T')[0];
                                              const newProg = isComp ? 100 : newStatus === 'Pendiente' && act.progress === 100 ? 0 : act.progress === 100 ? 50 : act.progress;
                                              store.putRecord({
                                                ...act,
                                                status: newStatus,
                                                progress: newProg,
                                                realEnd: isComp ? nowStr : undefined,
                                                updatedAt: new Date().toISOString(),
                                              });
                                            }}
                                            className={`text-[10px] font-bold rounded-md px-1.5 py-0.5 border cursor-pointer shrink-0 transition-colors ${
                                              act.status === 'Completado'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                                : act.status === 'En curso'
                                                ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-cyan-300 dark:border-blue-800'
                                                : act.status === 'En espera'
                                                ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                                : act.status === 'En validación'
                                                ? 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                                                : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
                                            }`}
                                            title="Ajustar estado de la actividad"
                                          >
                                            <option value="Pendiente">Pendiente</option>
                                            <option value="En curso">En curso</option>
                                            <option value="En espera">En espera</option>
                                            <option value="En validación">En validación</option>
                                            <option value="Completado">Completado</option>
                                          </select>

                                          {act.milestone && (
                                            <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-1.5 py-0.2 rounded font-semibold shrink-0">
                                              Hito
                                            </span>
                                          )}
                                        </div>
                                      </td>

                                      {/* Priority */}
                                      {visibleColumns.priority && (
                                        <td className="px-3 py-2.5">
                                          <span
                                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                              act.priority === 'Crítica'
                                                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800'
                                                : act.priority === 'Alta'
                                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800'
                                                : act.priority === 'Media'
                                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800'
                                                : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700'
                                            }`}
                                          >
                                            {act.priority || 'Normal'}
                                          </span>
                                        </td>
                                      )}

                                      {/* Owner */}
                                      {visibleColumns.owner && (
                                        <td className="px-3 py-2.5 text-slate-600 dark:text-neutral-400">
                                          {act.owner || 'Sin asignar'}
                                        </td>
                                      )}

                                      {/* Guide */}
                                      {visibleColumns.guide && (
                                        <td className="px-3 py-2.5">
                                          {act.guideRef && allGuides[act.guideRef] ? (
                                            <button
                                              onClick={() => {
                                                setSelectedGuideId(act.guideRef || null);
                                                setActiveTab('guides');
                                              }}
                                              className="text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-medium truncate max-w-[130px]"
                                              title={`Abrir guía: ${allGuides[act.guideRef].name}`}
                                            >
                                              <BookOpen className="w-3 h-3 shrink-0" />
                                              <span className="truncate">{allGuides[act.guideRef].name}</span>
                                            </button>
                                          ) : (
                                            <span className="text-slate-400 dark:text-neutral-600 text-[11px]">—</span>
                                          )}
                                        </td>
                                      )}

                                      {/* Duration / Estimate */}
                                      {visibleColumns.duration && (
                                        <td className="px-3 py-2.5 text-center font-mono text-[11px] text-slate-600 dark:text-neutral-400">
                                          {act.estimate ? `${act.estimate}h` : act.start && act.due ? `${act.start} → ${act.due}` : '—'}
                                        </td>
                                      )}

                                      {/* Weight */}
                                      {visibleColumns.weight && (
                                        <td className="px-3 py-2.5 text-center font-mono text-slate-700 dark:text-neutral-300">
                                          {act.weight}
                                        </td>
                                      )}

                                      {/* Scheduled Dates */}
                                      {visibleColumns.dates && (
                                        <td className="px-3 py-2.5 text-slate-500 dark:text-neutral-400 font-mono text-[11px]">
                                          {act.start || '—'} a {act.due || '—'}
                                        </td>
                                      )}

                                      {/* Progress % editable in-line */}
                                      {visibleColumns.progress && (
                                        <td className="px-3 py-2.5 text-center">
                                          <input
                                            type="number"
                                            min={0}
                                            max={100}
                                            value={act.progress ?? 0}
                                            onChange={(e) =>
                                              handleInlineProgressChange(
                                                act,
                                                Number(e.target.value)
                                              )
                                            }
                                            className="w-14 text-center bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded px-1 py-0.5 font-mono text-blue-600 dark:text-cyan-400 font-semibold focus:outline-hidden focus:border-blue-500 tabular-nums"
                                          />
                                        </td>
                                      )}

                                      {/* Contribution */}
                                      {visibleColumns.contribution && (
                                        <td className="px-3 py-2.5 text-right font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                                          +{contrib.inProject}%
                                        </td>
                                      )}

                                      {/* Row Actions */}
                                      <td className="px-3 py-2.5 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100">
                                          {/* Move Up/Down */}
                                          <button
                                            onClick={() => handleMoveTaskOrder(act, 'up')}
                                            disabled={actIdx === 0}
                                            className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-20"
                                            title="Subir posición"
                                          >
                                            <ArrowUp className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleMoveTaskOrder(act, 'down')}
                                            disabled={actIdx === acts.length - 1}
                                            className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-20"
                                            title="Bajar posición"
                                          >
                                            <ArrowDown className="w-3.5 h-3.5" />
                                          </button>

                                          {/* Ver Detalle / Asociar Guía */}
                                          <button
                                            onClick={() => handleOpenTaskDetail(act)}
                                            className="px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-950/60 rounded hover:bg-blue-100 transition-colors"
                                            title="Ver detalle y asociar guías"
                                          >
                                            Detalle
                                          </button>

                                          <button
                                            onClick={() => onOpenTaskModal(act, project.id, sec.id)}
                                            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400"
                                            title="Editar actividad"
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDuplicateTask(act)}
                                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-neutral-200"
                                            title="Duplicar actividad"
                                          >
                                            <Copy className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteTask(act)}
                                            className="p-1 text-slate-400 hover:text-rose-500"
                                            title="Eliminar actividad"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB: NOTAS, PENDIENTES & INVOLUCRADOS (RF-18 / Solicitud de Usuario) */}
      {activeTab === 'stakeholders' && (
        <div className="space-y-6">
          {/* Top Metric Strip & Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 block">
                  Puntos Clave & Minutas
                </span>
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-neutral-100 tabular-nums">
                  {projectNotes.length}
                </span>
                <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                  Acuerdos, sesiones y decisiones
                </div>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 block">
                  Tareas & Pendientes Activos
                </span>
                <span className="text-2xl font-bold font-mono text-blue-600 dark:text-cyan-400 tabular-nums">
                  {projectTasks.filter((t) => t.status !== 'Completado').length}
                </span>
                <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                  De {projectTasks.length} tareas totales
                </div>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-cyan-400 rounded-xl">
                <ClipboardList className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500 block">
                  Involucrados & Responsables
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {projectStakeholders.length}
                </span>
                <div className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                  Contactos con correo y teléfono
                </div>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Sub-navigation Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-3 shadow-2xs">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-800 p-1 rounded-lg text-xs font-semibold overflow-x-auto">
              <button
                onClick={() => setStakeholdersSubTab('all')}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  stakeholdersSubTab === 'all'
                    ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-cyan-400 shadow-2xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todos los Aspectos
              </button>
              <button
                onClick={() => setStakeholdersSubTab('notes')}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  stakeholdersSubTab === 'notes'
                    ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-cyan-400 shadow-2xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Puntos Clave & Minutas ({projectNotes.length})
              </button>
              <button
                onClick={() => setStakeholdersSubTab('tasks')}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  stakeholdersSubTab === 'tasks'
                    ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-cyan-400 shadow-2xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tareas & Pendientes ({projectTasks.filter((t) => t.status !== 'Completado').length})
              </button>
              <button
                onClick={() => setStakeholdersSubTab('contacts')}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  stakeholdersSubTab === 'contacts'
                    ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-cyan-400 shadow-2xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Involucrados & Contactos ({projectStakeholders.length})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                onClick={() => onOpenNoteModal(project.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 border border-purple-200 dark:border-purple-800/60 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Nueva Minuta / Nota</span>
              </button>

              <button
                onClick={() => setIsAddStakeholderModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800/60 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Agregar Involucrado</span>
              </button>

              <button
                onClick={handleCopyAllEmails}
                className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-slate-700 dark:text-neutral-200 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                title="Copiar todos los correos de involucrados al portapapeles"
              >
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                <span>Copiar Correos</span>
              </button>
            </div>
          </div>

          {/* SECTION A: PUNTOS CLAVE & MINUTAS */}
          {(stakeholdersSubTab === 'all' || stakeholdersSubTab === 'notes') && (
            <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                      Puntos Clave, Minutas de Sesiones y Acuerdos
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      Registro de decisiones técnicas, compromisos y bitácora del proyecto
                    </p>
                  </div>
                </div>

                {/* Filter Pills for Note Types */}
                <div className="flex items-center gap-1 text-[11px] font-semibold flex-wrap">
                  {['all', 'Sesión', 'Acuerdo', 'Decisión', 'Compromiso', 'Nota'].map((typeKey) => (
                    <button
                      key={typeKey}
                      onClick={() => setNoteTypeFilter(typeKey)}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        noteTypeFilter === typeKey
                          ? 'bg-purple-600 text-white font-bold'
                          : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
                      }`}
                    >
                      {typeKey === 'all' ? 'Todas' : typeKey}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note Cards List */}
              {projectNotes.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-2">
                  <FileText className="w-8 h-8 text-slate-400 dark:text-neutral-600 mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    Aún no hay minutas o puntos clave registrados para este proyecto.
                  </p>
                  <button
                    onClick={() => onOpenNoteModal(project.id)}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                  >
                    + Registrar Primera Minuta
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {projectNotes
                    .filter((n) => noteTypeFilter === 'all' || n.type === noteTypeFilter)
                    .map((note) => {
                      const typeColors: Record<string, string> = {
                        Sesión: 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200',
                        Acuerdo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200',
                        Decisión: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-cyan-400 border-blue-200',
                        Compromiso: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200',
                        Nota: 'bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300 border-slate-200',
                      };

                      return (
                        <div
                          key={note.id}
                          className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 shadow-2xs space-y-2.5 flex flex-col justify-between hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                  typeColors[note.type] || typeColors.Nota
                                }`}
                              >
                                {note.type}
                              </span>
                              <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-neutral-500">
                                <Calendar className="w-3 h-3" />
                                <span>{note.date || 'S/F'}</span>
                                {note.time && <span>· {note.time}</span>}
                              </div>
                            </div>

                            <h4 className="text-xs font-bold text-slate-900 dark:text-neutral-100 line-clamp-2">
                              {note.title}
                            </h4>

                            {note.attendees && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-neutral-400">
                                <Users className="w-3 h-3 text-slate-400" />
                                <span className="truncate">Asistentes: {note.attendees}</span>
                              </div>
                            )}

                            <p className="text-xs text-slate-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap line-clamp-4 pt-1">
                              {note.body}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 flex items-center justify-between text-xs text-slate-400">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  `${note.type}: ${note.title}\nFecha: ${note.date}\n${note.body}`
                                );
                                showToast('Minuta copiada al portapapeles.');
                              }}
                              className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copiar</span>
                            </button>

                            <button
                              onClick={() => setNoteToDelete(note)}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Eliminar minuta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* SECTION B: TAREAS & PENDIENTES RÁPIDOS */}
          {(stakeholdersSubTab === 'all' || stakeholdersSubTab === 'tasks') && (
            <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 rounded-lg">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                      Tareas, Pendientes y Seguimiento Rápido
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      Marca actividades completadas o agrega nuevos pendientes directamente
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Add Bar */}
              <form
                onSubmit={handleQuickAddTask}
                className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-800 rounded-xl text-xs"
              >
                <input
                  type="text"
                  required
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  placeholder="Escribe una nueva tarea o pendiente para el proyecto..."
                  className="flex-1 bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 focus:outline-hidden focus:border-blue-500"
                />

                <input
                  type="text"
                  value={quickTaskOwner}
                  onChange={(e) => setQuickTaskOwner(e.target.value)}
                  placeholder="Responsable (ej. Carlos G.)..."
                  className="w-full sm:w-44 bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 focus:outline-hidden"
                />

                <select
                  value={quickTaskPriority}
                  onChange={(e) =>
                    setQuickTaskPriority(e.target.value as 'Baja' | 'Media' | 'Alta' | 'Crítica')
                  }
                  className="bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg px-2.5 py-2 text-slate-800 dark:text-neutral-200 focus:outline-hidden"
                >
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                  <option value="Crítica">Crítica</option>
                </select>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Pendiente</span>
                </button>
              </form>

              {/* Task List */}
              <div className="divide-y divide-slate-100 dark:divide-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                {projectTasks.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    No hay tareas registradas en este proyecto.
                  </div>
                ) : (
                  projectTasks.map((t) => {
                    const isDone = t.status === 'Completado';

                    return (
                      <div
                        key={t.id}
                        className="p-3.5 bg-white dark:bg-neutral-900 hover:bg-slate-50 dark:hover:bg-neutral-800/40 flex items-center justify-between gap-3 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => {
                              const nextStatus = isDone ? 'En curso' : 'Completado';
                              const nextProgress = isDone ? 50 : 100;
                              store.putRecord({
                                ...t,
                                status: nextStatus,
                                progress: nextProgress,
                                updatedAt: new Date().toISOString(),
                              });
                              showToast(`Tarea marcada como ${nextStatus}`);
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                          />

                          <div className="min-w-0">
                            <span
                              className={`font-semibold block truncate ${
                                isDone
                                  ? 'line-through text-slate-400 dark:text-neutral-500'
                                  : 'text-slate-800 dark:text-neutral-200'
                              }`}
                            >
                              {t.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 dark:text-neutral-500">
                              <span>Resp: {t.owner || 'Sin asignar'}</span>
                              {t.due && <span>· Meta: {t.due}</span>}
                              {t.blockReason && (
                                <span className="text-rose-500 font-bold truncate">
                                  ⚠️ Bloqueo: {t.blockReason}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              t.priority === 'Crítica'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                : t.priority === 'Alta'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-400'
                            }`}
                          >
                            {t.priority}
                          </span>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isDone
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                : t.status === 'En curso'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-cyan-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-400'
                            }`}
                          >
                            {t.status}
                          </span>

                          <button
                            onClick={() => handleOpenTaskDetail(t)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 rounded transition-colors"
                            title="Ver detalle completo"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteTask(t)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded transition-colors"
                            title="Eliminar tarea"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* SECTION C: RESPONSABLES & CONTACTOS (INVOLUCRADOS) */}
          {(stakeholdersSubTab === 'all' || stakeholdersSubTab === 'contacts') && (
            <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                      Involucrados, Responsables y Directorio de Contactos
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      Personas clave del cliente, equipo interno y proveedores para comunicación directa
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyAllEmails}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-400 border border-blue-200 dark:border-blue-800/60 rounded-lg hover:bg-blue-100"
                    title="Copiar todos los correos en formato separado por comas"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Copiar Todos los Correos</span>
                  </button>

                  <button
                    onClick={() => setIsAddStakeholderModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Agregar Involucrado</span>
                  </button>
                </div>
              </div>

              {/* Stakeholders Cards Grid */}
              {projectStakeholders.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-2">
                  <Users className="w-8 h-8 text-slate-400 dark:text-neutral-600 mx-auto" />
                  <p className="text-xs text-slate-500 dark:text-neutral-400">
                    No hay involucrados o contactos registrados específicamente en este proyecto.
                  </p>
                  <button
                    onClick={() => setIsAddStakeholderModalOpen(true)}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                  >
                    + Agregar Primer Involucrado
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {projectStakeholders.map((stk) => {
                    const initials = stk.name
                      .split(' ')
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase();

                    return (
                      <div
                        key={stk.id}
                        className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-emerald-400 rounded-xl p-4 shadow-2xs space-y-3 flex flex-col justify-between transition-all"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-2xs"
                                style={{ backgroundColor: stk.color || '#3b82f6' }}
                              >
                                {initials || 'IN'}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-neutral-100 truncate">
                                  {stk.name}
                                </h4>
                                <span className="text-[11px] text-slate-500 dark:text-neutral-400 block truncate">
                                  {stk.role || 'Involucrado'}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => setStakeholderToDelete(stk)}
                              className="text-slate-400 hover:text-rose-500 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Desvincular del proyecto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {stk.company && (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-neutral-400">
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{stk.company}</span>
                            </div>
                          )}

                          {/* Email Field with Fast Copy and Mailto */}
                          {stk.email && (
                            <div className="flex items-center justify-between gap-1 p-2 bg-slate-50 dark:bg-neutral-800/60 rounded-lg text-xs">
                              <a
                                href={`mailto:${stk.email}`}
                                className="text-blue-600 dark:text-cyan-400 hover:underline flex items-center gap-1.5 truncate"
                                title="Enviar correo electrónico"
                              >
                                <Mail className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{stk.email}</span>
                              </a>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(stk.email || '');
                                  showToast(`Correo copiado: ${stk.email}`);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded"
                                title="Copiar correo"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {/* Phone Field */}
                          {stk.phone && (
                            <div className="flex items-center justify-between gap-1 p-2 bg-slate-50 dark:bg-neutral-800/60 rounded-lg text-xs">
                              <a
                                href={`tel:${stk.phone}`}
                                className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5 truncate"
                                title="Llamar por teléfono / WhatsApp"
                              >
                                <Phone className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{stk.phone}</span>
                              </a>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(stk.phone || '');
                                  showToast(`Teléfono copiado: ${stk.phone}`);
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded"
                                title="Copiar teléfono"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 text-[11px] text-slate-400 flex items-center justify-between">
                          <span>Estado: Activo</span>
                          {stk.email && (
                            <a
                              href={`mailto:${stk.email}`}
                              className="text-blue-600 dark:text-cyan-400 hover:underline font-semibold"
                            >
                              Redactar Correo →
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VISTA RESUMEN EJECUTIVO */}
      {activeTab === 'summary' && (
        <ProjectExecutiveSummary
          project={project}
          tasks={projectTasks}
          calc={calc}
          brand={brand}
          client={client}
          onOpenTaskModal={onOpenTaskModal}
        />
      )}

      {/* TAB 3: GUÍAS DEL PROYECTO */}
      {activeTab === 'guides' && (
        <div className="space-y-6">
          {selectedGuideId && allGuides[selectedGuideId] ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedGuideId(null)}
                  className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver a listado de guías</span>
                </button>

                <button
                  onClick={() => setGuideToDelete(allGuides[selectedGuideId])}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg transition-colors"
                  title="Desvincular esta guía del proyecto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Desvincular del Proyecto</span>
                </button>
              </div>
              <GuideEditor guide={allGuides[selectedGuideId]} />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Guides Action Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-2xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    <span>Guías Técnicas del Proyecto ({projectGuides.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Procedimientos operativos paso a paso vinculados a las actividades de este proyecto
                  </p>
                </div>

                <button
                  onClick={() => setIsLinkGuideModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Vincular Guía a este Proyecto</span>
                </button>
                <button
                  onClick={handleSyncGuidesFromTemplate}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 rounded-lg text-xs font-semibold transition-colors shrink-0"
                  title="Reemplaza las copias del proyecto con la versión actual de Biblioteca"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Actualizar desde Biblioteca</span>
                </button>
              </div>

              {/* Guides Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projectGuides.length === 0 ? (
                  <div className="col-span-full p-12 text-center bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-3">
                    <BookOpen className="w-8 h-8 text-slate-400 dark:text-neutral-600 mx-auto" />
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-neutral-200">
                      No hay guías asignadas a este proyecto
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-md mx-auto">
                      Vincula guías existentes de la biblioteca técnica para acompañar la ejecución técnica de las tareas.
                    </p>
                    <button
                      onClick={() => setIsLinkGuideModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-cyan-400 bg-blue-50 dark:bg-cyan-950/60 border border-blue-200 dark:border-cyan-800/60 rounded-lg hover:bg-blue-100"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Seleccionar Guía de Biblioteca</span>
                    </button>
                  </div>
                ) : (
                  projectGuides.map((g) => {
                    const gCalc = calculateGuideProgress(g);
                    return (
                      <div
                        key={g.id}
                        className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-blue-400 dark:hover:border-cyan-500 rounded-xl p-4 transition-all shadow-2xs space-y-3 flex flex-col justify-between"
                      >
                        <div
                          className="cursor-pointer space-y-2"
                          onClick={() => setSelectedGuideId(g.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0" />
                              <h4 className="text-xs font-bold text-slate-900 dark:text-neutral-100 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors line-clamp-1">
                                {g.name}
                              </h4>
                            </div>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 font-semibold shrink-0">
                              v{g.version}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-neutral-400 line-clamp-2">
                            {g.description || 'Guía de procedimientos técnicos.'}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className="text-slate-500 dark:text-neutral-400">Cumplimiento:</span>
                            <span className="font-bold text-blue-600 dark:text-cyan-400 tabular-nums">
                              {gCalc.progress}%
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setSelectedGuideId(g.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-neutral-800 rounded transition-colors"
                            >
                              Ver Guía
                            </button>
                            <button
                              onClick={() => setGuideToDelete(g)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Desvincular o eliminar guía de este proyecto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {g.kind === 'pguide' && (
                              <button
                                onClick={() => handleExportProjectGuideAsTemplate(g)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition-colors"
                                title="Guardar esta versión del proyecto como plantilla en Biblioteca"
                              >
                                Crear plantilla
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SCRIPTS & DIAGNÓSTICO / TROUBLESHOOTING */}
      {activeTab === 'scripts' && (
        <div className="space-y-6">
          {/* Header & Actions Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-violet-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                  Scripts y Procedimientos de Diagnóstico del Proyecto
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Comandos de automatización y resolución de incidentes con modo de copiado ágil para terminal
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsLinkScriptModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60 rounded-lg hover:bg-violet-100"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Vincular Script</span>
              </button>
              <button
                onClick={() => setIsLinkTroubleModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-lg hover:bg-amber-100"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Vincular Diagnóstico</span>
              </button>
              {onOpenScriptModal && (
                <button
                  onClick={() => onOpenScriptModal(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Script</span>
                </button>
              )}
            </div>
          </div>

          {/* Subfilter pills */}
          <div className="flex items-center gap-1.5 text-xs font-medium border-b border-slate-200 dark:border-neutral-800 pb-2">
            <button
              onClick={() => setScriptFilterTab('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                scriptFilterTab === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-neutral-900 font-bold'
                  : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
              }`}
            >
              Todos ({projectScripts.length + projectTroubles.length})
            </button>
            <button
              onClick={() => setScriptFilterTab('scripts')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                scriptFilterTab === 'scripts'
                  ? 'bg-violet-600 text-white font-bold'
                  : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
              }`}
            >
              Scripts de Automatización ({projectScripts.length})
            </button>
            <button
              onClick={() => setScriptFilterTab('troubles')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                scriptFilterTab === 'troubles'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-slate-600 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800'
              }`}
            >
              Casos de Troubleshooting ({projectTroubles.length})
            </button>
          </div>

          {/* List / Grid of scripts and troubleshooting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(projectScripts.length === 0 && projectTroubles.length === 0) ? (
              <div className="col-span-full p-12 text-center bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-3">
                <Terminal className="w-8 h-8 text-slate-400 dark:text-neutral-600 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-800 dark:text-neutral-200">
                  Sin scripts ni casos de diagnóstico vinculados a este proyecto
                </h4>
                <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-md mx-auto">
                  Vincula scripts o casos de diagnóstico de la biblioteca técnica para tener a la mano comandos listos para copiar y ejecutar.
                </p>
                <div className="flex justify-center gap-2 pt-1">
                  <button
                    onClick={() => setIsLinkScriptModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-500"
                  >
                    Vincular Script
                  </button>
                  <button
                    onClick={() => setIsLinkTroubleModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-500"
                  >
                    Vincular Diagnóstico
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Render Scripts */}
                {(scriptFilterTab === 'all' || scriptFilterTab === 'scripts') &&
                  projectScripts.map((sc) => {
                    const firstBlockCode = sc.blocks?.[0]?.code || '';

                    return (
                      <div
                        key={sc.id}
                        className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-violet-400 dark:hover:border-violet-600 rounded-xl p-4 transition-all shadow-2xs space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 shrink-0">
                                <Terminal className="w-4 h-4" />
                              </span>
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 block">
                                  Script Automatizado
                                </span>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-neutral-100 truncate">
                                  {sc.name}
                                </h4>
                              </div>
                            </div>

                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 font-semibold shrink-0">
                              {sc.os || 'Universal'}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-neutral-400 line-clamp-2">
                            {sc.objective || 'Script de ejecución técnica.'}
                          </p>

                          {/* Quick Monospace Snippet Box */}
                          {firstBlockCode && (
                            <div className="p-2.5 bg-slate-950 text-emerald-400 rounded-lg font-mono text-[11px] overflow-hidden truncate">
                              <code>{firstBlockCode.split('\n')[0]}</code>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between text-xs">
                          <button
                            onClick={() => setScriptViewerItem(sc)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs"
                            title="Abrir en Modo Vista para copiar comandos fácilmente"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Modo Vista / Comandos</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(firstBlockCode);
                                showToast('Comandos del script copiados al portapapeles.');
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                              title="Copiar código al portapapeles"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {onOpenScriptModal && (
                              <button
                                onClick={() => onOpenScriptModal(sc)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                                title="Editar script"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => setItemToUnlink({ item: sc, type: 'script' })}
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Desvincular del proyecto"
                            >
                              <Unlink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {/* Render Troubles */}
                {(scriptFilterTab === 'all' || scriptFilterTab === 'troubles') &&
                  projectTroubles.map((tr) => {
                    return (
                      <div
                        key={tr.id}
                        className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-amber-400 dark:hover:border-amber-600 rounded-xl p-4 transition-all shadow-2xs space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                                <AlertTriangle className="w-4 h-4" />
                              </span>
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                                  Troubleshooting / Diagnóstico
                                </span>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-neutral-100 truncate">
                                  {tr.name}
                                </h4>
                              </div>
                            </div>

                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 font-semibold shrink-0">
                              {tr.os || 'Universal'}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-[11px] text-rose-900 dark:text-rose-300 font-medium">
                            <strong>Síntoma:</strong> {tr.symptom}
                          </div>

                          {tr.fix && (
                            <div className="p-2.5 bg-slate-950 text-cyan-400 rounded-lg font-mono text-[11px] overflow-hidden truncate">
                              <code>{tr.fix.split('\n')[0]}</code>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between text-xs">
                          <button
                            onClick={() => setScriptViewerItem(tr)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs"
                            title="Abrir en Modo Vista para copiar solución y pruebas rápidamente"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Modo Vista / Solución</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(tr.fix || tr.test || '');
                                showToast('Comando de solución copiado al portapapeles.');
                              }}
                              className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                              title="Copiar comando de solución"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            {onOpenTroubleModal && (
                              <button
                                onClick={() => onOpenTroubleModal(tr)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                                title="Editar caso"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => setItemToUnlink({ item: tr, type: 'trouble' })}
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Desvincular del proyecto"
                            >
                              <Unlink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ACTIVIDAD DETALLADA ("VER DETALLE" & ASOCIAR GUÍAS) */}
      {detailTaskModal.isOpen && detailTaskModal.task && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-6 shadow-2xl space-y-5 text-xs max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200 dark:border-neutral-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-cyan-400 block mb-1">
                  Detalle de Actividad y Cumplimiento
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100">
                  {detailTaskModal.task.title}
                </h3>
              </div>
              <button
                onClick={() => setDetailTaskModal({ isOpen: false, task: null })}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics & Slider */}
            <div className="bg-slate-50 dark:bg-neutral-800/60 p-4 rounded-xl border border-slate-200 dark:border-neutral-700/80 space-y-3">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-700 dark:text-neutral-300">
                  Porcentaje de Cumplimiento:
                </span>
                <span className="font-mono text-base font-bold text-blue-600 dark:text-cyan-400 tabular-nums">
                  {detailTaskModal.task.progress}%
                </span>
              </div>

              {/* Progress Slider */}
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={detailTaskModal.task.progress}
                onChange={(e) =>
                  handleInlineProgressChange(detailTaskModal.task!, Number(e.target.value))
                }
                className="w-full h-2 bg-slate-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />

              {/* Quick Percentage Presets */}
              <div className="flex items-center gap-2 pt-1">
                {[0, 25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => handleInlineProgressChange(detailTaskModal.task!, pct)}
                    className={`flex-1 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                      detailTaskModal.task?.progress === pct
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-100'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* General Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-500 dark:text-neutral-400 block mb-1">
                  Responsable:
                </label>
                <span className="font-semibold text-slate-900 dark:text-neutral-200">
                  {detailTaskModal.task.owner || 'Sin asignar'}
                </span>
              </div>
              <div>
                <label className="text-slate-500 dark:text-neutral-400 block mb-1 font-medium">Estado:</label>
                <select
                  value={detailTaskModal.task.status}
                  onChange={(e) => handleDetailTaskStatusChange(e.target.value as TaskStatus)}
                  className={`w-full text-xs font-semibold rounded-lg px-2 py-1.5 border transition-colors cursor-pointer focus:outline-hidden ${
                    detailTaskModal.task.status === 'Completado'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                      : detailTaskModal.task.status === 'En curso'
                      ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-cyan-300 dark:border-blue-800'
                      : detailTaskModal.task.status === 'En espera'
                      ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                      : detailTaskModal.task.status === 'En validación'
                      ? 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                      : 'bg-slate-50 dark:bg-neutral-800 border-slate-300 dark:border-neutral-700 text-slate-800 dark:text-neutral-200'
                  }`}
                >
                  <option value="Pendiente">⏳ Pendiente</option>
                  <option value="En curso">🔄 En curso</option>
                  <option value="En espera">⏸️ En espera</option>
                  <option value="En validación">🔍 En validación</option>
                  <option value="Completado">✅ Completado</option>
                </select>
              </div>
              <div>
                <label className="text-slate-500 dark:text-neutral-400 block mb-1">
                  Fechas Programadas:
                </label>
                <span className="font-mono text-slate-700 dark:text-neutral-300">
                  {detailTaskModal.task.start || '—'} al {detailTaskModal.task.due || '—'}
                </span>
              </div>
              <div>
                <label className="text-slate-500 dark:text-neutral-400 block mb-1">Prioridad:</label>
                <span className="font-semibold text-slate-800 dark:text-neutral-200">
                  {detailTaskModal.task.priority || 'Normal'}
                </span>
              </div>
            </div>

            {/* Checklist Section */}
            <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-neutral-800">
              <h4 className="font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                <span>Lista de Verificación / Checklist</span>
              </h4>

              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {(detailTaskModal.task.checklist || []).length === 0 ? (
                  <p className="text-slate-400 dark:text-neutral-500 italic py-1">
                    Sin elementos de verificación en la actividad.
                  </p>
                ) : (
                  (detailTaskModal.task.checklist || []).map((chk, cIdx) => (
                    <div
                      key={chk.id || cIdx}
                      onClick={() => handleToggleChecklistItem(cIdx)}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 dark:bg-neutral-800/60 hover:bg-slate-100 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={chk.done}
                        onChange={() => {}}
                        className="rounded border-slate-300 dark:border-neutral-700 text-emerald-600 cursor-pointer"
                      />
                      <span
                        className={`flex-1 ${
                          chk.done
                            ? 'line-through text-slate-400 dark:text-neutral-500'
                            : 'text-slate-700 dark:text-neutral-200'
                        }`}
                      >
                        {chk.text}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Add checklist item */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                  placeholder="Agregar nuevo ítem de verificación..."
                  className="flex-1 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-neutral-200 focus:outline-hidden focus:border-blue-500"
                />
                <button
                  onClick={handleAddChecklistItem}
                  className="px-3 py-1.5 font-semibold text-white bg-slate-800 dark:bg-neutral-700 hover:bg-slate-700 rounded-lg"
                >
                  Agregar
                </button>
              </div>
            </div>

            {/* ASSOCIATE TECHNICAL GUIDE SECTION */}
            <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  <span>Guía Técnica Asociada para Cumplimiento</span>
                </h4>
              </div>

              <div className="space-y-2">
                <select
                  value={detailTaskGuideId}
                  onChange={(e) => handleAssociateGuideToTask(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-200 font-medium"
                >
                  <option value="">(Sin guía asociada - Selecciona una guía de la biblioteca)</option>
                  {Object.values(allGuides).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (v{g.version})
                    </option>
                  ))}
                </select>

                {/* If guide is associated, render interactive steps */}
                {detailTaskGuideId && allGuides[detailTaskGuideId] && (
                  <div className="p-3 bg-blue-50/50 dark:bg-neutral-950/70 border border-blue-200/80 dark:border-neutral-800 rounded-xl space-y-2.5 mt-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800 dark:text-neutral-200">
                        Pasos técnicos de la guía:
                      </span>
                      <button
                        onClick={() => {
                          setSelectedGuideId(detailTaskGuideId);
                          setDetailTaskModal({ isOpen: false, task: null });
                          setActiveTab('guides');
                        }}
                        className="text-blue-600 dark:text-cyan-400 font-semibold hover:underline"
                      >
                        Abrir guía completa →
                      </button>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto">
                      {(allGuides[detailTaskGuideId].sections || []).flatMap((sec) =>
                        (sec.steps || []).map((step) => {
                          const checklistBlocks = (step.blocks || []).filter((b) => b.type === 'checklist');
                          const hasChecklists = checklistBlocks.some((b) => (b.items || []).length > 0);

                          return (
                            <div
                              key={step.id}
                              className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 space-y-2 transition-colors"
                            >
                              <div
                                onClick={() => handleFulfillGuideStep(step.id)}
                                className="flex items-start gap-2.5 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={step.progress === 100}
                                  onChange={() => {}}
                                  className="mt-0.5 rounded border-slate-300 dark:border-neutral-700 text-blue-600 cursor-pointer"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <h5
                                      className={`font-semibold text-xs ${
                                        step.progress === 100
                                          ? 'line-through text-slate-400 dark:text-neutral-500'
                                          : 'text-slate-800 dark:text-neutral-200'
                                      }`}
                                    >
                                      {step.title}
                                    </h5>
                                    <span className="font-mono text-[10px] text-blue-600 dark:text-cyan-400 font-bold tabular-nums">
                                      {step.progress}%
                                    </span>
                                  </div>
                                  {step.desc && (
                                    <div className="text-[10px] text-slate-500 dark:text-neutral-400 line-clamp-2 mt-0.5">
                                      <RichTextRenderer content={step.desc} />
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Nested checklist items in the step */}
                              {hasChecklists && (
                                <div className="pl-6 pt-1.5 space-y-1.5 border-t border-slate-100 dark:border-neutral-800">
                                  {checklistBlocks.flatMap((b) =>
                                    (b.items || []).map((it) => (
                                      <div
                                        key={it.id}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleGuideChecklistItem(step.id, b.id, it.id);
                                        }}
                                        className="flex items-center gap-2 text-[11px] cursor-pointer hover:text-blue-600 transition-colors"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={it.done}
                                          onChange={() => {}}
                                          className="rounded border-slate-300 dark:border-neutral-700 text-blue-600 cursor-pointer"
                                        />
                                        <span className={it.done ? 'line-through text-slate-400 dark:text-neutral-500' : 'text-slate-700 dark:text-neutral-300'}>
                                          {it.text}
                                        </span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-neutral-800">
              <button
                onClick={() => setDetailTaskModal({ isOpen: false, task: null })}
                className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT / ADD SECTION */}
      {editingSectionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <h4 className="text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>
                {editingSectionModal.section ? 'Editar Etapa del Plan' : 'Nueva Etapa del Plan'}
              </span>
            </h4>

            <form onSubmit={handleSaveSection} className="space-y-3.5">
              <div>
                <label className="text-slate-700 dark:text-neutral-300 block mb-1">
                  Nombre de la Etapa *
                </label>
                <input
                  type="text"
                  required
                  value={sectionFormName}
                  onChange={(e) => setSectionFormName(e.target.value)}
                  placeholder="Ej. 02 Aprovisionamiento de Conectores"
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-neutral-300 block mb-1">
                  Ponderación / Peso (%) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={sectionFormWeight}
                  onChange={(e) => setSectionFormWeight(Number(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 font-mono font-semibold"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-neutral-300 block mb-1">
                  Guía Técnica Vinculada (opcional)
                </label>
                <select
                  value={sectionFormGuideId}
                  onChange={(e) => setSectionFormGuideId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-2.5 py-2 text-slate-900 dark:text-neutral-200"
                >
                  <option value="">(Ninguna)</option>
                  {Object.values(allGuides).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (v{g.version})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingSectionModal({ isOpen: false, section: null })}
                  className="px-3.5 py-1.5 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg"
                >
                  Guardar Etapa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: APPLY / IMPORT PLAN TEMPLATE */}
      {isImportTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <h4 className="text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>Aplicar Plantilla al Proyecto</span>
            </h4>
            <p className="text-slate-500 dark:text-neutral-400 leading-relaxed">
              Configura automáticamente las etapas, ponderaciones y actividades seleccionando una plantilla oficial o agregando secciones específicas.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-semibold">
                  Plantilla de la Biblioteca:
                </label>
                <select
                  value={selectedTemplateToImport}
                  onChange={(e) => {
                    setSelectedTemplateToImport(e.target.value);
                    const tpl = allTemplates.find((t) => t.id === e.target.value);
                    if (tpl && tpl.sections && tpl.sections.length > 0) {
                      setSelectedSingleSectionId(tpl.sections[0].id);
                    }
                  }}
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-200 font-medium"
                >
                  <option value="">(Selecciona una plantilla)</option>
                  {allTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (v{t.version}) - {t.sections?.length || 0} etapas
                    </option>
                  ))}
                </select>
              </div>

              {/* Mode Selection */}
              <div>
                <label className="text-slate-700 dark:text-neutral-300 block mb-1.5 font-semibold">
                  Modo de Importación:
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/60 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-neutral-200 block">
                        Reemplazar plan completo
                      </span>
                      <span className="text-slate-500 dark:text-neutral-400 text-[11px]">
                        Sobrescribe las etapas actuales y genera las actividades de la plantilla.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/60 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-neutral-200 block">
                        Anexar a las etapas existentes
                      </span>
                      <span className="text-slate-500 dark:text-neutral-400 text-[11px]">
                        Conserva lo actual y añade las etapas de la plantilla al final.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/60 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="singleSection"
                      checked={importMode === 'singleSection'}
                      onChange={() => setImportMode('singleSection')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-neutral-200 block">
                        Añadir sólo una etapa/sección específica
                      </span>
                      <span className="text-slate-500 dark:text-neutral-400 text-[11px]">
                        Importa una sección particular y sus actividades al proyecto.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Single section dropdown if chosen */}
              {importMode === 'singleSection' && (
                <div>
                  <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-semibold">
                    Selecciona la Etapa a Importar:
                  </label>
                  <select
                    value={selectedSingleSectionId}
                    onChange={(e) => setSelectedSingleSectionId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-200 font-medium"
                  >
                    {allTemplates
                      .find((t) => t.id === selectedTemplateToImport)
                      ?.sections?.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.weight}%)
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsImportTemplateModalOpen(false)}
                className="px-3.5 py-1.5 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!selectedTemplateToImport}
                onClick={handleApplyTemplate}
                className="px-4 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg shadow-xs"
              >
                Aplicar Plantilla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CONFIRM CLEAR WORK PLAN */}
      {isClearPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <h4 className="text-base font-bold text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <span>¿Eliminar Plan de Trabajo Completo?</span>
            </h4>
            <p className="text-slate-600 dark:text-neutral-300 leading-relaxed">
              Esta acción eliminará todas las etapas y actividades del proyecto{' '}
              <strong>&ldquo;{project.name}&rdquo;</strong> para dejarlo completamente en blanco.
            </p>
            <p className="text-slate-500 dark:text-neutral-400 text-[11px]">
              Las actividades se moverán a la papelera y podrán ser recuperadas si lo requieres.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setIsClearPlanModalOpen(false)}
                className="px-3.5 py-1.5 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleClearWorkPlan}
                className="px-4 py-1.5 font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-xs"
              >
                Eliminar Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE/UNLINK GUIDE */}
      <ConfirmModal
        isOpen={!!guideToDelete}
        title="Desvincular Guía del Proyecto"
        message={`¿Estás seguro de que deseas desvincular o eliminar la guía "${guideToDelete?.name}" de este proyecto? Las actividades del proyecto ya no tendrán esta referencia.`}
        confirmText="Desvincular Guía"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={handleConfirmDeleteGuide}
        onCancel={() => setGuideToDelete(null)}
      />

      {/* CONFIRM UNLINK SCRIPT / TROUBLE */}
      <ConfirmModal
        isOpen={!!itemToUnlink}
        title={`Desvincular ${itemToUnlink?.type === 'script' ? 'Script' : 'Caso de Diagnóstico'}`}
        message={`¿Deseas desvincular "${itemToUnlink?.item.name}" de este proyecto? Seguirá disponible en la biblioteca técnica.`}
        confirmText="Desvincular"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={handleConfirmUnlinkScriptTrouble}
        onCancel={() => setItemToUnlink(null)}
      />

      {/* SCRIPT / TROUBLESHOOTING VIEW MODE MODAL */}
      {scriptViewerItem && (
        <ScriptTroubleViewerModal
          isOpen={!!scriptViewerItem}
          item={scriptViewerItem}
          onClose={() => setScriptViewerItem(null)}
          onEdit={() => {
            const current = scriptViewerItem;
            setScriptViewerItem(null);
            if (current.kind === 'script' && onOpenScriptModal) {
              onOpenScriptModal(current as Script);
            } else if (current.kind === 'trouble' && onOpenTroubleModal) {
              onOpenTroubleModal(current as Trouble);
            }
          }}
        />
      )}

      {/* MODAL LINK GUIDE TO PROJECT */}
      {isLinkGuideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span>Vincular Guía Técnica a este Proyecto</span>
              </h4>
              <button
                onClick={() => setIsLinkGuideModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-500 dark:text-neutral-400 text-xs">
              Selecciona una guía técnica de la biblioteca para incluirla en el expediente de este proyecto:
            </p>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-xl">
              {libraryGuides.length === 0 ? (
                <div className="p-4 text-center text-slate-400 dark:text-neutral-500">
                  No hay guías disponibles en la biblioteca.
                </div>
              ) : (
                libraryGuides.map((g) => (
                  <div
                    key={g.id}
                    className="p-3 hover:bg-slate-50 dark:hover:bg-neutral-800/50 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 dark:text-neutral-200 truncate">
                        {g.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400 line-clamp-1">
                        {g.description || 'Procedimiento técnico estándar.'}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleLinkGuideToProject(g)}
                        className="px-2.5 py-1 text-xs font-semibold bg-blue-50 dark:bg-cyan-950/60 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-cyan-800 rounded-lg hover:bg-blue-100"
                        title="Crear copia editable para este proyecto"
                      >
                        Usar en proyecto
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsLinkGuideModalOpen(false)}
                className="px-4 py-1.5 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-800 rounded-lg font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LINK SCRIPT TO PROJECT */}
      {isLinkScriptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-violet-500" />
                <span>Vincular Script a este Proyecto</span>
              </h4>
              <button
                onClick={() => setIsLinkScriptModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-500 dark:text-neutral-400 text-xs">
              Selecciona un script de la biblioteca para asociarlo y habilitar el copiado ágil en este proyecto:
            </p>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-xl">
              {libraryScripts.filter((s) => !(s.projects || []).includes(project.id)).length === 0 ? (
                <div className="p-4 text-center text-slate-400 dark:text-neutral-500">
                  Todos los scripts ya están vinculados o la biblioteca está vacía.
                </div>
              ) : (
                libraryScripts
                  .filter((s) => !(s.projects || []).includes(project.id))
                  .map((sc) => (
                    <div
                      key={sc.id}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-neutral-800/50 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-neutral-200 truncate">
                          {sc.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-neutral-400 line-clamp-1">
                          {sc.objective || 'Script de automatización técnica.'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleLinkScriptToProject(sc.id)}
                        className="px-3 py-1 text-xs font-semibold bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 rounded-lg hover:bg-violet-100 shrink-0"
                      >
                        + Vincular
                      </button>
                    </div>
                  ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsLinkScriptModalOpen(false)}
                className="px-4 py-1.5 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-800 rounded-lg font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL LINK TROUBLE TO PROJECT */}
      {isLinkTroubleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
              <h4 className="text-sm font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Vincular Diagnóstico / Troubleshooting</span>
              </h4>
              <button
                onClick={() => setIsLinkTroubleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-500 dark:text-neutral-400 text-xs">
              Selecciona un procedimiento de diagnóstico para solucionar incidentes técnicos en este proyecto:
            </p>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-neutral-800 border border-slate-200 dark:border-neutral-800 rounded-xl">
              {libraryTroubles.filter((tr) => !(tr.projects || []).includes(project.id)).length === 0 ? (
                <div className="p-4 text-center text-slate-400 dark:text-neutral-500">
                  Todos los diagnósticos ya están vinculados o la biblioteca está vacía.
                </div>
              ) : (
                libraryTroubles
                  .filter((tr) => !(tr.projects || []).includes(project.id))
                  .map((tr) => (
                    <div
                      key={tr.id}
                      className="p-3 hover:bg-slate-50 dark:hover:bg-neutral-800/50 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-neutral-200 truncate">
                          {tr.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-neutral-400 line-clamp-1">
                          {tr.symptom || 'Procedimiento de resolución de incidentes.'}
                        </div>
                      </div>
                      <button
                        onClick={() => handleLinkTroubleToProject(tr.id)}
                        className="px-3 py-1 text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 shrink-0"
                      >
                        + Vincular
                      </button>
                    </div>
                  ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsLinkTroubleModalOpen(false)}
                className="px-4 py-1.5 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-800 rounded-lg font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Agregar Involucrado / Contacto al Proyecto */}
      {isAddStakeholderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                  Agregar Involucrado al Proyecto
                </h3>
              </div>
              <button
                onClick={() => setIsAddStakeholderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStakeholder} className="space-y-3">
              <div>
                <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-semibold">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={newStakeholderName}
                  onChange={(e) => setNewStakeholderName(e.target.value)}
                  placeholder="Ej. Ing. Roberto Mendoza"
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-semibold">
                    Rol o Cargo
                  </label>
                  <input
                    type="text"
                    value={newStakeholderRole}
                    onChange={(e) => setNewStakeholderRole(e.target.value)}
                    placeholder="Ej. Líder de Proyecto, Sponsor..."
                    className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-semibold">
                    Empresa u Organización
                  </label>
                  <input
                    type="text"
                    value={newStakeholderCompany}
                    onChange={(e) => setNewStakeholderCompany(e.target.value)}
                    placeholder="Ej. Cliente / TI Infraestructura"
                    className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-semibold">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={newStakeholderEmail}
                  onChange={(e) => setNewStakeholderEmail(e.target.value)}
                  placeholder="roberto.mendoza@empresa.com"
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-semibold">
                  Teléfono / Móvil / WhatsApp
                </label>
                <input
                  type="text"
                  value={newStakeholderPhone}
                  onChange={(e) => setNewStakeholderPhone(e.target.value)}
                  placeholder="+52 55 1234 5678"
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddStakeholderModalOpen(false)}
                  className="px-3.5 py-2 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-xs"
                >
                  Guardar Involucrado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ConfirmModal: Eliminar Minuta */}
      <ConfirmModal
        isOpen={!!noteToDelete}
        title="Eliminar Minuta / Nota"
        message={`¿Estás seguro de que deseas eliminar la minuta "${noteToDelete?.title}"? Esta acción se moverá a la papelera.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={handleConfirmDeleteNote}
        onCancel={() => setNoteToDelete(null)}
      />

      {/* ConfirmModal: Desvincular Involucrado */}
      <ConfirmModal
        isOpen={!!stakeholderToDelete}
        title="Desvincular Involucrado"
        message={`¿Estás seguro de que deseas desvincular a "${stakeholderToDelete?.name}" de este proyecto?`}
        confirmText="Desvincular"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={handleConfirmDeleteStakeholder}
        onCancel={() => setStakeholderToDelete(null)}
      />

      {/* Fallback Tab: Tablero de Avance Gráfico si se selecciona visual */}
      {activeTab === 'visual' && (
        <ProjectVisualProgressBoard
          project={project}
          tasks={projectTasks}
          calc={calc}
          brand={brand}
          client={client}
          allGuides={allGuides}
          onNavigateToTask={(t) => handleOpenTaskDetail(t)}
        />
      )}
    </div>
  );
};
