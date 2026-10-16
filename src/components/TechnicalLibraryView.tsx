import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  Terminal,
  AlertCircle,
  FolderKanban,
  Plus,
  Search,
  Star,
  Folder,
  Tag,
  ArrowLeft,
  Copy,
  Download,
  Trash2,
  Pencil,
  FileCode,
  Layers,
  ChevronRight,
  Sparkles,
  Upload,
  Play,
  ExternalLink,
  FileJson,
} from 'lucide-react';
import { store } from '../services/store';
import { Guide, Script, Trouble, PlanTpl, CatalogItem, InteractiveGuide } from '../types';
import { GuideEditor } from './GuideEditor';
import { ConfirmModal } from './modals/ConfirmModal';
import { ScriptTroubleViewerModal } from './ScriptTroubleViewerModal';
import { InteractiveGuideViewer } from './InteractiveGuideViewer';
import { InteractiveGuideModal } from './modals/InteractiveGuideModal';
import { exportSingleItemAsJson } from '../services/singleItemTransfer';
import { SingleItemImportModal } from './modals/SingleItemImportModal';

interface TechnicalLibraryViewProps {
  onOpenGuideModal: (guide?: Guide | null) => void;
  onOpenScriptModal: (script?: Script | null) => void;
  onOpenTroubleModal: (trouble?: Trouble | null) => void;
  onOpenPlanTplModal?: (plantpl?: PlanTpl | null) => void;
  initialSelectedGuideId?: string | null;
}

