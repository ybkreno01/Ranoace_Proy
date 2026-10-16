import React from 'react';
import { GanttChartSquare, Calendar, ChevronRight } from 'lucide-react';
import { store } from '../services/store';
import { calculateProjectProgress } from '../services/businessRules';
import { BrandLogo } from './common/BrandLogo';
import { ProjectNameCell } from './common/ProjectNameCell';

export const GanttView: React.FC = () => {
  const state = store.getState();
  const projects = store.getProjects();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Cronograma de Proyectos (Gantt)</h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
          Línea de tiempo de cartera, avance ponderado y compromisos temporales (RF-38)
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-6 space-y-6 shadow-2xs">
        <div className="space-y-6">
          {projects.map((p) => {
            const pTasks = store.getProjectTasks(p.id);
            const calc = calculateProjectProgress(p, pTasks);
            const brand = state.records[p.brandId || ''] as any;
            const color = brand?.color || '#06b6d4';

            return (
              <div
                key={p.id}
                className="p-4 bg-slate-50 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 rounded-xl space-y-3 transition-colors cursor-pointer"
                onClick={() => store.setActiveView('projects', p.id)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <ProjectNameCell
                    project={p}
                    brand={brand}
                    client={state.records[p.clientId || ''] as any}
                    worktype={state.records[p.typeId || ''] as any}
                    logoSize="lg"
                  />

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-slate-500 dark:text-neutral-400">
                      {p.start || '2026-10-01'} → {p.target || '2026-10-31'}
                    </span>
                    <span className="text-blue-600 dark:text-cyan-400 font-bold tabular-nums">
                      {calc.progress}% avance
                    </span>
                  </div>
                </div>

                {/* Timeline Gantt representation */}
                <div className="relative w-full h-8 bg-slate-100 dark:bg-neutral-950 rounded-lg border border-slate-200 dark:border-neutral-800 p-1 flex items-center overflow-hidden">
                  {/* Today marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                    style={{ left: '40%' }}
                    title={`Hoy: ${todayStr}`}
                  />

                  {/* Project scheduled bar */}
                  <div
                    className="h-6 rounded relative overflow-hidden transition-all duration-300"
                    style={{
                      left: '5%',
                      width: '85%',
                      backgroundColor: `${color}30`,
                      border: `1px solid ${color}70`,
                    }}
                  >
                    {/* Real Progress Fill */}
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${calc.progress}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>

                {/* Sections breakdown pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500 dark:text-neutral-400">
                  {calc.sections.map((sec) => (
                    <span
                      key={sec.sectionId}
                      className="px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700/60 text-slate-700 dark:text-neutral-300"
                    >
                      {sec.name.split('.')[0] || sec.name}: {sec.calculatedProgress}%
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
