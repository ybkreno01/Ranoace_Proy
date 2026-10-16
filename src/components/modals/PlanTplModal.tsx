import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Layers,
  Plus,
  Trash2,
  BookOpen,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Copy,
  Save,
  Download,
  Rocket,
  Settings2,
  FolderInput,
  Flag,
  Check,
} from 'lucide-react';
import { store } from '../../services/store';
import { exportSingleItemAsJson } from '../../services/singleItemTransfer';
import { BrandLogo } from '../common/BrandLogo';
import { PlanTpl, PlanTplSection, PlanTplActivity, CatalogItem, Guide, Project, Task } from '../../types';

interface PlanTplModalProps {
  isOpen: boolean;
  plantpl?: PlanTpl | null;
  onClose: () => void;
  onSaved?: (plantpl: PlanTpl) => void;
}

type Phase = { id: string; name: string };

const rid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

const DEFAULT_PHASES: Phase[] = [
  { id: 'ph-1', name: 'Fase 1: Implementación' },
  { id: 'ph-2', name: 'Fase 2: Validación y Cierre' },
];

// Diferencia en días entre dos fechas YYYY-MM-DD (fecha local, sin UTC).
const diffDays = (from: string, to: string): number => {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  const a = new Date(y1, (m1 || 1) - 1, d1 || 1).getTime();
  const b = new Date(y2, (m2 || 1) - 1, d2 || 1).getTime();
  return Math.round((b - a) / 86400000);
};

const inputCls =
  'w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded px-2 py-1 text-xs text-slate-900 dark:text-neutral-100 focus:outline-hidden focus:border-indigo-500';

