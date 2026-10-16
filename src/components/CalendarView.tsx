import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  CheckCircle2,
  Clock,
  Target,
  FolderKanban,
  User,
  Filter,
  CheckSquare,
  ArrowRight,
  X,
  List,
  Grid3X3,
  Edit2,
  CalendarDays,
  GripVertical,
} from 'lucide-react';
import { store } from '../services/store';
import { Task, Project, TaskStatus } from '../types';

export const CalendarView: React.FC = () => {
  const state = store.getState();
  const allTasks = store.getAllTasks();
  const projects = store.getProjects();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  // New task quick creator state
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [quickTaskProjectId, setQuickTaskProjectId] = useState('');
  const [quickTaskOwner, setQuickTaskOwner] = useState('');

  // Drag-and-drop state for rescheduling
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDayStr(today.toISOString().split('T')[0]);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter tasks based on filters
  const filteredTasks = useMemo(() => {
    return allTasks.filter((t: Task) => {
      if (projectFilter !== 'all' && t.projectId !== projectFilter) return false;
      if (statusFilter === 'pending' && t.status === 'Completado') return false;
      if (statusFilter === 'completed' && t.status !== 'Completado') return false;
      return true;
    });
  }, [allTasks, projectFilter, statusFilter]);

  // Map dates to events
  const dateEventsMap = useMemo(() => {
    const map: Record<string, { tasks: Task[]; projectTargets: Project[] }> = {};

    filteredTasks.forEach((t: Task) => {
      const d = t.due || t.start;
      if (d) {
        if (!map[d]) map[d] = { tasks: [], projectTargets: [] };
        map[d].tasks.push(t);
      }
    });

    projects.forEach((p: Project) => {
      if (projectFilter !== 'all' && p.id !== projectFilter) return;
      if (p.target) {
        if (!map[p.target]) map[p.target] = { tasks: [], projectTargets: [] };
        map[p.target].projectTargets.push(p);
      }
    });

    return map;
  }, [filteredTasks, projects, projectFilter]);

  // Calendar cells
  const days = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstDay; i++) {
      arr.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      arr.push(d);
    }
    return arr;
  }, [firstDay, daysInMonth]);

  // Handler for drag and drop rescheduling
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDropOnDate = (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    const task = allTasks.find((t) => t.id === taskId);
    if (task) {
      const updated: Task = {
        ...task,
        due: targetDateStr,
        updatedAt: new Date().toISOString(),
      };
      store.putRecord(updated);
    }
    setDraggedTaskId(null);
  };

  // Toggle task completion in-place
  const handleToggleTaskStatus = (task: Task, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isCompleted = task.status === 'Completado';
    const newStatus: TaskStatus = isCompleted ? 'En curso' : 'Completado';
    const newProgress = isCompleted ? 0 : 100;

    const updated: Task = {
      ...task,
      status: newStatus,
      progress: newProgress,
      realEnd: newStatus === 'Completado' ? new Date().toISOString().split('T')[0] : undefined,
      updatedAt: new Date().toISOString(),
    };
    store.putRecord(updated);
  };

  // Quick add task for selected day
  const handleCreateQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim() || !selectedDayStr) return;

    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      kind: 'task',
      title: quickTaskTitle.trim(),
      projectId: quickTaskProjectId || undefined,
      order: 99,
      owner: quickTaskOwner.trim() || 'Equipo',
      status: 'Pendiente',
      priority: 'Media',
      start: selectedDayStr,
      due: selectedDayStr,
      progress: 0,
      progressMode: 'auto',
      weight: 5,
      milestone: false,
      checklist: [],
      deps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.putRecord(newTask);
    setQuickTaskTitle('');
    setIsQuickTaskOpen(false);
  };

  // Events of selected day for the Day Drawer
  const selectedDayEvents = selectedDayStr ? dateEventsMap[selectedDayStr] : null;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-cyan-950/60 text-blue-600 dark:text-cyan-400 rounded-xl">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Calendario Operativo Interactivo
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Haz clic en cualquier día o arrastra actividades para reprogramar fechas
              </p>
            </div>
          </div>
        </div>

        {/* Calendar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-slate-200 dark:border-neutral-700">
            <button
              onClick={() => setViewMode('month')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Vista cuadrícula mensual"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mes</span>
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Vista lista / agenda"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Agenda</span>
            </button>
          </div>

          <button
            onClick={goToday}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 hover:bg-slate-50 dark:hover:bg-neutral-700 rounded-lg border border-slate-200 dark:border-neutral-700 shadow-2xs"
          >
            Hoy
          </button>

          <div className="flex items-center gap-1 bg-white dark:bg-neutral-800 rounded-lg border border-slate-200 dark:border-neutral-700 p-0.5 shadow-2xs">
            <button
              onClick={prevMonth}
              className="p-1 text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 px-3 min-w-[130px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 text-slate-500 hover:text-slate-900 dark:text-neutral-400 dark:hover:text-white rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-neutral-900 p-3 rounded-xl border border-slate-200 dark:border-neutral-800 shadow-2xs text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Filtros:</span>
          </div>

          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-neutral-200 font-medium"
          >
            <option value="all">Todos los proyectos ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-neutral-200 font-medium"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes / En curso</option>
            <option value="completed">Solo completados</option>
          </select>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
          Mostrando <strong>{filteredTasks.length}</strong> actividades programadas
        </div>
      </div>

      {/* MONTH VIEW: GRID */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-800/60 text-center text-xs font-bold text-slate-600 dark:text-neutral-400 py-3">
            <span>Domingo</span>
            <span>Lunes</span>
            <span>Martes</span>
            <span>Miércoles</span>
            <span>Jueves</span>
            <span>Viernes</span>
            <span>Sábado</span>
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-neutral-800">
            {days.map((day, idx) => {
              if (day === null) {
                return (
                  <div
                    key={idx}
                    className="min-h-[110px] bg-slate-50/40 dark:bg-neutral-950/30 opacity-40"
                  />
                );
              }

              const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const events = dateEventsMap[dayStr];
              const isToday = dayStr === todayStr;
              const isSelected = dayStr === selectedDayStr;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDayStr(dayStr)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropOnDate(e, dayStr)}
                  className={`min-h-[110px] p-2 flex flex-col justify-between transition-all cursor-pointer group select-none relative ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/30 ring-2 ring-blue-500 ring-inset z-10'
                      : isToday
                      ? 'bg-cyan-50/50 dark:bg-cyan-950/20'
                      : 'hover:bg-slate-50/80 dark:hover:bg-neutral-800/40 bg-white dark:bg-neutral-900'
                  }`}
                >
                  {/* Day number & Quick add action */}
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`font-mono text-xs px-1.5 py-0.5 rounded-full font-bold ${
                        isToday
                          ? 'bg-blue-600 dark:bg-cyan-500 text-white dark:text-neutral-900'
                          : isSelected
                          ? 'bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                          : 'text-slate-600 dark:text-neutral-400'
                      }`}
                    >
                      {day}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDayStr(dayStr);
                        setIsQuickTaskOpen(true);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 rounded hover:bg-slate-200 dark:hover:bg-neutral-700 transition-opacity"
                      title="Agregar actividad para este día"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Event Badges List */}
                  <div className="space-y-1 overflow-y-auto max-h-24 text-[11px] mt-1 pr-0.5">
                    {/* Project Milestones */}
                    {events?.projectTargets?.map((p) => (
                      <div
                        key={p.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          store.setActiveView('projects', p.id);
                        }}
                        className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 rounded font-semibold truncate hover:border-amber-500 transition-colors flex items-center gap-1"
                        title={`Entrega de Proyecto: ${p.name}`}
                      >
                        <Target className="w-2.5 h-2.5 shrink-0 text-amber-500" />
                        <span className="truncate">{p.name}</span>
                      </div>
                    ))}

                    {/* Task Activities (Draggable) */}
                    {events?.tasks?.map((t) => {
                      const isDone = t.status === 'Completado';
                      return (
                        <div
                          key={t.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, t.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDayStr(dayStr);
                          }}
                          className={`px-1.5 py-0.5 rounded border text-[10px] font-medium flex items-center justify-between gap-1 transition-all cursor-grab active:cursor-grabbing ${
                            isDone
                              ? 'bg-slate-100 dark:bg-neutral-800/60 border-slate-200 dark:border-neutral-700/60 text-slate-400 dark:text-neutral-500 line-through'
                              : 'bg-blue-50 dark:bg-cyan-950/40 border-blue-200 dark:border-cyan-800 text-blue-900 dark:text-cyan-200 hover:border-blue-400'
                          }`}
                          title={`${t.title} (${t.owner || 'Equipo'}) - Arrastra para reprogramar`}
                        >
                          <span className="truncate flex-1">{t.title}</span>
                          <button
                            onClick={(e) => handleToggleTaskStatus(t, e)}
                            className="shrink-0 p-0.5 text-slate-400 hover:text-emerald-500"
                            title={isDone ? 'Marcar pendiente' : 'Marcar completado'}
                          >
                            <CheckCircle2
                              className={`w-2.5 h-2.5 ${isDone ? 'text-emerald-500' : ''}`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Empty state hint */}
                  {(!events || (events.tasks.length === 0 && events.projectTargets.length === 0)) && (
                    <div className="h-6" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AGENDA VIEW: LIST */}
      {viewMode === 'agenda' && (
        <div className="space-y-4">
          {Object.entries(dateEventsMap).length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl text-slate-400">
              No hay actividades programadas con los filtros seleccionados.
            </div>
          ) : (
            Object.entries(dateEventsMap)
              .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
              .map(([dateStr, events]) => {
                const isToday = dateStr === todayStr;

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDayStr(dateStr)}
                    className={`bg-white dark:bg-neutral-900 border rounded-2xl p-4 transition-all shadow-2xs space-y-3 cursor-pointer ${
                      dateStr === selectedDayStr
                        ? 'border-blue-500 ring-1 ring-blue-500'
                        : isToday
                        ? 'border-cyan-400 dark:border-cyan-600'
                        : 'border-slate-200 dark:border-neutral-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono text-xs px-2 py-0.5 rounded-full font-bold ${
                            isToday
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300'
                          }`}
                        >
                          {dateStr} {isToday ? '(HOY)' : ''}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-neutral-400">
                          {events.tasks.length} tareas · {events.projectTargets.length} metas
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDayStr(dateStr);
                          setIsQuickTaskOpen(true);
                        }}
                        className="flex items-center gap-1 text-xs text-blue-600 dark:text-cyan-400 font-semibold hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Nueva Tarea</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      {events.tasks.map((t) => {
                        const proj = projects.find((p) => p.id === t.projectId);
                        const isDone = t.status === 'Completado';

                        return (
                          <div
                            key={t.id}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                              isDone
                                ? 'bg-slate-50 dark:bg-neutral-800/40 border-slate-200 dark:border-neutral-800 text-slate-400 line-through'
                                : 'bg-white dark:bg-neutral-800/80 border-slate-200 dark:border-neutral-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isDone}
                                onChange={() => handleToggleTaskStatus(t)}
                                className="rounded border-slate-300 dark:border-neutral-600 text-blue-600 cursor-pointer"
                              />
                              <div className="min-w-0">
                                <h4 className="font-semibold truncate">{t.title}</h4>
                                <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                                  {proj?.name || 'General'} · Resp: {t.owner || 'Equipo'}
                                </span>
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold shrink-0 ${
                                isDone
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-cyan-400'
                              }`}
                            >
                              {t.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {/* DAY DETAIL DRAWER / MODAL */}
      {selectedDayStr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="w-full max-w-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                    Agenda del Día
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100 font-mono">
                    {selectedDayStr} {selectedDayStr === todayStr ? '(HOY)' : ''}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsQuickTaskOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Actividad</span>
                </button>
                <button
                  onClick={() => setSelectedDayStr(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Add Form inside modal */}
            {isQuickTaskOpen && (
              <form
                onSubmit={handleCreateQuickTask}
                className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl space-y-3 text-xs"
              >
                <div className="font-bold text-blue-900 dark:text-blue-300">
                  Nueva Actividad para {selectedDayStr}
                </div>
                <input
                  type="text"
                  autoFocus
                  required
                  value={quickTaskTitle}
                  onChange={(e) => setQuickTaskTitle(e.target.value)}
                  placeholder="Título de la tarea o entrega..."
                  className="w-full bg-white dark:bg-neutral-800 border border-blue-200 dark:border-neutral-700 rounded-lg p-2 text-xs"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={quickTaskProjectId}
                    onChange={(e) => setQuickTaskProjectId(e.target.value)}
                    className="bg-white dark:bg-neutral-800 border border-blue-200 dark:border-neutral-700 rounded-lg p-2 text-xs"
                  >
                    <option value="">⭐ (Sin proyecto - Independiente)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={quickTaskOwner}
                    onChange={(e) => setQuickTaskOwner(e.target.value)}
                    placeholder="Responsable (ej. Reno)"
                    className="bg-white dark:bg-neutral-800 border border-blue-200 dark:border-neutral-700 rounded-lg p-2 text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickTaskOpen(false)}
                    className="px-3 py-1 text-slate-500 hover:text-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            )}

            {/* List of events */}
            <div className="space-y-3">
              {/* Project Goals */}
              {selectedDayEvents?.projectTargets && selectedDayEvents.projectTargets.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                    Metas de Proyectos
                  </span>
                  {selectedDayEvents.projectTargets.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        store.setActiveView('projects', p.id);
                        setSelectedDayStr(null);
                      }}
                      className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs cursor-pointer hover:border-amber-400"
                    >
                      <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
                        <Target className="w-4 h-4 text-amber-500" />
                        <span>{p.name}</span>
                      </div>
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        Ver Proyecto →
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tasks List */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                  Actividades Programadas ({selectedDayEvents?.tasks?.length || 0})
                </span>

                {(!selectedDayEvents || selectedDayEvents.tasks.length === 0) ? (
                  <p className="p-6 text-center text-xs text-slate-400 dark:text-neutral-500 bg-slate-50 dark:bg-neutral-800/40 rounded-xl">
                    No hay tareas programadas para este día.
                  </p>
                ) : (
                  selectedDayEvents.tasks.map((task) => {
                    const isDone = task.status === 'Completado';
                    const proj = projects.find((p) => p.id === task.projectId);

                    return (
                      <div
                        key={task.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-colors ${
                          isDone
                            ? 'bg-slate-50 dark:bg-neutral-800/40 border-slate-200 dark:border-neutral-800'
                            : 'bg-white dark:bg-neutral-800/70 border-slate-200 dark:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => handleToggleTaskStatus(task)}
                            className="rounded border-slate-300 dark:border-neutral-600 text-blue-600 cursor-pointer h-4 w-4"
                          />
                          <div className="min-w-0">
                            <h4
                              className={`font-semibold ${
                                isDone
                                  ? 'text-slate-400 dark:text-neutral-500 line-through'
                                  : 'text-slate-900 dark:text-neutral-100'
                              }`}
                            >
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-neutral-500 mt-0.5">
                              <span>{proj?.name || 'General'}</span>
                              <span>·</span>
                              <span>Resp: {task.owner || 'Equipo'}</span>
                              <span>·</span>
                              <span>{task.progress}% avance</span>
                            </div>
                          </div>
                        </div>

                        {/* Inline Reschedule date picker */}
                        <div className="flex items-center gap-2 shrink-0">
                          <input
                            type="date"
                            value={task.due || ''}
                            onChange={(e) => {
                              const updated: Task = {
                                ...task,
                                due: e.target.value,
                                updatedAt: new Date().toISOString(),
                              };
                              store.putRecord(updated);
                            }}
                            className="text-[10px] font-mono bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded px-1.5 py-0.5"
                            title="Cambiar fecha de entrega"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
