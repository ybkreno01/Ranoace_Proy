import React, { useState } from 'react';
import {
  Columns3,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronRight,
  GripVertical,
  Search,
  Filter,
  Plus,
  FolderKanban,
} from 'lucide-react';
import { store } from '../services/store';
import { Task, TaskStatus, Project } from '../types';

interface KanbanViewProps {
  onOpenTaskModal: (task: Task) => void;
}

const COLUMNS: {
  id: TaskStatus;
  label: string;
  lightHeader: string;
  darkHeader: string;
  badge: string;
}[] = [
  {
    id: 'Pendiente',
    label: 'Pendiente',
    lightHeader: 'border-slate-300 text-slate-700 bg-slate-100',
    darkHeader: 'dark:border-neutral-700 dark:text-neutral-300 dark:bg-neutral-800/60',
    badge: 'bg-slate-200 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300',
  },
  {
    id: 'En curso',
    label: 'En Curso',
    lightHeader: 'border-blue-400 text-blue-700 bg-blue-50',
    darkHeader: 'dark:border-blue-500/80 dark:text-blue-400 dark:bg-blue-950/40',
    badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300',
  },
  {
    id: 'En espera',
    label: 'En Espera',
    lightHeader: 'border-amber-400 text-amber-700 bg-amber-50',
    darkHeader: 'dark:border-amber-500/80 dark:text-amber-400 dark:bg-amber-950/40',
    badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300',
  },
  {
    id: 'En validación',
    label: 'En Validación',
    lightHeader: 'border-purple-400 text-purple-700 bg-purple-50',
    darkHeader: 'dark:border-purple-500/80 dark:text-purple-400 dark:bg-purple-950/40',
    badge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300',
  },
  {
    id: 'Completado',
    label: 'Completado',
    lightHeader: 'border-emerald-400 text-emerald-700 bg-emerald-50',
    darkHeader: 'dark:border-emerald-500/80 dark:text-emerald-400 dark:bg-emerald-950/40',
    badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300',
  },
];

