import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Download,
  Copy,
  Check,
  X,
  Rocket,
  FlaskConical,
  AlertTriangle,
  Clock,
  Target,
  Layers,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Building2,
  Tag,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { store } from '../../services/store';
import { Project, Task, CatalogItem } from '../../types';
import { calculateProjectProgress } from '../../services/businessRules';

interface DashboardExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilter?: 'all' | 'productive' | 'poc';
}

export const DashboardExecutiveReportModal: React.FC<DashboardExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  initialFilter = 'all',
}) => {
  const [filterType, setFilterType] = useState<'all' | 'productive' | 'poc'>(initialFilter);
  const [copied, setCopied] = useState(false);

  const state = store.getState();
  const projects = store.getProjects();
  const allTasks = store.getAllTasks();

  const brands = Object.values(state.records).filter(
    (r): r is CatalogItem => r.kind === 'brand' && !r.deletedAt
  );
  const clients = Object.values(state.records).filter(
    (r): r is CatalogItem => r.kind === 'client' && !r.deletedAt
  );
  const worktypes = Object.values(state.records).filter(
    (r): r is CatalogItem => r.kind === 'worktype' && !r.deletedAt
  );

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

  const todayStr = new Date().toISOString().split('T')[0];
  const in7DaysDate = new Date();
  in7DaysDate.setDate(in7DaysDate.getDate() + 7);
  const in7Days = in7DaysDate.toISOString().split('T')[0];

  // Calculate project progress
  const projectsWithProgress = useMemo(() => {
    return projects.map((p) => {
      const pTasks = store.getProjectTasks(p.id);
      const calc = calculateProjectProgress(p, pTasks);
      const isProjectPoc = isPoc(p);
      return {
        project: p,
        tasks: pTasks,
        calc,
        isPoc: isProjectPoc,
      };
    });
  }, [projects, worktypes]);

  // Filtered by selected type
  const displayedProjects = useMemo(() => {
    return projectsWithProgress.filter((item) => {
      if (filterType === 'productive') return !item.isPoc;
      if (filterType === 'poc') return item.isPoc;
      return true;
    });
  }, [projectsWithProgress, filterType]);

  const productiveList = displayedProjects.filter((i) => !i.isPoc);
  const pocList = displayedProjects.filter((i) => i.isPoc);

  const avgProductive = useMemo(() => {
    if (!productiveList.length) return 0;
    return Math.round(
      productiveList.reduce((acc, curr) => acc + curr.calc.progress, 0) / productiveList.length
    );
  }, [productiveList]);

  const avgPoc = useMemo(() => {
    if (!pocList.length) return 0;
    return Math.round(
      pocList.reduce((acc, curr) => acc + curr.calc.progress, 0) / pocList.length
    );
  }, [pocList]);

  const totalCriteria = useMemo(() => {
    let total = 0;
    let done = 0;
    pocList.forEach(({ project }) => {
      (project.criteria || []).forEach((c) => {
        total++;
        if (c.done) done++;
      });
    });
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [pocList]);

  const overdueTasksCount = allTasks.filter(
    (t: Task) => t.status !== 'Completado' && t.due && t.due < todayStr
  ).length;

  const due7DaysCount = allTasks.filter(
    (t: Task) => t.status !== 'Completado' && t.due && t.due >= todayStr && t.due <= in7Days
  ).length;

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Export CSV function (BOM for Excel support in Spanish)
  const handleExportCSV = () => {
    const headers = [
      'Tipo de Proyecto',
      'Nombre del Proyecto',
      'Cliente',
      'Marca',
      'Estado',
      'Avance (%)',
      'Fecha Inicio',
      'Fecha Meta',
      'Siguiente Accion',
      'Bloqueo / Riesgo',
      'Tareas Totales',
      'Tareas Completadas',
    ];

    const rows = displayedProjects.map(({ project, calc, tasks, isPoc: isP }) => {
      const client = clients.find((c) => c.id === project.clientId)?.name || 'Sin asignar';
      const brand = brands.find((b) => b.id === project.brandId)?.name || 'Sin marca';
      const completed = tasks.filter((t) => t.status === 'Completado').length;

      return [
        isP ? 'PoC / PLC' : 'Productivo',
        `"${project.name.replace(/"/g, '""')}"`,
        `"${client.replace(/"/g, '""')}"`,
        `"${brand.replace(/"/g, '""')}"`,
        project.status,
        calc.progress,
        project.start || '',
        project.target || '',
        `"${(calc.effectiveNextAction || '').replace(/"/g, '""')}"`,
        `"${(project.blocker || '').replace(/"/g, '""')}"`,
        tasks.length,
        completed,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Ejecutivo_Cartera_CCI_${todayStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy Executive Markdown Briefing
  const handleCopyMarkdown = () => {
    let md = `# INFORME EJECUTIVO GERENCIAL - CENTRO DE CONTROL DE INGENIERÍA\n`;
    md += `**Fecha de Emisión:** ${new Date().toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}\n`;
    md += `**Cartera Evaluada:** ${
      filterType === 'all'
        ? 'Consolidada (Productivos + PoCs/PLCs)'
        : filterType === 'productive'
        ? 'Solo Proyectos Productivos'
        : 'Solo PoCs y PLCs'
    }\n\n`;

    md += `## 1. RESUMEN DE ALTO NIVEL (KPIs)\n`;
    md += `- **Total de Proyectos:** ${displayedProjects.length}\n`;
    md += `- **Proyectos Productivos:** ${productiveList.length} (Avance promedio: ${avgProductive}%)\n`;
    md += `- **PoCs / PLCs (Pruebas de Concepto):** ${pocList.length} (Avance técnico promedio: ${avgPoc}%)\n`;
    if (pocList.length > 0) {
      md += `- **Validación de Criterios PoC:** ${totalCriteria.done} de ${totalCriteria.total} criterios aprobados (${totalCriteria.pct}%)\n`;
    }
    md += `- **Tareas Vencidas Críticas:** ${overdueTasksCount}\n`;
    md += `- **Entregables Próximos (7 días):** ${due7DaysCount}\n\n`;

    md += `## 2. DETALLE DE PROYECTOS PRODUCTIVOS\n`;
    if (productiveList.length === 0) {
      md += `*No hay proyectos productivos en este segmento.*\n\n`;
    } else {
      productiveList.forEach(({ project, calc, tasks }) => {
        const client = clients.find((c) => c.id === project.clientId)?.name || 'Sin cliente';
        const brand = brands.find((b) => b.id === project.brandId)?.name || 'N/A';
        md += `### 🚀 ${project.name} (${client} · ${brand})\n`;
        md += `- **Estado:** ${project.status} | **Avance:** ${calc.progress}%\n`;
        md += `- **Meta:** ${project.target || 'Por definir'} | **Siguiente Acción:** ${
          calc.effectiveNextAction || 'No programada'
        }\n`;
        if (project.blocker) {
          md += `- ⚠️ **Bloqueo / Riesgo:** ${project.blocker}\n`;
        }
        md += `- **Tareas:** ${tasks.filter((t) => t.status === 'Completado').length}/${tasks.length} completadas\n\n`;
      });
    }

    md += `## 3. DETALLE DE PoCs Y PLCs (VALIDACIÓN TÉCNICA)\n`;
    if (pocList.length === 0) {
      md += `*No hay PoCs/PLCs en este segmento.*\n\n`;
    } else {
      pocList.forEach(({ project, calc }) => {
        const client = clients.find((c) => c.id === project.clientId)?.name || 'Sin cliente';
        const brand = brands.find((b) => b.id === project.brandId)?.name || 'N/A';
        const cTotal = (project.criteria || []).length;
        const cDone = (project.criteria || []).filter((c) => c.done).length;
        md += `### 🧪 ${project.name} (${client} · ${brand})\n`;
        md += `- **Estado:** ${project.status} | **Avance:** ${calc.progress}%\n`;
        md += `- **Criterios de Éxito:** ${cDone}/${cTotal} aprobados\n`;
        (project.criteria || []).forEach((c) => {
          md += `  - [${c.done ? 'x' : ' '}] ${c.text}\n`;
        });
        md += `- **Siguiente Acción:** ${calc.effectiveNextAction || 'Evaluación en curso'}\n\n`;
      });
    }

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      {/* Container - Printable styles */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Control Bar (Hidden when printing) */}
        <div className="no-print p-4 sm:px-6 border-b border-slate-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 dark:bg-neutral-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Reporte Ejecutivo de Cartera
              </h2>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Resumen gerencial de implementaciones productivas y pruebas de concepto (PoCs)
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter buttons */}
            <div className="flex items-center bg-slate-200/80 dark:bg-neutral-800 rounded-lg p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterType === 'all'
                    ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todos ({projectsWithProgress.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('productive')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  filterType === 'productive'
                    ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Rocket className="w-3 h-3" />
                <span>Productivos</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('poc')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  filterType === 'poc'
                    ? 'bg-purple-600 text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FlaskConical className="w-3 h-3" />
                <span>PoCs / PLCs</span>
              </button>
            </div>

            {/* Print button */}
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              title="Imprimir o guardar como PDF"
            >
              <Printer className="w-4 h-4 text-slate-600 dark:text-neutral-300" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>

            {/* CSV export */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              title="Descargar datos en formato CSV para Excel"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            {/* Copy markdown summary */}
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-cyan-300 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              title="Copiar resumen en formato texto para enviar por correo o chat"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors ml-1 cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & Scrollable Report Content Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 print:p-0 print:space-y-4 text-slate-800 dark:text-neutral-100">
          {/* Executive Header Banner */}
          <div className="border-b-2 border-slate-900 dark:border-neutral-700 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold tracking-wider uppercase text-blue-600 dark:text-cyan-400">
                  Centro de Control de Ingeniería
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5">
                  Informe Ejecutivo de Cartera & Proyectos
                </h1>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                  Dirección de Operaciones e Implementaciones de Seguridad y Ciberseguridad
                </p>
              </div>

              <div className="text-left sm:text-right space-y-0.5 text-xs text-slate-600 dark:text-neutral-400 font-mono">
                <div>
                  <span className="font-semibold text-slate-700 dark:text-neutral-300">Fecha:</span>{' '}
                  {new Date().toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </div>
                <div>
                  <span className="font-semibold text-slate-700 dark:text-neutral-300">Hora:</span>{' '}
                  {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-emerald-600 dark:text-emerald-400 font-bold">● Cartera Sincronizada</div>
              </div>
            </div>
          </div>

          {/* KPI Executive Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700/80">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block">
                Total Proyectos
              </span>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1 font-mono">
                {displayedProjects.length}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                {productiveList.length} Prod · {pocList.length} PoCs
              </p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60">
              <span className="text-[11px] font-semibold text-blue-700 dark:text-cyan-300 uppercase tracking-wide flex items-center gap-1">
                <Rocket className="w-3.5 h-3.5" />
                <span>Avance Productivo</span>
              </span>
              <div className="text-3xl font-extrabold text-blue-600 dark:text-cyan-400 mt-1 font-mono">
                {avgProductive}%
              </div>
              <p className="text-[11px] text-blue-700/80 dark:text-cyan-300/80 mt-1">
                {productiveList.filter((p) => p.project.status === 'En ejecución').length} activos en cliente
              </p>
            </div>

            <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60">
              <span className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide flex items-center gap-1">
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Validación PoC / PLC</span>
              </span>
              <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mt-1 font-mono">
                {pocList.length > 0 ? `${totalCriteria.pct}%` : 'N/A'}
              </div>
              <p className="text-[11px] text-purple-700/80 dark:text-purple-300/80 mt-1">
                {totalCriteria.done}/{totalCriteria.total} criterios aprobados
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700/80">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wide block">
                Atención Inmediata
              </span>
              <div className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 mt-1 font-mono">
                {overdueTasksCount}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                {due7DaysCount} por vencer en 7 días
              </p>
            </div>
          </div>

          {/* Section: COMPARATIVA EJECUTIVA DE PROYECTOS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-neutral-800">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span>Matriz de Control y Seguimiento de Cartera</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-neutral-400 font-medium">
                {displayedProjects.length} proyectos evaluados
              </span>
            </div>

            {/* Table */}
            <div className="border border-slate-200 dark:border-neutral-800 rounded-xl overflow-x-auto shadow-2xs">
              <table className="w-full min-w-[760px] text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-neutral-800/80 border-b border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-300 font-semibold">
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Proyecto & Cliente</th>
                    <th className="py-2.5 px-3">Marca</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3">Avance</th>
                    <th className="py-2.5 px-3">Meta</th>
                    <th className="py-2.5 px-3">Siguiente Acción Clave</th>
                    <th className="py-2.5 px-3">Riesgo / Bloqueo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-neutral-800">
                  {displayedProjects.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        No hay proyectos en el filtro seleccionado.
                      </td>
                    </tr>
                  ) : (
                    displayedProjects.map(({ project, calc, tasks, isPoc: isP }) => {
                      const client = clients.find((c) => c.id === project.clientId);
                      const brand = brands.find((b) => b.id === project.brandId);
                      return (
                        <tr
                          key={project.id}
                          className="hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors"
                        >
                          {/* Tipo */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {isP ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                <FlaskConical className="w-3 h-3 text-purple-600" />
                                <span>PoC / PLC</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
                                <Rocket className="w-3 h-3 text-blue-600" />
                                <span>Productivo</span>
                              </span>
                            )}
                          </td>

                          {/* Nombre & Cliente */}
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 dark:text-white">{project.name}</div>
                            <div className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">
                              {client?.name || 'Cliente no asignado'}
                            </div>
                          </td>

                          {/* Marca */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {brand ? (
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-semibold border"
                                style={{
                                  color: brand.color || '#3b82f6',
                                  borderColor: `${brand.color || '#3b82f6'}50`,
                                }}
                              >
                                {brand.name}
                              </span>
                            ) : (
                              <span className="text-slate-400">N/A</span>
                            )}
                          </td>

                          {/* Estado */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                project.status === 'Completado'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                  : project.status === 'En ejecución'
                                  ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                                  : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
                              }`}
                            >
                              {project.status}
                            </span>
                          </td>

                          {/* Avance */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {calc.progress}%
                              </span>
                              <div className="w-14 h-1.5 bg-slate-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    isP ? 'bg-purple-600' : 'bg-blue-600'
                                  }`}
                                  style={{ width: `${calc.progress}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Meta */}
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600 dark:text-neutral-300">
                            {project.target || 'N/D'}
                          </td>

                          {/* Siguiente Acción */}
                          <td className="py-2.5 px-3 text-slate-700 dark:text-neutral-300 max-w-xs truncate font-medium">
                            {calc.effectiveNextAction || 'Sin siguiente acción'}
                          </td>

                          {/* Bloqueo */}
                          <td className="py-2.5 px-3">
                            {project.blocker ? (
                              <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[140px]">{project.blocker}</span>
                              </span>
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-medium">
                                En curso normal
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: MATRIZ DE CRITERIOS DE ÉXITO DE POCS / PLCS */}
          {pocList.length > 0 && (
            <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300">
                  <FlaskConical className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-bold text-xs sm:text-sm">
                    Matriz de Validación Técnica de PoCs y PLCs (Criterios de Aceptación)
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-300">
                  {totalCriteria.done}/{totalCriteria.total} Criterios Validados ({totalCriteria.pct}%)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pocList.map(({ project }) => {
                  const client = clients.find((c) => c.id === project.clientId);
                  const criteria = project.criteria || [];
                  const cDone = criteria.filter((c) => c.done).length;
                  return (
                    <div
                      key={project.id}
                      className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-purple-100 dark:border-neutral-800 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-slate-900 dark:text-white truncate">
                          🧪 {project.name}
                        </span>
                        <span className="text-purple-600 dark:text-purple-400 font-mono text-[11px] shrink-0">
                          {cDone}/{criteria.length} listos
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-neutral-400">
                        Cliente prospecto: {client?.name || 'No asignado'}
                      </div>
                      <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-neutral-800">
                        {criteria.length === 0 ? (
                          <span className="text-slate-400 italic text-[11px]">
                            Sin criterios definidos aún.
                          </span>
                        ) : (
                          criteria.map((c) => (
                            <div key={c.id} className="flex items-center gap-1.5">
                              {c.done ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-neutral-600 shrink-0" />
                              )}
                              <span
                                className={`truncate text-[11px] ${
                                  c.done
                                    ? 'line-through text-slate-400 dark:text-neutral-500'
                                    : 'text-slate-700 dark:text-neutral-300'
                                }`}
                              >
                                {c.text}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Executive Signatures & Footer (Print Friendly) */}
          <div className="pt-6 border-t border-slate-200 dark:border-neutral-800 text-xs text-slate-500 dark:text-neutral-400 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-700 dark:text-neutral-300">
                Centro de Control de Ingeniería (CCI) · Sistema de Gestión
              </p>
              <p className="text-[11px]">
                Documento generado automáticamente con datos en tiempo real de Firestore y Google Drive.
              </p>
            </div>
            <div className="text-center sm:text-right">
              <div className="border-t border-slate-400 w-48 mx-auto sm:ml-auto pt-1 text-[11px] font-medium text-slate-700 dark:text-neutral-300">
                Firma de Validación / Dirección
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
