import React, { useMemo } from 'react';
import { CheckSquare, Calendar, FolderKanban, AlertTriangle, Clock } from 'lucide-react';
import { store } from '../services/store';
import { Task } from '../types';
import { BrandLogo } from './common/BrandLogo';

export const MyWorkView: React.FC = () => {
  const allTasks = store.getAllTasks();
  const projects = store.getProjects();
  const todayStr = new Date().toISOString().split('T')[0];
  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const toggleTask = (task: Task) => {
    const isDone = task.status === 'Completado';
    store.putRecord({
      ...task,
      status: isDone ? 'En curso' : 'Completado',
      progress: isDone ? 50 : 100,
      realEnd: isDone ? undefined : todayStr,
    });
  };

  const groups = useMemo(() => {
    const overdue: Task[] = [];
    const today: Task[] = [];
    const next7Days: Task[] = [];
    const later: Task[] = [];
    const noDate: Task[] = [];
    const completed: Task[] = [];

    allTasks.forEach((t: Task) => {
      if (t.status === 'Completado') {
        completed.push(t);
        return;
      }
      if (!t.due) {
        noDate.push(t);
        return;
      }
      if (t.due < todayStr) {
        overdue.push(t);
      } else if (t.due === todayStr) {
        today.push(t);
      } else if (t.due <= in7Days) {
        next7Days.push(t);
      } else {
        later.push(t);
      }
    });

    return [
      { id: 'overdue', title: 'Vencidas', tasks: overdue, color: 'text-rose-600 dark:text-rose-400', badgeBg: 'bg-rose-50 border-rose-200 dark:bg-rose-950/60 dark:border-rose-800' },
      { id: 'today', title: 'Hoy', tasks: today, color: 'text-amber-600 dark:text-amber-400', badgeBg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:border-amber-800' },
      { id: 'next7Days', title: 'Próximos 7 Días', tasks: next7Days, color: 'text-blue-600 dark:text-cyan-400', badgeBg: 'bg-blue-50 border-blue-200 dark:bg-cyan-950/60 dark:border-cyan-800' },
      { id: 'later', title: 'Más Adelante', tasks: later, color: 'text-slate-600 dark:text-neutral-400', badgeBg: 'bg-slate-100 border-slate-200 dark:bg-neutral-800 dark:border-neutral-700' },
      { id: 'noDate', title: 'Sin Fecha Programada', tasks: noDate, color: 'text-slate-500 dark:text-neutral-500', badgeBg: 'bg-slate-100 border-slate-200 dark:bg-neutral-800 dark:border-neutral-700' },
      { id: 'completed', title: 'Completadas', tasks: completed, color: 'text-emerald-600 dark:text-emerald-400', badgeBg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800' },
    ];
  }, [allTasks, todayStr, in7Days]);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Mi Trabajo</h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
          Actividades consolidadas agrupadas por prioridad temporal (RF-34)
        </p>
      </div>

      <div className="space-y-6">
        {groups.map((group) => {
          if (group.tasks.length === 0 && group.id !== 'overdue') return null;

          return (
            <div key={group.id} className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span className={group.color}>{group.title}</span>
                <span className={`px-1.5 py-0.2 rounded font-mono text-[11px] border ${group.badgeBg} ${group.color}`}>
                  {group.tasks.length}
                </span>
              </div>

              {group.tasks.length === 0 ? (
                <div className="p-3 bg-slate-50 dark:bg-neutral-900/60 border border-slate-200 dark:border-neutral-800/60 rounded-lg text-xs text-slate-500 dark:text-neutral-500 italic">
                  Sin tareas en esta categoría.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {group.tasks.map((task) => {
                    const project = projects.find((p) => p.id === task.projectId);

                    return (
                      <div
                        key={task.id}
                        className="p-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 rounded-lg flex items-center justify-between gap-3 transition-colors shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={task.status === 'Completado'}
                            onChange={() => toggleTask(task)}
                            className="rounded border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-cyan-600 focus:ring-0 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <h4
                              className={`text-xs font-medium truncate ${
                                task.status === 'Completado'
                                  ? 'text-slate-400 dark:text-neutral-500 line-through'
                                  : 'text-slate-900 dark:text-neutral-200'
                              }`}
                            >
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                              {project ? (
                                <button
                                  onClick={() => store.setActiveView('projects', project.id)}
                                  className="text-blue-600 dark:text-cyan-400 hover:underline truncate flex items-center gap-1.5"
                                  title={`Ver proyecto: ${project.name}`}
                                >
                                  <BrandLogo
                                    brandId={project.brandId}
                                    projectName={project.name}
                                    size="2xs"
                                  />
                                  <span>{project.name}</span>
                                </button>
                              ) : (
                                <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 px-1.5 py-0.5 rounded">
                                  ⭐ Independiente
                                </span>
                              )}
                              <span>·</span>
                              <span>Resp: {task.owner || 'Sin asignar'}</span>
                              {task.due && (
                                <>
                                  <span>·</span>
                                  <span className="font-mono">Vence: {task.due}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-mono text-blue-600 dark:text-cyan-400 tabular-nums">
                            {task.progress}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