export const KanbanView: React.FC<KanbanViewProps> = ({ onOpenTaskModal }) => {
  const state = store.getState();
  const allTasks = store.getAllTasks();
  const projects = store.getProjects();
  const worktypes = Object.values(state.records).filter(
    (r): r is any => r.kind === 'worktype' && !r.deletedAt
  );

  const isPoc = (project: Project): boolean => {
    const wt = worktypes.find((w) => w.id === project.typeId);
    const wtName = (wt?.name || '').toLowerCase();
    const pName = (project.name || '').toLowerCase();
    const pScope = (project.scope || '').toLowerCase();
    const pCond = (project.condition || '').toLowerCase();
    const hasPocTag = project.tags?.some((t: string) => {
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

  const [waitingModalTask, setWaitingModalTask] = useState<Task | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [blockOwner, setBlockOwner] = useState('');
  const [followUp, setFollowUp] = useState('');

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [showAllDone, setShowAllDone] = useState(false);

  const moveTask = (task: Task, newStatus: TaskStatus) => {
    if (task.status === newStatus) return;

    if (newStatus === 'En espera') {
      setWaitingModalTask(task);
      setBlockReason(task.blockReason || '');
      setBlockOwner(task.blockOwner || '');
      setFollowUp(task.followUp || '');
      return;
    }

    const d = new Date();
    const nowStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const isCompleted = newStatus === 'Completado';
    store.putRecord({
      ...task,
      status: newStatus,
      progress:
        isCompleted
          ? 100
          : task.progress === 0 && newStatus === 'En curso'
          ? 25
          : task.progress === 100
          ? 75
          : task.progress,
      realEnd: isCompleted ? nowStr : undefined,
    });
  };

  const handleConfirmWaiting = () => {
    if (!waitingModalTask) return;
    store.putRecord({
      ...waitingModalTask,
      status: 'En espera',
      blockReason,
      blockOwner,
      followUp,
    });
    setWaitingModalTask(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = allTasks.find((t) => t.id === taskId);
    if (task) {
      moveTask(task, targetStatus);
    }
    setDraggedTaskId(null);
  };

  // Filter tasks
  const filteredTasks = allTasks.filter((t) => {
    if (projectFilter === 'independent') {
      if (t.projectId) return false;
    } else if (projectFilter === 'with_project') {
      if (!t.projectId) return false;
    } else if (projectFilter !== 'all') {
      if (t.projectId !== projectFilter) return false;
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchOwner = (t.owner || '').toLowerCase().includes(q);
      return matchTitle || matchOwner;
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-neutral-100 tracking-tight flex items-center gap-2">
            <Columns3 className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
            <span>Tablero Kanban Interactivo</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Control de actividades vinculadas o independientes. Arrastra tarjetas para actualizar el estado.
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filtrar actividades..."
              className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-slate-800 dark:text-neutral-200 focus:outline-hidden focus:border-blue-500 w-40 sm:w-52"
            />
          </div>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-neutral-200 focus:outline-hidden"
          >
            <option value="all">Todas las tareas (con y sin proyecto)</option>
            <option value="independent">⭐ Tareas independientes</option>
            <option value="with_project">📁 Tareas con proyecto</option>
            {projects.filter((p) => !isPoc(p)).length > 0 && (
              <optgroup label="Proyectos Productivos:">
                {projects.filter((p) => !isPoc(p)).map((p) => (
                  <option key={p.id} value={p.id}>
                    🚀 {p.name}
                  </option>
                ))}
              </optgroup>
            )}
            {projects.filter((p) => isPoc(p)).length > 0 && (
              <optgroup label="PoCs / PLCs:">
                {projects.filter((p) => isPoc(p)).map((p) => (
                  <option key={p.id} value={p.id}>
                    🧪 {p.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>

          <button
            onClick={() => onOpenTaskModal(null as any)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-2xs shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* 5 Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 items-start min-h-[620px]">
        {COLUMNS.map((col) => {
          const allColTasks = filteredTasks.filter((t) => t.status === col.id);
          // Completado: por defecto solo los últimos 7 días para mantener el tablero accionable.
          const doneCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
          const isRecentDone = (t: Task) =>
            new Date(t.realEnd || t.updatedAt || 0).getTime() >= doneCutoff;
          const hiddenDone =
            col.id === 'Completado' && !showAllDone ? allColTasks.filter((t) => !isRecentDone(t)).length : 0;
          const colTasks =
            col.id === 'Completado' && !showAllDone ? allColTasks.filter(isRecentDone) : allColTasks;
          const isOver = dragOverColumn === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`border rounded-xl p-3 flex flex-col min-h-[500px] transition-all ${
                isOver
                  ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/30'
                  : 'bg-white dark:bg-neutral-900/90 border-slate-200 dark:border-neutral-800 shadow-2xs'
              }`}
            >
              {/* Column Header */}
              <div
                className={`flex items-center justify-between p-2 rounded-lg mb-3 border text-xs font-semibold ${
                  col.lightHeader
                } ${col.darkHeader}`}
              >
                <span>{col.label}</span>
                <span
                  className={`font-mono text-[11px] px-2 py-0.5 rounded-full font-bold ${col.badge}`}
                >
                  {allColTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 dark:text-neutral-600 italic">
                    {hiddenDone > 0 ? 'Sin cierres recientes' : 'Sin actividades'}
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const project = projects.find((p) => p.id === task.projectId);
                    const isBeingDragged = draggedTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => onOpenTaskModal(task)}
                        className={`p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all border shadow-2xs group ${
                          isBeingDragged
                            ? 'opacity-40 scale-95 border-dashed border-blue-400 bg-blue-50 dark:bg-blue-950/20'
                            : 'bg-slate-50/80 hover:bg-white dark:bg-neutral-800/60 dark:hover:bg-neutral-800 border-slate-200/90 dark:border-neutral-700/60 hover:border-slate-300 dark:hover:border-neutral-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="text-xs font-medium text-slate-800 dark:text-neutral-200 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2">
                            {task.title}
                          </h4>
                          <GripVertical className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {project ? (
                          <div className="text-[10px] text-slate-500 dark:text-neutral-400 truncate mt-1 flex items-center gap-1">
                            {isPoc(project) ? (
                              <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 shrink-0">
                                🧪 [PoC]
                              </span>
                            ) : (
                              <FolderKanban className="w-3 h-3 text-blue-500 shrink-0" />
                            )}
                            <span className="truncate">{project.name}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-indigo-700 dark:text-indigo-300 mt-1 inline-flex items-center gap-1 font-semibold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 px-1.5 py-0.5 rounded">
                            <span>⭐ Independiente</span>
                          </div>
                        )}

                        {task.blockReason && (
                          <div className="mt-1.5 p-1.5 text-[10px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 rounded flex items-center gap-1.5">
                            <AlertCircle className="w-3 h-3 shrink-0 text-amber-500" />
                            <span className="truncate">{task.blockReason}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-neutral-400 mt-2.5 pt-2 border-t border-slate-200/70 dark:border-neutral-700/50">
                          <span className="truncate max-w-[110px]">{task.owner || 'Sin asignar'}</span>
                          <span className="font-mono tabular-nums font-semibold text-blue-600 dark:text-cyan-400">
                            {task.progress}%
                          </span>
                        </div>

                        {/* Quick move buttons */}
                        <div
                          className="flex items-center justify-end gap-1 mt-2 pt-1.5 border-t border-slate-200/50 dark:border-neutral-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {col.id !== 'Pendiente' && (
                            <button
                              onClick={() => {
                                const prevIdx = COLUMNS.findIndex((c) => c.id === col.id) - 1;
                                if (prevIdx >= 0) moveTask(task, COLUMNS[prevIdx].id);
                              }}
                              className="text-[10px] text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-neutral-700/60 transition-colors"
                              title="Mover a etapa anterior"
                            >
                              ←
                            </button>
                          )}
                          {col.id !== 'Completado' && (
                            <button
                              onClick={() => {
                                const nextIdx = COLUMNS.findIndex((c) => c.id === col.id) + 1;
                                if (nextIdx < COLUMNS.length) moveTask(task, COLUMNS[nextIdx].id);
                              }}
                              className="text-[10px] text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-cyan-950/60 font-semibold transition-colors"
                              title="Avanzar etapa"
                            >
                              →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {col.id === 'Completado' && (hiddenDone > 0 || showAllDone) && (
                <button
                  type="button"
                  onClick={() => setShowAllDone((v) => !v)}
                  className="mt-3 w-full text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {showAllDone ? 'Ver solo últimos 7 días' : `Ver ${hiddenDone} anteriores`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* En Espera Modal (RF-35) */}
      {waitingModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <span>Pasar a &ldquo;En Espera&rdquo;</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              Registra el motivo de bloqueo, responsable y fecha de seguimiento para auditar los tiempos de espera.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 dark:text-neutral-300 block mb-1">
                  Motivo del Bloqueo / Espera *
                </label>
                <textarea
                  rows={2}
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ej. Esperando apertura de puerto 443 por equipo de Firewall..."
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg p-2.5 text-slate-800 dark:text-neutral-200 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-neutral-300 block mb-1">
                  Responsable del Desbloqueo
                </label>
                <input
                  type="text"
                  value={blockOwner}
                  onChange={(e) => setBlockOwner(e.target.value)}
                  placeholder="Ej. Ing. Redes Cliente / Proveedor"
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-neutral-200 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-neutral-300 block mb-1">
                  Fecha de Seguimiento
                </label>
                <input
                  type="date"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-neutral-200 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-neutral-800">
              <button
                onClick={() => setWaitingModalTask(null)}
                className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmWaiting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-xs"
              >
                Confirmar Espera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
