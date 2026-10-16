import React, { useMemo, useState } from 'react';
import { AlertTriangle, CalendarDays, GripVertical, Pencil, Plus, Target, Trash2, X } from 'lucide-react';
import { store } from '../services/store';
import { DailyPlanItem, Task } from '../types';

// Fecha local (YYYY-MM-DD). toISOString() usa UTC y adelanta el día después de las 18:00 en CDMX.
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const blank = (): Omit<DailyPlanItem, 'id' | 'kind' | 'createdAt' | 'updatedAt' | 'order'> => ({
  title: '',
  description: '',
  objective: '',
  date: localToday(),
  done: false,
});

export const DailyPlanningView: React.FC = () => {
  const state = store.getState();
  const items = useMemo(
    () => Object.values(state.records).filter((record): record is DailyPlanItem => record.kind === 'daily_plan' && !record.deletedAt)
      .sort((a, b) => a.order - b.order),
    [state.records]
  );
  const [draft, setDraft] = useState(blank());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [showAllDue, setShowAllDue] = useState(false);

  const today = localToday();
  const projects = store.getProjects();
  const dueTasks = useMemo(
    () =>
      store
        .getAllTasks()
        .filter((t: Task) => t.status !== 'Completado' && t.due && t.due <= today)
        .sort((a: Task, b: Task) => (a.due || '').localeCompare(b.due || '')),
    [state.records, today]
  );

  const completeTask = (task: Task) =>
    store.putRecord({ ...task, status: 'Completado', progress: 100, realEnd: today });

  const quickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;
    const now = new Date().toISOString();
    store.putRecord({
      id: `daily-plan-${Date.now()}`,
      kind: 'daily_plan',
      title,
      date: today,
      done: false,
      order: items.length,
      createdAt: now,
      updatedAt: now,
    });
    setQuickTitle('');
  };

  const reset = () => {
    setDraft(blank());
    setEditingId(null);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    const current = editingId ? items.find((item) => item.id === editingId) : undefined;
    const now = new Date().toISOString();
    store.putRecord({
      id: current?.id || `daily-plan-${Date.now()}`,
      kind: 'daily_plan',
      title: draft.title.trim(),
      description: draft.description?.trim() || undefined,
      objective: draft.objective?.trim() || undefined,
      date: draft.date || undefined,
      done: current?.done || false,
      order: current?.order ?? items.length,
      createdAt: current?.createdAt || now,
      updatedAt: now,
    });
    reset();
  };

  const edit = (item: DailyPlanItem) => {
    setEditingId(item.id);
    setDraft({ title: item.title, description: item.description || '', objective: item.objective || '', date: item.date || '', done: item.done });
  };

  const toggle = (item: DailyPlanItem) => store.putRecord({ ...item, done: !item.done });

  // Dos listas: pendientes (principal) y terminadas (secundaria) para que no se mezclen.
  const pendingItems = items.filter((item) => !item.done);
  const doneItems = items
    .filter((item) => item.done)
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

  const drop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    const reordered = [...pendingItems];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    store.putRecords([...reordered, ...items.filter((item) => item.done)].map((item, order) => ({ ...item, order })));
    setDraggedIndex(null);
  };

  const clearDone = () => {
    doneItems.forEach((item) => store.deleteRecord(item.id, true));
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Planeación diaria</h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">Tus pendientes personales y las tareas de proyecto que vencen hoy o ya vencieron.</p>
      </div>

      <form onSubmit={quickAdd} className="flex gap-2">
        <input
          value={quickTitle}
          onChange={(e) => setQuickTitle(e.target.value)}
          placeholder="Agregar pendiente para hoy y presionar Enter…"
          aria-label="Agregar pendiente rápido"
          className="flex-1 rounded-lg border border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2.5 text-sm text-slate-900 dark:text-white"
        />
        <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500"><Plus className="w-4 h-4" />Agregar</button>
        <button type="button" onClick={() => setShowDetails((v) => !v)} className="rounded-lg border border-slate-300 dark:border-neutral-700 px-3 py-2 text-xs font-medium text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800">{showDetails ? 'Ocultar detalles' : 'Con detalles'}</button>
      </form>

      {dueTasks.length > 0 && (
        <section className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-2xs">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-neutral-100">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            De tus proyectos: vencen hoy o ya vencieron <span className="font-mono text-xs text-slate-500">{dueTasks.length}</span>
          </h3>
          <ul className="divide-y divide-slate-100 dark:divide-neutral-800">
            {(showAllDue ? dueTasks : dueTasks.slice(0, 5)).map((t: Task) => {
              const proj = projects.find((p) => p.id === t.projectId);
              return (
                <li key={t.id} className="flex items-center gap-3 py-2 text-xs">
                  <input type="checkbox" checked={false} onChange={() => completeTask(t)} aria-label={`Completar ${t.title}`} className="h-4 w-4 rounded border-slate-300 text-blue-600" />
                  <span className="min-w-0 flex-1 truncate font-medium text-slate-800 dark:text-neutral-100">{t.title}</span>
                  {proj && (
                    <button type="button" onClick={() => store.setActiveView('projects', proj.id)} className="max-w-[40%] truncate text-blue-600 hover:underline">{proj.name}</button>
                  )}
                  <span className={`font-mono ${t.due! < today ? 'text-rose-600' : 'text-slate-500'}`}>{t.due}</span>
                </li>
              );
            })}
          </ul>
          {dueTasks.length > 5 && (
            <button type="button" onClick={() => setShowAllDue((v) => !v)} className="mt-2 text-xs font-semibold text-blue-600 hover:underline">
              {showAllDue ? 'Ver solo las 5 más antiguas' : `Ver las ${dueTasks.length} tareas`}
            </button>
          )}
        </section>
      )}

      {(showDetails || editingId) && <form onSubmit={save} className="rounded-xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-neutral-100">{editingId ? 'Editar pendiente' : 'Nuevo pendiente'}</h3>
          {editingId && <button type="button" onClick={reset} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"><X className="w-4 h-4" /></button>}
        </div>
        <input required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Título del pendiente" className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 px-3 py-2 text-sm text-slate-900 dark:text-white" />
        <div className="grid gap-3 sm:grid-cols-2">
          <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Descripción opcional" rows={2} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 px-3 py-2 text-xs text-slate-900 dark:text-white" />
          <textarea value={draft.objective} onChange={(e) => setDraft({ ...draft, objective: e.target.value })} placeholder="Objetivo opcional" rows={2} className="w-full rounded-lg border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 px-3 py-2 text-xs text-slate-900 dark:text-white" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="rounded-lg border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 px-3 py-2 text-xs text-slate-900 dark:text-white" />
          <button className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500"><Plus className="w-4 h-4" />{editingId ? 'Guardar' : 'Agregar'}</button>
        </div>
      </form>}

      <div className="grid gap-5 lg:grid-cols-3 items-start">
        <section aria-label="Pendientes" className="lg:col-span-2 space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-neutral-100">
            Pendientes <span className="font-mono text-xs text-slate-500">{pendingItems.length}</span>
          </h3>
          {pendingItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-neutral-700 p-8 text-center text-xs text-slate-500">
              {doneItems.length > 0 ? 'No tienes pendientes. Todo lo terminado está a la derecha.' : 'Agrega tus pendientes del día aquí.'}
            </div>
          ) : (
            pendingItems.map((item, index) => (
              <div key={item.id} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(index)} className={`flex gap-3 rounded-xl border bg-white dark:bg-neutral-900 p-4 shadow-2xs ${draggedIndex !== null && draggedIndex !== index ? 'border-blue-300' : 'border-slate-200 dark:border-neutral-800'}`}>
                <span draggable onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDraggedIndex(index); }} onDragEnd={() => setDraggedIndex(null)} title="Arrastra para cambiar la posición" className="cursor-grab active:cursor-grabbing pt-1 text-slate-400"><GripVertical className="w-4 h-4" /></span>
                <input type="checkbox" checked={false} onChange={() => toggle(item)} aria-label={`Marcar como terminado: ${item.title}`} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                  {item.description && <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600 dark:text-neutral-300">{item.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    {item.date && <span className={`inline-flex items-center gap-1 ${item.date < today ? 'text-rose-600' : 'text-slate-500'}`}><CalendarDays className="w-3.5 h-3.5" />{item.date}</span>}
                    {item.objective && <span className="inline-flex items-center gap-1 text-blue-700 dark:text-cyan-300"><Target className="w-3.5 h-3.5" />{item.objective}</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => edit(item)} title="Editar pendiente" className="p-1.5 text-slate-400 hover:text-blue-600"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => store.deleteRecord(item.id, true)} title="Enviar a papelera" className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))
          )}
        </section>

        <aside aria-label="Terminadas" className="space-y-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              Terminadas <span className="font-mono text-xs">{doneItems.length}</span>
            </h3>
            {doneItems.length > 0 && (
              <button type="button" onClick={clearDone} className="text-[11px] font-medium text-slate-500 hover:text-rose-600">Enviar a papelera</button>
            )}
          </div>
          {doneItems.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500">Lo que termines aparecerá aquí.</p>
          ) : (
            doneItems.map((item) => (
              <div key={item.id} className="flex items-start gap-2 rounded-lg border border-emerald-100 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900 p-2.5">
                <input type="checkbox" checked onChange={() => toggle(item)} aria-label={`Regresar a pendientes: ${item.title}`} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-500 line-through">{item.title}</p>
                  {item.date && <p className="font-mono text-[10px] text-slate-400">{item.date}</p>}
                </div>
                <button onClick={() => store.deleteRecord(item.id, true)} title="Enviar a papelera" className="p-1 text-slate-400 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))
          )}
        </aside>
      </div>
    </div>
  );
};
 


