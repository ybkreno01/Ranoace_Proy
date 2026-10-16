import React, { useState, useMemo } from 'react';
import {
  FolderKanban,
  Plus,
  LayoutGrid,
  Table as TableIcon,
  Copy,
  Trash2,
  ExternalLink,
  AlertCircle,
  Download,
  Pencil,
  SlidersHorizontal,
  Check,
  Upload,
} from 'lucide-react';
import { store } from '../services/store';
import { Project, CatalogItem } from '../types';
import { calculateProjectProgress } from '../services/businessRules';
import { exportSingleItemAsJson } from '../services/singleItemTransfer';
import { SingleItemImportModal } from './modals/SingleItemImportModal';
import { BrandLogo } from './common/BrandLogo';
import { ProjectNameCell } from './common/ProjectNameCell';

interface ProjectsViewProps {
  onOpenProjectModal: (project?: Project) => void;
  onCloneProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  onOpenProjectModal,
  onCloneProject,
  onDeleteProject,
}) => {
  const state = store.getState();
  const projects = store.getProjects();
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Column visibility state for Projects Table
  const [showColMenu, setShowColMenu] = useState(false);
  const [visibleCols, setVisibleCols] = useState({
    client: true,
    brand: true,
    status: true,
    type: true,
    target: true,
    progress: true,
    blocker: true,
    condition: false,
  });

  const brands = Object.values(state.records).filter(
    (r): r is CatalogItem => r.kind === 'brand' && !r.deletedAt
  );
  const clients = Object.values(state.records).filter(
    (r): r is CatalogItem => r.kind === 'client' && !r.deletedAt
  );
  const worktypes = Object.values(state.records).filter(
    (r): r is CatalogItem => r.kind === 'worktype' && !r.deletedAt
  );

  const [workTypeFilter, setWorkTypeFilter] = useState<string>('all');

  const isPoc = (project: Project): boolean => {
    const wt = worktypes.find((w) => w.id === project.typeId);
    const wtName = (wt?.name || '').toLowerCase();
    const pName = (project.name || '').toLowerCase();
    const pScope = (project.scope || '').toLowerCase();
    const pCond = (project.condition || '').toLowerCase();
    const hasPocTag = project.tags?.some((t) => {
      const tl = t.toLowerCase();
      return tl.includes('poc') || tl.includes('plc') || tl.includes('prueba');
    });
    return (
      project.typeId === 'type-poc' ||
      wtName.includes('poc') ||
      wtName.includes('plc') ||
      wtName.includes('prueba de concepto') ||
      pName.includes('poc') ||
      pName.includes('plc') ||
      pName.includes('prueba de concepto') ||
      pScope.includes('poc') ||
      pCond.includes('poc') ||
      Boolean(hasPocTag)
    );
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (workTypeFilter === 'productive' && isPoc(p)) return false;
      if (workTypeFilter === 'poc' && !isPoc(p)) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (brandFilter !== 'all' && p.brandId !== brandFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const client = (clients.find((c) => c.id === p.clientId) as any)?.name || '';
        if (
          !p.name.toLowerCase().includes(q) &&
          !client.toLowerCase().includes(q) &&
          !(p.condition || '').toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [projects, workTypeFilter, statusFilter, brandFilter, search, clients, worktypes]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Cartera de Proyectos</h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Seguimiento técnico, PoCs, implementaciones y capacitaciones
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-neutral-800 rounded-lg border border-slate-200 dark:border-neutral-700/80">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'cards' ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-white shadow-2xs' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Vista de Tarjetas"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table' ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-white shadow-2xs' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Vista de Tabla"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-750 border border-slate-200 dark:border-neutral-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Importar un proyecto desde archivo JSON individual"
          >
            <Upload className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <span className="hidden sm:inline">Importar</span>
            <span>JSON</span>
          </button>

          <button
            onClick={() => onOpenProjectModal()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Proyecto</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (RF-09) */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-2xs">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrar por nombre o cliente..."
          className="text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-neutral-200 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:border-blue-500 dark:focus:border-cyan-500 w-48 sm:w-64"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-neutral-200 focus:outline-hidden focus:border-blue-500 dark:focus:border-cyan-500"
        >
          <option value="all">Todos los estados</option>
          <option value="Borrador">Borrador</option>
          <option value="Planificado">Planificado</option>
          <option value="En ejecución">En ejecución</option>
          <option value="En espera">En espera</option>
          <option value="Completado">Completado</option>
          <option value="Cancelado">Cancelado</option>
        </select>

        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-neutral-200 focus:outline-hidden focus:border-blue-500 dark:focus:border-cyan-500"
        >
          <option value="all">Todas las marcas</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={workTypeFilter}
          onChange={(e) => setWorkTypeFilter(e.target.value)}
          className="text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-neutral-200 focus:outline-hidden focus:border-blue-500 dark:focus:border-cyan-500 font-semibold"
        >
          <option value="all">Todos los tipos</option>
          <option value="productive">🚀 Solo Productivos</option>
          <option value="poc">🧪 Solo PoCs / PLCs</option>
        </select>

        {viewMode === 'table' && (
          <div className="relative">
            <button
              onClick={() => setShowColMenu(!showColMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-neutral-300"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>Columnas</span>
            </button>

            {showColMenu && (
              <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-xl p-2 z-30 text-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase px-2 py-1 block">
                  Columnas Visibles
                </span>
                {[
                  { key: 'client', label: 'Cliente' },
                  { key: 'brand', label: 'Marca' },
                  { key: 'status', label: 'Estado' },
                  { key: 'type', label: 'Tipo de Proyecto' },
                  { key: 'target', label: 'Fecha Objetivo' },
                  { key: 'progress', label: 'Avance Ponderado' },
                  { key: 'blocker', label: 'Bloqueo / Blocker' },
                  { key: 'condition', label: 'Condición' },
                ].map((col) => (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() =>
                      setVisibleCols((prev: any) => ({ ...prev, [col.key]: !prev[col.key] }))
                    }
                    className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 text-left text-slate-700 dark:text-neutral-300"
                  >
                    <span>{col.label}</span>
                    {(visibleCols as any)[col.key] && (
                      <Check className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <span className="text-xs text-neutral-400 ml-auto font-mono tabular-nums">
          {filteredProjects.length} de {projects.length} proyectos
        </span>
      </div>

      {/* Projects Grid / Table View */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-xs">
          <FolderKanban className="w-10 h-10 text-slate-400 dark:text-neutral-600 mx-auto mb-3" />
          <h4 className="text-sm font-medium text-slate-800 dark:text-neutral-300">No se encontraron proyectos</h4>
          <p className="text-xs text-slate-500 dark:text-neutral-500 mt-1">
            Intenta cambiar los filtros o crea un nuevo proyecto con el botón superior.
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => {
            const pTasks = store.getProjectTasks(p.id);
            const calc = calculateProjectProgress(p, pTasks);
            const client = clients.find((c) => c.id === p.clientId) as any;
            const brand = brands.find((b) => b.id === p.brandId) as any;
            const wtype = worktypes.find((w) => w.id === p.typeId) as any;

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 rounded-xl p-5 flex flex-col justify-between transition-all group hover:shadow-md relative shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="px-2 py-0.5 text-[11px] font-medium rounded border"
                        style={{
                          backgroundColor: `${brand?.color || '#06b6d4'}15`,
                          color: brand?.color || '#06b6d4',
                          borderColor: `${brand?.color || '#06b6d4'}35`,
                        }}
                      >
                        {brand?.name || 'General'}
                      </span>
                      {isPoc(p) ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          🧪 PoC / PLC
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
                          🚀 Productivo
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">{p.status}</span>
                  </div>

                  <div className="flex items-start gap-3 my-2">
                    <BrandLogo
                      brand={brand}
                      brandId={p.brandId}
                      projectName={p.name}
                      size="lg"
                      className="mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <h3
                        onClick={() => store.setActiveView('projects', p.id)}
                        className="text-base font-bold text-slate-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors cursor-pointer line-clamp-2 leading-snug"
                      >
                        {p.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                        {brand?.name || 'General'} · {wtype?.name || (isPoc(p) ? 'PoC' : 'Proyecto')}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 truncate">
                    Cliente: <strong className="text-slate-700 dark:text-neutral-300 font-normal">{client?.name || 'Sin cliente'}</strong>
                  </p>

                  {p.condition && (
                    <p className="text-xs text-slate-600 dark:text-neutral-400 mt-2 bg-slate-50 dark:bg-neutral-800/40 p-2 rounded border border-slate-200 dark:border-neutral-800 line-clamp-2">
                      {p.condition}
                    </p>
                  )}
                </div>

                {/* Progress bar and metrics */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-neutral-800 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                      <span className="text-slate-500 dark:text-neutral-400">Avance Real</span>
                      <span className="text-blue-600 dark:text-cyan-400 font-semibold tabular-nums">{calc.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${calc.progress}%`,
                          backgroundColor: brand?.color || '#06b6d4',
                        }}
                      />
                    </div>
                  </div>

                  {p.blocker && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 p-1.5 rounded border border-amber-200 dark:border-amber-900/40 truncate">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{p.blocker}</span>
                    </div>
                  )}

                  {/* Card Actions Footer */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-neutral-400 pt-1">
                    <span className="text-[11px]">Meta: {p.target || 'N/A'}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenProjectModal(p)}
                        className="p-1.5 text-slate-400 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded transition-colors"
                        title="Editar proyecto (1 clic)"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onCloneProject(p)}
                        className="p-1.5 text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded transition-colors"
                        title="Clonar proyecto (RF-15)"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => exportSingleItemAsJson(p)}
                        className="p-1.5 text-slate-400 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded transition-colors"
                        title="Exportar proyecto como archivo JSON individual"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteProject(p)}
                        className="p-1.5 text-slate-400 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded transition-colors"
                        title="Enviar a papelera (RF-16)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => store.setActiveView('projects', p.id)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-cyan-400 hover:bg-blue-50 dark:hover:bg-cyan-950/40 rounded transition-colors ml-1"
                      >
                        <span>Expediente</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-neutral-800/80 text-slate-600 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-700/80">
                <tr>
                  <th className="px-4 py-3 font-extrabold uppercase tracking-wider text-[11px] text-slate-700 dark:text-neutral-300">PROJECT NAME</th>
                  {visibleCols.client && <th className="px-4 py-3 font-semibold">Cliente</th>}
                  {visibleCols.brand && <th className="px-4 py-3 font-semibold">Marca</th>}
                  {visibleCols.status && <th className="px-4 py-3 font-semibold">Estado</th>}
                  {visibleCols.type && <th className="px-4 py-3 font-semibold">Tipo</th>}
                  {visibleCols.target && <th className="px-4 py-3 font-semibold">Fecha Objetivo</th>}
                  {visibleCols.condition && <th className="px-4 py-3 font-semibold">Condición</th>}
                  {visibleCols.blocker && <th className="px-4 py-3 font-semibold">Bloqueo</th>}
                  {visibleCols.progress && <th className="px-4 py-3 font-semibold text-right">Avance</th>}
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
                {filteredProjects.map((p) => {
                  const pTasks = store.getProjectTasks(p.id);
                  const calc = calculateProjectProgress(p, pTasks);
                  const client = clients.find((c) => c.id === p.clientId) as any;
                  const brand = brands.find((b) => b.id === p.brandId) as any;
                  const wtype = worktypes.find((w) => w.id === p.typeId) as any;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 dark:hover:bg-neutral-800/50 transition-colors group cursor-pointer"
                      onClick={() => store.setActiveView('projects', p.id)}
                    >
                      <td className="px-4 py-3 min-w-[380px] md:min-w-[420px]">
                        <ProjectNameCell
                          project={p}
                          brand={brand}
                          client={client}
                          worktype={wtype}
                          logoSize="lg"
                        />
                      </td>
                      {visibleCols.client && <td className="px-4 py-3 text-slate-500 dark:text-neutral-400">{client?.name || '—'}</td>}
                      {visibleCols.brand && (
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-medium border"
                            style={{
                              color: brand?.color || '#06b6d4',
                              borderColor: `${brand?.color || '#06b6d4'}40`,
                            }}
                          >
                            {brand?.name || 'General'}
                          </span>
                        </td>
                      )}
                      {visibleCols.status && <td className="px-4 py-3 font-mono text-slate-600 dark:text-neutral-300">{p.status}</td>}
                      {visibleCols.type && (
                        <td className="px-4 py-3">
                          {isPoc(p) ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                              🧪 PoC / PLC
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
                              🚀 Productivo
                            </span>
                          )}
                        </td>
                      )}
                      {visibleCols.target && <td className="px-4 py-3 text-slate-500 dark:text-neutral-400">{p.target || '—'}</td>}
                      {visibleCols.condition && (
                        <td className="px-4 py-3 text-slate-500 dark:text-neutral-400 max-w-xs truncate">{p.condition || '—'}</td>
                      )}
                      {visibleCols.blocker && (
                        <td className="px-4 py-3 max-w-xs truncate">
                          {p.blocker ? (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold truncate block">
                              ⚠️ {p.blocker}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-neutral-500">—</span>
                          )}
                        </td>
                      )}
                      {visibleCols.progress && (
                        <td className="px-4 py-3 text-right font-mono font-semibold text-blue-600 dark:text-cyan-400 tabular-nums">
                          {calc.progress}%
                        </td>
                      )}
                      <td
                        className="px-4 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onOpenProjectModal(p)}
                            className="p-1 text-slate-400 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded transition-colors"
                            title="Editar proyecto (1 clic)"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onCloneProject(p)}
                            className="p-1 text-slate-400 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded transition-colors"
                            title="Clonar"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => exportSingleItemAsJson(p)}
                            className="p-1 text-slate-400 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded transition-colors"
                            title="Exportar JSON individual"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteProject(p)}
                            className="p-1 text-slate-400 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal to Import Individual Project JSON */}
      <SingleItemImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        defaultFilterKind="project"
        onItemImported={(res) => store.setActiveView('projects', res.id)}
      />
    </div>
  );
};
