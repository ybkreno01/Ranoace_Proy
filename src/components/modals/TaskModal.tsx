import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Plus, Trash2 } from 'lucide-react';
import { store } from '../../services/store';
import { Task, TaskPriority, TaskStatus } from '../../types';

interface TaskModalProps {
  isOpen: boolean;
  task?: Task | null;
  projectId?: string;
  sectionId?: string;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  task,
  projectId,
  sectionId,
  onClose,
}) => {
  const projects = store.getProjects();

  const [title, setTitle] = useState('');
  const [targetProjectId, setTargetProjectId] = useState(projectId || '');
  const [targetSectionId, setTargetSectionId] = useState(sectionId || '');
  const [owner, setOwner] = useState('');
  const [status, setStatus] = useState<TaskStatus>('Pendiente');
  const [priority, setPriority] = useState<TaskPriority>('Media');
  const [start, setStart] = useState('');
  const [due, setDue] = useState('');
  const [weight, setWeight] = useState(1);
  const [progress, setProgress] = useState(0);
  const [progressMode, setProgressMode] = useState<'auto' | 'manual'>('auto');
  const [milestone, setMilestone] = useState(false);
  const [description, setDescription] = useState('');
  const [checklist, setChecklist] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [newChecklistText, setNewChecklistText] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setTargetProjectId(task.projectId || '');
      setTargetSectionId(task.sectionId || '');
      setOwner(task.owner || '');
      setStatus(task.status);
      setPriority(task.priority);
      setStart(task.start || '');
      setDue(task.due || '');
      setWeight(task.weight || 1);
      setProgress(task.progress || 0);
      setProgressMode(task.progressMode || 'auto');
      setMilestone(task.milestone || false);
      setDescription(task.description || '');
      setChecklist(task.checklist || []);
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      setTitle('');
      setTargetProjectId(projectId || '');
      setTargetSectionId(sectionId || '');
      setOwner('');
      setStatus('Pendiente');
      setPriority('Media');
      setStart(todayStr);
      setDue(todayStr);
      setWeight(1);
      setProgress(0);
      setProgressMode('auto');
      setMilestone(false);
      setDescription('');
      setChecklist([]);
    }
  }, [task, isOpen, projectId, sectionId]);

  if (!isOpen) return null;

  const currentProject = projects.find((p) => p.id === targetProjectId);

  const addChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    setChecklist([
      ...checklist,
      { id: `c-${Date.now()}`, text: newChecklistText.trim(), done: false },
    ]);
    setNewChecklistText('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const taskId = task?.id || `task-${Date.now()}`;
    const now = new Date().toISOString();

    const isCompleted = status === 'Completado';
    let finalProgress = progress;
    if (isCompleted) {
      finalProgress = 100;
    } else if (status === 'Pendiente' && progress === 100) {
      finalProgress = 0;
    }

    const updatedTask: Task = {
      id: taskId,
      kind: 'task',
      title: title.trim(),
      description: description.trim(),
      projectId: targetProjectId ? targetProjectId : undefined,
      sectionId: targetProjectId && targetSectionId ? targetSectionId : undefined,
      order: task?.order || 0,
      owner: owner.trim(),
      status: status,
      priority,
      start: start || undefined,
      due: due || undefined,
      dueOriginal: task?.dueOriginal || due || undefined,
      realStart: (task?.progress || finalProgress) > 0 && !task?.realStart ? now.split('T')[0] : task?.realStart,
      realEnd: isCompleted ? now.split('T')[0] : undefined,
      progress: finalProgress,
      progressMode,
      weight: Number(weight) > 0 ? Number(weight) : 1,
      milestone,
      checklist,
      deps: task?.deps || [],
      createdAt: task?.createdAt || now,
      updatedAt: now,
    };

    store.putRecord(updatedTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-neutral-800 bg-slate-50/90 dark:bg-neutral-900/90">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
              {task ? 'Editar Tarea / Actividad' : 'Nueva Tarea / Actividad'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-neutral-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
          <div>
            <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-medium">Título de la Actividad *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Configurar conectores RDP, auditoría de certificados..."
              className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 text-sm focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Proyecto Asignado</label>
              <select
                value={targetProjectId}
                onChange={(e) => {
                  setTargetProjectId(e.target.value);
                  const p = projects.find((proj) => proj.id === e.target.value);
                  setTargetSectionId(p?.plan?.sections[0]?.id || '');
                }}
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-2.5 py-2 text-slate-800 dark:text-neutral-200"
              >
                <option value="">⭐ (Sin proyecto - Tarea independiente / general)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    📁 {p.name}
                  </option>
                ))}
              </select>
              {targetProjectId && (
                <p className="text-[11px] text-blue-600 dark:text-cyan-400 mt-1">
                  ⚖️ Avance del proyecto: Si hay 1 tarea es 100%, si son 2 o más se reparten equitativamente.
                </p>
              )}
            </div>

            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Sección del Plan</label>
              <select
                value={targetSectionId}
                disabled={!targetProjectId}
                onChange={(e) => setTargetSectionId(e.target.value)}
                className={`w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-2.5 py-2 text-slate-800 dark:text-neutral-200 ${
                  !targetProjectId ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <option value="">
                  {targetProjectId ? '(Sin sección - Otras actividades)' : '(No aplica - Tarea independiente)'}
                </option>
                {currentProject?.plan?.sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.weight}%)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Responsable</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Ej. Ing. Juan Pérez"
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-200 focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-medium">Estado</label>
              <select
                value={status}
                onChange={(e) => {
                  const newSt = e.target.value as TaskStatus;
                  setStatus(newSt);
                  if (newSt === 'Completado') {
                    setProgress(100);
                  } else if (newSt === 'Pendiente' && progress === 100) {
                    setProgress(0);
                  } else if (newSt === 'En curso' && (progress === 100 || progress === 0)) {
                    setProgress(50);
                  }
                }}
                className={`w-full border rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer ${
                  status === 'Completado'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    : status === 'En curso'
                    ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-cyan-300 dark:border-blue-800'
                    : status === 'En espera'
                    ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                    : status === 'En validación'
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
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Fecha Programada de Inicio</label>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-2.5 py-2 text-slate-800 dark:text-neutral-200 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Fecha Programada de Fin (Due)</label>
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-2.5 py-2 text-slate-800 dark:text-neutral-200 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Peso en su Sección</label>
              <input
                type="number"
                min={1}
                max={50}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-200 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Avance Capturado (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-blue-600 dark:text-cyan-400 font-mono"
              />
            </div>
          </div>

          {/* Checklist Editor (RF-33) */}
          <div className="pt-2 border-t border-slate-200 dark:border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 dark:text-neutral-300 font-medium">
                Lista de Verificación / Checklist (RF-33)
              </label>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-neutral-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={progressMode === 'auto'}
                  onChange={(e) => setProgressMode(e.target.checked ? 'auto' : 'manual')}
                  className="rounded border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-cyan-600 focus:ring-0"
                />
                <span>El checklist calcula el avance</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addChecklistItem();
                  }
                }}
                placeholder="Agregar elemento a la lista y presionar Enter..."
                className="flex-1 bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-neutral-200 focus:outline-hidden focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={addChecklistItem}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-800"
                >
                  <label className="flex items-center gap-2 cursor-pointer text-slate-800 dark:text-neutral-200 min-w-0">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => {
                        setChecklist(
                          checklist.map((c) => (c.id === item.id ? { ...c, done: !c.done } : c))
                        );
                      }}
                      className="rounded border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-cyan-600 focus:ring-0"
                    />
                    <span className={`truncate ${item.done ? 'line-through text-slate-400 dark:text-neutral-500' : ''}`}>
                      {item.text}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setChecklist(checklist.filter((c) => c.id !== item.id))}
                    className="text-slate-400 hover:text-rose-600 dark:text-neutral-500 dark:hover:text-rose-400 p-0.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 rounded-lg transition-colors shadow-xs"
            >
              Guardar Actividad
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