export const TechnicalLibraryView: React.FC<TechnicalLibraryViewProps> = ({
  onOpenGuideModal,
  onOpenScriptModal,
  onOpenTroubleModal,
  onOpenPlanTplModal,
  initialSelectedGuideId,
}) => {
  const state = store.getState();
  const [activeTab, setActiveTab] = useState<'guides' | 'interactive' | 'scripts' | 'trouble' | 'plantpls'>('guides');

  // Search query
  const [search, setSearch] = useState('');

  // Modals state
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);
  const [viewerItem, setViewerItem] = useState<Script | Trouble | null>(null);

  // Interactive guide state
  const [activeInteractiveGuideId, setActiveInteractiveGuideId] = useState<string | null>(null);
  const [interactiveModalState, setInteractiveModalState] = useState<{
    isOpen: boolean;
    guide: InteractiveGuide | null;
  }>({ isOpen: false, guide: null });

  // Single Item JSON Import Modal state
  const [isSingleImportModalOpen, setIsSingleImportModalOpen] = useState(false);

  // Advanced Filters: filterType ('all' | 'fav' | brandId | folderName | tagId)
  const [activeFilter, setActiveFilter] = useState<{
    type: 'all' | 'fav' | 'brand' | 'folder' | 'tag';
    value?: string;
  }>({ type: 'all' });

  // Selected standard guide for opening the visual GuideEditor
  const [activeGuideId, setActiveGuideId] = useState<string | null>(initialSelectedGuideId || null);

  const brands = Object.values(state.records).filter(
    (r): r is CatalogItem => r.kind === 'brand' && !r.deletedAt
  );
  const tags = Object.values(state.records).filter(
    (r): r is CatalogItem => r.kind === 'tag' && !r.deletedAt
  );

  const guides = Object.values(state.records).filter(
    (r): r is Guide => r.kind === 'guide' && !r.deletedAt
  );
  const interactiveGuides = Object.values(state.records).filter(
    (r): r is InteractiveGuide => r.kind === 'interactive_guide' && !r.deletedAt
  );
  const scripts = Object.values(state.records).filter(
    (r): r is Script => r.kind === 'script' && !r.deletedAt
  );
  const troubleEntries = Object.values(state.records).filter(
    (r): r is Trouble => r.kind === 'trouble' && !r.deletedAt
  );
  const plantpls = Object.values(state.records).filter(
    (r): r is PlanTpl => r.kind === 'plantpl' && !r.deletedAt
  );

  // Check initial selection
  useEffect(() => {
    if (initialSelectedGuideId) {
      const rec = state.records[initialSelectedGuideId];
      if (rec && rec.kind === 'interactive_guide') {
        setActiveInteractiveGuideId(initialSelectedGuideId);
        setActiveTab('interactive');
      } else if (rec && (rec.kind === 'guide' || rec.kind === 'pguide')) {
        setActiveGuideId(initialSelectedGuideId);
        setActiveTab('guides');
      }
    }
  }, [initialSelectedGuideId, state.records]);

  // Current list based on active tab
  const currentItems = useMemo(() => {
    if (activeTab === 'guides') return guides;
    if (activeTab === 'interactive') return interactiveGuides;
    if (activeTab === 'scripts') return scripts;
    if (activeTab === 'trouble') return troubleEntries;
    return plantpls;
  }, [activeTab, guides, interactiveGuides, scripts, troubleEntries, plantpls]);

  // Extract distinct folders for current tab items (Chapter 3.1)
  const availableFolders = useMemo(() => {
    const set = new Set<string>();
    currentItems.forEach((it: any) => {
      if (it.folder && it.folder.trim()) set.add(it.folder.trim());
    });
    return Array.from(set).sort();
  }, [currentItems]);

  // Brands that actually have items in the current tab
  const availableBrands = useMemo(() => {
    const brandIds = new Set<string>();
    currentItems.forEach((it: any) => {
      if (it.brandId) brandIds.add(it.brandId);
    });
    return brands.filter((b) => brandIds.has(b.id));
  }, [currentItems, brands]);

  // Tags used by items in current tab
  const availableTags = useMemo(() => {
    const tagIds = new Set<string>();
    currentItems.forEach((it: any) => {
      if (Array.isArray(it.tags)) {
        it.tags.forEach((t: string) => tagIds.add(t));
      }
    });
    return tags.filter((t) => tagIds.has(t.id));
  }, [currentItems, tags]);

  // Filtered Items (matching Chapter 3.1 and 3.2)
  const filteredItems = useMemo(() => {
    return currentItems.filter((item: any) => {
      // 1. Filter Type
      if (activeFilter.type === 'fav' && !item.fav) return false;
      if (activeFilter.type === 'brand' && item.brandId !== activeFilter.value) return false;
      if (activeFilter.type === 'folder' && item.folder !== activeFilter.value) return false;
      if (activeFilter.type === 'tag' && (!item.tags || !item.tags.includes(activeFilter.value))) return false;

      // 2. Text Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const brand = brands.find((b) => b.id === item.brandId)?.name.toLowerCase() || '';
        const name = (item.name || '').toLowerCase();
        const desc = (item.description || item.symptom || item.objective || '').toLowerCase();
        const product = (item.product || '').toLowerCase();

        if (!name.includes(q) && !desc.includes(q) && !brand.includes(q) && !product.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [currentItems, activeFilter, search, brands]);

  const activeGuide = activeGuideId ? (state.records[activeGuideId] as Guide) : null;
  const activeInteractiveGuide = activeInteractiveGuideId
    ? (state.records[activeInteractiveGuideId] as InteractiveGuide)
    : null;

  // Toggle favorite
  const handleToggleFav = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    store.putRecord({
      ...item,
      fav: !item.fav,
    });
  };

  const handleDeleteItem = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToDelete({ id: item.id, name: item.name || 'este elemento' });
  };

  const handleDuplicateTemplate = (tpl: PlanTpl, e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = `plantpl-${Date.now()}`;
    const duplicated: PlanTpl = {
      ...tpl,
      id: newId,
      name: `${tpl.name} (Copia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.putRecord(duplicated);
  };

  // If Interactive Guide is active, render InteractiveGuideViewer
  if (activeInteractiveGuide) {
    const brand = brands.find((b) => b.id === activeInteractiveGuide.brandId);
    return (
      <>
        <InteractiveGuideViewer
          guide={activeInteractiveGuide}
          onBack={() => setActiveInteractiveGuideId(null)}
          onEdit={(g) => setInteractiveModalState({ isOpen: true, guide: g })}
          onDelete={(g) => setItemToDelete({ id: g.id, name: g.name })}
          brand={brand}
        />

        <InteractiveGuideModal
          isOpen={interactiveModalState.isOpen}
          guide={interactiveModalState.guide}
          onClose={() => setInteractiveModalState({ isOpen: false, guide: null })}
        />

        <ConfirmModal
          isOpen={!!itemToDelete}
          title="Enviar a Papelera"
          message={`¿Estás seguro de que deseas enviar "${itemToDelete?.name}" a la papelera? Podrás restaurarlo más tarde desde la papelera si lo necesitas.`}
          confirmText="Enviar a papelera"
          cancelText="Cancelar"
          isDestructive={true}
          onConfirm={() => {
            if (itemToDelete) {
              store.deleteRecord(itemToDelete.id, true);
              if (activeInteractiveGuideId === itemToDelete.id) {
                setActiveInteractiveGuideId(null);
              }
              setItemToDelete(null);
            }
          }}
          onCancel={() => setItemToDelete(null)}
        />
      </>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            {activeGuide && (
              <button
                onClick={() => setActiveGuideId(null)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white mr-1 transition-colors cursor-pointer"
                title="Volver al catálogo de guías"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {activeGuide ? activeGuide.name : 'Biblioteca Técnica'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            {activeGuide
              ? `Editor interactivo por bloques (v${activeGuide.version}) · ${activeGuide.product || 'Procedimiento estándar'}`
              : 'Procedimientos paso a paso, guías interactivas con generación dinámica de comandos, plantillas, scripts y troubleshooting.'}
          </p>
        </div>

        {/* Primary Create & Import Actions */}
        {!activeGuide && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Single Item Import JSON Button */}
            <button
              type="button"
              onClick={() => setIsSingleImportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-750 border border-slate-200 dark:border-neutral-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
              title="Importar un archivo individual JSON (Guía, Script, Troubleshooting o Plantilla)"
            >
              <Upload className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <span>Importar JSON</span>
            </button>

            {activeTab === 'guides' && (
              <button
                onClick={() => onOpenGuideModal(null)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Guía</span>
              </button>
            )}
            {activeTab === 'interactive' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInteractiveModalState({ isOpen: true, guide: null })}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-750 border border-slate-200 dark:border-neutral-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
                  title="Importar un archivo HTML o runbook interactivo"
                >
                  <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Importar Guía HTML</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInteractiveModalState({ isOpen: true, guide: null })}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Guía Interactiva</span>
                </button>
              </div>
            )}
            {activeTab === 'scripts' && (
              <button
                onClick={() => onOpenScriptModal(null)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Script</span>
              </button>
            )}
            {activeTab === 'trouble' && (
              <button
                onClick={() => onOpenTroubleModal(null)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Ficha</span>
              </button>
            )}
            {activeTab === 'plantpls' && (
              <button
                onClick={() => onOpenPlanTplModal && onOpenPlanTplModal(null)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Plantilla de Plan</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* If Standard Guide is currently active, render full visual GuideEditor */}
      {activeGuide ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-xs shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="font-mono text-blue-600 dark:text-cyan-400 font-semibold">Versión {activeGuide.version}</span>
              <span className="text-slate-400 dark:text-neutral-500">·</span>
              <span className="text-slate-600 dark:text-neutral-300">Carpeta: {activeGuide.folder || 'General'}</span>
              <span className="text-slate-400 dark:text-neutral-500">·</span>
              <span className="text-slate-600 dark:text-neutral-300">Entorno: {activeGuide.env || 'Producción'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => exportSingleItemAsJson(activeGuide)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-cyan-300 rounded-lg font-semibold transition-colors cursor-pointer"
                title="Exportar esta guía completa como JSON individual para respaldar o compartir"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar JSON</span>
              </button>
              <button
                onClick={() => onOpenGuideModal(activeGuide)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Editar nombre y propiedades
              </button>
            </div>
          </div>

          <GuideEditor guide={activeGuide} onBack={() => setActiveGuideId(null)} />
        </div>
      ) : (
        /* Two-column layout according to Chapter 3 of specification */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Column 1: Left Navigation & Advanced Filters Panel */}
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 space-y-5 text-xs shadow-2xs">
            {/* 5 Tabs with counters */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">
                Sección
              </span>
              {[
                { id: 'guides', label: 'Guías estándar', count: guides.length, icon: BookOpen, color: 'text-amber-500 dark:text-amber-400' },
                { id: 'interactive', label: 'Guías Interactivas', count: interactiveGuides.length, icon: Sparkles, color: 'text-emerald-500 dark:text-emerald-400', badge: 'Runbook' },
                { id: 'scripts', label: 'Scripts', count: scripts.length, icon: Terminal, color: 'text-violet-600 dark:text-violet-400' },
                { id: 'trouble', label: 'Troubleshooting', count: troubleEntries.length, icon: AlertCircle, color: 'text-rose-500 dark:text-rose-400' },
                { id: 'plantpls', label: 'Plantillas de Planes', count: plantpls.length, icon: FolderKanban, color: 'text-indigo-600 dark:text-indigo-400' },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setActiveFilter({ type: 'all' });
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors font-medium cursor-pointer ${
                      isActive
                        ? 'bg-slate-100 dark:bg-neutral-800 text-slate-900 dark:text-white font-semibold border border-slate-200 dark:border-neutral-700'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200 hover:bg-slate-50 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${tab.color}`} />
                      <span className="truncate">{tab.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      {tab.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {tab.badge}
                        </span>
                      )}
                      <span className="font-mono text-[11px] text-slate-400 dark:text-neutral-500 tabular-nums">
                        {tab.count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Filters: Todo & Favoritos */}
            <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">
                Filtros
              </span>
              <button
                onClick={() => setActiveFilter({ type: 'all' })}
                className={`w-full text-left p-1.5 rounded transition-colors cursor-pointer ${
                  activeFilter.type === 'all'
                    ? 'text-blue-600 dark:text-cyan-400 font-semibold bg-blue-50 dark:bg-cyan-950/40'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
                }`}
              >
                Todo
              </button>
              <button
                onClick={() => setActiveFilter({ type: 'fav' })}
                className={`w-full text-left p-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                  activeFilter.type === 'fav'
                    ? 'text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
                }`}
              >
                <Star className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Favoritos</span>
              </button>
            </div>

            {/* Brands Filter */}
            {availableBrands.length > 0 && (
              <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">
                  Marca / Fabricante
                </span>
                {availableBrands.map((b) => (
                  <button
                    key={b.id}
                    onClick={() =>
                      setActiveFilter(
                        activeFilter.type === 'brand' && activeFilter.value === b.id
                          ? { type: 'all' }
                          : { type: 'brand', value: b.id }
                      )
                    }
                    className={`w-full text-left p-1.5 rounded flex items-center gap-2 transition-colors cursor-pointer ${
                      activeFilter.type === 'brand' && activeFilter.value === b.id
                        ? 'text-blue-600 dark:text-cyan-400 font-semibold bg-blue-50 dark:bg-cyan-950/40'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: b.color || '#06b6d4' }}
                    />
                    <span className="truncate">{b.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Folders Filter */}
            {availableFolders.length > 0 && (
              <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">
                  Carpetas
                </span>
                {availableFolders.map((fld) => (
                  <button
                    key={fld}
                    onClick={() =>
                      setActiveFilter(
                        activeFilter.type === 'folder' && activeFilter.value === fld
                          ? { type: 'all' }
                          : { type: 'folder', value: fld }
                      )
                    }
                    className={`w-full text-left p-1.5 rounded flex items-center gap-1.5 transition-colors cursor-pointer ${
                      activeFilter.type === 'folder' && activeFilter.value === fld
                        ? 'text-blue-600 dark:text-cyan-400 font-semibold bg-blue-50 dark:bg-cyan-950/40'
                        : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 shrink-0" />
                    <span className="truncate">{fld}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Tags Filter */}
            {availableTags.length > 0 && (
              <div className="pt-3 border-t border-slate-200 dark:border-neutral-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider block mb-1">
                  Etiquetas
                </span>
                <div className="flex flex-wrap gap-1">
                  {availableTags.map((t) => (
                    <button
                      key={t.id}
                      onClick={() =>
                        setActiveFilter(
                          activeFilter.type === 'tag' && activeFilter.value === t.id
                            ? { type: 'all' }
                            : { type: 'tag', value: t.id }
                        )
                      }
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                        activeFilter.type === 'tag' && activeFilter.value === t.id
                          ? 'bg-blue-600 dark:bg-cyan-500 text-white dark:text-neutral-900 font-bold'
                          : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      #{t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Column 2: Items List & Details */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-neutral-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  activeTab === 'interactive'
                    ? 'Buscar guías interactivas por nombre, tecnología, carpeta o descripción...'
                    : 'Buscar por nombre, descripción, producto o síntoma...'
                }
                className="w-full bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 dark:text-neutral-200 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:border-blue-500 dark:focus:border-cyan-500 shadow-2xs"
              />
            </div>

            {/* Quick banner for interactive tab */}
            {activeTab === 'interactive' && (
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs flex items-center justify-between gap-3 text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    <strong>Guías y Runbooks Interactivos:</strong> Diseñados para capturar topología y generar comandos reales que se copian al portapapeles.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setInteractiveModalState({ isOpen: true, guide: null })}
                  className="text-xs font-bold underline hover:text-emerald-700 dark:hover:text-emerald-300 shrink-0 cursor-pointer"
                >
                  + Importar Runbook
                </button>
              </div>
            )}

            {/* Items Grid / Rows */}
            <div className="space-y-3">
              {filteredItems.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-400 dark:text-neutral-500 text-xs shadow-2xs space-y-2">
                  <p>No se encontraron elementos en esta categoría con los filtros seleccionados.</p>
                  {activeTab === 'interactive' && (
                    <button
                      type="button"
                      onClick={() => setInteractiveModalState({ isOpen: true, guide: null })}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Crear o Importar Primera Guía Interactiva</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredItems.map((item: any) => {
                  const brand = brands.find((b) => b.id === item.brandId);
                  const brandColor = brand?.color || '#06b6d4';

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (activeTab === 'guides') {
                          setActiveGuideId(item.id);
                        } else if (activeTab === 'interactive') {
                          setActiveInteractiveGuideId(item.id);
                        } else if (activeTab === 'scripts') {
                          setViewerItem(item);
                        } else if (activeTab === 'trouble') {
                          setViewerItem(item);
                        } else if (activeTab === 'plantpls') {
                          onOpenPlanTplModal && onOpenPlanTplModal(item);
                        }
                      }}
                      className="p-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 rounded-xl flex items-center justify-between gap-4 transition-all group cursor-pointer shadow-2xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <button
                            onClick={(e) => handleToggleFav(item, e)}
                            className="text-slate-400 dark:text-neutral-500 hover:text-amber-500 transition-colors cursor-pointer"
                            title="Alternar favorito"
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                item.fav ? 'text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400' : ''
                              }`}
                            />
                          </button>

                          {brand && (
                            <span
                              className="text-[10px] font-semibold px-2 py-0.2 rounded border"
                              style={{
                                color: brandColor,
                                borderColor: `${brandColor}40`,
                                backgroundColor: `${brandColor}15`,
                              }}
                            >
                              {brand.name}
                            </span>
                          )}

                          {activeTab === 'interactive' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              ⚡ Guía Interactiva
                            </span>
                          )}

                          {item.version && (
                            <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-400">
                              v{item.version}
                            </span>
                          )}

                          {item.folder && (
                            <span className="text-[10px] text-slate-400 dark:text-neutral-500 truncate">
                              · {item.folder}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-semibold text-slate-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors truncate">
                          {item.name}
                        </h4>

                        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 line-clamp-1">
                          {item.description || item.symptom || item.objective || 'Sin descripción'}
                        </p>

                        {/* Extra metadata for plantpls */}
                        {activeTab === 'plantpls' && item.sections && (
                          <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-slate-500 dark:text-neutral-400">
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                              {item.sections.length} etapas/secciones
                            </span>
                            <span>·</span>
                            <span>{item.acts?.length || 0} actividades</span>
                            <span>·</span>
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {item.acts?.filter((a: any) => a.guideTplId)?.length || 0} guías asociadas
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {activeTab === 'guides' && (
                          <span className="text-xs text-slate-400 dark:text-neutral-500 font-mono hidden sm:inline">
                            {item.sections?.length || 0} secciones
                          </span>
                        )}

                        <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100">
                          {activeTab === 'guides' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenGuideModal(item);
                              }}
                              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              title="Editar nombre y propiedades de la guía"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                          )}
                          {activeTab === 'interactive' && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveInteractiveGuideId(item.id);
                                }}
                                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                                title="Abrir y llenar datos en runbook interactivo"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>Abrir y Llenar</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const blob = new Blob([item.htmlContent], { type: 'text/html;charset=utf-8' });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `${item.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_runbook.html`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }}
                                className="p-1.5 text-slate-400 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                title="Descargar archivo HTML independiente"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInteractiveModalState({ isOpen: true, guide: item });
                                }}
                                className="p-1.5 text-slate-400 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                                title="Modificar guía interactiva o editar código"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {(activeTab === 'scripts' || activeTab === 'trouble') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewerItem(item);
                              }}
                              className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900 border border-blue-200 dark:border-cyan-800/80 text-blue-700 dark:text-cyan-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              title="Abrir en Modo Vista para copiar comandos rápidamente"
                            >
                              <Terminal className="w-3.5 h-3.5" />
                              <span>Modo Vista</span>
                            </button>
                          )}
                          {(activeTab === 'scripts' || activeTab === 'trouble') && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (activeTab === 'scripts') onOpenScriptModal(item);
                                else onOpenTroubleModal(item);
                              }}
                              className="p-1.5 text-slate-400 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                              title="Editar propiedades"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {activeTab === 'plantpls' && (
                            <button
                              onClick={(e) => handleDuplicateTemplate(item, e)}
                              className="p-1.5 text-slate-400 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                              title="Duplicar plantilla"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              exportSingleItemAsJson(item);
                            }}
                            className="p-1.5 text-slate-400 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-cyan-400 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                            title="Exportar archivo JSON individual para respaldar o modificar"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleDeleteItem(item, e)}
                            className="p-1.5 text-slate-400 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                            title="Enviar a papelera"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <ChevronRight className="w-4 h-4 text-slate-400 dark:text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Guide Create / Edit / Import Modal */}
      <InteractiveGuideModal
        isOpen={interactiveModalState.isOpen}
        guide={interactiveModalState.guide}
        onClose={() => setInteractiveModalState({ isOpen: false, guide: null })}
        onSaved={(newGuide) => {
          setActiveTab('interactive');
          setActiveInteractiveGuideId(newGuide.id);
        }}
      />

      {/* Script & Trouble Viewer Modal with Quick Copy */}
      <ScriptTroubleViewerModal
        isOpen={!!viewerItem}
        item={viewerItem}
        onClose={() => setViewerItem(null)}
        onEdit={() => {
          if (!viewerItem) return;
          const current = viewerItem;
          setViewerItem(null);
          if (current.kind === 'script') {
            onOpenScriptModal(current as Script);
          } else {
            onOpenTroubleModal(current as Trouble);
          }
        }}
      />

      {/* Confirm Deletion Modal */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Enviar a Papelera"
        message={`¿Estás seguro de que deseas enviar "${itemToDelete?.name}" a la papelera? Podrás restaurarlo más tarde desde la papelera si lo necesitas.`}
        confirmText="Enviar a papelera"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={() => {
          if (itemToDelete) {
            store.deleteRecord(itemToDelete.id, true);
            if (activeInteractiveGuideId === itemToDelete.id) {
              setActiveInteractiveGuideId(null);
            }
            setItemToDelete(null);
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />

      {/* Modal to Import Individual Item JSON */}
      <SingleItemImportModal
        isOpen={isSingleImportModalOpen}
        onClose={() => setIsSingleImportModalOpen(false)}
        defaultFilterKind={
          activeTab === 'interactive'
            ? 'interactive_guide'
            : activeTab === 'scripts'
            ? 'script'
            : activeTab === 'trouble'
            ? 'trouble'
            : 'guide'
        }
        onItemImported={(result) => {
          if (result.kind === 'interactive_guide') {
            setActiveInteractiveGuideId(result.id);
            setActiveTab('interactive');
          } else if (result.kind === 'guide') {
            setActiveGuideId(result.id);
            setActiveTab('guides');
          } else if (result.kind === 'script') {
            setActiveTab('scripts');
          } else if (result.kind === 'trouble') {
            setActiveTab('trouble');
          }
        }}
      />
    </div>
  );
};
