import React, { useState, useMemo, useRef } from 'react';
import {
  BarChart3,
  Download,
  PieChart,
  CheckCircle,
  TrendingUp,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Calendar,
  Users,
  Target,
  FileCheck2,
  Printer,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  ExternalLink,
  Layers,
  Search,
  Copy,
  Check,
  FileText,
  Send,
  RefreshCw,
  FolderKanban,
  Flag,
  ArrowUpRight,
} from 'lucide-react';
import { store } from '../services/store';
import { Project, Task, CatalogItem, Note } from '../types';
import { calculateProjectProgress } from '../services/businessRules';

type ExecutiveTab = 'cockpit' | 'deliverables' | 'risks' | 'capacity' | 'report-generator';

export const ReportsView: React.FC = () => {
  const state = store.getState();
  const projects = store.getProjects();
  const allTasks = store.getAllTasks();

  const [activeTab, setActiveTab] = useState<ExecutiveTab>('cockpit');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'productive' | 'poc'>('all');
  const [searchDeliverableQuery, setSearchDeliverableQuery] = useState('');
  const [deliverableStatusFilter, setDeliverableStatusFilter] = useState<string>('all');

  // Report Generator State
  const [reportProjectId, setReportProjectId] = useState<string>(projects[0]?.id || 'all');
  const [reportTemplate, setReportTemplate] = useState<'status' | 'handover' | 'poc-evaluation'>('status');
  const [copiedReportText, setCopiedReportText] = useState(false);
  const printableReportRef = useRef<HTMLDivElement>(null);

  // Catalogs
  const brands = useMemo(
    () => Object.values(state.records).filter((r) => r.kind === 'brand' && !r.deletedAt) as CatalogItem[],
    [state.records]
  );
  const clients = useMemo(
    () => Object.values(state.records).filter((r) => r.kind === 'client' && !r.deletedAt) as CatalogItem[],
    [state.records]
  );
  const projectTypes = useMemo(
    () => Object.values(state.records).filter((r) => r.kind === 'worktype' && !r.deletedAt) as CatalogItem[],
    [state.records]
  );

  const isPoc = (p: Project) => {
    const t = projectTypes.find((pt) => pt.id === p.typeId);
    return (
      p.typeId === 'type-poc' ||
      t?.name?.toLowerCase().includes('poc') ||
      t?.name?.toLowerCase().includes('plc') ||
      p.name?.toLowerCase().includes('poc') ||
      p.name?.toLowerCase().includes('plc')
    );
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (selectedBrandFilter !== 'all' && p.brandId !== selectedBrandFilter) return false;
      if (selectedClientFilter !== 'all' && p.clientId !== selectedClientFilter) return false;
      if (selectedTypeFilter === 'productive' && isPoc(p)) return false;
      if (selectedTypeFilter === 'poc' && !isPoc(p)) return false;
      return true;
    });
  }, [projects, selectedBrandFilter, selectedClientFilter, selectedTypeFilter]);

  // Project progress mapping
  const projectProgressMap = useMemo(() => {
    const map: Record<string, ReturnType<typeof calculateProjectProgress>> = {};
    projects.forEach((p) => {
      const pTasks = store.getProjectTasks(p.id);
      map[p.id] = calculateProjectProgress(p, pTasks);
    });
    return map;
  }, [projects, allTasks]);

  // Overall Portfolio KPIs & Health Classification
  const portfolioKPIs = useMemo(() => {
    const total = filteredProjects.length;
    if (total === 0) {
      return {
        total: 0,
        avgProgress: 0,
        onTrack: 0,
        atRisk: 0,
        critical: 0,
        completed: 0,
        deliverablesTotal: 0,
        deliverablesDone: 0,
        deliverablesRate: 0,
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let sumProgress = 0;
    let onTrack = 0;
    let atRisk = 0;
    let critical = 0;
    let completed = 0;

    filteredProjects.forEach((p) => {
      const calc = projectProgressMap[p.id] || { progress: 0, isStale: false };
      sumProgress += calc.progress;

      if (p.status === 'Completado') {
        completed++;
      } else if (p.blocker || (p.target && p.target < todayStr && calc.progress < 100)) {
        critical++;
      } else if (calc.isStale || p.status === 'En espera') {
        atRisk++;
      } else {
        onTrack++;
      }
    });

    // Deliverables stats (milestones or tasks in filtered projects)
    const filteredProjectIds = new Set(filteredProjects.map((p) => p.id));
    const relevantTasks = allTasks.filter((t) => t.projectId && filteredProjectIds.has(t.projectId));
    const milestoneTasks = relevantTasks.filter((t) => t.milestone || t.weight >= 2);
    const deliverablesTotal = milestoneTasks.length;
    const deliverablesDone = milestoneTasks.filter((t) => t.status === 'Completado').length;
    const deliverablesRate = deliverablesTotal > 0 ? Math.round((deliverablesDone / deliverablesTotal) * 100) : 0;

    return {
      total,
      avgProgress: Math.round((sumProgress / total) * 10) / 10,
      onTrack,
      atRisk,
      critical,
      completed,
      deliverablesTotal,
      deliverablesDone,
      deliverablesRate,
    };
  }, [filteredProjects, projectProgressMap, allTasks]);

  // Stage distribution across the 9 Engineering Lifecycle Stages
  const stagesDistribution = useMemo(() => {
    const stageDefinitions = [
      { id: '1', name: 'Diagnóstico & Requerimientos', short: 'Diagnóstico', color: '#6366f1' },
      { id: '2', name: 'Arquitectura & Diseño', short: 'Arquitectura', color: '#0ea5e9' },
      { id: '3', name: 'Plan de Trabajo', short: 'Plan', color: '#06b6d4' },
      { id: '4', name: 'Ejecución & Desarrollo', short: 'Ejecución', color: '#3b82f6' },
      { id: '5', name: 'PoC & Pruebas en Laboratorio', short: 'PoC / Lab', color: '#8b5cf6' },
      { id: '6', name: 'Validación & Criterios', short: 'Validación', color: '#a855f7' },
      { id: '7', name: 'Documentación Técnica', short: 'Documentación', color: '#ec4899' },
      { id: '8', name: 'Capacitación & Entrega', short: 'Capacitación', color: '#f59e0b' },
      { id: '9', name: 'Cierre Formal & Soporte', short: 'Cierre', color: '#10b981' },
    ];

    return stageDefinitions.map((def, idx) => {
      // Find projects currently in or around this stage progress (approx 11% slices)
      const count = filteredProjects.filter((p) => {
        const prog = projectProgressMap[p.id]?.progress || 0;
        if (p.status === 'Completado' && idx === 8) return true;
        if (p.status === 'Completado') return false;
        const low = idx * 11;
        const high = idx === 8 ? 101 : (idx + 1) * 11;
        return prog >= low && prog < high;
      }).length;

      return {
        ...def,
        count,
        percentage: filteredProjects.length > 0 ? Math.round((count / filteredProjects.length) * 100) : 0,
      };
    });
  }, [filteredProjects, projectProgressMap]);

  // Brand / Technology breakdown
  const brandStats = useMemo(() => {
    const stats: Record<
      string,
      { count: number; name: string; color: string; avgProg: number; pocCount: number }
    > = {};

    filteredProjects.forEach((p) => {
      const bId = p.brandId || 'general';
      const b = brands.find((br) => br.id === bId);
      if (!stats[bId]) {
        stats[bId] = {
          count: 0,
          name: b?.name || 'General / Multimarca',
          color: b?.color || '#3b82f6',
          avgProg: 0,
          pocCount: 0,
        };
      }
      const calc = projectProgressMap[p.id] || { progress: 0 };
      stats[bId].count++;
      stats[bId].avgProg += calc.progress;
      if (isPoc(p)) stats[bId].pocCount++;
    });

    Object.keys(stats).forEach((k) => {
      if (stats[k].count > 0) {
        stats[k].avgProg = Math.round((stats[k].avgProg / stats[k].count) * 10) / 10;
      }
    });

    return Object.values(stats).sort((a, b) => b.count - a.count);
  }, [filteredProjects, brands, projectProgressMap]);

  // Consolidated Deliverables & Milestones List
  const allDeliverables = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const items: Array<{
      id: string;
      title: string;
      projectId: string;
      projectName: string;
      clientName: string;
      brandName: string;
      brandColor: string;
      owner: string;
      due?: string;
      status: string;
      progress: number;
      isMilestone: boolean;
      daysDiff: number | null;
      approvalStatus: 'Borrador' | 'En Revisión' | 'Aprobado' | 'Entregado';
      hasGuide: boolean;
      guideRef?: string;
      originalTask: Task;
    }> = [];

    const projectLookup = new Map(projects.map((p) => [p.id, p]));

    allTasks.forEach((task) => {
      if (!task.projectId) return;
      const project = projectLookup.get(task.projectId);
      if (!project) return;

      // Filter by selected brand/client/type
      if (selectedBrandFilter !== 'all' && project.brandId !== selectedBrandFilter) return false;
      if (selectedClientFilter !== 'all' && project.clientId !== selectedClientFilter) return false;
      if (selectedTypeFilter === 'productive' && isPoc(project)) return false;
      if (selectedTypeFilter === 'poc' && !isPoc(project)) return false;

      // Check if it's a deliverable (milestone, heavy task, or explicit deliverable)
      const isCandidate = task.milestone || task.weight >= 2 || (task.checklist && task.checklist.length > 0);
      if (!isCandidate) return;

      const client = clients.find((c) => c.id === project.clientId);
      const brand = brands.find((b) => b.id === project.brandId);

      let daysDiff: number | null = null;
      if (task.due) {
        const d1 = new Date(task.due);
        const d2 = new Date(today);
        daysDiff = Math.round((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));
      }

      // Read approval status from task notes or derive from status
      let approval: 'Borrador' | 'En Revisión' | 'Aprobado' | 'Entregado' = 'Borrador';
      if (task.notes?.includes('[V°B° APROBADO]')) approval = 'Aprobado';
      else if (task.notes?.includes('[ENTREGADO]')) approval = 'Entregado';
      else if (task.status === 'Completado') approval = 'Entregado';
      else if (task.status === 'En validación') approval = 'En Revisión';
      else if (task.status === 'En curso') approval = 'En Revisión';

      items.push({
        id: task.id,
        title: task.title,
        projectId: project.id,
        projectName: project.name,
        clientName: client?.name || 'Cliente General',
        brandName: brand?.name || 'General',
        brandColor: brand?.color || '#3b82f6',
        owner: task.owner || 'Ingeniero Asignado',
        due: task.due,
        status: task.status,
        progress: task.progress || 0,
        isMilestone: !!task.milestone,
        daysDiff,
        approvalStatus: approval,
        hasGuide: !!(task.guideRef || task.stepRef),
        guideRef: task.guideRef,
        originalTask: task,
      });
    });

    // Apply text search & status filter
    return items.filter((d) => {
      if (deliverableStatusFilter !== 'all' && d.approvalStatus !== deliverableStatusFilter) return false;
      if (searchDeliverableQuery.trim()) {
        const q = searchDeliverableQuery.toLowerCase();
        return (
          d.title.toLowerCase().includes(q) ||
          d.projectName.toLowerCase().includes(q) ||
          d.clientName.toLowerCase().includes(q) ||
          d.owner.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allTasks, projects, clients, brands, selectedBrandFilter, selectedClientFilter, selectedTypeFilter, searchDeliverableQuery, deliverableStatusFilter]);

  // Risk & Blocker Register (Projects with blockers or overdue tasks)
  const riskRegister = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const risks: Array<{
      projectId: string;
      projectName: string;
      clientName: string;
      brandName: string;
      severity: 'Crítico' | 'Alto' | 'Medio';
      reason: string;
      owner: string;
      targetDate?: string;
      mitigation: string;
      daysDelayed?: number;
    }> = [];

    filteredProjects.forEach((p) => {
      const client = clients.find((c) => c.id === p.clientId);
      const brand = brands.find((b) => b.id === p.brandId);
      const calc = projectProgressMap[p.id];

      // Blocker 1: Project explicit blocker
      if (p.blocker) {
        risks.push({
          projectId: p.id,
          projectName: p.name,
          clientName: client?.name || 'Cliente',
          brandName: brand?.name || 'Marca',
          severity: 'Crítico',
          reason: p.blocker,
          owner: p.blockerOwner || 'Sin responsable',
          targetDate: p.target,
          mitigation: p.nextAction || 'Requiere sesión de escalamiento y destrabado',
        });
      }

      // Blocker 2: Overdue target date
      if (p.target && p.target < today && p.status !== 'Completado') {
        const d1 = new Date(today);
        const d2 = new Date(p.target);
        const diff = Math.round((d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));
        risks.push({
          projectId: p.id,
          projectName: p.name,
          clientName: client?.name || 'Cliente',
          brandName: brand?.name || 'Marca',
          severity: diff > 14 ? 'Crítico' : 'Alto',
          reason: `Fecha meta vencida hace ${diff} días (Avance: ${calc?.progress || 0}%)`,
          owner: p.contacts?.[0] || 'Líder de Proyecto',
          targetDate: p.target,
          daysDelayed: diff,
          mitigation: p.nextAction || 'Ajustar cronograma o movilizar apoyo de ingeniería',
        });
      }

      // Blocker 3: Stale project (>14 days without activity)
      if (calc?.isStale && p.status === 'En ejecución' && !p.blocker) {
        risks.push({
          projectId: p.id,
          projectName: p.name,
          clientName: client?.name || 'Cliente',
          brandName: brand?.name || 'Marca',
          severity: 'Medio',
          reason: 'Inactividad técnica mayor a 14 días sin actualización de avance',
          owner: 'Equipo Técnico',
          targetDate: p.target,
          mitigation: 'Reactivar seguimiento con minutas o revisión de laboratorio',
        });
      }
    });

    return risks;
  }, [filteredProjects, clients, brands, projectProgressMap]);

  // Team Workload & Capacity
  const teamCapacity = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const map: Record<
      string,
      {
        owner: string;
        totalTasks: number;
        activeTasks: number;
        completedTasks: number;
        overdueTasks: number;
        projectsCount: Set<string>;
      }
    > = {};

    allTasks.forEach((t) => {
      const owner = t.owner?.trim() || 'Sin asignar';
      if (!map[owner]) {
        map[owner] = {
          owner,
          totalTasks: 0,
          activeTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          projectsCount: new Set<string>(),
        };
      }
      map[owner].totalTasks++;
      if (t.status === 'Completado') {
        map[owner].completedTasks++;
      } else {
        map[owner].activeTasks++;
        if (t.due && t.due < today) {
          map[owner].overdueTasks++;
        }
      }
      if (t.projectId) {
        map[owner].projectsCount.add(t.projectId);
      }
    });

    return Object.values(map)
      .map((m) => ({
        ...m,
        projectsCount: m.projectsCount.size,
        loadIndex: m.activeTasks + m.overdueTasks * 2,
        status:
          m.activeTasks > 8 || m.overdueTasks > 2
            ? ('Sobrecargado' as const)
            : m.activeTasks >= 4
            ? ('Óptimo' as const)
            : ('Disponible' as const),
      }))
      .sort((a, b) => b.loadIndex - a.loadIndex);
  }, [allTasks]);

  // Handler to toggle / advance deliverable approval status
  const handleToggleDeliverableApproval = (d: typeof allDeliverables[0]) => {
    const cycle: Record<string, 'Borrador' | 'En Revisión' | 'Aprobado' | 'Entregado'> = {
      Borrador: 'En Revisión',
      'En Revisión': 'Aprobado',
      Aprobado: 'Entregado',
      Entregado: 'Borrador',
    };
    const next = cycle[d.approvalStatus] || 'Borrador';
    const tag = next === 'Aprobado' ? '[V°B° APROBADO]' : next === 'Entregado' ? '[ENTREGADO]' : '';
    const cleanNotes = (d.originalTask.notes || '')
      .replace(/\[V°B° APROBADO\]/g, '')
      .replace(/\[ENTREGADO\]/g, '')
      .trim();

    store.putRecord({
      ...d.originalTask,
      notes: `${cleanNotes} ${tag}`.trim(),
      updatedAt: new Date().toISOString(),
    });
  };

  // Selected Project for Report Generator
  const reportSelectedProject = useMemo(() => {
    if (reportProjectId === 'all') return null;
    return projects.find((p) => p.id === reportProjectId) || null;
  }, [reportProjectId, projects]);

  const reportSelectedTasks = useMemo(() => {
    if (!reportSelectedProject) return [];
    return store.getProjectTasks(reportSelectedProject.id);
  }, [reportSelectedProject]);

  const reportSelectedCalc = useMemo(() => {
    if (!reportSelectedProject) return null;
    return projectProgressMap[reportSelectedProject.id] || calculateProjectProgress(reportSelectedProject, reportSelectedTasks);
  }, [reportSelectedProject, reportSelectedTasks, projectProgressMap]);

  // Export Deliverables CSV
  const handleExportDeliverablesCSV = () => {
    let csv = '\uFEFFProyecto;Cliente;Marca;Entregable / Hito;Responsable;Fecha Meta;Avance %;Estado Técnico;Visto Bueno\n';
    allDeliverables.forEach((d) => {
      csv += `"${d.projectName}";"${d.clientName}";"${d.brandName}";"${d.title}";"${d.owner}";"${d.due || 'S/F'}";${d.progress}%;"${d.status}";"${d.approvalStatus}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Matriz_Entregables_CCI_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Executive Portfolio CSV
  const handleExportPortfolioCSV = () => {
    let csv = '\uFEFFProyecto;Tipo;Cliente;Marca;Estado;Salud;Inicio;Meta;Avance %;Actividades Listas;Total Actividades;Próxima Acción;Bloqueo\n';
    filteredProjects.forEach((p) => {
      const client = clients.find((c) => c.id === p.clientId)?.name || '';
      const brand = brands.find((b) => b.id === p.brandId)?.name || '';
      const calc = projectProgressMap[p.id];
      const today = new Date().toISOString().split('T')[0];
      const salud = p.status === 'Completado' ? 'Completado' : p.blocker ? 'Crítico' : p.target && p.target < today ? 'Atrasado' : 'A Tiempo';

      csv += `"${p.name}";"${isPoc(p) ? 'PoC/PLC' : 'Productivo'}";"${client}";"${brand}";"${p.status}";"${salud}";"${p.start || ''}";"${p.target || ''}";${calc?.progress || 0}%;${calc?.completedActivitiesCount || 0};${calc?.totalActivitiesCount || 0};"${calc?.effectiveNextAction || ''}";"${p.blocker || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tablero_Ejecutivo_Cartera_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy Executive Report Markdown to Clipboard
  const handleCopyReportMarkdown = () => {
    if (!reportSelectedProject || !reportSelectedCalc) return;
    const client = clients.find((c) => c.id === reportSelectedProject.clientId)?.name || 'General';
    const brand = brands.find((b) => b.id === reportSelectedProject.brandId)?.name || 'General';
    const today = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

    let md = `# INFORME EJECUTIVO DE AVANCE Y ENTREGABLES\n`;
    md += `**Proyecto:** ${reportSelectedProject.name}\n`;
    md += `**Cliente:** ${client} | **Marca:** ${brand}\n`;
    md += `**Fecha de Emisión:** ${today}\n`;
    md += `**Estado:** ${reportSelectedProject.status} | **Avance Técnico:** ${reportSelectedCalc.progress}%\n\n`;
    md += `## 1. Resumen Ejecutivo & Objetivo\n${reportSelectedProject.objective || 'Sin objetivo registrado.'}\n\n`;
    md += `## 2. Métricas Clave\n`;
    md += `- Actividades Totales: ${reportSelectedCalc.totalActivitiesCount}\n`;
    md += `- Actividades Completadas: ${reportSelectedCalc.completedActivitiesCount}\n`;
    md += `- Próxima Acción Clave: ${reportSelectedCalc.effectiveNextAction}\n\n`;
    md += `## 3. Matriz de Entregables Principales\n`;
    reportSelectedTasks
      .filter((t) => t.milestone || t.weight >= 2)
      .forEach((t) => {
        md += `- [${t.status === 'Completado' ? 'X' : ' '}] **${t.title}** (Meta: ${t.due || 'S/F'}, Resp: ${t.owner || 'Ingeniería'}, Avance: ${t.progress}%)\n`;
      });
    md += `\n---\n*Centro de Control de Ingeniería (CCI) - Gestión de Cartera*`;

    navigator.clipboard.writeText(md);
    setCopiedReportText(true);
    setTimeout(() => setCopiedReportText(false), 2500);
  };

  // Print Report Handler
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Executive Navigation Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Tablero Ejecutivo & Centro de Entregables
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Supervisión integral de cartera, matriz de entregables con visto bueno, control de riesgos y generador de actas ejecutivas.
          </p>
        </div>

        {/* Global Export Actions */}
        <div className="flex items-center gap-2 flex-wrap no-print">
          <button
            type="button"
            onClick={handleExportPortfolioCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Exportar resumen consolidado de cartera a CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Cartera CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportDeliverablesCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700 rounded-lg transition-colors shadow-2xs cursor-pointer"
            title="Exportar matriz completa de entregables a CSV"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Entregables CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('report-generator');
              setTimeout(() => {
                window.scrollTo({ top: 600, behavior: 'smooth' });
              }, 100);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generar Acta / Reporte</span>
          </button>
        </div>
      </div>

      {/* Segmented Tab Navigation Bar (Anti-Slop Clean Segmented Design) */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl overflow-x-auto text-xs font-semibold no-print">
        <button
          type="button"
          onClick={() => setActiveTab('cockpit')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'cockpit'
              ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-cyan-400 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Tablero de Control Ejecutivo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deliverables')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'deliverables'
              ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-cyan-400 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Matriz de Entregables e Hitos ({allDeliverables.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('risks')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'risks'
              ? 'bg-white dark:bg-neutral-800 text-rose-600 dark:text-rose-400 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Riesgos & Bloqueos ({riskRegister.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('capacity')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'capacity'
              ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-cyan-400 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Capacidad & Equipo ({teamCapacity.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('report-generator')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'report-generator'
              ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-cyan-400 shadow-2xs font-bold'
              : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Printer className="w-4 h-4" />
          <span>Generador de Informes & Actas</span>
        </button>
      </div>

      {/* Global Interactive Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-xs shadow-2xs no-print">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400 font-medium">
          <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
          <span>Filtrar Cartera:</span>
        </div>

        {/* Brand Filter */}
        <select
          value={selectedBrandFilter}
          onChange={(e) => setSelectedBrandFilter(e.target.value)}
          className="bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:border-blue-500 font-medium cursor-pointer"
        >
          <option value="all">Todas las Marcas / Tecnologías</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Client Filter */}
        <select
          value={selectedClientFilter}
          onChange={(e) => setSelectedClientFilter(e.target.value)}
          className="bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:border-blue-500 font-medium cursor-pointer"
        >
          <option value="all">Todos los Clientes</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <div className="flex items-center bg-slate-100 dark:bg-neutral-800 rounded-lg p-0.5 border border-slate-200 dark:border-neutral-700 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setSelectedTypeFilter('all')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              selectedTypeFilter === 'all'
                ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-cyan-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-neutral-400'
            }`}
          >
            Todos ({projects.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedTypeFilter('productive')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              selectedTypeFilter === 'productive'
                ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-cyan-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-neutral-400'
            }`}
          >
            Productivos
          </button>
          <button
            type="button"
            onClick={() => setSelectedTypeFilter('poc')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              selectedTypeFilter === 'poc'
                ? 'bg-white dark:bg-neutral-900 text-purple-600 dark:text-purple-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-neutral-400'
            }`}
          >
            PoC / PLC
          </button>
        </div>

        {/* Clear Filters Reset */}
        {(selectedBrandFilter !== 'all' || selectedClientFilter !== 'all' || selectedTypeFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSelectedBrandFilter('all');
              setSelectedClientFilter('all');
              setSelectedTypeFilter('all');
            }}
            className="text-[11px] text-blue-600 dark:text-cyan-400 hover:underline font-semibold ml-auto"
          >
            Restablecer filtros
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: COCKPIT / TABLERO EJECUTIVO                                      */}
      {/* ========================================================================= */}
      {activeTab === 'cockpit' && (
        <div className="space-y-6">
          {/* Executive Health Cards + SVG Radial Gauge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Global Portfolio Progress Ring Gauge */}
            <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 flex items-center gap-4 shadow-2xs">
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 dark:text-neutral-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-600 dark:text-cyan-400 transition-all duration-700 ease-out"
                    strokeDasharray={`${portfolioKPIs.avgProgress}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-bold font-mono text-slate-900 dark:text-white leading-none">
                    {portfolioKPIs.avgProgress}%
                  </span>
                </div>
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 block font-medium">Avance Cartera</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate block">
                  {portfolioKPIs.total} Proyectos
                </span>
                <span className="text-[10px] text-blue-600 dark:text-cyan-400 font-mono">Ponderado global</span>
              </div>
            </div>

            {/* Health: On Track */}
            <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">A Tiempo / En Orden</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {portfolioKPIs.onTrack}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                    ({portfolioKPIs.total > 0 ? Math.round((portfolioKPIs.onTrack / portfolioKPIs.total) * 100) : 0}%)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-neutral-500 block">Sin demoras ni bloqueos</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Health: At Risk */}
            <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">En Riesgo / En Espera</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
                    {portfolioKPIs.atRisk}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                    ({portfolioKPIs.total > 0 ? Math.round((portfolioKPIs.atRisk / portfolioKPIs.total) * 100) : 0}%)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-neutral-500 block">Inactividad o en pausa</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Health: Critical */}
            <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">Crítico / Con Bloqueo</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                    {portfolioKPIs.critical}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                    ({portfolioKPIs.total > 0 ? Math.round((portfolioKPIs.critical / portfolioKPIs.total) * 100) : 0}%)
                  </span>
                </div>
                <span className="text-[10px] text-rose-500 dark:text-rose-400 font-semibold block">Requiere atención</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            {/* Deliverable Fulfillment Rate */}
            <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 flex items-center justify-between shadow-2xs">
              <div className="space-y-0.5">
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium">Cumplimiento Entregables</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
                    {portfolioKPIs.deliverablesRate}%
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-neutral-500">
                    ({portfolioKPIs.deliverablesDone}/{portfolioKPIs.deliverablesTotal})
                  </span>
                </div>
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium block">Hitos completados</span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Award className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Lifecycle Stages Velocity & Breakdown */}
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  <span>Distribución de Cartera por Etapa del Ciclo de Vida</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Proyectos activos distribuidos a lo largo del proceso estructurado de 9 fases
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">
                {filteredProjects.length} proyectos analizados
              </span>
            </div>

            {/* 9 Stages Interactive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2">
              {stagesDistribution.map((st) => (
                <div
                  key={st.id}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-neutral-800 bg-slate-50/60 dark:bg-neutral-800/40 flex flex-col justify-between space-y-2 hover:border-slate-300 dark:hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: st.color }}
                    />
                    <span className="text-[10px] font-mono text-slate-400 dark:text-neutral-500">#{st.id}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-neutral-200 truncate" title={st.name}>
                      {st.short}
                    </h4>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                        {st.count}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-neutral-400">({st.percentage}%)</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1 bg-slate-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${st.percentage}%`,
                        backgroundColor: st.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Two-Column Matrix: Brand Performance & Executive Portfolio Roster */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Brand / Technology Matrix */}
            <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  <span>Rendimiento por Marca</span>
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-mono">
                  {brandStats.length} tecnologías
                </span>
              </div>

              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {brandStats.map((b) => (
                  <div
                    key={b.name}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-800 space-y-2 hover:bg-slate-100/60 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-semibold text-xs text-slate-900 dark:text-neutral-100">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                        <span className="truncate">{b.name}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-400 font-medium">
                        {b.count} {b.count === 1 ? 'proyecto' : 'proyectos'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-500 dark:text-neutral-400">Avance promedio</span>
                        <span className="font-bold text-blue-600 dark:text-cyan-400">{b.avgProg}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${b.avgProg}%`, backgroundColor: b.color }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-neutral-400 pt-1 border-t border-slate-200/50 dark:border-neutral-700/50">
                      <span>🧪 {b.pocCount} PoC/PLC activas</span>
                      <span>🚀 {b.count - b.pocCount} Productivos</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Executive Projects Table (Detailed Portfolio Status) */}
            <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                    <span>Control de Cartera Activa</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                    Avance medido, fechas objetivo y próximas acciones inmediatas
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => store.setActiveView('projects')}
                  className="text-xs text-blue-600 dark:text-cyan-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver Todos</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-neutral-800/60 text-slate-600 dark:text-neutral-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-neutral-800">
                    <tr>
                      <th className="py-2.5 px-3">Proyecto / Cliente</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3">Avance</th>
                      <th className="py-2.5 px-3">Meta</th>
                      <th className="py-2.5 px-3">Próxima Acción</th>
                      <th className="py-2.5 px-3 text-right">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                    {filteredProjects.slice(0, 8).map((p) => {
                      const client = clients.find((c) => c.id === p.clientId);
                      const brand = brands.find((b) => b.id === p.brandId);
                      const calc = projectProgressMap[p.id];
                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-neutral-800/40 transition-colors"
                        >
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: brand?.color || '#3b82f6' }}
                              />
                              <span className="truncate max-w-[200px]">{p.name}</span>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-neutral-400 block pl-3.5">
                              {client?.name || 'Cliente'} {isPoc(p) ? '· PoC/PLC' : ''}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                p.status === 'Completado'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                                  : p.blocker
                                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                                  : p.status === 'En ejecución'
                                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400'
                                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
                              }`}
                            >
                              {p.blocker ? 'Con Bloqueo' : p.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 dark:text-neutral-200">{calc?.progress || 0}%</span>
                              <div className="w-12 h-1.5 bg-slate-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 dark:bg-cyan-400 rounded-full"
                                  style={{ width: `${calc?.progress || 0}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-neutral-400">
                            {p.target || 'S/F'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-neutral-300 max-w-[160px] truncate" title={calc?.effectiveNextAction}>
                            {calc?.effectiveNextAction || 'En desarrollo'}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => store.setActiveView('projects', p.id)}
                              className="text-blue-600 dark:text-cyan-400 hover:text-blue-800 font-semibold text-xs cursor-pointer inline-flex items-center gap-0.5"
                            >
                              <span>Abrir</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MATRIZ DE ENTREGABLES E HITOS                                     */}
      {/* ========================================================================= */}
      {activeTab === 'deliverables' && (
        <div className="space-y-5">
          {/* Deliverables Header & Filter Controls */}
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Matriz de Entregables, Hitos Clave y Visto Bueno Técnico</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Seguimiento formal de entregables por proyecto, fecha de compromiso y estado de visto bueno (V°B°).
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Search in Deliverables */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchDeliverableQuery}
                  onChange={(e) => setSearchDeliverableQuery(e.target.value)}
                  placeholder="Buscar entregable, cliente..."
                  className="bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-hidden focus:border-blue-500 w-48 sm:w-56"
                />
              </div>

              {/* Approval status filter */}
              <select
                value={deliverableStatusFilter}
                onChange={(e) => setDeliverableStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-hidden focus:border-blue-500 font-medium cursor-pointer"
              >
                <option value="all">Todos los V°B°</option>
                <option value="Borrador">Borrador</option>
                <option value="En Revisión">En Revisión</option>
                <option value="Aprobado">V°B° Aprobado</option>
                <option value="Entregado">Entregado al Cliente</option>
              </select>

              <button
                type="button"
                onClick={handleExportDeliverablesCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Matriz CSV</span>
              </button>
            </div>
          </div>

          {/* Deliverables Table (OpenProject / Plane Style) */}
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-neutral-800/70 text-slate-600 dark:text-neutral-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-neutral-800">
                  <tr>
                    <th className="py-3 px-4">Entregable / Hito</th>
                    <th className="py-3 px-4">Proyecto / Cliente</th>
                    <th className="py-3 px-4">Responsable</th>
                    <th className="py-3 px-4">Fecha Compromiso</th>
                    <th className="py-3 px-4">Avance Técnico</th>
                    <th className="py-3 px-4">Estado V°B°</th>
                    <th className="py-3 px-4 text-center">Evidencia</th>
                    <th className="py-3 px-4 text-right">Acción V°B°</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                  {allDeliverables.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-neutral-500">
                        No se encontraron entregables con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    allDeliverables.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                        {/* Title */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {d.isMilestone && (
                              <span title="Hito clave de contrato" className="inline-flex">
                                <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              </span>
                            )}
                            <span className="font-bold text-slate-900 dark:text-white leading-snug">{d.title}</span>
                          </div>
                        </td>

                        {/* Project / Client */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.brandColor }} />
                            <span className="truncate max-w-[170px]">{d.projectName}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-neutral-400 block pl-3.5">
                            {d.clientName}
                          </span>
                        </td>

                        {/* Owner */}
                        <td className="py-3 px-4 text-slate-700 dark:text-neutral-300 font-medium">
                          {d.owner}
                        </td>

                        {/* Due Date & Delay status */}
                        <td className="py-3 px-4 font-mono">
                          <div className="space-y-0.5">
                            <span className="text-slate-700 dark:text-neutral-300 block">{d.due || 'Por definir'}</span>
                            {d.daysDiff !== null && (
                              <span
                                className={`text-[10px] font-bold block ${
                                  d.daysDiff < 0
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : d.daysDiff <= 3
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                {d.daysDiff < 0
                                  ? `Atrasado ${Math.abs(d.daysDiff)}d`
                                  : d.daysDiff === 0
                                  ? 'Vence hoy'
                                  : `Faltan ${d.daysDiff}d`}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Progress */}
                        <td className="py-3 px-4 font-mono">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-neutral-200">{d.progress}%</span>
                            <div className="w-14 h-1.5 bg-slate-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-600 dark:bg-emerald-400 rounded-full"
                                style={{ width: `${d.progress}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Approval Status Badge */}
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              d.approvalStatus === 'Entregado'
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                : d.approvalStatus === 'Aprobado'
                                ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-cyan-300 border border-blue-300 dark:border-blue-800'
                                : d.approvalStatus === 'En Revisión'
                                ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700'
                            }`}
                          >
                            {d.approvalStatus === 'Entregado' && <CheckCircle className="w-3 h-3" />}
                            {d.approvalStatus === 'Aprobado' && <Check className="w-3 h-3" />}
                            {d.approvalStatus === 'En Revisión' && <Clock className="w-3 h-3" />}
                            <span>{d.approvalStatus}</span>
                          </span>
                        </td>

                        {/* Evidence attachment indicator */}
                        <td className="py-3 px-4 text-center">
                          {d.hasGuide ? (
                            <button
                              type="button"
                              onClick={() => store.setActiveView('library', null, d.guideRef)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer"
                              title="Abrir guía técnica vinculada como evidencia"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Guía</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-mono">-</span>
                          )}
                        </td>

                        {/* Quick Action Toggle V°B° */}
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleDeliverableApproval(d)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded bg-slate-100 dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-cyan-300 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700 transition-colors cursor-pointer"
                            title="Avanzar estado de Visto Bueno (Borrador → En Revisión → Aprobado → Entregado)"
                          >
                            Cambiar V°B°
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RIESGOS & BLOQUEOS                                                */}
      {/* ========================================================================= */}
      {activeTab === 'risks' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Matriz de Riesgos, Bloqueos y Plan de Mitigación</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Identificación temprana de impedimentos técnicos, demoras de cliente y acciones de contingencia
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
              {riskRegister.length} Riesgos Activos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {riskRegister.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Excelente: Cartera sin Bloqueos Activos</h4>
                <p className="text-xs text-slate-500 dark:text-neutral-400">
                  Ningún proyecto seleccionado presenta bloqueos críticos ni retrasos mayores a 14 días.
                </p>
              </div>
            ) : (
              riskRegister.map((risk, idx) => (
                <div
                  key={`${risk.projectId}-${idx}`}
                  className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 space-y-3 shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          risk.severity === 'Crítico'
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            : risk.severity === 'Alto'
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                            : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-cyan-400 border border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        Nivel {risk.severity}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 dark:text-neutral-500">
                        {risk.targetDate ? `Meta: ${risk.targetDate}` : 'Sin meta'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1" title={risk.projectName}>
                      {risk.projectName}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                      {risk.clientName} · {risk.brandName}
                    </p>

                    <div className="p-2.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-xs text-rose-900 dark:text-rose-200 space-y-1">
                      <span className="font-semibold block text-[11px] text-rose-700 dark:text-rose-400">Causa / Bloqueo:</span>
                      <p className="text-[11px] leading-relaxed">{risk.reason}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700 text-xs space-y-1">
                      <span className="font-semibold block text-[11px] text-slate-700 dark:text-neutral-300">Plan de Mitigación:</span>
                      <p className="text-[11px] text-slate-600 dark:text-neutral-400 leading-relaxed">{risk.mitigation}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-neutral-800 text-[11px]">
                    <span className="text-slate-500 dark:text-neutral-400 truncate max-w-[150px]">
                      👤 {risk.owner}
                    </span>
                    <button
                      type="button"
                      onClick={() => store.setActiveView('projects', risk.projectId)}
                      className="text-blue-600 dark:text-cyan-400 font-semibold hover:underline cursor-pointer"
                    >
                      Resolver en Proyecto →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CAPACIDAD & EQUIPO                                                */}
      {/* ========================================================================= */}
      {activeTab === 'capacity' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span>Carga de Trabajo & Capacidad de Ingeniería</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Distribución de tareas asignadas, carga activa e índice de sobrecarga del equipo
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 dark:text-neutral-400">
              {teamCapacity.length} Miembros con Asignaciones
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamCapacity.map((member) => (
              <div
                key={member.owner}
                className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-cyan-950/60 text-blue-700 dark:text-cyan-300 font-bold text-xs flex items-center justify-center">
                      {member.owner.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{member.owner}</h4>
                      <span className="text-[10px] text-slate-500 dark:text-neutral-400">
                        {member.projectsCount} {member.projectsCount === 1 ? 'proyecto' : 'proyectos'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      member.status === 'Sobrecargado'
                        ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                        : member.status === 'Óptimo'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-cyan-400 border border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    {member.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-neutral-800 text-center font-mono">
                  <div className="p-2 rounded bg-slate-50 dark:bg-neutral-800/60">
                    <span className="text-[10px] text-slate-400 block">Activas</span>
                    <span className="text-sm font-bold text-slate-800 dark:text-neutral-200">{member.activeTasks}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-neutral-800/60">
                    <span className="text-[10px] text-slate-400 block">Listas</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{member.completedTasks}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-neutral-800/60">
                    <span className="text-[10px] text-slate-400 block">Vencidas</span>
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{member.overdueTasks}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-neutral-400">
                    <span>Carga ponderada</span>
                    <span>{Math.min(100, member.loadIndex * 8)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        member.status === 'Sobrecargado'
                          ? 'bg-rose-500'
                          : member.status === 'Óptimo'
                          ? 'bg-emerald-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, member.loadIndex * 8)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: GENERADOR DE INFORMES & ACTAS FORMALES                            */}
      {/* ========================================================================= */}
      {activeTab === 'report-generator' && (
        <div className="space-y-6">
          {/* Controls Bar for Report Configuration */}
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 space-y-4 shadow-2xs no-print">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Printer className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  <span>Configuración del Informe Ejecutivo y Acta de Entrega</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Genera documentos formales listos para impresión, auditoría o firma con el cliente
                </p>
              </div>

              {/* Action Buttons: Print PDF & Copy Markdown */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyReportMarkdown}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors shadow-2xs cursor-pointer"
                  title="Copiar contenido en formato Markdown para correos o minutas"
                >
                  {copiedReportText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedReportText ? '¡Copiado!' : 'Copiar Texto'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintReport}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 transition-colors shadow-xs cursor-pointer"
                  title="Imprimir documento oficial o guardar en formato PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Exportar PDF</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100 dark:border-neutral-800">
              {/* Select Target Project */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-neutral-400 block mb-1">
                  Proyecto a Emitir:
                </label>
                <select
                  value={reportProjectId}
                  onChange={(e) => setReportProjectId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500 font-semibold cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Report Template */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-neutral-400 block mb-1">
                  Plantilla de Documento:
                </label>
                <select
                  value={reportTemplate}
                  onChange={(e) => setReportTemplate(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-blue-500 font-semibold cursor-pointer"
                >
                  <option value="status">📊 Informe Ejecutivo de Estado de Proyecto</option>
                  <option value="handover">📜 Acta Formal de Entrega & Cierre Técnico</option>
                  <option value="poc-evaluation">🧪 Dictamen de Validación PoC / PLC</option>
                </select>
              </div>
            </div>
          </div>

          {/* Printable Document Sheet Preview */}
          <div
            ref={printableReportRef}
            className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-10 shadow-sm max-w-4xl mx-auto space-y-8 font-sans text-slate-900 dark:text-white print:border-none print:shadow-none print:p-0 print:m-0"
          >
            {reportSelectedProject ? (
              <>
                {/* Formal Document Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b-2 border-slate-900 dark:border-neutral-200">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                        CC
                      </div>
                      <span className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-neutral-200">
                        Centro de Control de Ingeniería (CCI)
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                      {reportTemplate === 'status' && 'INFORME EJECUTIVO DE AVANCE Y ESTADO DE PROYECTO'}
                      {reportTemplate === 'handover' && 'ACTA FORMAL DE ENTREGA Y CONFORMIDAD TÉCNICA'}
                      {reportTemplate === 'poc-evaluation' && 'DICTAMEN TÉCNICO DE EVALUACIÓN PoC / PLC'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-neutral-400">
                      Expediente Oficial de Ingeniería · Código ID: {reportSelectedProject.id}
                    </p>
                  </div>

                  <div className="text-right font-mono text-xs text-slate-500 dark:text-neutral-400 space-y-1">
                    <div>
                      Fecha: <strong>{new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                    </div>
                    <div>
                      Estado: <strong className="text-blue-600 dark:text-cyan-400">{reportSelectedProject.status}</strong>
                    </div>
                    <div>
                      Avance Técnico: <strong className="text-emerald-600 dark:text-emerald-400">{reportSelectedCalc?.progress || 0}%</strong>
                    </div>
                  </div>
                </div>

                {/* Section 1: Project Metadata & Strategic Objectives */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-800 pb-1">
                    1. Información General del Proyecto
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Proyecto:</span>
                      <strong className="text-slate-900 dark:text-white">{reportSelectedProject.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cliente:</span>
                      <strong className="text-slate-900 dark:text-white">
                        {clients.find((c) => c.id === reportSelectedProject.clientId)?.name || 'Cliente General'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tecnología / Marca:</span>
                      <strong className="text-slate-900 dark:text-white">
                        {brands.find((b) => b.id === reportSelectedProject.brandId)?.name || 'Multimarca'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Ventana de Ejecución:</span>
                      <span className="font-mono text-slate-900 dark:text-white">
                        {reportSelectedProject.start || 'S/F'} → {reportSelectedProject.target || 'S/F'}
                      </span>
                    </div>
                  </div>

                  {reportSelectedProject.objective && (
                    <div className="p-3 bg-slate-50 dark:bg-neutral-800/60 rounded-lg text-xs space-y-1">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                        Objetivo Técnico:
                      </span>
                      <p className="text-slate-700 dark:text-neutral-300 leading-relaxed">
                        {reportSelectedProject.objective}
                      </p>
                    </div>
                  )}
                </div>

                {/* Section 2: Deliverables & Acceptance Checklist */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                      2. Registro de Entregables e Hitos Verificados
                    </h3>
                    <span className="text-[11px] font-mono text-slate-500">
                      {reportSelectedTasks.filter((t) => t.milestone || t.weight >= 2).length} entregables registrados
                    </span>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 text-[10px] font-bold uppercase">
                      <tr>
                        <th className="py-2 px-3">Entregable</th>
                        <th className="py-2 px-3">Responsable</th>
                        <th className="py-2 px-3">Fecha</th>
                        <th className="py-2 px-3">Avance</th>
                        <th className="py-2 px-3 text-right">Conformidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                      {reportSelectedTasks.filter((t) => t.milestone || t.weight >= 2).map((t) => (
                        <tr key={t.id}>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                            {t.title}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-neutral-300 font-medium">
                            {t.owner || 'Ingeniero Asignado'}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{t.due || 'S/F'}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-neutral-200">
                            {t.progress}%
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.status === 'Completado'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              {t.status === 'Completado' ? 'Cumplido / Aprobado' : 'En Curso'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Section 3: Criteria & Acceptance Matrix */}
                {(reportSelectedProject.criteria || []).length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400 border-b border-slate-200 dark:border-neutral-800 pb-1">
                      3. Criterios de Aceptación Técnica Validados
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {reportSelectedProject.criteria.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-neutral-800/40 rounded border border-slate-200 dark:border-neutral-800"
                        >
                          {c.done ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-neutral-600 shrink-0" />
                          )}
                          <span className={c.done ? 'font-medium text-slate-800 dark:text-neutral-200' : 'text-slate-500'}>
                            {c.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 4: Formal Sign-off Signature Blocks */}
                <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-neutral-800">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
                    4. Visto Bueno & Firmas de Conformidad
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8">
                    {/* Responsable Técnico */}
                    <div className="space-y-2 text-center border-t border-slate-400 dark:border-neutral-600 pt-2">
                      <p className="font-bold text-xs text-slate-900 dark:text-white">
                        {reportSelectedTasks[0]?.owner || 'Ingeniero Responsable'}
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-neutral-400 block">
                        Responsable Técnico del Proyecto
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 block">Firma y Sello</span>
                    </div>

                    {/* Líder de Arquitectura / Proyecto */}
                    <div className="space-y-2 text-center border-t border-slate-400 dark:border-neutral-600 pt-2">
                      <p className="font-bold text-xs text-slate-900 dark:text-white">
                        {reportSelectedProject.contacts?.[0] || 'Líder de Proyecto CCI'}
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-neutral-400 block">
                        Líder de Proyecto / Arquitectura
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 block">Visto Bueno Aprobatorio</span>
                    </div>

                    {/* Cliente / Stakeholder */}
                    <div className="space-y-2 text-center border-t border-slate-400 dark:border-neutral-600 pt-2">
                      <p className="font-bold text-xs text-slate-900 dark:text-white">
                        {clients.find((c) => c.id === reportSelectedProject.clientId)?.name || 'Representante del Cliente'}
                      </p>
                      <span className="text-[10px] text-slate-500 dark:text-neutral-400 block">
                        Aceptación y Recepción de Entregables
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 block">Conformidad del Cliente</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-400 dark:text-neutral-500">
                Selecciona un proyecto para visualizar el informe ejecutivo.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
