import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Users,
  Layers,
  ShieldAlert,
  ArrowUpRight,
  Activity,
  Flame,
  PieChart as PieChartIcon,
  BarChart3,
  Target,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Project, Task, CatalogItem, Guide } from '../types';
import { ProjectCalculationResult } from '../services/businessRules';

interface ProjectVisualProgressBoardProps {
  project: Project;
  tasks: Task[];
  calc: ProjectCalculationResult;
  brand?: CatalogItem | null;
  client?: CatalogItem | null;
  allGuides?: Record<string, Guide>;
  onNavigateToTask?: (task: Task) => void;
}

export const ProjectVisualProgressBoard: React.FC<ProjectVisualProgressBoardProps> = ({
  project,
  tasks,
  calc,
  brand,
  client,
  onNavigateToTask,
}) => {
  const brandColor = brand?.color || '#3b82f6';
  const [stageViewMode, setStageViewMode] = useState<'circular' | 'linear'>('circular');

  // Task status distribution
  const statusCounts = useMemo(() => {
    const counts = {
      Completado: 0,
      'En curso': 0,
      'En espera': 0,
      'En validación': 0,
      Pendiente: 0,
    };
    tasks.forEach((t) => {
      if (counts[t.status] !== undefined) {
        counts[t.status]++;
      } else {
        counts.Pendiente++;
      }
    });
    return counts;
  }, [tasks]);

  const totalTasks = tasks.length || 1;

  // Health Status determination
  const healthStatus = useMemo(() => {
    if (project.status === 'Completado') {
      return { label: 'Completado', color: 'emerald', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
    }
    if (project.blocker && project.blocker.trim()) {
      return { label: 'Crítico / Bloqueado', color: 'rose', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' };
    }
    if (calc.isStale) {
      return { label: 'Sin Movimiento (Stale)', color: 'amber', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    }
    if (calc.progress >= 75) {
      return { label: 'Fase Avanzada', color: 'blue', bg: 'bg-blue-500/10 text-blue-600 dark:text-cyan-400 border-blue-500/20' };
    }
    return { label: 'En Progreso Normal', color: 'blue', bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
  }, [project.status, project.blocker, calc.isStale, calc.progress]);

  // Team workload distribution
  const workloadByOwner = useMemo(() => {
    const map: Record<string, { total: number; completed: number; inProgress: number }> = {};
    tasks.forEach((t) => {
      const owner = t.owner?.trim() || 'Sin asignar';
      if (!map[owner]) {
        map[owner] = { total: 0, completed: 0, inProgress: 0 };
      }
      map[owner].total++;
      if (t.status === 'Completado' || t.progress >= 100) {
        map[owner].completed++;
      } else if (t.status === 'En curso') {
        map[owner].inProgress++;
      }
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [tasks]);

  // Days calculations
  const today = new Date().toISOString().split('T')[0];
  const daysInfo = useMemo(() => {
    if (!project.start || !project.target) return { totalDays: 30, elapsedDays: 10, remainingDays: 20, pct: 33 };
    const s = new Date(project.start).getTime();
    const t = new Date(project.target).getTime();
    const now = new Date(today).getTime();

    const totalMs = Math.max(1, t - s);
    const elapsedMs = Math.max(0, now - s);
    const remainingMs = Math.max(0, t - now);

    const totalDays = Math.ceil(totalMs / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.min(totalDays, Math.ceil(elapsedMs / (1000 * 60 * 60 * 24)));
    const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
    const pct = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)));

    return { totalDays, elapsedDays, remainingDays, pct };
  }, [project.start, project.target, today]);

  // SVG Radial Gauge geometry
  const gaugeRadius = 75;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const strokeDashoffset = gaugeCircumference - (calc.progress / 100) * gaugeCircumference;

  // Donut SVG geometry for status breakdown
  const donutRadius = 60;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const statusSlices = useMemo(() => {
    let accumulatedAngle = 0;
    const slices = [
      { key: 'Completado', count: statusCounts.Completado, color: '#10b981' },
      { key: 'En curso', count: statusCounts['En curso'], color: '#06b6d4' },
      { key: 'En espera', count: statusCounts['En espera'], color: '#f59e0b' },
      { key: 'En validación', count: statusCounts['En validación'], color: '#8b5cf6' },
      { key: 'Pendiente', count: statusCounts.Pendiente, color: '#94a3b8' },
    ];

    return slices.map((s) => {
      const fraction = s.count / totalTasks;
      const strokeLength = fraction * donutCircumference;
      const offset = donutCircumference - strokeLength;
      const rotation = accumulatedAngle;
      accumulatedAngle += fraction * 360;
      return { ...s, fraction, strokeLength, offset, rotation };
    });
  }, [statusCounts, totalTasks, donutCircumference]);

  return (
    <div className="space-y-6">
      {/* SECTION 1: Top Key Executive Gauges & KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Main Progress Radial Gauge (Visual Speedometer) */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs flex flex-col items-center justify-between relative overflow-hidden">
          <div className="w-full flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                Avance Ponderado Global
              </h3>
            </div>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${healthStatus.bg}`}>
              {healthStatus.label}
            </span>
          </div>

          {/* SVG Radial Gauge */}
          <div className="relative my-3 flex items-center justify-center">
            <svg className="w-48 h-48 -rotate-90 transform" viewBox="0 0 180 180">
              <circle
                cx="90"
                cy="90"
                r={gaugeRadius}
                stroke="currentColor"
                strokeWidth="14"
                className="text-slate-100 dark:text-neutral-800"
                fill="none"
              />
              <circle
                cx="90"
                cy="90"
                r={gaugeRadius}
                stroke="url(#progressGradient)"
                strokeWidth="14"
                strokeDasharray={gaugeCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>

            {/* Inner Content of Radial Gauge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                {calc.progress}%
              </span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium mt-0.5">
                {calc.completedActivitiesCount} de {calc.totalActivitiesCount} actividades
              </span>
            </div>
          </div>

          {/* Satellite Mini Metrics */}
          <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-neutral-800 text-center">
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-neutral-800/50">
              <span className="text-[10px] text-slate-500 dark:text-neutral-400 block">Tiempo Consumido</span>
              <span className="text-xs font-bold font-mono text-slate-800 dark:text-neutral-200">
                {daysInfo.elapsedDays} / {daysInfo.totalDays} días ({daysInfo.pct}%)
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-neutral-800/50">
              <span className="text-[10px] text-slate-500 dark:text-neutral-400 block">Días Restantes</span>
              <span className="text-xs font-bold font-mono text-blue-600 dark:text-cyan-400">
                {daysInfo.remainingDays} días
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Donut Chart - Activities Status Breakdown */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                Distribución de Actividades
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500 dark:text-neutral-400">
              {tasks.length} Total
            </span>
          </div>

          <div className="flex items-center justify-center gap-6 my-2">
            {/* SVG Donut */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={donutRadius}
                  stroke="currentColor"
                  strokeWidth="18"
                  className="text-slate-100 dark:text-neutral-800"
                  fill="none"
                />
                {statusSlices.map((s) => (
                  <circle
                    key={s.key}
                    cx="80"
                    cy="80"
                    r={donutRadius}
                    stroke={s.color}
                    strokeWidth="18"
                    strokeDasharray={donutCircumference}
                    strokeDashoffset={s.offset}
                    transform={`rotate(${s.rotation} 80 80)`}
                    fill="none"
                    className="transition-all duration-700"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                  {statusCounts.Completado}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Listas
                </span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-1.5 text-xs flex-1">
              {[
                { label: 'Completado', count: statusCounts.Completado, color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'En curso', count: statusCounts['En curso'], color: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400' },
                { label: 'En espera', count: statusCounts['En espera'], color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
                { label: 'En validación', count: statusCounts['En validación'], color: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400' },
                { label: 'Pendiente', count: statusCounts.Pendiente, color: 'bg-slate-400', text: 'text-slate-600 dark:text-neutral-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`} />
                    <span className="text-slate-600 dark:text-neutral-300 text-[11px]">{item.label}</span>
                  </div>
                  <span className={`font-mono font-bold text-xs tabular-nums ${item.text}`}>
                    {item.count} <span className="text-[10px] opacity-70">({Math.round((item.count / totalTasks) * 100)}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-neutral-800 text-[11px] text-slate-500 dark:text-neutral-400 flex items-center justify-between">
            <span>Tasa de cumplimiento:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
              {Math.round((statusCounts.Completado / totalTasks) * 100)}%
            </span>
          </div>
        </div>

        {/* Card 3: Project Pulse & Critical Indicators */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-violet-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                Puntos de Enfoque Inmediato
              </h3>
            </div>
            <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-neutral-400">
              {project.target}
            </span>
          </div>

          {/* Active Blocker if any */}
          {project.blocker && project.blocker.trim() ? (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-bold text-xs">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Bloqueo Activo Reportado:</span>
              </div>
              <p className="text-xs text-rose-800 dark:text-rose-300 pl-5">
                {project.blocker}
              </p>
              {project.blockerOwner && (
                <span className="text-[10px] text-rose-600 dark:text-rose-400 pl-5 block">
                  Responsable: {project.blockerOwner}
                </span>
              )}
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Sin bloqueos activos. El proyecto avanza conforme al plan.</span>
            </div>
          )}

          {/* Next Action */}
          <div className="p-3 bg-slate-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700/60 rounded-xl space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 dark:text-neutral-300">
                Siguiente Acción Clave:
              </span>
              {calc.effectiveNextActionDate && (
                <span className="font-mono text-[10px] text-slate-500 dark:text-neutral-400">
                  {calc.effectiveNextActionDate}
                </span>
              )}
            </div>
            <p className="text-slate-800 dark:text-neutral-200 text-xs">
              {calc.effectiveNextAction || 'No se ha configurado siguiente acción.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-neutral-400 pt-1">
            <div className="flex items-center justify-between px-2 py-1 bg-slate-50 dark:bg-neutral-800 rounded-lg">
              <span>Etapas:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">
                {calc.sections.length}
              </span>
            </div>
            <div className="flex items-center justify-between px-2 py-1 bg-slate-50 dark:bg-neutral-800 rounded-lg">
              <span>Hitos Cumplidos:</span>
              <span className="font-bold text-blue-600 dark:text-cyan-400 font-mono">
                {tasks.filter((t) => t.milestone && (t.status === 'Completado' || t.progress >= 100)).length} /{' '}
                {tasks.filter((t) => t.milestone).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Stage Progress (Desglose y Ponderación por Etapas del Plan con Gráficos Circulares) */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <PieChartIcon className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-neutral-100">
                Desglose y Ponderación por Etapas del Plan
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Cumplimiento ponderado individual y contribución matemática acumulada al avance general
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle: Gráficos Circulares vs Barras */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-neutral-800 p-1 rounded-lg">
              <button
                onClick={() => setStageViewMode('circular')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  stageViewMode === 'circular'
                    ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-cyan-400 shadow-2xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Vista en cuadrícula con gráficos circulares"
              >
                <PieChartIcon className="w-3.5 h-3.5" />
                <span>Gráficos Circulares</span>
              </button>
              <button
                onClick={() => setStageViewMode('linear')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  stageViewMode === 'linear'
                    ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-cyan-400 shadow-2xs'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Vista en lista con barras"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Barras</span>
              </button>
            </div>

            <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-900">
              Total Ponderado: {calc.sections.reduce((sum, s) => sum + s.weight, 0)}%
            </span>
          </div>
        </div>

        {/* Circular Gauges Grid (Active Default) */}
        {stageViewMode === 'circular' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
            {calc.sections.map((sec, idx) => {
              const isCompleted = sec.calculatedProgress >= 100;
              const isStarted = sec.calculatedProgress > 0;
              const ringColor = isCompleted
                ? '#10b981'
                : sec.calculatedProgress >= 70
                ? '#06b6d4'
                : isStarted
                ? '#3b82f6'
                : '#94a3b8';

              const ringCircumference = 213.63; // 2 * PI * 34
              const ringOffset = ringCircumference - (ringCircumference * Math.min(100, Math.max(0, sec.calculatedProgress))) / 100;

              return (
                <div
                  key={sec.sectionId}
                  className="rounded-xl overflow-hidden border border-slate-200 dark:border-neutral-800 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group bg-white dark:bg-neutral-900"
                >
                  {/* Dark Navy Header as shown in image */}
                  <div className="bg-slate-900 dark:bg-slate-950 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-cyan-300 border border-cyan-500/30 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-slate-100 text-xs sm:text-sm truncate" title={sec.name}>
                        {sec.name}
                      </h4>
                    </div>
                    <span className="shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-cyan-300 border border-white/15">
                      Peso: {sec.weight}%
                    </span>
                  </div>

                  {/* Card Body: Circular Gauge & Stats */}
                  <div className="p-4 flex flex-col justify-between flex-1 space-y-3.5">
                    <div className="flex items-center justify-between gap-4">
                      {/* Circular Gauge */}
                      <div className="relative w-20 h-20 sm:w-22 sm:h-22 shrink-0 flex items-center justify-center">
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
                            stroke={ringColor}
                            strokeWidth="7"
                            strokeDasharray={ringCircumference}
                            strokeDashoffset={ringOffset}
                            strokeLinecap="round"
                            transform="rotate(-90 44 44)"
                            fill="none"
                            className="transition-all duration-700 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
                          <span className="text-sm font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                            {sec.calculatedProgress}%
                          </span>
                          <span className="text-[8px] uppercase font-bold tracking-wider text-slate-400 dark:text-neutral-500">
                            Avance
                          </span>
                        </div>
                      </div>

                      {/* Stat Columns */}
                      <div className="flex-1 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-neutral-400 text-[11px]">Tareas:</span>
                          <span className="font-mono font-bold text-slate-800 dark:text-neutral-200">
                            {sec.completedActivitiesCount} / {sec.activitiesCount}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 dark:text-neutral-400 text-[11px]">Aporte Global:</span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            +{sec.contributionToProject}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-neutral-800">
                          <span className="text-slate-500 dark:text-neutral-400 text-[11px]">Estado:</span>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isCompleted
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                : isStarted
                                ? 'bg-blue-50 dark:bg-cyan-950/60 text-blue-600 dark:text-cyan-400 border-blue-200 dark:border-cyan-800'
                                : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400 border-slate-200 dark:border-neutral-700'
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            ) : isStarted ? (
                              <Activity className="w-3 h-3 text-blue-500 dark:text-cyan-400" />
                            ) : (
                              <Clock className="w-3 h-3 text-slate-400" />
                            )}
                            <span>{isCompleted ? 'Cumplida' : isStarted ? 'En Ejecución' : 'Por Iniciar'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stage Progress Mini Footer */}
                    <div className="pt-2 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400">
                      <span>
                        {sec.activitiesCount - sec.completedActivitiesCount > 0
                          ? `${sec.activitiesCount - sec.completedActivitiesCount} tareas pendientes`
                          : 'Todas las tareas completadas'}
                      </span>
                      <span className="font-mono text-[10px] text-blue-600 dark:text-cyan-400 group-hover:underline">
                        Etapa #{idx + 1}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Linear Bars List */
          <div className="space-y-4">
            {calc.sections.map((sec, idx) => {
              const isCompleted = sec.calculatedProgress >= 100;
              const isStarted = sec.calculatedProgress > 0;
              const barColor = isCompleted
                ? 'bg-emerald-500'
                : isStarted
                ? 'bg-blue-600 dark:bg-cyan-500'
                : 'bg-slate-300 dark:bg-neutral-700';

              return (
                <div
                  key={sec.sectionId}
                  className="p-4 rounded-xl border border-slate-100 dark:border-neutral-800/80 bg-slate-50/50 dark:bg-neutral-800/30 space-y-2.5 hover:border-blue-300 dark:hover:border-cyan-500/40 transition-colors"
                >
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-cyan-400 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-neutral-100 truncate text-sm">
                        {sec.name}
                      </h4>
                      <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-neutral-400 px-2 py-0.5 rounded bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700">
                        Peso: {sec.weight}%
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-slate-500 dark:text-neutral-400 text-[11px]">
                        {sec.completedActivitiesCount} de {sec.activitiesCount} tareas completadas
                      </span>
                      <span className="font-mono text-sm font-extrabold text-blue-600 dark:text-cyan-400 tabular-nums">
                        {sec.calculatedProgress}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Track */}
                  <div className="h-3 w-full bg-slate-200/80 dark:bg-neutral-800 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-700 ease-out`}
                      style={{ width: `${sec.calculatedProgress}%` }}
                    />
                  </div>

                  {/* Contribution note */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 pt-0.5">
                    <span>
                      Aporte efectivo al proyecto:{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                        +{sec.contributionToProject}%
                      </strong>
                    </span>
                    <span className={`font-semibold ${isCompleted ? 'text-emerald-600 dark:text-emerald-400' : isStarted ? 'text-blue-600 dark:text-cyan-400' : 'text-slate-400'}`}>
                      {isCompleted ? 'Etapa Cumplida' : isStarted ? 'En Ejecución' : 'Pendiente de Inicio'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: Team Workload & Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Workload by Owner */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                Distribución de Carga por Responsable
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">{workloadByOwner.length} miembros</span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {workloadByOwner.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-neutral-500 italic text-center py-4">
                No hay actividades asignadas aún.
              </p>
            ) : (
              workloadByOwner.map(([owner, stats]) => {
                const compPct = Math.round((stats.completed / stats.total) * 100);
                return (
                  <div key={owner} className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-neutral-200 truncate max-w-[200px]">
                        {owner}
                      </span>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {stats.completed} listas
                        </span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-600 dark:text-neutral-400 font-semibold">
                          {stats.total} total
                        </span>
                      </div>
                    </div>

                    <div className="h-2 w-full bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 dark:bg-cyan-500 rounded-full transition-all duration-500"
                        style={{ width: `${compPct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Milestone Tracker & Upcoming Deadlines */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-neutral-300">
                Hitos y Fechas Clave del Proyecto
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">Próximos compromisos</span>
          </div>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {tasks
              .filter((t) => t.milestone || t.priority === 'Crítica' || t.priority === 'Alta')
              .slice(0, 6)
              .map((t) => {
                const isDone = t.status === 'Completado' || t.progress >= 100;
                return (
                  <div
                    key={t.id}
                    onClick={() => onNavigateToTask && onNavigateToTask(t)}
                    className="p-2.5 rounded-xl border border-slate-100 dark:border-neutral-800 bg-slate-50/50 dark:bg-neutral-800/40 hover:border-blue-400 cursor-pointer transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isDone}
                        readOnly
                        className="rounded border-slate-300 dark:border-neutral-700 text-blue-600"
                      />
                      <span className={`truncate font-medium ${isDone ? 'line-through text-slate-400 dark:text-neutral-500' : 'text-slate-800 dark:text-neutral-200'}`}>
                        {t.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                      {t.due && (
                        <span className="text-slate-500 dark:text-neutral-400">
                          {t.due}
                        </span>
                      )}
                      <span className={`px-1.5 py-0.2 rounded font-bold ${isDone ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-cyan-400'}`}>
                        {t.progress}%
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
