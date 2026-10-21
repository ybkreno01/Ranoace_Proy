import React, { useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Layers,
  Users,
  Target,
  ShieldAlert,
  ArrowRight,
  Printer,
  Sparkles,
  Award,
  Check,
} from 'lucide-react';
import { Project, Task, CatalogItem, Section, Note } from '../types';
import { ProjectCalculationResult } from '../services/businessRules';
import { store } from '../services/store';
import { BrandLogo } from './common/BrandLogo';
import { htmlToPlainText } from '../services/textUtils';

interface ProjectExecutiveSummaryProps {
  project: Project;
  tasks: Task[];
  calc: ProjectCalculationResult;
  brand?: CatalogItem | null;
  client?: CatalogItem | null;
  onOpenTaskModal?: (task?: Task) => void;
}

export const ProjectExecutiveSummary: React.FC<ProjectExecutiveSummaryProps> = ({
  project,
  tasks,
  calc,
  brand,
  client,
}) => {
  const state = store.getState();
  const brandColor = brand?.color || '#3b82f6';

  // Toggle Project Criteria
  const handleToggleCriteria = (critId: string) => {
    const updatedCriteria = (project.criteria || []).map((c) =>
      c.id === critId ? { ...c, done: !c.done } : c
    );
    store.putRecord({
      ...project,
      criteria: updatedCriteria,
      updatedAt: new Date().toISOString(),
    });
  };

  // Recent notes/minutas for this project
  const projectNotes = useMemo(() => {
    return Object.values(state.records).filter(
      (r: any) => r.kind === 'note' && r.projectId === project.id && !r.deletedAt
    ) as Note[];
  }, [state.records, project.id]);

  // Key milestones
  const milestones = useMemo(() => {
    return tasks.filter((t) => t.milestone);
  }, [tasks]);

  // Print summary handler
  const handlePrintSummary = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between no-print pb-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
            <span>Ficha Resumen Ejecutivo del Proyecto</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
            Puntos clave, estado actual de cumplimiento, criterios de aceptación y próximas acciones concretas.
          </p>
        </div>

        <button
          onClick={handlePrintSummary}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-750 text-slate-700 dark:text-neutral-200 transition-colors shadow-2xs"
          title="Imprimir resumen ejecutivo o exportar a PDF"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Imprimir / Exportar PDF</span>
        </button>
      </div>

      {/* BLOCK 1: Ficha Ejecutiva Sintética & Métricas Clave */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Main Info */}
        <div className="md:col-span-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: brandColor }}
                />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                  {brand?.name || 'Marca'} · {client?.name || 'Cliente'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 font-semibold">
                  ID: {project.id}
                </span>
              </div>
              <div className="flex items-center gap-2.5 pt-0.5">
                <BrandLogo
                  brand={brand}
                  brandId={project.brandId}
                  projectName={project.name}
                  size="lg"
                />
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {project.name}
                </h1>
              </div>
            </div>

            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border shrink-0 ${
                project.status === 'Completado'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                  : project.status === 'En ejecución'
                  ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-cyan-400 dark:border-blue-800'
                  : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
              }`}
            >
              {project.status}
            </span>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-neutral-800 text-xs">
            <div>
              <span className="text-slate-500 dark:text-neutral-400 block text-[11px]">Fecha Inicio:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-neutral-200">
                {project.start || 'Sin definir'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-neutral-400 block text-[11px]">Fecha Meta:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-neutral-200">
                {project.target || 'Sin definir'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-neutral-400 block text-[11px]">Condición:</span>
              <span className="font-semibold text-slate-800 dark:text-neutral-200">
                {project.condition || 'Estándar'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-neutral-400 block text-[11px]">Actividades:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-neutral-200">
                {calc.completedActivitiesCount} / {calc.totalActivitiesCount} listas
              </span>
            </div>
          </div>
        </div>

        {/* Global Progress Radial Highlight */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-5 shadow-xs flex flex-col justify-between items-center text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-100">
            Avance Ponderado
          </span>
          <div className="my-2">
            <span className="text-4xl sm:text-5xl font-black tabular-nums tracking-tight">
              {calc.progress}%
            </span>
          </div>
          <span className="text-xs text-blue-100 font-medium">
            {calc.progress >= 100
              ? 'Proyecto Finalizado'
              : calc.progress >= 50
              ? 'En recta final'
              : 'En fase inicial/media'}
          </span>
        </div>
      </div>

      {/* BLOCK 2: Objetivos, Alcance & Criterios de Aceptación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Objetivos y Alcance */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-neutral-100">
            <Target className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Objetivo & Alcance Concretos
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-50 dark:bg-neutral-800/50 rounded-xl border border-slate-100 dark:border-neutral-800">
              <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 block mb-1">
                Objetivo Principal:
              </span>
              <p className="text-slate-800 dark:text-neutral-200 leading-relaxed font-medium">
                {project.objective || 'Sin objetivo registrado.'}
              </p>
            </div>

            {project.scope && (
              <div className="p-3.5 bg-slate-50 dark:bg-neutral-800/50 rounded-xl border border-slate-100 dark:border-neutral-800">
                <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 block mb-1">
                  Alcance Acordado:
                </span>
                <p className="text-slate-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {project.scope}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Criterios de Aceptación (Definición de Hecho) */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 dark:text-neutral-100">
              <Award className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Criterios de Aceptación (Definición de Éxito)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              {(project.criteria || []).filter((c) => c.done).length} de {(project.criteria || []).length}
            </span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {(project.criteria || []).length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-neutral-500 italic py-4 text-center">
                Sin criterios de aceptación configurados.
              </p>
            ) : (
              (project.criteria || []).map((crit) => (
                <div
                  key={crit.id}
                  onClick={() => handleToggleCriteria(crit.id)}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors text-xs ${
                    crit.done
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                      : 'bg-slate-50 dark:bg-neutral-800/50 border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 hover:border-blue-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={crit.done}
                    onChange={() => {}}
                    className="w-4 h-4 rounded border-slate-300 dark:border-neutral-700 text-emerald-600 cursor-pointer"
                  />
                  <span className={`flex-1 font-medium ${crit.done ? 'line-through text-slate-400 dark:text-neutral-500' : ''}`}>
                    {crit.text}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* BLOCK 3: Semáforo de Bloqueo & Próxima Acción Inmediata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Blocker status */}
        <div className={`rounded-2xl p-5 border shadow-xs space-y-2 ${
          project.blocker && project.blocker.trim()
            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
            : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldAlert className={`w-4 h-4 ${project.blocker && project.blocker.trim() ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-200">
              Estado de Bloqueos y Dependencias
            </h4>
          </div>

          {project.blocker && project.blocker.trim() ? (
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-rose-800 dark:text-rose-300">
                {project.blocker}
              </p>
              {project.blockerOwner && (
                <span className="text-[11px] text-rose-600 dark:text-rose-400 block font-medium">
                  Responsable del desbloqueo: {project.blockerOwner}
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-neutral-400 pt-1">
              No existen bloqueadores activos registrados. Todas las dependencias están resueltas.
            </p>
          )}
        </div>

        {/* Next Best Action */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-200">
                Próxima Acción Clave (Next Action)
              </h4>
            </div>
            {calc.effectiveNextActionDate && (
              <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-cyan-400">
                {calc.effectiveNextActionDate}
              </span>
            )}
          </div>

          <p className="text-xs font-medium text-slate-800 dark:text-neutral-200 leading-relaxed pt-1">
            {calc.effectiveNextAction || 'No hay una acción clave registrada para el proyecto.'}
          </p>
        </div>
      </div>

      {/* BLOCK 4: Resumen Ejecutivo de Etapas y Ponderación */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-200">
              Resumen Sintético de Etapas
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
            {calc.sections.length} etapas registradas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-100 dark:border-neutral-800 text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Etapa</th>
                <th className="py-2.5 px-3 text-center">Peso</th>
                <th className="py-2.5 px-3 text-center">Avance</th>
                <th className="py-2.5 px-3 text-center">Tareas</th>
                <th className="py-2.5 px-3 text-right">Contribución</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800/80">
              {calc.sections.map((sec, i) => (
                <tr key={sec.sectionId} className="hover:bg-slate-50/60 dark:hover:bg-neutral-800/40">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-neutral-800 text-[10px] flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <span>{sec.name}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700 dark:text-neutral-300">
                    {sec.weight}%
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                      sec.calculatedProgress >= 100
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : sec.calculatedProgress > 0
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-cyan-300'
                        : 'bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-neutral-400'
                    }`}>
                      {sec.calculatedProgress}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-neutral-400">
                    {sec.completedActivitiesCount} / {sec.activitiesCount}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    +{sec.contributionToProject}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BLOCK 5: Minutas y Acuerdos Estratégicos Recientes */}
      {projectNotes.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-200">
              Últimos Acuerdos y Decisiones Estratégicas
            </h3>
          </div>

          <div className="space-y-2">
            {projectNotes.slice(0, 3).map((n) => (
              <div
                key={n.id}
                className="p-3 bg-slate-50 dark:bg-neutral-800/50 rounded-xl border border-slate-100 dark:border-neutral-800 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-neutral-100">
                    {n.title}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-neutral-400">
                    {n.date} · {n.type}
                  </span>
                </div>
                {n.body && (
                  <p className="text-slate-600 dark:text-neutral-300 line-clamp-2">
                    {htmlToPlainText(n.body)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