export const PlanTplModal: React.FC<PlanTplModalProps> = ({ isOpen, plantpl, onClose, onSaved }) => {
  const state = store.getState();
  const allRecords = Object.values(state.records);
  const brands = allRecords.filter((r): r is CatalogItem => r.kind === 'brand' && !r.deletedAt);
  const workTypes = allRecords.filter((r): r is CatalogItem => r.kind === 'worktype' && !r.deletedAt);
  const guides = allRecords
    .filter((r): r is Guide => r.kind === 'guide' && !r.deletedAt)
    .sort((a, b) => a.name.localeCompare(b.name));
  const projects = allRecords
    .filter((r): r is Project => r.kind === 'project' && !r.deletedAt)
    .sort((a, b) => a.name.localeCompare(b.name));

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string>('');
  const [name, setName] = useState('');
  const [version, setVersion] = useState('1.0');
  const [brandId, setBrandId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [description, setDescription] = useState('');
  const [fav, setFav] = useState(false);
  const [phases, setPhases] = useState<Phase[]>(DEFAULT_PHASES);
  const [sections, setSections] = useState<PlanTplSection[]>([]);
  const [acts, setActs] = useState<PlanTplActivity[]>([]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState(false);
  const [panel, setPanel] = useState<null | 'props' | 'phases' | 'import' | 'use'>(null);
  const [importProjectId, setImportProjectId] = useState('');
  const [useProjectId, setUseProjectId] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notice, setNotice] = useState<string>('');
  const [newActTitles, setNewActTitles] = useState<Record<string, string>>({});
  const noticeTimer = useRef<number | null>(null);
  const saveRef = useRef<(silent?: boolean) => PlanTpl | null>(() => null);
  const dirtyRef = useRef(false);
  const [autoSavedAt, setAutoSavedAt] = useState('');

  const flash = (msg: string) => {
    setNotice(msg);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(''), 4000);
  };

  // ---- Inicialización ----
  useEffect(() => {
    if (!isOpen) return;
    setPanel(null);
    setConfirmDelete(false);
    setNewActTitles({});
    setCollapsed({});
    setDirty(false);
    if (plantpl) {
      setCurrentId(plantpl.id);
      setCreatedAt(plantpl.createdAt);
      setName(plantpl.name);
      setVersion(plantpl.version || '1.0');
      setBrandId(plantpl.brandId || '');
      setTypeId(plantpl.typeId || '');
      setDescription(plantpl.description || '');
      setFav(plantpl.fav || false);
      const ph = plantpl.phases && plantpl.phases.length > 0 ? plantpl.phases : DEFAULT_PHASES;
      setPhases(ph.map((p) => ({ id: p.id, name: p.name })));
      setSections((plantpl.sections || []).map((s) => ({ ...s })));
      setActs((plantpl.acts || []).map((a) => ({ ...a })));
    } else {
      const t = Date.now();
      setCurrentId(null);
      setCreatedAt('');
      setName('');
      setVersion('1.0');
      setBrandId('');
      setTypeId('');
      setDescription('');
      setFav(false);
      setPhases(DEFAULT_PHASES);
      const secs: PlanTplSection[] = [
        { id: `sec-${t}-1`, name: '1. Preparación y prerrequisitos', weight: 15, phaseId: 'ph-1' },
        { id: `sec-${t}-2`, name: '2. Despliegue de componentes', weight: 35, phaseId: 'ph-1' },
        { id: `sec-${t}-3`, name: '3. Pruebas de funcionamiento', weight: 30, phaseId: 'ph-2' },
        { id: `sec-${t}-4`, name: '4. Entrega y cierre técnico', weight: 20, phaseId: 'ph-2' },
      ];
      setSections(secs);
      setActs([
        {
          id: `act-${t}-1`,
          sectionId: secs[0].id,
          title: 'Levantamiento de accesos y puertos de red',
          owner: 'Ingeniero Consultor',
          d0: 0,
          d1: 2,
          weight: 1,
          milestone: false,
          checklist: [],
        },
      ]);
      setDirty(true);
    }
  }, [plantpl, isOpen]);

  // Aviso al cerrar la pestaña con cambios sin guardar
  useEffect(() => {
    if (!isOpen || !dirty) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [isOpen, dirty]);

  dirtyRef.current = dirty;

  // Autoguardado: 1.5 s después del último cambio se escribe en el store, que
  // lo envía a Firestore y programa el respaldo en Google Drive.
  useEffect(() => {
    if (!isOpen || !dirty || !name.trim()) return;
    const t = window.setTimeout(() => {
      if (saveRef.current(true)) setAutoSavedAt(new Date().toLocaleTimeString());
    }, 1500);
    return () => window.clearTimeout(t);
  }, [isOpen, dirty, name, version, brandId, typeId, description, fav, phases, sections, acts]);

  // Al salir de la vista con cambios pendientes, guarda antes de desmontar.
  useEffect(() => {
    return () => {
      if (dirtyRef.current) saveRef.current(true);
    };
  }, []);

  const totalWeight = useMemo(() => sections.reduce((s, x) => s + (x.weight || 0), 0), [sections]);
  const totalDays = useMemo(() => (acts.length ? Math.max(...acts.map((a) => a.d1)) + 1 : 0), [acts]);

  if (!isOpen) return null;

  const touch = () => setDirty(true);
  const updSection = (id: string, patch: Partial<PlanTplSection>) => {
    setSections((p) => p.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    touch();
  };
  const updAct = (id: string, patch: Partial<PlanTplActivity>) => {
    setActs((p) => p.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    touch();
  };

  // ---- Acciones de sección ----
  const addSection = () => {
    const id = rid('sec');
    setSections((p) => [
      ...p,
      { id, name: `${p.length + 1}. Nueva sección`, weight: 10, phaseId: phases[0]?.id || 'ph-1' },
    ]);
    touch();
  };
  const moveSection = (id: string, dir: -1 | 1) => {
    setSections((p) => {
      const i = p.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= p.length) return p;
      const c = [...p];
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });
    touch();
  };
  const duplicateSection = (id: string) => {
    const src = sections.find((s) => s.id === id);
    if (!src) return;
    const newId = rid('sec');
    const copyActs = acts
      .filter((a) => a.sectionId === id)
      .map((a) => ({ ...a, id: rid('act'), sectionId: newId, checklist: (a.checklist || []).map((c) => ({ ...c, id: rid('chk'), done: false })) }));
    setSections((p) => {
      const i = p.findIndex((s) => s.id === id);
      const c = [...p];
      c.splice(i + 1, 0, { ...src, id: newId, name: `${src.name} (copia)` });
      return c;
    });
    setActs((p) => [...p, ...copyActs]);
    touch();
  };
  const removeSection = (id: string) => {
    if (sections.length <= 1) {
      flash('La plantilla debe tener al menos una sección.');
      return;
    }
    const n = acts.filter((a) => a.sectionId === id).length;
    if (n > 0 && !window.confirm(`Esta sección tiene ${n} actividad(es). ¿Eliminarla junto con sus actividades?`)) return;
    setSections((p) => p.filter((s) => s.id !== id));
    setActs((p) => p.filter((a) => a.sectionId !== id));
    touch();
  };
  const normalizeWeights = () => {
    if (!sections.length) return;
    if (totalWeight <= 0) {
      const w = Math.round((100 / sections.length) * 10) / 10;
      setSections((p) => p.map((s) => ({ ...s, weight: w })));
    } else {
      const f = 100 / totalWeight;
      setSections((p) => p.map((s) => ({ ...s, weight: Math.round(s.weight * f * 10) / 10 })));
    }
    touch();
  };

  // ---- Acciones de actividad ----
  const addActivity = (secId: string, title?: string) => {
    const secActs = acts.filter((a) => a.sectionId === secId);
    const last = secActs[secActs.length - 1];
    const d0 = last ? last.d1 + 1 : 0;
    const t = (title ?? '').trim();
    setActs((p) => [
      ...p,
      {
        id: rid('act'),
        sectionId: secId,
        title: t || 'Nueva actividad',
        owner: last?.owner || 'Ingeniero Responsable',
        d0,
        d1: d0,
        weight: 1,
        milestone: false,
        checklist: [],
      },
    ]);
    touch();
  };
  const removeAct = (id: string) => {
    setActs((p) => p.filter((a) => a.id !== id));
    touch();
  };
  const moveAct = (id: string, dir: -1 | 1) => {
    setActs((p) => {
      const a = p.find((x) => x.id === id);
      if (!a) return p;
      const siblings = p.filter((x) => x.sectionId === a.sectionId);
      const si = siblings.findIndex((x) => x.id === id);
      const sj = si + dir;
      if (sj < 0 || sj >= siblings.length) return p;
      const target = siblings[sj];
      const c = [...p];
      const i = c.findIndex((x) => x.id === id);
      const j = c.findIndex((x) => x.id === target.id);
      [c[i], c[j]] = [c[j], c[i]];
      return c;
    });
    touch();
  };
  const duplicateAct = (id: string) => {
    setActs((p) => {
      const i = p.findIndex((a) => a.id === id);
      if (i < 0) return p;
      const c = [...p];
      c.splice(i + 1, 0, { ...p[i], id: rid('act'), title: `${p[i].title} (copia)`, checklist: (p[i].checklist || []).map((k) => ({ ...k, id: rid('chk'), done: false })) });
      return c;
    });
    touch();
  };
  const setStart = (a: PlanTplActivity, v: number) => {
    const d0 = Math.max(0, Math.round(v) || 0);
    updAct(a.id, { d0, d1: Math.max(a.d1, d0) });
  };
  const setEnd = (a: PlanTplActivity, v: number) => {
    const d1 = Math.max(a.d0, Math.round(v) || 0);
    updAct(a.id, { d1 });
  };
  const setDuration = (a: PlanTplActivity, v: number) => {
    const n = Math.max(1, Math.round(v) || 1);
    updAct(a.id, { d1: a.d0 + n - 1 });
  };

  // ---- Fases ----
  const updPhase = (id: string, nm: string) => {
    setPhases((p) => p.map((x) => (x.id === id ? { ...x, name: nm } : x)));
    touch();
  };
  const addPhase = () => {
    setPhases((p) => [...p, { id: rid('ph'), name: `Fase ${p.length + 1}` }]);
    touch();
  };
  const removePhase = (id: string) => {
    if (phases.length <= 1) return;
    const fallback = phases.find((p) => p.id !== id)!.id;
    setPhases((p) => p.filter((x) => x.id !== id));
    setSections((p) => p.map((s) => (s.phaseId === id ? { ...s, phaseId: fallback } : s)));
    touch();
  };

  // ---- Guardar / salir ----
  const buildRecord = (): PlanTpl => {
    const validPhaseIds = new Set(phases.map((p) => p.id));
    const fallbackPhase = phases[0]?.id || 'ph-1';
    const now = new Date().toISOString();
    return {
      id: currentId || `plantpl-${Date.now()}`,
      kind: 'plantpl',
      name: name.trim(),
      version: version.trim() || '1.0',
      brandId: brandId || undefined,
      typeId: typeId || undefined,
      description: description.trim() || undefined,
      fav,
      phases,
      sections: sections.map((s) => ({ ...s, phaseId: validPhaseIds.has(s.phaseId) ? s.phaseId : fallbackPhase })),
      acts,
      createdAt: createdAt || now,
      updatedAt: now,
    };
  };

  const save = (silent = false): PlanTpl | null => {
    if (!name.trim()) {
      if (!silent) flash('Escribe un nombre para la plantilla antes de guardar.');
      return null;
    }
    const rec = buildRecord();
    store.putRecord(rec);
    setCurrentId(rec.id);
    setCreatedAt(rec.createdAt);
    setDirty(false);
    if (onSaved) onSaved(rec);
    if (!silent) flash('Plantilla guardada y en cola de respaldo en Google Drive.');
    return rec;
  };
  saveRef.current = save;

  const close = () => {
    if (dirty) {
      if (name.trim()) save(true);
      else if (!window.confirm('La plantilla no tiene nombre y no se ha guardado. ¿Salir y descartarla?')) return;
    }
    setDirty(false);
    dirtyRef.current = false;
    onClose();
  };

  const useInProject = () => {
    if (!useProjectId) return;
    const rec = save();
    if (!rec) return;
    try {
      sessionStorage.setItem('cci_pending_tpl', rec.id);
    } catch {
      /* sin sessionStorage: el usuario elige la plantilla en el proyecto */
    }
    dirtyRef.current = false;
    onClose();
    store.setActiveView('projects', useProjectId);
  };

  const cloneTemplate = () => {
    const rec = save();
    if (!rec) return;
    const secMap: Record<string, string> = {};
    rec.sections.forEach((s) => (secMap[s.id] = rid('sec')));
    const now = new Date().toISOString();
    const copy: PlanTpl = {
      ...rec,
      id: `plantpl-${Date.now()}`,
      name: `${rec.name} (Copia)`,
      sections: rec.sections.map((s) => ({ ...s, id: secMap[s.id] })),
      acts: rec.acts.map((a) => ({ ...a, id: rid('act'), sectionId: secMap[a.sectionId], checklist: (a.checklist || []).map((c) => ({ ...c, id: rid('chk') })) })),
      createdAt: now,
      updatedAt: now,
    };
    store.putRecord(copy);
    flash(`Se creó "${copy.name}" en la Biblioteca.`);
  };

  const exportTemplate = () => {
    const rec = save();
    if (!rec) return;
    try {
      exportSingleItemAsJson(rec);
    } catch (e: any) {
      flash(e?.message || 'No se pudo exportar.');
    }
  };

  const deleteTemplate = () => {
    dirtyRef.current = false;
    if (currentId) store.deleteRecord(currentId);
    setDirty(false);
    onClose();
  };

  // ---- Importar plan desde un proyecto (con sus guías) ----
  const importFromProject = () => {
    const proj = projects.find((p) => p.id === importProjectId);
    if (!proj) return;
    const st = store.getState();
    const recs = Object.values(st.records);
    const pguides = recs.filter((r): r is Guide => r.kind === 'pguide' && r.projectId === proj.id && !r.deletedAt);
    const masterIds = new Set(guides.map((g) => g.id));
    const published: Record<string, string> = {};
    let publishedCount = 0;
    let linkedCount = 0;
    const now = new Date().toISOString();

    // pguide -> guía maestra (la de origen si existe; si no, se publica una nueva)
    const resolveMaster = (ref?: string): string | undefined => {
      if (!ref) return undefined;
      if (masterIds.has(ref)) return ref;
      const pg = pguides.find((g) => g.id === ref);
      if (!pg) return undefined;
      if (pg.sourceId && masterIds.has(pg.sourceId)) {
        linkedCount++;
        return pg.sourceId;
      }
      if (published[pg.id]) return published[pg.id];
      const newId = rid('guide');
      store.putRecord({
        ...pg,
        id: newId,
        kind: 'guide',
        name: pg.name.replace(` (${proj.name})`, ''),
        projectId: undefined,
        sourceId: undefined,
        sourceVersion: undefined,
        createdAt: now,
        updatedAt: now,
      } as Guide);
      published[pg.id] = newId;
      publishedCount++;
      return newId;
    };

    const projTasks = recs
      .filter((r): r is Task => r.kind === 'task' && r.projectId === proj.id && !r.deletedAt)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const projPhases = (proj.plan?.phases || []).slice().sort((a, b) => a.order - b.order);
    const projSections = (proj.plan?.sections || []).slice().sort((a, b) => a.order - b.order);

    if (projSections.length === 0 && projTasks.length === 0) {
      flash('Ese proyecto no tiene plan ni actividades para importar.');
      return;
    }
    if (acts.length > 0 && !window.confirm('Se reemplazarán las secciones y actividades actuales de la plantilla. ¿Continuar?')) return;

    const newPhases: Phase[] = projPhases.length
      ? projPhases.map((p) => ({ id: p.id, name: p.name }))
      : DEFAULT_PHASES;
    const secMap: Record<string, string> = {};
    const newSections: PlanTplSection[] = projSections.map((s) => {
      const id = rid('sec');
      secMap[s.id] = id;
      return {
        id,
        name: s.name,
        weight: s.weight,
        phaseId: newPhases.some((p) => p.id === s.phaseId) ? s.phaseId : newPhases[0].id,
        guideTplId: resolveMaster(s.guideTplId),
        guideWeight: s.guideWeight,
      };
    });
    // Tareas sin sección → sección "Otras actividades"
    const orphans = projTasks.filter((t) => !t.sectionId || !secMap[t.sectionId]);
    let orphanSecId = '';
    if (orphans.length) {
      orphanSecId = rid('sec');
      newSections.push({ id: orphanSecId, name: 'Otras actividades', weight: 0, phaseId: newPhases[0].id });
    }
    const base = proj.start || '';
    const newActs: PlanTplActivity[] = projTasks.map((t) => {
      const s = t.start && base ? Math.max(0, diffDays(base, t.start)) : 0;
      const e = t.due && base ? Math.max(s, diffDays(base, t.due)) : s;
      return {
        id: rid('act'),
        sectionId: t.sectionId && secMap[t.sectionId] ? secMap[t.sectionId] : orphanSecId,
        title: t.title,
        owner: t.owner || '',
        d0: s,
        d1: e,
        weight: t.weight || 1,
        milestone: !!t.milestone,
        guideTplId: resolveMaster(t.guideRef),
        checklist: (t.checklist || []).map((c) => ({ id: rid('chk'), text: c.text, done: false })),
      };
    });

    setPhases(newPhases);
    setSections(newSections);
    setActs(newActs);
    if (!name.trim()) setName(`Plan basado en ${proj.name}`);
    if (!brandId && proj.brandId) setBrandId(proj.brandId);
    if (!typeId && proj.typeId) setTypeId(proj.typeId);
    touch();
    setPanel(null);
    flash(
      `Importado: ${newSections.length} secciones, ${newActs.length} actividades. Guías: ${linkedCount} enlazadas a la Biblioteca y ${publishedCount} publicadas como plantilla nueva.`
    );
  };

  const brandName = brands.find((b) => b.id === brandId)?.name;
  const typeName = workTypes.find((w) => w.id === typeId)?.name;
  const weightOk = Math.round(totalWeight) === 100;

  return (
    <div className="max-w-6xl mx-auto space-y-4 pb-16 text-xs">
      {/* Tarjeta de encabezado */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={close}
            className="mt-1 p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800"
            title="Volver a la Biblioteca"
            aria-label="Volver a la Biblioteca"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          {brandId ? (
            <BrandLogo brandId={brandId} size="lg" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          )}
          <div className="flex-1 min-w-0 space-y-1.5">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                touch();
              }}
              placeholder="Nombre de la plantilla (p. ej. Plan estándar de despliegue PAM)"
              aria-label="Nombre de la plantilla"
              className="w-full bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-neutral-700 focus:border-indigo-500 focus:outline-hidden text-lg font-bold text-slate-900 dark:text-neutral-100 px-1 py-0.5"
            />
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold">
                Plantilla de plan
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700 font-mono">
                v{version || '1.0'}
              </span>
              {brandName && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700">
                  {brandName}
                </span>
              )}
              {typeName && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700">
                  {typeName}
                </span>
              )}
              <span className="text-slate-500 dark:text-neutral-400">
                {sections.length} secciones · {acts.length} actividades · {totalDays} días
              </span>
            </div>
          </div>
        </div>

        <textarea
          rows={2}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            touch();
          }}
          placeholder="Descripción: alcance, prerrequisitos y para qué proyectos aplica…"
          aria-label="Descripción"
          className="w-full bg-slate-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-100 focus:outline-hidden focus:border-indigo-500"
        />

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setPanel(panel === 'use' ? null : 'use')} className="flex items-center gap-1.5 px-3 py-1.5 font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg">
            <Rocket className="w-3.5 h-3.5" /> Usar en proyecto
          </button>
          <button type="button" onClick={() => setPanel(panel === 'import' ? null : 'import')} className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg border ${panel === 'import' ? 'bg-indigo-50 border-indigo-400 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' : 'bg-white dark:bg-neutral-900 border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800'}`}>
            <FolderInput className="w-3.5 h-3.5" /> Desde proyecto
          </button>
          <button type="button" onClick={() => setPanel(panel === 'props' ? null : 'props')} className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg border ${panel === 'props' ? 'bg-indigo-50 border-indigo-400 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' : 'bg-white dark:bg-neutral-900 border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800'}`}>
            <Settings2 className="w-3.5 h-3.5" /> Propiedades
          </button>
          <button type="button" onClick={() => setPanel(panel === 'phases' ? null : 'phases')} className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg border ${panel === 'phases' ? 'bg-indigo-50 border-indigo-400 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300' : 'bg-white dark:bg-neutral-900 border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800'}`}>
            <Layers className="w-3.5 h-3.5" /> Fases ({phases.length})
          </button>
          <button type="button" onClick={cloneTemplate} className="flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg border bg-white dark:bg-neutral-900 border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800">
            <Copy className="w-3.5 h-3.5" /> Clonar
          </button>
          <button type="button" onClick={exportTemplate} className="flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-lg border bg-white dark:bg-neutral-900 border-slate-300 dark:border-neutral-700 text-slate-700 dark:text-neutral-300 hover:bg-slate-50 dark:hover:bg-neutral-800" title="Exporta la plantilla junto con las guías que referencia">
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
          {currentId && (
            <span className="ml-auto flex items-center gap-1">
              {confirmDelete ? (
                <>
                  <span className="text-rose-600 dark:text-rose-400 font-medium">¿Enviar a la papelera?</span>
                  <button type="button" onClick={deleteTemplate} className="px-2.5 py-1.5 font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg">Sí, eliminar</button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="px-2.5 py-1.5 font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg">Cancelar</button>
                </>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 px-3 py-1.5 font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900">
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
                </button>
              )}
            </span>
          )}
        </div>

        {panel === 'props' && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200 dark:border-neutral-800">
            <div>
              <label className="block mb-1 text-slate-600 dark:text-neutral-400">Versión</label>
              <input type="text" value={version} onChange={(e) => { setVersion(e.target.value); touch(); }} className={`${inputCls} font-mono`} />
            </div>
            <div>
              <label className="block mb-1 text-slate-600 dark:text-neutral-400">Marca</label>
              <select value={brandId} onChange={(e) => { setBrandId(e.target.value); touch(); }} className={inputCls}>
                <option value="">(Multi-marca)</option>
                {brands.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-slate-600 dark:text-neutral-400">Tipo de trabajo</label>
              <select value={typeId} onChange={(e) => { setTypeId(e.target.value); touch(); }} className={inputCls}>
                <option value="">(Sin tipo)</option>
                {workTypes.map((w) => (<option key={w.id} value={w.id}>{w.name}</option>))}
              </select>
            </div>
            <label className="flex items-end gap-2 pb-1.5 cursor-pointer text-slate-700 dark:text-neutral-300">
              <input type="checkbox" checked={fav} onChange={(e) => { setFav(e.target.checked); touch(); }} className="rounded" />
              Favorita
            </label>
          </div>
        )}

        {panel === 'phases' && (
          <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 space-y-2">
            <p className="text-slate-500 dark:text-neutral-400">Las fases agrupan secciones en el proyecto. Cada sección elige su fase.</p>
            {phases.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <input type="text" value={p.name} onChange={(e) => updPhase(p.id, e.target.value)} aria-label="Nombre de la fase" className={inputCls} />
                <button type="button" onClick={() => removePhase(p.id)} disabled={phases.length <= 1} className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30" title="Eliminar fase (sus secciones pasan a la primera restante)" aria-label="Eliminar fase">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addPhase} className="flex items-center gap-1 px-2.5 py-1 font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded">
              <Plus className="w-3.5 h-3.5" /> Agregar fase
            </button>
          </div>
        )}

        {panel === 'use' && (
          <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 space-y-2">
            <p className="text-slate-500 dark:text-neutral-400">Guarda la plantilla, abre el proyecto elegido y muestra la ventana para aplicarla (reemplazar, agregar todo o una sola sección).</p>
            <div className="flex flex-wrap items-center gap-2">
              <select value={useProjectId} onChange={(e) => setUseProjectId(e.target.value)} aria-label="Proyecto destino" className={`${inputCls} max-w-md`}>
                <option value="">Selecciona el proyecto destino…</option>
                {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
              <button type="button" disabled={!useProjectId} onClick={useInProject} className="px-3 py-1.5 font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-lg">
                Abrir proyecto y aplicar
              </button>
            </div>
          </div>
        )}

        {panel === 'import' && (
          <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 space-y-2">
            <p className="text-slate-500 dark:text-neutral-400">
              Toma el plan de un proyecto (secciones, actividades, fechas relativas al inicio) y sus guías. Si la guía del proyecto viene de la Biblioteca, se enlaza a esa guía; si es propia del proyecto, se publica como plantilla nueva.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select value={importProjectId} onChange={(e) => setImportProjectId(e.target.value)} aria-label="Proyecto de origen" className={`${inputCls} max-w-md`}>
                <option value="">Selecciona un proyecto…</option>
                {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
              <button type="button" disabled={!importProjectId} onClick={importFromProject} className="px-3 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg">
                Importar plan y guías
              </button>
            </div>
          </div>
        )}
      </div>

      {notice && (
        <div role="status" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
          <Check className="w-3.5 h-3.5 shrink-0" /> {notice}
        </div>
      )}

      {/* Barra de pesos y guardado */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl border bg-white/95 dark:bg-neutral-900/95 backdrop-blur border-slate-200 dark:border-neutral-800">
        <span className={`font-mono px-2 py-1 rounded border ${weightOk ? 'bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-400' : 'bg-rose-100 border-rose-300 text-rose-700 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-400'}`}>
          Suma de pesos: {Math.round(totalWeight * 10) / 10}%
        </span>
        {!weightOk && (
          <button type="button" onClick={normalizeWeights} className="px-2.5 py-1 font-semibold text-amber-800 bg-amber-100 border border-amber-300 rounded hover:bg-amber-200 dark:text-amber-300 dark:bg-amber-950 dark:border-amber-800">
            Ajustar a 100 %
          </button>
        )}
        <span className="ml-auto flex items-center gap-2">
          {dirty ? (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><AlertCircle className="w-3.5 h-3.5" /> {name.trim() ? 'Guardando automáticamente…' : 'Escribe un nombre para activar el autoguardado'}</span>
          ) : (
            currentId && <span className="text-slate-400 dark:text-neutral-500">Guardado{autoSavedAt ? ` · ${autoSavedAt}` : ''} · respaldo en Drive automático</span>
          )}
          <button type="button" onClick={() => save()} className="flex items-center gap-1.5 px-4 py-1.5 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs">
            <Save className="w-3.5 h-3.5" /> Guardar
          </button>
        </span>
      </div>

      {/* Tarjetas de sección */}
      {sections.map((sec, si) => {
        const secActs = acts.filter((a) => a.sectionId === sec.id);
        const isCollapsed = !!collapsed[sec.id];
        const secDays = secActs.length ? Math.max(...secActs.map((a) => a.d1)) + 1 : 0;
        return (
          <section key={sec.id} className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-2xs overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-neutral-800/60 border-b border-slate-200 dark:border-neutral-800">
              <button type="button" onClick={() => setCollapsed((c) => ({ ...c, [sec.id]: !c[sec.id] }))} className="p-1 text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white" aria-label={isCollapsed ? 'Expandir sección' : 'Colapsar sección'}>
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <input type="text" value={sec.name} onChange={(e) => updSection(sec.id, { name: e.target.value })} aria-label="Nombre de la sección" className="flex-1 min-w-48 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-neutral-600 focus:border-indigo-500 focus:outline-hidden text-sm font-semibold text-slate-900 dark:text-neutral-100 px-1 py-0.5" />
              <label className="flex items-center gap-1 text-slate-500 dark:text-neutral-400">
                Peso
                <input type="number" min={0} max={100} value={sec.weight} onChange={(e) => updSection(sec.id, { weight: Number(e.target.value) || 0 })} aria-label="Peso de la sección (%)" className="w-14 bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded px-1.5 py-1 font-mono text-center" />
                %
              </label>
              <select value={sec.phaseId} onChange={(e) => updSection(sec.id, { phaseId: e.target.value })} aria-label="Fase de la sección" className="bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded px-2 py-1 max-w-44">
                {phases.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                {!phases.some((p) => p.id === sec.phaseId) && <option value={sec.phaseId}>(fase desconocida)</option>}
              </select>
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                <select value={sec.guideTplId || ''} onChange={(e) => updSection(sec.id, { guideTplId: e.target.value || undefined })} aria-label="Guía de la sección" className="bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded px-2 py-1 max-w-52">
                  <option value="">Sin guía de sección</option>
                  {guides.map((g) => (<option key={g.id} value={g.id}>{g.name} (v{g.version})</option>))}
                  {sec.guideTplId && !guides.some((g) => g.id === sec.guideTplId) && <option value={sec.guideTplId}>(guía no encontrada)</option>}
                </select>
              </span>
              <span className="text-slate-400 dark:text-neutral-500 whitespace-nowrap">{secActs.length} act. · {secDays} d</span>
              <span className="flex items-center">
                <button type="button" onClick={() => moveSection(sec.id, -1)} disabled={si === 0} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30" title="Subir sección" aria-label="Subir sección"><ArrowUp className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => moveSection(sec.id, 1)} disabled={si === sections.length - 1} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30" title="Bajar sección" aria-label="Bajar sección"><ArrowDown className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => duplicateSection(sec.id)} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white" title="Duplicar sección" aria-label="Duplicar sección"><Copy className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => removeSection(sec.id)} className="p-1 text-slate-400 hover:text-rose-600" title="Eliminar sección" aria-label="Eliminar sección"><Trash2 className="w-3.5 h-3.5" /></button>
              </span>
            </div>

            {!isCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-800">
                      <th className="px-3 py-2 font-semibold min-w-56">Actividad</th>
                      <th className="px-2 py-2 font-semibold min-w-32">Responsable</th>
                      <th className="px-2 py-2 font-semibold w-20">Día inicio</th>
                      <th className="px-2 py-2 font-semibold w-20">Día fin</th>
                      <th className="px-2 py-2 font-semibold w-16">Días</th>
                      <th className="px-2 py-2 font-semibold w-16">Peso</th>
                      <th className="px-2 py-2 font-semibold min-w-44">Guía asociada</th>
                      <th className="px-2 py-2 font-semibold w-12 text-center">Hito</th>
                      <th className="px-2 py-2 w-28" />
                    </tr>
                  </thead>
                  <tbody>
                    {secActs.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-3 py-4 text-center text-slate-400 dark:text-neutral-500">Sin actividades. Escribe un título abajo y presiona Enter.</td>
                      </tr>
                    )}
                    {secActs.map((a, ai) => (
                      <tr key={a.id} className="border-b border-slate-100 dark:border-neutral-800/70 hover:bg-slate-50/70 dark:hover:bg-neutral-800/30">
                        <td className="px-3 py-1.5">
                          <input type="text" value={a.title} onChange={(e) => updAct(a.id, { title: e.target.value })} aria-label="Título de la actividad" className={inputCls} />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="text" value={a.owner} onChange={(e) => updAct(a.id, { owner: e.target.value })} aria-label="Responsable" className={inputCls} />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min={0} value={a.d0} onChange={(e) => setStart(a, Number(e.target.value))} aria-label="Día de inicio" className={`${inputCls} font-mono text-center`} />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min={a.d0} value={a.d1} onChange={(e) => setEnd(a, Number(e.target.value))} aria-label="Día de fin" className={`${inputCls} font-mono text-center`} />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min={1} value={a.d1 - a.d0 + 1} onChange={(e) => setDuration(a, Number(e.target.value))} aria-label="Duración en días" className={`${inputCls} font-mono text-center`} />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" min={0} step="0.5" value={a.weight} onChange={(e) => updAct(a.id, { weight: Math.max(0, Number(e.target.value) || 0) })} aria-label="Peso de la actividad" className={`${inputCls} font-mono text-center`} />
                        </td>
                        <td className="px-2 py-1.5">
                          <select value={a.guideTplId || ''} onChange={(e) => updAct(a.id, { guideTplId: e.target.value || undefined })} aria-label="Guía asociada" className={inputCls}>
                            <option value="">—</option>
                            {guides.map((g) => (<option key={g.id} value={g.id}>{g.name} (v{g.version})</option>))}
                            {a.guideTplId && !guides.some((g) => g.id === a.guideTplId) && <option value={a.guideTplId}>(guía no encontrada)</option>}
                          </select>
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button type="button" onClick={() => updAct(a.id, { milestone: !a.milestone })} aria-pressed={a.milestone} aria-label="Hito" title="Marcar como hito" className={`p-1 rounded ${a.milestone ? 'text-amber-500' : 'text-slate-300 dark:text-neutral-600 hover:text-amber-500'}`}>
                            <Flag className="w-3.5 h-3.5" fill={a.milestone ? 'currentColor' : 'none'} />
                          </button>
                        </td>
                        <td className="px-2 py-1.5">
                          <span className="flex items-center justify-end">
                            <button type="button" onClick={() => moveAct(a.id, -1)} disabled={ai === 0} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30" aria-label="Subir actividad" title="Subir"><ArrowUp className="w-3.5 h-3.5" /></button>
                            <button type="button" onClick={() => moveAct(a.id, 1)} disabled={ai === secActs.length - 1} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white disabled:opacity-30" aria-label="Bajar actividad" title="Bajar"><ArrowDown className="w-3.5 h-3.5" /></button>
                            <button type="button" onClick={() => duplicateAct(a.id)} className="p-1 text-slate-400 hover:text-slate-800 dark:hover:text-white" aria-label="Duplicar actividad" title="Duplicar"><Copy className="w-3.5 h-3.5" /></button>
                            <button type="button" onClick={() => removeAct(a.id)} className="p-1 text-slate-400 hover:text-rose-600" aria-label="Eliminar actividad" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center gap-2 px-3 py-2">
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={newActTitles[sec.id] || ''}
                    onChange={(e) => setNewActTitles((p) => ({ ...p, [sec.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (newActTitles[sec.id] || '').trim()) {
                        e.preventDefault();
                        addActivity(sec.id, newActTitles[sec.id]);
                        setNewActTitles((p) => ({ ...p, [sec.id]: '' }));
                      }
                    }}
                    placeholder="Agregar actividad y presionar Enter…"
                    aria-label={`Agregar actividad a ${sec.name}`}
                    className="flex-1 bg-transparent focus:outline-hidden text-slate-800 dark:text-neutral-100 placeholder:text-slate-400"
                  />
                  <button type="button" onClick={() => { addActivity(sec.id, newActTitles[sec.id]); setNewActTitles((p) => ({ ...p, [sec.id]: '' })); }} className="px-2.5 py-1 font-semibold text-blue-700 dark:text-cyan-300 bg-blue-50 dark:bg-cyan-950/50 border border-blue-200 dark:border-cyan-800 rounded">
                    Agregar
                  </button>
                </div>
              </div>
            )}
          </section>
        );
      })}

      <button type="button" onClick={addSection} className="w-full flex items-center justify-center gap-1.5 py-3 font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/30 border border-dashed border-indigo-300 dark:border-indigo-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/50">
        <Plus className="w-4 h-4" /> Agregar sección
      </button>
    </div>
  );
};
