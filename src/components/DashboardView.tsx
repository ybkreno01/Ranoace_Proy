import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FolderKanban,
  AlertTriangle,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layers,
  Filter,
  Eye,
  Check,
  CheckSquare,
  Columns3,
  User,
  Plus,
  Edit,
  Trash2,
  Search,
  FlaskConical,
  Rocket,
  Target,
  ShieldCheck,
  Split,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { store } from '../services/store';
import { Project, Task, CatalogItem, TaskPriority, TaskStatus } from '../types';
import { calculateProjectProgress } from '../services/businessRules';
import { DashboardExecutiveReportModal } from './modals/DashboardExecutiveReportModal';
import { BrandLogo } from './common/BrandLogo';
import { ProjectNameCell } from './common/ProjectNameCell';

const DASHBOARD_SAVED_STATE_KEY = 'cci_dashboard_saved_state_v1';

interface DashboardSavedState {
  portfolioTypeFilter?: 'all' | 'productive' | 'poc' | 'split';
  activeTab?: 'attention' | 'sessions' | 'noAction' | 'history';
  statusFilter?: 'vigentes' | 'all' | 'ejecucion' | 'completado';
  selectedBrandFilter?: string;
  selectedClientFilter?: string;
  searchProjectQuery?: string;
  timelineZoom?: 'days' | 'compact';
  taskScopeFilter?: 'all' | 'independent' | 'with_project';
  taskStatusFilter?: string;
  taskPriorityFilter?: string;
  taskProjectSelectFilter?: string;
  taskSearchQuery?: string;
}

const getSavedDashboardState = (): DashboardSavedState => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(DASHBOARD_SAVED_STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error('Error reading saved dashboard state', e);
    return {};
  }
};

interface DashboardViewProps {
  onOpenProjectModal?: (project?: Project | null, defaultTypeId?: string) => void;
  onDeleteProject?: (project: Project) => void;
  onOpenTaskModal?: (task?: Task | null, projectId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenProjectModal,
  onDeleteProject,
  onOpenTaskModal,
}) => {
  const savedState = useMemo(() => getSavedDashboardState(), []);

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

  // Helper to determine if a project is a PoC / PLC (Prueba de Concepto) or Productive
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

  // State for Portfolio Type View (Preserves last selected filter)
  const [portfolioTypeFilter, setPortfolioTypeFilter] = useState<'all' | 'productive' | 'poc' | 'split'>(
    savedState.portfolioTypeFilter || 'split'
  );
  const [activeTab, setActiveTab] = useState<'attention' | 'sessions' | 'noAction' | 'history'>(
    savedState.activeTab || 'attention'
  );
  const [isExecutiveReportOpen, setIsExecutiveReportOpen] = useState(false);

  // Advanced Filters for the Dashboard Gantt (Preserves last selected filter, defaults to 'ejecucion')
  const [statusFilter, setStatusFilter] = useState<'vigentes' | 'all' | 'ejecucion' | 'completado'>(
    savedState.statusFilter || 'ejecucion'
  );
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>(
    savedState.selectedBrandFilter || 'all'
  );
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>(
    savedState.selectedClientFilter || 'all'
  );
  const [searchProjectQuery, setSearchProjectQuery] = useState<string>(
    savedState.searchProjectQuery || ''
  );
  const [timelineZoom, setTimelineZoom] = useState<'days' | 'compact'>(
    savedState.timelineZoom || 'days'
  );
  // Projects start collapsed by default as requested
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  const handleExpandAll = () => {
    const allExp: Record<string, boolean> = {};
    projects.forEach((p) => {
      allExp[p.id] = true;
    });
    setExpandedProjects(allExp);
  };

  const handleCollapseAll = () => {
    setExpandedProjects({});
  };

  // Task Control Section State (Preserves last selected filter)
  const [taskScopeFilter, setTaskScopeFilter] = useState<'all' | 'independent' | 'with_project'>(
    savedState.taskScopeFilter || 'all'
  );
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>(
    savedState.taskStatusFilter || 'pending'
  );
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>(
    savedState.taskPriorityFilter || 'all'
  );
  const [taskProjectSelectFilter, setTaskProjectSelectFilter] = useState<string>(
    savedState.taskProjectSelectFilter || 'all'
  );
  const [taskSearchQuery, setTaskSearchQuery] = useState<string>(
    savedState.taskSearchQuery || ''
  );
  const [isQuickAddExpanded, setIsQuickAddExpanded] = useState<boolean>(false);
  const [quickTitle, setQuickTitle] = useState<string>('');
  const [quickProjectId, setQuickProjectId] = useState<string>('');
  const [quickOwner, setQuickOwner] = useState<string>('');
  const [quickDue, setQuickDue] = useState<string>('');
  const [quickPriority, setQuickPriority] = useState<TaskPriority>('Media');

  // Automatically persist any dashboard filter/view changes to localStorage
  useEffect(() => {
    try {
      const stateToPersist: DashboardSavedState = {
        portfolioTypeFilter,
        activeTab,
        statusFilter,
        selectedBrandFilter,
        selectedClientFilter,
        searchProjectQuery,
        timelineZoom,
        taskScopeFilter,
        taskStatusFilter,
        taskPriorityFilter,
        taskProjectSelectFilter,
        taskSearchQuery,
      };
      localStorage.setItem(DASHBOARD_SAVED_STATE_KEY, JSON.stringify(stateToPersist));
    } catch (e) {
      console.error('Error saving dashboard state', e);
    }
  }, [
    portfolioTypeFilter,
    activeTab,
    statusFilter,
    selectedBrandFilter,
    selectedClientFilter,
    searchProjectQuery,
    timelineZoom,
    taskScopeFilter,
    taskStatusFilter,
    taskPriorityFilter,
    taskProjectSelectFilter,
    taskSearchQuery,
  ]);

  const handleCreateQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    const now = new Date().toISOString();
    const targetProject = projects.find((p) => p.id === quickProjectId);
    const firstSectionId = targetProject?.plan?.sections?.[0]?.id;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      kind: 'task',
      title: quickTitle.trim(),
      projectId: quickProjectId ? quickProjectId : undefined,
      sectionId: firstSectionId || undefined,
      order: 999,
      owner: quickOwner.trim(),
      status: 'Pendiente',
      priority: quickPriority,
      start: now.split('T')[0],
      due: quickDue || undefined,
      progress: 0,
      progressMode: 'auto',
      weight: 1, // equal weight so tasks distribute 100% proportionally
      milestone: false,
      checklist: [],
      deps: [],
      createdAt: now,
      updatedAt: now,
    };
    store.putRecord(newTask);
    setQuickTitle('');
    setQuickOwner('');
    setQuickDue('');
    setIsQuickAddExpanded(false);
  };

  const handleUpdateTaskStatus = (task: Task, newStatus: TaskStatus) => {
    const isCompleted = newStatus === 'Completado';
    const nowStr = new Date().toISOString().split('T')[0];
    const newProg = isCompleted ? 100 : newStatus === 'Pendiente' && task.progress === 100 ? 0 : task.progress === 100 ? 50 : task.progress;
    store.putRecord({
      ...task,
      status: newStatus,
      progress: newProg,
      realEnd: isCompleted ? nowStr : undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    store.deleteRecord(taskId);
  };

  const filteredControlTasks = useMemo(() => {
    return allTasks.filter((t: Task) => {
      if (taskScopeFilter === 'independent' && t.projectId) return false;
      if (taskScopeFilter === 'with_project' && !t.projectId) return false;
      if (taskStatusFilter === 'pending') {
        if (t.status === 'Completado') return false;
      } else if (taskStatusFilter !== 'all' && t.status !== taskStatusFilter) {
        return false;
      }
      if (taskPriorityFilter !== 'all' && t.priority !== taskPriorityFilter) return false;
      if (taskProjectSelectFilter !== 'all' && t.projectId !== taskProjectSelectFilter) return false;
      if (taskSearchQuery.trim()) {
        const q = taskSearchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchOwner = (t.owner || '').toLowerCase().includes(q);
        const project = projects.find((p) => p.id === t.projectId);
        const matchProject = project?.name.toLowerCase().includes(q);
        if (!matchTitle && !matchOwner && !matchProject) return false;
      }
      return true;
    });
  }, [allTasks, taskScopeFilter, taskStatusFilter, taskPriorityFilter, taskProjectSelectFilter, taskSearchQuery, projects]);

  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().split('T')[0], [today]);
  const in7Days = useMemo(
    () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    []
  );

  const controlTaskStats = useMemo(() => {
    const total = allTasks.length;
    const pending = allTasks.filter((t: Task) => t.status !== 'Completado').length;
    const independent = allTasks.filter((t: Task) => !t.projectId).length;
    const withProject = allTasks.filter((t: Task) => !!t.projectId).length;
    const completed = allTasks.filter((t: Task) => t.status === 'Completado').length;
    const inProgress = allTasks.filter((t: Task) => t.status === 'En curso').length;
    const overdue = allTasks.filter((t: Task) => t.status !== 'Completado' && t.due && t.due < todayStr).length;
    return { total, pending, independent, withProject, completed, inProgress, overdue };
  }, [allTasks, todayStr]);

  // Gantt Timeline Navigation & Auto-centering on current date
  const ganttScrollContainerRef = useRef<HTMLDivElement>(null);
  const [colWidth, setColWidth] = useState<number>(38);

  // Compute wide continuous timeline horizon (past projects, today, future projects)
  const { minTimelineDate, maxTimelineDate, timelineDays, monthsGrouped } = useMemo(() => {
    const t = new Date(todayStr + 'T00:00:00');

    // Earliest start: default at least 60 days in past
    let earliest = new Date(t);
    earliest.setDate(earliest.getDate() - 60);

    // Latest target: default at least 90 days in future
    let latest = new Date(t);
    latest.setDate(latest.getDate() + 90);

    // Check all project start/target dates to expand horizon if projects exist outside
    projects.forEach((p) => {
      if (p.start) {
        const ps = new Date(p.start + 'T00:00:00');
        if (!isNaN(ps.getTime()) && ps < earliest) {
          earliest = new Date(ps);
          earliest.setDate(earliest.getDate() - 14);
        }
      }
      if (p.target) {
        const pt = new Date(p.target + 'T00:00:00');
        if (!isNaN(pt.getTime()) && pt > latest) {
          latest = new Date(pt);
          latest.setDate(latest.getDate() + 14);
        }
      }
    });

    // Clean boundary: start on the 1st of that earliest month
    earliest.setDate(1);

    const daysArr: {
      date: string;
      dayNum: number;
      dayName: string;
      monthName: string;
      monthYear: string;
      isWeekend: boolean;
      isCurrentDay: boolean;
      index: number;
    }[] = [];

    const monthsMap: Record<string, { label: string; count: number; startIndex: number }> = {};

    const cur = new Date(earliest);
    let idx = 0;
    while (cur <= latest) {
      const year = cur.getFullYear();
      const month = String(cur.getMonth() + 1).padStart(2, '0');
      const date = String(cur.getDate()).padStart(2, '0');
      const iso = `${year}-${month}-${date}`;
      const dayNum = cur.getDate();
      const dayName = ['D', 'L', 'M', 'X', 'J', 'V', 'S'][cur.getDay()];
      const monthName = cur.toLocaleDateString('es-ES', { month: 'short' });
      const monthYear = cur.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      const isWeekend = cur.getDay() === 0 || cur.getDay() === 6;
      const isCurrentDay = iso === todayStr;

      daysArr.push({
        date: iso,
        dayNum,
        dayName,
        monthName,
        monthYear,
        isWeekend,
        isCurrentDay,
        index: idx,
      });

      if (!monthsMap[monthYear]) {
        monthsMap[monthYear] = { label: monthYear, count: 0, startIndex: idx };
      }
      monthsMap[monthYear].count++;

      cur.setDate(cur.getDate() + 1);
      idx++;
    }

    return {
      minTimelineDate: earliest,
      maxTimelineDate: latest,
      timelineDays: daysArr,
      monthsGrouped: Object.values(monthsMap),
    };
  }, [projects, todayStr]);

  const activeColWidth = timelineZoom === 'compact' ? 26 : colWidth;
  const leftColWidth = 460; // 460px sticky project info column for full legible names
  const totalTrackWidth = timelineDays.length * activeColWidth;

  // Auto-centering on today: "siempre debe aparecer en la actual"
  const scrollToToday = (smooth = true) => {
    if (!ganttScrollContainerRef.current) return;
    const container = ganttScrollContainerRef.current;
    const todayIdx = timelineDays.findIndex((d) => d.isCurrentDay);
    if (todayIdx >= 0) {
      const todayX = todayIdx * activeColWidth;
      const visibleTimelineWidth = Math.max(300, container.clientWidth - leftColWidth);
      const targetScroll = Math.max(0, todayX - visibleTimelineWidth / 2 + activeColWidth / 2);
      container.scrollTo({ left: targetScroll, behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  // Center on today on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToToday(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [timelineDays.length, activeColWidth]);

  const handleScrollByDays = (deltaDays: number) => {
    if (!ganttScrollContainerRef.current) return;
    ganttScrollContainerRef.current.scrollBy({ left: deltaDays * activeColWidth, behavior: 'smooth' });
  };

  // Calculate project progress and metrics
  const projectsWithProgress = useMemo(() => {
    return projects.map((p) => {
      const pTasks = store.getProjectTasks(p.id);
      const calc = calculateProjectProgress(p, pTasks);
      return { project: p, calc, tasks: pTasks };
    });
  }, [projects, allTasks]);

  // Segmented project groups
  const productiveProjects = useMemo(() => {
    return projectsWithProgress.filter(({ project }) => !isPoc(project));
  }, [projectsWithProgress, worktypes]);

  const pocProjects = useMemo(() => {
    return projectsWithProgress.filter(({ project }) => isPoc(project));
  }, [projectsWithProgress, worktypes]);

  const productiveActive = useMemo(() => {
    return productiveProjects.filter(
      ({ project }) => project.status === 'En ejecución' || project.status === 'Planificado'
    );
  }, [productiveProjects]);

  const pocActive = useMemo(() => {
    return pocProjects.filter(
      ({ project }) => project.status === 'En ejecución' || project.status === 'Planificado'
    );
  }, [pocProjects]);

  const avgProductiveProgress = useMemo(() => {
    if (!productiveProjects.length) return 0;
    const sum = productiveProjects.reduce((acc, curr) => acc + curr.calc.progress, 0);
    return Math.round(sum / productiveProjects.length);
  }, [productiveProjects]);

  const avgPocProgress = useMemo(() => {
    if (!pocProjects.length) return 0;
    const sum = pocProjects.reduce((acc, curr) => acc + curr.calc.progress, 0);
    return Math.round(sum / pocProjects.length);
  }, [pocProjects]);

  // Overall criteria stats for PoCs
  const pocCriteriaStats = useMemo(() => {
    let total = 0;
    let done = 0;
    pocProjects.forEach(({ project }) => {
      (project.criteria || []).forEach((c) => {
        total++;
        if (c.done) done++;
      });
    });
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [pocProjects]);

  // Filtered projects for the Gantt timeline
  const filteredGanttProjects = useMemo(() => {
    return projectsWithProgress.filter(({ project }) => {
      // Portfolio Type filter: Productivo vs PoC
      if (portfolioTypeFilter === 'productive' && isPoc(project)) return false;
      if (portfolioTypeFilter === 'poc' && !isPoc(project)) return false;

      // "De entrada lo vigente": En ejecución, Planificado, En espera
      if (statusFilter === 'vigentes') {
        if (project.status === 'Completado' || project.status === 'Cancelado') return false;
      } else if (statusFilter === 'ejecucion') {
        if (project.status !== 'En ejecución') return false;
      } else if (statusFilter === 'completado') {
        if (project.status !== 'Completado') return false;
      }

      if (selectedBrandFilter !== 'all' && project.brandId !== selectedBrandFilter) return false;
      if (selectedClientFilter !== 'all' && project.clientId !== selectedClientFilter) return false;

      if (searchProjectQuery.trim()) {
        const q = searchProjectQuery.toLowerCase();
        const clientName = clients.find((c) => c.id === project.clientId)?.name.toLowerCase() || '';
        if (!project.name.toLowerCase().includes(q) && !clientName.includes(q)) return false;
      }

      return true;
    });
  }, [projectsWithProgress, portfolioTypeFilter, statusFilter, selectedBrandFilter, selectedClientFilter, searchProjectQuery, clients, worktypes]);

  // Split Gantt Projects: Productivos (primero) vs PoCs / PLCs (abajo)
  const productiveGanttProjects = useMemo(() => {
    return filteredGanttProjects.filter(({ project }) => !isPoc(project));
  }, [filteredGanttProjects, worktypes]);

  const pocGanttProjects = useMemo(() => {
    return filteredGanttProjects.filter(({ project }) => isPoc(project));
  }, [filteredGanttProjects, worktypes]);

  // Indicator metrics (RF-05)
  const activeProjects = projects.filter((p) => p.status === 'En ejecución' || p.status === 'Planificado');
  const overdueTasks = allTasks.filter(
    (t: Task) => t.status !== 'Completado' && t.due && t.due < todayStr
  );
  const blockerProjects = projects.filter((p) => p.blocker && p.blocker.trim().length > 0);
  const due7DaysTasks = allTasks.filter(
    (t: Task) => t.status !== 'Completado' && t.due && t.due >= todayStr && t.due <= in7Days
  );
  const noNextActionProjects = projectsWithProgress.filter(
    ({ calc, project }) => !calc.effectiveNextAction && project.status !== 'Completado' && project.status !== 'Cancelado'
  );

  // Task distribution by status
  const taskStats = useMemo(() => {
    const counts = { Pendiente: 0, 'En curso': 0, 'En espera': 0, 'En validación': 0, Completado: 0 };
    allTasks.forEach((t: Task) => {
      if (counts[t.status] !== undefined) counts[t.status]++;
    });
    return counts;
  }, [allTasks]);

  const toggleTaskDone = (task: Task) => {
    const isNowDone = task.status !== 'Completado';
    store.putRecord({
      ...task,
      status: isNowDone ? 'Completado' : 'En curso',
      progress: isNowDone ? 100 : task.progress || 50,
      realEnd: isNowDone ? todayStr : undefined,
    });
  };

  const toggleProjectExpanded = (projId: string) => {
    setExpandedProjects((prev) => ({ ...prev, [projId]: !prev[projId] }));
  };

  // Helper to compute Gantt pixel position for project and task bars
  const getGanttSpan = (startDateStr?: string, endDateStr?: string) => {
    if (!timelineDays.length) {
      return { leftPx: 0, widthPx: activeColWidth, visible: false, durationDays: 1 };
    }

    const firstDateStr = timelineDays[0].date;
    const sClean = (startDateStr || todayStr).split('T')[0].trim();
    const eClean = (endDateStr || sClean).split('T')[0].trim();

    const sTime = new Date(sClean + 'T00:00:00').getTime();
    const eTime = new Date(eClean + 'T00:00:00').getTime();
    const firstTime = new Date(firstDateStr + 'T00:00:00').getTime();

    // Guard against invalid or NaN dates
    const validStartTime = isNaN(sTime) ? new Date(todayStr + 'T00:00:00').getTime() : sTime;
    const validEndTime = isNaN(eTime) ? validStartTime : Math.max(validStartTime, eTime);

    const dayMs = 24 * 60 * 60 * 1000;
    const startDayDiff = Math.max(0, Math.round((validStartTime - firstTime) / dayMs));
    const endDayDiff = Math.max(startDayDiff, Math.round((validEndTime - firstTime) / dayMs));
    const durationDays = Math.max(1, endDayDiff - startDayDiff + 1);

    const leftPx = startDayDiff * activeColWidth;
    const widthPx = Math.max(activeColWidth, durationDays * activeColWidth);

    return {
      leftPx,
      widthPx,
      visible: true,
      durationDays,
    };
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Dashboard Top Header Bar with Executive Report CTA */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Tablero de Control de Implementaciones
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>En vivo</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
            Seguimiento de proyectos de ingeniería, cronogramas y separación estratégica de implementaciones productivas vs PoCs / PLCs.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
          {onOpenProjectModal && (
            <>
              <button
                type="button"
                onClick={() => onOpenProjectModal(null, 'type-impl')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 dark:text-cyan-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/80 rounded-xl transition-colors shadow-2xs cursor-pointer"
                title="Dar de alta un nuevo proyecto productivo de implementación"
              >
                <Rocket className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                <span>+ Productivo</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenProjectModal(null, 'type-poc')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800/80 rounded-xl transition-colors shadow-2xs cursor-pointer"
                title="Dar de alta una nueva PoC (Prueba de Concepto / PLC)"
              >
                <FlaskConical className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>+ PoC / PLC</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsExecutiveReportOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer group"
            title="Exportar informe ejecutivo con KPIs, comparativa y desglose formal"
          >
            <FileText className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span>Exportar Reporte</span>
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards (RF-05) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
        <div
          onClick={() => {
            setPortfolioTypeFilter('all');
            setStatusFilter('all');
            store.setActiveView('projects');
          }}
          className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-cyan-500/40 cursor-pointer transition-all group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-semibold">Proyectos Activos</span>
            <FolderKanban className="w-4 h-4 text-blue-600 dark:text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{activeProjects.length}</div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium mt-1 truncate">
            <span className="text-blue-600 dark:text-cyan-400 font-semibold">{productiveActive.length} Productivos</span>
            <span className="text-slate-400 dark:text-neutral-500">·</span>
            <span className="text-purple-600 dark:text-purple-400 font-semibold">{pocActive.length} PoCs/PLCs</span>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('attention')}
          className={`p-4 rounded-xl border cursor-pointer transition-all group shadow-2xs ${
            overdueTasks.length > 0
              ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 hover:border-rose-500/50'
              : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-semibold">Tareas Vencidas</span>
            <AlertTriangle className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
          </div>
          <div
            className={`text-2xl font-bold tabular-nums ${
              overdueTasks.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-neutral-200'
            }`}
          >
            {overdueTasks.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-neutral-500 mt-1">Requieren atención urgente</p>
        </div>

        <div
          onClick={() => store.setActiveView('projects')}
          className={`p-4 rounded-xl border cursor-pointer transition-all group shadow-2xs ${
            blockerProjects.length > 0
              ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60 hover:border-amber-500/50'
              : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-semibold">Bloqueos Activos</span>
            <AlertCircle className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div
            className={`text-2xl font-bold tabular-nums ${
              blockerProjects.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-neutral-200'
            }`}
          >
            {blockerProjects.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-neutral-500 mt-1">Dependencias externas</p>
        </div>

        <div
          onClick={() => store.setActiveView('my-work')}
          className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-blue-500/40 cursor-pointer transition-all group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-semibold">Vencen en 7 Días</span>
            <Clock className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{due7DaysTasks.length}</div>
          <p className="text-[11px] text-slate-500 dark:text-neutral-500 mt-1">Entregables próximos</p>
        </div>

        <div
          onClick={() => setActiveTab('noAction')}
          className="col-span-2 sm:col-span-1 p-4 rounded-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-violet-500/40 cursor-pointer transition-all group shadow-2xs"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-neutral-400 mb-2">
            <span className="text-xs font-semibold">Sin Siguiente Acción</span>
            <Calendar className="w-4 h-4 text-violet-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {noNextActionProjects.length}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-neutral-500 mt-1">Falta definir paso</p>
        </div>
      </div>

      {/* Main Feature: MODERN GANTT TIMELINE ON DASHBOARD */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        {/* Gantt Top Header & Timeline Navigation Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-neutral-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/70 dark:bg-neutral-900/90">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Diagrama de Gantt & Cronograma de Cartera
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Visualización interactiva con barra de desplazamiento temporal libre hacia proyectos pasados y futuros.
            </p>
          </div>

          {/* Timeline Navigation Controls (Ir al pasado, Centrar en Hoy, Ir al futuro) */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Quick jump step buttons */}
            <div className="flex items-center bg-slate-100 dark:bg-neutral-800 rounded-lg p-0.5 border border-slate-200 dark:border-neutral-700/80 shadow-2xs">
              <button
                type="button"
                onClick={() => handleScrollByDays(-30)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-700 rounded transition-colors font-medium cursor-pointer"
                title="Retroceder 1 mes hacia proyectos pasados"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>-30d</span>
              </button>

              <button
                type="button"
                onClick={() => handleScrollByDays(-7)}
                className="flex items-center gap-1 px-2 py-1.5 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-700 rounded transition-colors font-medium cursor-pointer"
                title="Retroceder 1 semana hacia el pasado"
              >
                <span>-7d</span>
              </button>

              {/* Centrar en Hoy button */}
              <button
                type="button"
                onClick={() => scrollToToday(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-blue-700 dark:text-cyan-300 bg-blue-50 dark:bg-blue-950/70 hover:bg-blue-100 dark:hover:bg-blue-900/80 font-bold rounded transition-all cursor-pointer border border-blue-200 dark:border-cyan-800/60 shadow-2xs"
                title="Centrar la vista inmediatamente en la fecha actual (Hoy)"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>🎯 Centrar en Hoy</span>
              </button>

              <button
                type="button"
                onClick={() => handleScrollByDays(7)}
                className="flex items-center gap-1 px-2 py-1.5 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-700 rounded transition-colors font-medium cursor-pointer"
                title="Avanzar 1 semana hacia el futuro"
              >
                <span>+7d</span>
              </button>

              <button
                type="button"
                onClick={() => handleScrollByDays(30)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-neutral-700 rounded transition-colors font-medium cursor-pointer"
                title="Avanzar 1 mes hacia proyectos futuros"
              >
                <span>+30d</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* View Zoom Mode */}
            <div className="flex items-center bg-slate-100 dark:bg-neutral-800 rounded-lg p-0.5 border border-slate-200 dark:border-neutral-700/80 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setTimelineZoom('days')}
                className={`px-2.5 py-1.5 rounded transition-colors cursor-pointer ${
                  timelineZoom === 'days'
                    ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-cyan-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Vista detallada con columnas amplias por día (38px)"
              >
                Días
              </button>
              <button
                type="button"
                onClick={() => setTimelineZoom('compact')}
                className={`px-2.5 py-1.5 rounded transition-colors cursor-pointer ${
                  timelineZoom === 'compact'
                    ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-cyan-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Vista compacta para visualizar períodos más largos (26px)"
              >
                Compacto
              </button>
            </div>

            {onOpenProjectModal && (
              <button
                type="button"
                onClick={() => onOpenProjectModal(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Proyecto</span>
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters Bar (Marca, Cliente, Vigentes, Búsqueda + Desplegar / Plegar todos) */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-neutral-950/70 border-b border-slate-200 dark:border-neutral-800/80 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-neutral-400 font-medium">
            <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            <span>Filtros:</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-400 absolute left-2.5 top-2 pointer-events-none" />
            <input
              type="text"
              value={searchProjectQuery}
              onChange={(e) => setSearchProjectQuery(e.target.value)}
              placeholder="Buscar proyecto..."
              className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 rounded-lg pl-8 pr-2.5 py-1 text-xs focus:outline-hidden focus:border-blue-500 w-36 sm:w-44"
            />
          </div>

          {/* Portfolio Type Filter: Productivo vs PoC */}
          <select
            value={portfolioTypeFilter}
            onChange={(e) => setPortfolioTypeFilter(e.target.value as any)}
            className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:border-blue-500 font-semibold"
          >
            <option value="split">⚖️ Vista Separada: Productivo y abajo PoC</option>
            <option value="productive">🚀 Solo Productivos ({productiveProjects.length})</option>
            <option value="poc">🧪 Solo PoCs / PLCs ({pocProjects.length})</option>
            <option value="all">📁 Todos juntos ({projects.length})</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:border-blue-500 font-semibold"
          >
            <option value="ejecucion">🚀 Solo en ejecución (Por defecto)</option>
            <option value="vigentes">Vigentes (En ejecución, Planificados, En espera)</option>
            <option value="all">Todos los proyectos</option>
            <option value="completado">Completados</option>
          </select>

          {/* Brand Filter */}
          <select
            value={selectedBrandFilter}
            onChange={(e) => setSelectedBrandFilter(e.target.value)}
            className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">Todas las marcas</option>
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
            className="bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-800 dark:text-neutral-200 rounded-lg px-2.5 py-1 text-xs focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">Todos los clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Quick Jump to Past / Today / Future */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (ganttScrollContainerRef.current) {
                  ganttScrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                }
              }}
              className="px-2 py-1 rounded bg-slate-200/80 hover:bg-slate-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-medium text-[11px] transition-colors"
              title="Ir al inicio de la línea de tiempo (proyectos más antiguos)"
            >
              ⏮ Pasado
            </button>
            <button
              type="button"
              onClick={() => scrollToToday(true)}
              className="px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-cyan-300 font-bold text-[11px] transition-colors"
              title="Volver a la fecha actual"
            >
              🎯 Hoy
            </button>
            <button
              type="button"
              onClick={() => {
                if (ganttScrollContainerRef.current) {
                  ganttScrollContainerRef.current.scrollTo({ left: totalTrackWidth, behavior: 'smooth' });
                }
              }}
              className="px-2 py-1 rounded bg-slate-200/80 hover:bg-slate-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-medium text-[11px] transition-colors"
              title="Ir al final de la línea de tiempo (proyectos futuros)"
            >
              Futuro ⏭
            </button>
          </div>

          {/* Desplegar todos / Plegar todos Quick Controls */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={handleExpandAll}
              className="px-2.5 py-1 rounded bg-slate-200/80 hover:bg-slate-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-semibold text-[11px] transition-colors"
              title="Desplegar actividades de todos los proyectos"
            >
              Desplegar todos
            </button>
            <button
              onClick={handleCollapseAll}
              className="px-2.5 py-1 rounded bg-slate-200/80 hover:bg-slate-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-neutral-300 font-semibold text-[11px] transition-colors"
              title="Plegar todos los proyectos"
            >
              Plegar todos
            </button>
            <span className="text-[11px] font-mono text-slate-500 dark:text-neutral-500 pl-1 tabular-nums hidden lg:inline">
              ({filteredGanttProjects.length} proyectos)
            </span>
          </div>
        </div>

        {/* User Help Strip: Notice on horizontal scroll and today centering */}
        <div className="px-4 py-1.5 bg-blue-50/60 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900/40 flex items-center justify-between text-[11px] text-blue-700 dark:text-cyan-300">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-cyan-400 shrink-0" />
            <span>
              <strong>Línea de tiempo continua:</strong> Desplázate con la barra horizontal inferior para viajar hacia el pasado o hacia el futuro. La vista se abre siempre centrada en <strong>HOY ({todayStr})</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => scrollToToday(true)}
            className="underline font-semibold hover:text-blue-900 dark:hover:text-cyan-200 cursor-pointer shrink-0 ml-2"
          >
            Re-centrar en Hoy
          </button>
        </div>

        {/* Interactive Gantt Viewport with Continuous Horizontal Scrollbar */}
        <div
          ref={ganttScrollContainerRef}
          className="overflow-x-auto scrollbar-thin scrollbar-track-slate-100 scrollbar-thumb-blue-400 dark:scrollbar-track-neutral-950 dark:scrollbar-thumb-neutral-700 pb-2 select-none"
          style={{ maxWidth: '100%' }}
        >
          <div style={{ width: leftColWidth + totalTrackWidth, minWidth: '100%' }} className="relative">
            {/* Timeline Header Row (Months in Row 1, Days in Row 2) */}
            <div className="border-b border-slate-200 dark:border-neutral-800 bg-slate-100/90 dark:bg-neutral-950/80">
              {/* Row 1: Month labels */}
              <div className="flex">
                <div
                  style={{ width: leftColWidth }}
                  className="shrink-0 sticky left-0 z-30 bg-slate-200/90 dark:bg-neutral-900 border-r border-slate-300 dark:border-neutral-800 p-2 font-bold text-xs text-slate-800 dark:text-neutral-200 flex items-center justify-between shadow-[3px_0_8px_-2px_rgba(0,0,0,0.12)]"
                >
                  <span className="uppercase tracking-wider text-[11px] font-extrabold text-slate-700 dark:text-neutral-200">PROJECT NAME</span>
                  <span className="text-[11px] font-mono text-slate-600 dark:text-neutral-400">Avance</span>
                </div>

                <div className="flex" style={{ width: totalTrackWidth }}>
                  {monthsGrouped.map((m) => (
                    <div
                      key={m.label}
                      style={{ width: m.count * activeColWidth }}
                      className="border-r border-slate-300 dark:border-neutral-700/80 text-center py-1 font-bold text-[11px] uppercase tracking-wider text-slate-700 dark:text-neutral-300 bg-slate-200/60 dark:bg-neutral-900/60 truncate"
                    >
                      {m.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 2: Day names & dates */}
              <div className="flex border-t border-slate-200 dark:border-neutral-800/80">
                <div
                  style={{ width: leftColWidth }}
                  className="shrink-0 sticky left-0 z-30 bg-slate-100 dark:bg-neutral-900 border-r border-slate-300 dark:border-neutral-800 px-3 py-1.5 text-[11px] text-slate-500 dark:text-neutral-400 flex items-center justify-between shadow-[3px_0_8px_-2px_rgba(0,0,0,0.12)]"
                >
                  <span>Haz clic en el nombre para abrir detalle</span>
                  <span className="font-mono text-[10px]">Ponderado</span>
                </div>

                <div className="flex" style={{ width: totalTrackWidth }}>
                  {timelineDays.map((td) => (
                    <div
                      key={td.date}
                      style={{ width: activeColWidth }}
                      className={`py-1.5 flex flex-col justify-center items-center text-center text-xs shrink-0 transition-colors ${
                        td.isCurrentDay
                          ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                          : td.isWeekend
                          ? 'bg-slate-200/50 dark:bg-neutral-950/60 text-slate-400 dark:text-neutral-500'
                          : td.index % 2 === 1
                          ? 'bg-slate-150/60 dark:bg-neutral-900/50 text-slate-600 dark:text-neutral-400'
                          : 'text-slate-600 dark:text-neutral-400'
                      }`}
                      title={`${td.dayName} ${td.dayNum} ${td.monthName} ${td.isCurrentDay ? ' (HOY)' : ''}`}
                    >
                      <span className="text-[9px] uppercase font-mono font-bold leading-none">
                        {td.isCurrentDay ? 'HOY' : td.dayName}
                      </span>
                      <span className="text-[11px] font-mono tabular-nums leading-tight mt-0.5">
                        {td.dayNum}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gantt Projects Rows */}
            <div className="divide-y divide-slate-200 dark:divide-neutral-800/80">
              {filteredGanttProjects.length === 0 ? (
                <div className="p-12 text-center text-sm text-slate-500 dark:text-neutral-500">
                  No hay proyectos que coincidan con los filtros seleccionados.
                </div>
              ) : (
                (() => {
                  const renderProjectGanttRow = ({ project, calc, tasks }: { project: Project; calc: any; tasks: Task[] }) => {
                    const brand = brands.find((b) => b.id === project.brandId);
                    const client = clients.find((c) => c.id === project.clientId);
                    const brandColor = brand?.color || '#06b6d4';
                    const isExpanded = expandedProjects[project.id] ?? false;
                    const span = getGanttSpan(project.start, project.target);

                    return (
                      <div key={project.id} className="group">
                        {/* Project Main Row */}
                        <div className="flex items-stretch hover:bg-slate-50/80 dark:hover:bg-neutral-800/40 transition-colors min-h-[58px]">
                          {/* Project Info Column - Sticky on left with FULL legible title */}
                          <div
                            style={{ width: leftColWidth }}
                            className="shrink-0 sticky left-0 z-20 bg-white dark:bg-neutral-900 border-r border-slate-200 dark:border-neutral-800 p-2.5 flex items-center justify-between gap-3 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.08)]"
                          >
                            <ProjectNameCell
                              project={project}
                              brand={brand}
                              client={client}
                              worktype={worktypes.find((w) => w.id === project.typeId)}
                              showExpandButton={true}
                              isExpanded={isExpanded}
                              onToggleExpand={() => toggleProjectExpanded(project.id)}
                              logoSize="lg"
                              className="flex-1 min-w-0"
                            />

                            {/* Progress and Row Controls */}
                            <div className="flex items-center gap-1 shrink-0 ml-1">
                              <span className="font-mono text-xs font-bold text-blue-600 dark:text-cyan-400 tabular-nums bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-cyan-800/50">
                                {calc.progress}%
                              </span>
                              {onOpenProjectModal && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenProjectModal(project);
                                  }}
                                  className="p-1 text-slate-400 hover:text-cyan-400 rounded opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  title="Editar expediente de proyecto"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onDeleteProject) {
                                    onDeleteProject(project);
                                  } else {
                                    store.deleteRecord(project.id, true);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-400 rounded opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title="Eliminar proyecto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Gantt Bar Track for Project */}
                          <div
                            style={{ width: totalTrackWidth }}
                            className="h-auto relative flex items-center shrink-0 border-l border-slate-150 dark:border-neutral-850 overflow-hidden"
                          >
                            {/* Background Day Columns (Limpio sin líneas divisorias, tono muy leve alternado) */}
                            <div className="absolute inset-0 flex pointer-events-none">
                              {timelineDays.map((td) => (
                                <div
                                  key={td.date}
                                  style={{ width: activeColWidth }}
                                  className={`h-full transition-colors ${
                                    td.isCurrentDay
                                      ? 'bg-blue-500/10 dark:bg-cyan-500/15'
                                      : td.isWeekend
                                      ? 'bg-slate-100/50 dark:bg-neutral-950/50'
                                      : td.index % 2 === 1
                                      ? 'bg-slate-100/35 dark:bg-neutral-800/25'
                                      : 'bg-transparent'
                                  }`}
                                />
                              ))}
                            </div>

                            {/* Vertical Red Marker for "HOY" */}
                            {timelineDays.some((td) => td.isCurrentDay) && (
                              <div
                                className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 pointer-events-none shadow-[0_0_4px_rgba(244,63,94,0.4)]"
                                style={{
                                  left: `${
                                    timelineDays.findIndex((td) => td.isCurrentDay) * activeColWidth +
                                    activeColWidth / 2
                                  }px`,
                                }}
                              />
                            )}

                            {/* Pixel-Accurate Visual Project Gantt Bar */}
                            <div
                              onClick={() => store.setActiveView('projects', project.id)}
                              className="h-8 rounded-lg relative overflow-hidden cursor-pointer shadow-xs transition-all hover:brightness-110 active:scale-98 z-[1]"
                              style={{
                                left: `${span.leftPx}px`,
                                width: `${span.widthPx}px`,
                                backgroundColor: `${brandColor}25`,
                                border: `1.5px solid ${brandColor}`,
                              }}
                              title={`${project.name}\nAvance: ${calc.progress}%\nDuración: ${span.durationDays} días (${project.start} → ${project.target})`}
                            >
                              {/* Real progress fill */}
                              <div
                                className="h-full transition-all duration-300"
                                style={{
                                  width: `${calc.progress}%`,
                                  backgroundColor: brandColor,
                                }}
                              />

                              <span className="absolute inset-0 flex items-center px-2.5 text-[11px] font-bold text-white drop-shadow truncate pointer-events-none whitespace-nowrap">
                                {isPoc(project) ? '🧪 [PoC] ' : '🚀 '}
                                {project.name} · {calc.progress}% · ({span.durationDays}d)
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Expandable Project Tasks inside the Gantt */}
                        {isExpanded && tasks.length > 0 && (
                          <div className="bg-slate-50/80 dark:bg-neutral-950/60 divide-y divide-slate-200/80 dark:divide-neutral-800/40">
                            {tasks.map((task) => {
                              const taskSpan = getGanttSpan(task.start || project.start, task.due || project.target);
                              const isDone = task.status === 'Completado';

                              return (
                                <div
                                  key={task.id}
                                  className="flex items-stretch hover:bg-slate-100/70 dark:hover:bg-neutral-800/30 transition-colors text-xs min-h-[42px]"
                                >
                                  {/* Task name & owner - Sticky Column with FULL legible title */}
                                  <div
                                    style={{ width: leftColWidth }}
                                    className="shrink-0 sticky left-0 z-20 bg-slate-50/95 dark:bg-neutral-950/95 border-r border-slate-200 dark:border-neutral-800 pl-10 pr-3 py-2 flex items-center justify-between gap-2 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.08)]"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <input
                                        type="checkbox"
                                        checked={isDone}
                                        onChange={() => toggleTaskDone(task)}
                                        className="rounded border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-blue-600 dark:text-cyan-600 focus:ring-0 cursor-pointer shrink-0"
                                      />
                                      {/* Task title clearly visible without truncation */}
                                      <span
                                        className={`break-words leading-tight flex-1 ${
                                          isDone
                                            ? 'line-through text-slate-400 dark:text-neutral-500'
                                            : 'text-slate-800 dark:text-neutral-200 font-medium'
                                        }`}
                                        title={task.title}
                                      >
                                        {task.title}
                                      </span>
                                      {task.milestone && (
                                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 shrink-0">
                                          Hito
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500 dark:text-neutral-400 shrink-0">
                                      {task.owner && <span className="truncate max-w-[80px]">{task.owner}</span>}
                                      <span className="font-bold tabular-nums">{task.progress}%</span>
                                    </div>
                                  </div>

                                  {/* Task Bar in timeline */}
                                  <div
                                    style={{ width: totalTrackWidth }}
                                    className="h-auto relative flex items-center shrink-0 border-l border-slate-150 dark:border-neutral-850 overflow-hidden"
                                  >
                                    {/* Background Day Columns (Limpio sin líneas, tono leve alternado) */}
                                    <div className="absolute inset-0 flex pointer-events-none">
                                      {timelineDays.map((td) => (
                                        <div
                                          key={td.date}
                                          style={{ width: activeColWidth }}
                                          className={`h-full transition-colors ${
                                            td.isCurrentDay
                                              ? 'bg-blue-500/10 dark:bg-cyan-500/15'
                                              : td.isWeekend
                                              ? 'bg-slate-100/50 dark:bg-neutral-950/50'
                                              : td.index % 2 === 1
                                              ? 'bg-slate-100/35 dark:bg-neutral-800/25'
                                              : 'bg-transparent'
                                          }`}
                                        />
                                      ))}
                                    </div>

                                    {/* Red line for "HOY" */}
                                    {timelineDays.some((td) => td.isCurrentDay) && (
                                      <div
                                        className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 pointer-events-none shadow-[0_0_4px_rgba(244,63,94,0.4)]"
                                        style={{
                                          left: `${
                                            timelineDays.findIndex((td) => td.isCurrentDay) * activeColWidth +
                                            activeColWidth / 2
                                          }px`,
                                        }}
                                      />
                                    )}

                                    {/* Task Scheduled Bar */}
                                    <div
                                      className={`h-4 rounded relative overflow-hidden transition-all z-[1] ${
                                        isDone
                                          ? 'bg-emerald-500/40 border border-emerald-500/80'
                                          : 'bg-cyan-600/40 border border-cyan-500/70'
                                      }`}
                                      style={{
                                        left: `${taskSpan.leftPx}px`,
                                        width: `${taskSpan.widthPx}px`,
                                      }}
                                      title={`${task.title}\nAvance: ${task.progress}%\nResponsable: ${task.owner || 'N/A'}\nFechas: ${task.start || project.start} → ${task.due || project.target}`}
                                    >
                                      <div
                                        className={`h-full transition-all duration-300 ${
                                          isDone ? 'bg-emerald-500' : 'bg-cyan-400/80'
                                        }`}
                                        style={{ width: `${task.progress}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  };

                  if (portfolioTypeFilter === 'split') {
                    return (
                      <>
                        {/* 1) SECCIÓN SEPARADA: PROYECTOS PRODUCTIVOS (PRIMERO) */}
                        <div className="flex border-b border-blue-200/90 dark:border-blue-900/80 bg-blue-50/90 dark:bg-blue-950/70 sticky top-0 z-20">
                          <div
                            style={{ width: leftColWidth }}
                            className="shrink-0 sticky left-0 z-25 bg-blue-100/95 dark:bg-blue-950/95 border-r border-blue-200 dark:border-blue-900 px-3.5 py-2 flex items-center justify-between text-xs font-bold text-blue-900 dark:text-cyan-200 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.08)]"
                          >
                            <div className="flex items-center gap-2">
                              <Rocket className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                              <span className="uppercase tracking-wider text-[11px] font-extrabold">1. Proyectos Productivos</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-200/80 dark:bg-blue-900/80 text-blue-800 dark:text-cyan-300">
                              {productiveGanttProjects.length} {productiveGanttProjects.length === 1 ? 'proyecto' : 'proyectos'}
                            </span>
                          </div>
                          <div
                            style={{ width: totalTrackWidth }}
                            className="h-8 bg-blue-50/60 dark:bg-blue-950/30 border-l border-blue-200/50 dark:border-blue-900/40 flex items-center px-4 text-xs font-semibold text-blue-700/80 dark:text-cyan-400/80"
                          >
                            <span className="text-[11px]">Diagrama de Gantt: Implementaciones comerciales en producción</span>
                          </div>
                        </div>

                        {productiveGanttProjects.length === 0 ? (
                          <div className="flex">
                            <div
                              style={{ width: leftColWidth }}
                              className="shrink-0 sticky left-0 z-20 bg-white dark:bg-neutral-900 border-r border-slate-200 dark:border-neutral-800 p-4 text-xs text-slate-500 italic"
                            >
                              No hay proyectos productivos vigentes con los filtros seleccionados.
                            </div>
                            <div style={{ width: totalTrackWidth }} className="bg-slate-50/20 dark:bg-neutral-900/20 border-l border-slate-200 dark:border-neutral-800" />
                          </div>
                        ) : (
                          productiveGanttProjects.map(renderProjectGanttRow)
                        )}

                        {/* 2) SECCIÓN SEPARADA: PRUEBAS DE CONCEPTO (POC / PLC) (ABAJO) */}
                        <div className="flex border-y border-purple-200/90 dark:border-purple-900/80 bg-purple-50/90 dark:bg-purple-950/70 sticky top-0 z-20">
                          <div
                            style={{ width: leftColWidth }}
                            className="shrink-0 sticky left-0 z-25 bg-purple-100/95 dark:bg-purple-950/95 border-r border-purple-200 dark:border-purple-900 px-3.5 py-2 flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-200 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.08)]"
                          >
                            <div className="flex items-center gap-2">
                              <FlaskConical className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span className="uppercase tracking-wider text-[11px] font-extrabold">2. Pruebas de Concepto (PoC / PLC)</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-200/80 dark:bg-purple-900/80 text-purple-800 dark:text-purple-300">
                              {pocGanttProjects.length} {pocGanttProjects.length === 1 ? 'proyecto' : 'proyectos'}
                            </span>
                          </div>
                          <div
                            style={{ width: totalTrackWidth }}
                            className="h-8 bg-purple-50/60 dark:bg-purple-950/30 border-l border-purple-200/50 dark:border-purple-900/40 flex items-center px-4 text-xs font-semibold text-purple-700/80 dark:text-purple-400/80"
                          >
                            <span className="text-[11px]">Diagrama de Gantt: Pruebas de concepto y validaciones técnicas</span>
                          </div>
                        </div>

                        {pocGanttProjects.length === 0 ? (
                          <div className="flex">
                            <div
                              style={{ width: leftColWidth }}
                              className="shrink-0 sticky left-0 z-20 bg-white dark:bg-neutral-900 border-r border-slate-200 dark:border-neutral-800 p-4 text-xs text-slate-500 italic"
                            >
                              No hay pruebas de concepto vigentes con los filtros seleccionados.
                            </div>
                            <div style={{ width: totalTrackWidth }} className="bg-slate-50/20 dark:bg-neutral-900/20 border-l border-slate-200 dark:border-neutral-800" />
                          </div>
                        ) : (
                          pocGanttProjects.map(renderProjectGanttRow)
                        )}
                      </>
                    );
                  }

                  if (portfolioTypeFilter === 'productive') {
                    return (
                      <>
                        <div className="flex border-b border-blue-200/80 dark:border-blue-900/80 bg-blue-50/90 dark:bg-blue-950/70 sticky top-0 z-20">
                          <div
                            style={{ width: leftColWidth }}
                            className="shrink-0 sticky left-0 z-25 bg-blue-100/95 dark:bg-blue-950/95 border-r border-blue-200 dark:border-blue-900 px-3.5 py-2 flex items-center justify-between text-xs font-bold text-blue-900 dark:text-cyan-200 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.08)]"
                          >
                            <div className="flex items-center gap-2">
                              <Rocket className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                              <span className="uppercase tracking-wider text-[11px] font-extrabold">Proyectos Productivos</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-200/80 dark:bg-blue-900/80 text-blue-800 dark:text-cyan-300">
                              {productiveGanttProjects.length}
                            </span>
                          </div>
                          <div
                            style={{ width: totalTrackWidth }}
                            className="h-8 bg-blue-50/60 dark:bg-blue-950/30 border-l border-blue-200/50 dark:border-blue-900/40 flex items-center px-4 text-xs font-semibold text-blue-700/80 dark:text-cyan-400/80"
                          >
                            <span className="text-[11px]">Solo Proyectos Productivos</span>
                          </div>
                        </div>
                        {productiveGanttProjects.map(renderProjectGanttRow)}
                      </>
                    );
                  }

                  if (portfolioTypeFilter === 'poc') {
                    return (
                      <>
                        <div className="flex border-b border-purple-200/80 dark:border-purple-900/80 bg-purple-50/90 dark:bg-purple-950/70 sticky top-0 z-20">
                          <div
                            style={{ width: leftColWidth }}
                            className="shrink-0 sticky left-0 z-25 bg-purple-100/95 dark:bg-purple-950/95 border-r border-purple-200 dark:border-purple-900 px-3.5 py-2 flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-200 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.08)]"
                          >
                            <div className="flex items-center gap-2">
                              <FlaskConical className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span className="uppercase tracking-wider text-[11px] font-extrabold">Pruebas de Concepto (PoC / PLC)</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-200/80 dark:bg-purple-900/80 text-purple-800 dark:text-purple-300">
                              {pocGanttProjects.length}
                            </span>
                          </div>
                          <div
                            style={{ width: totalTrackWidth }}
                            className="h-8 bg-purple-50/60 dark:bg-purple-950/30 border-l border-purple-200/50 dark:border-purple-900/40 flex items-center px-4 text-xs font-semibold text-purple-700/80 dark:text-purple-400/80"
                          >
                            <span className="text-[11px]">Solo Pruebas de Concepto y Validaciones</span>
                          </div>
                        </div>
                        {pocGanttProjects.map(renderProjectGanttRow)}
                      </>
                    );
                  }

                  return filteredGanttProjects.map(renderProjectGanttRow);
                })()
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN PRINCIPAL: CONTROL Y GESTIÓN DE TAREAS (VINCULADAS E INDEPENDIENTES) */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs space-y-4">
        {/* Header with Title, Stats Badges and Action Buttons */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-cyan-400">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-neutral-100 flex items-center gap-2">
                  <span>Control y Seguimiento de Tareas</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 font-mono">
                    {filteredControlTasks.length} {filteredControlTasks.length === 1 ? 'actividad' : 'actividades'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                  Supervisión centralizada de actividades independientes o vinculadas a proyectos, estados y responsables.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts & New Task Trigger */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsQuickAddExpanded(!isQuickAddExpanded)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border shadow-2xs cursor-pointer ${
                isQuickAddExpanded
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                  : 'bg-white dark:bg-neutral-800 text-slate-700 dark:text-neutral-200 border-slate-200 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-700'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isQuickAddExpanded ? 'Cerrar Alta Rápida' : 'Alta Rápida'}</span>
            </button>

            <button
              onClick={() => onOpenTaskModal?.(null)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Tarea Completa</span>
            </button>

            <button
              onClick={() => store.setActiveView('kanban')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-neutral-300 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
              title="Abrir en Tablero Kanban"
            >
              <Columns3 className="w-3.5 h-3.5 text-blue-500" />
              <span>Kanban</span>
            </button>

            <button
              onClick={() => store.setActiveView('my-work')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-neutral-300 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors cursor-pointer"
              title="Abrir en Mi Trabajo"
            >
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Mi Trabajo</span>
            </button>
          </div>
        </div>

        {/* Metric summary pills */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
            <span className="text-[11px] text-blue-700 dark:text-cyan-300 block font-bold">⏳ Pendientes</span>
            <span className="text-base font-bold text-blue-800 dark:text-cyan-200 font-mono">{controlTaskStats.pending}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-neutral-800/50 border border-slate-200 dark:border-neutral-800">
            <span className="text-[11px] text-slate-500 dark:text-neutral-400 block">Total Tareas</span>
            <span className="text-base font-bold text-slate-900 dark:text-white font-mono">{controlTaskStats.total}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60">
            <span className="text-[11px] text-indigo-700 dark:text-indigo-300 block font-medium">⭐ Independientes</span>
            <span className="text-base font-bold text-indigo-800 dark:text-indigo-200 font-mono">{controlTaskStats.independent}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60">
            <span className="text-[11px] text-blue-700 dark:text-blue-300 block font-medium">📁 De Proyectos</span>
            <span className="text-base font-bold text-blue-800 dark:text-blue-200 font-mono">{controlTaskStats.withProject}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60">
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block font-medium">Completadas</span>
            <span className="text-base font-bold text-emerald-800 dark:text-emerald-200 font-mono">{controlTaskStats.completed}</span>
          </div>
          <div className={`p-2.5 rounded-lg border ${
            controlTaskStats.overdue > 0
              ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200/80 dark:border-rose-900/60 text-rose-700 dark:text-rose-300'
              : 'bg-slate-50 dark:bg-neutral-800/50 border-slate-200 dark:border-neutral-800 text-slate-500 dark:text-neutral-400'
          }`}>
            <span className="text-[11px] block font-medium">Vencidas</span>
            <span className="text-base font-bold font-mono">{controlTaskStats.overdue}</span>
          </div>
        </div>

        {/* Inline Quick Add Task Form */}
        {isQuickAddExpanded && (
          <form
            onSubmit={handleCreateQuickTask}
            className="p-3.5 bg-slate-50/90 dark:bg-neutral-800/60 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-3 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                <span>Creación Rápida de Tarea</span>
              </span>
              <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                Al asociarla a un proyecto, el 100% de avance se reparte equitativamente (1 = 100%, 2 = 50% c/u, 3 = 33.3% c/u).
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
              <div className="sm:col-span-5">
                <input
                  type="text"
                  required
                  placeholder="Título de la tarea o pendiente *"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-slate-900 dark:text-neutral-100 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-3">
                <select
                  value={quickProjectId}
                  onChange={(e) => setQuickProjectId(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-neutral-200 focus:outline-hidden"
                >
                  <option value="">⭐ Sin proyecto (Independiente)</option>
                  {productiveProjects.length > 0 && (
                    <optgroup label="Proyectos Productivos:">
                      {productiveProjects.map(({ project: p }) => (
                        <option key={p.id} value={p.id}>
                          🚀 {p.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {pocProjects.length > 0 && (
                    <optgroup label="PoCs / PLCs:">
                      {pocProjects.map(({ project: p }) => (
                        <option key={p.id} value={p.id}>
                          🧪 {p.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Responsable..."
                  value={quickOwner}
                  onChange={(e) => setQuickOwner(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-neutral-200 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="date"
                  value={quickDue}
                  onChange={(e) => setQuickDue(e.target.value)}
                  className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg px-2 py-1.5 text-slate-800 dark:text-neutral-200 font-mono text-[11px] focus:outline-hidden"
                  title="Fecha de vencimiento"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs">
                <span className="text-slate-600 dark:text-neutral-400">Prioridad:</span>
                {(['Baja', 'Media', 'Alta', 'Crítica'] as TaskPriority[]).map((pr) => (
                  <button
                    key={pr}
                    type="button"
                    onClick={() => setQuickPriority(pr)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      quickPriority === pr
                        ? pr === 'Crítica'
                          ? 'bg-rose-600 text-white font-bold'
                          : pr === 'Alta'
                          ? 'bg-amber-600 text-white font-bold'
                          : pr === 'Media'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-700 text-white font-bold'
                        : 'bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 text-slate-600 dark:text-neutral-400 hover:bg-slate-100'
                    }`}
                  >
                    {pr}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsQuickAddExpanded(false)}
                  className="px-3 py-1 text-xs text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-2xs cursor-pointer"
                >
                  Guardar Tarea
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Interactive Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Scope Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-neutral-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => setTaskScopeFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                taskScopeFilter === 'all'
                  ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todas ({controlTaskStats.total})
            </button>
            <button
              onClick={() => setTaskScopeFilter('independent')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                taskScopeFilter === 'independent'
                  ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-300'
              }`}
            >
              <span>⭐ Independientes</span>
              <span className="font-mono text-[10px]">({controlTaskStats.independent})</span>
            </button>
            <button
              onClick={() => setTaskScopeFilter('with_project')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer ${
                taskScopeFilter === 'with_project'
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-300'
              }`}
            >
              <span>📁 De Proyectos</span>
              <span className="font-mono text-[10px]">({controlTaskStats.withProject})</span>
            </button>
          </div>

          {/* Detailed Filters & Search */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status filter */}
            <select
              value={taskStatusFilter}
              onChange={(e) => setTaskStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-neutral-200 focus:outline-hidden font-medium"
            >
              <option value="pending">⏳ Pendientes (Por defecto)</option>
              <option value="all">Todos los estados (incluye completadas)</option>
              <option value="Pendiente">Solo estado: Pendiente</option>
              <option value="En curso">Solo estado: En curso</option>
              <option value="En espera">Solo estado: En espera</option>
              <option value="En validación">Solo estado: En validación</option>
              <option value="Completado">Solo estado: Completado</option>
            </select>

            {/* Project filter */}
            <select
              value={taskProjectSelectFilter}
              onChange={(e) => setTaskProjectSelectFilter(e.target.value)}
              className="bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-neutral-200 focus:outline-hidden max-w-[170px] truncate"
            >
              <option value="all">Cualquier proyecto</option>
              {productiveProjects.length > 0 && (
                <optgroup label="Proyectos Productivos:">
                  {productiveProjects.map(({ project: p }) => (
                    <option key={p.id} value={p.id}>
                      🚀 {p.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {pocProjects.length > 0 && (
                <optgroup label="PoCs / PLCs:">
                  {pocProjects.map(({ project: p }) => (
                    <option key={p.id} value={p.id}>
                      🧪 {p.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar tarea o responsable..."
                value={taskSearchQuery}
                onChange={(e) => setTaskSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-slate-800 dark:text-neutral-200 focus:outline-hidden w-44 sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Task Cards / Table List */}
        <div className="space-y-2 overflow-y-auto max-h-[520px] pr-1">
          {filteredControlTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-neutral-500 bg-slate-50/60 dark:bg-neutral-800/30 rounded-xl border border-dashed border-slate-200 dark:border-neutral-800 space-y-2">
              <CheckSquare className="w-8 h-8 text-slate-300 dark:text-neutral-600 mx-auto" />
              <p className="font-medium text-slate-600 dark:text-neutral-400">
                No se encontraron actividades con los filtros actuales
              </p>
              <div className="flex justify-center gap-2 pt-1">
                <button
                  onClick={() => {
                    setTaskScopeFilter('all');
                    setTaskStatusFilter('all');
                    setTaskProjectSelectFilter('all');
                    setTaskSearchQuery('');
                  }}
                  className="px-3 py-1 text-xs bg-slate-200 hover:bg-slate-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 rounded-lg text-slate-700 dark:text-neutral-200 cursor-pointer"
                >
                  Limpiar Filtros
                </button>
                <button
                  onClick={() => onOpenTaskModal?.(null)}
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-semibold cursor-pointer"
                >
                  + Crear Tarea
                </button>
              </div>
            </div>
          ) : (
            filteredControlTasks.map((task) => {
              const project = projects.find((p) => p.id === task.projectId);
              const isDone = task.status === 'Completado';
              const isOverdue = task.due && task.due < todayStr && !isDone;

              return (
                <div
                  key={task.id}
                  onClick={() => onOpenTaskModal?.(task, task.projectId)}
                  className={`group p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all cursor-pointer ${
                    isDone
                      ? 'bg-slate-50/70 dark:bg-neutral-900/40 border-slate-200/80 dark:border-neutral-800/60 opacity-80 hover:opacity-100'
                      : isOverdue
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-400'
                      : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-800 hover:border-blue-400 dark:hover:border-neutral-700 shadow-2xs'
                  }`}
                >
                  {/* Left Column: Checkbox, Title, Badges */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleUpdateTaskStatus(task, isDone ? 'En curso' : 'Completado');
                      }}
                      className="mt-0.5 rounded border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-blue-600 focus:ring-0 cursor-pointer h-4 w-4 shrink-0"
                    />

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Task Title */}
                        <span
                          className={`font-semibold group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors ${
                            isDone
                              ? 'text-slate-400 dark:text-neutral-500 line-through'
                              : 'text-slate-900 dark:text-neutral-100'
                          }`}
                        >
                          {task.title}
                        </span>

                        {/* Priority pill */}
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                            task.priority === 'Crítica'
                              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : task.priority === 'Alta'
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : task.priority === 'Baja'
                              ? 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400'
                              : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {task.priority || 'Media'}
                        </span>
                      </div>

                      {/* Sub-line: Project connection vs Independent */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-neutral-400">
                        {project ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              store.setActiveView('projects', project.id);
                            }}
                            className="inline-flex items-center gap-1.5 font-medium text-blue-600 dark:text-cyan-400 hover:underline bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 px-1.5 py-0.5 rounded shrink-0 cursor-pointer"
                            title="Ir al detalle del proyecto"
                          >
                            <BrandLogo
                              brandId={project.brandId}
                              projectName={project.name}
                              size="2xs"
                            />
                            <span className="truncate max-w-[190px]">{project.name}</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 px-1.5 py-0.5 rounded shrink-0">
                            <span>⭐ Independiente / General</span>
                          </span>
                        )}

                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[130px]">{task.owner || 'Sin asignar'}</span>
                        </span>

                        {task.due && (
                          <>
                            <span>·</span>
                            <span
                              className={`flex items-center gap-1 font-mono ${
                                isOverdue
                                  ? 'text-rose-600 dark:text-rose-400 font-bold'
                                  : 'text-slate-600 dark:text-neutral-400'
                              }`}
                            >
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>Vence: {task.due}</span>
                              {isOverdue && <span className="text-[10px] bg-rose-100 dark:bg-rose-950 px-1 rounded">¡Vencida!</span>}
                            </span>
                          </>
                        )}

                        {task.checklist && task.checklist.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-[10px] text-slate-500 dark:text-neutral-400 font-mono">
                              ✓ {task.checklist.filter((c: any) => c.done).length}/{task.checklist.length}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Status dropdown, Progress bar, Quick Actions */}
                  <div
                    className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-neutral-800"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Status dropdown */}
                    <select
                      value={task.status}
                      onChange={(e) => handleUpdateTaskStatus(task, e.target.value as TaskStatus)}
                      className={`text-[11px] font-semibold rounded-lg px-2 py-1 border transition-colors cursor-pointer ${
                        task.status === 'Completado'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : task.status === 'En curso'
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                          : task.status === 'En espera'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          : task.status === 'En validación'
                          ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                          : 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border-slate-300 dark:border-neutral-700'
                      }`}
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En curso">En curso</option>
                      <option value="En espera">En espera</option>
                      <option value="En validación">En validación</option>
                      <option value="Completado">Completado</option>
                    </select>

                    {/* Progress Bar */}
                    <div className="w-20 hidden md:block">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-neutral-400 mb-0.5">
                        <span>Avance</span>
                        <span className="font-semibold">{task.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            task.progress === 100
                              ? 'bg-emerald-500'
                              : task.progress >= 50
                              ? 'bg-blue-500'
                              : 'bg-cyan-500'
                          }`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenTaskModal?.(task, task.projectId)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                        title="Editar tarea completa"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTask(task.id, e)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar tarea"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Secondary Grid: Attention Panel & Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Attention Panel with Tabs (RF-07) */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs flex flex-col">
          {/* Tabs Header */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-neutral-800/60 rounded-lg mb-4 text-xs font-medium">
            <button
              onClick={() => setActiveTab('attention')}
              className={`flex-1 py-1.5 px-2 rounded-md transition-colors text-center ${
                activeTab === 'attention'
                  ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
              }`}
            >
              Atención ({overdueTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex-1 py-1.5 px-2 rounded-md transition-colors text-center ${
                activeTab === 'sessions'
                  ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
              }`}
            >
              Sesiones
            </button>
            <button
              onClick={() => setActiveTab('noAction')}
              className={`flex-1 py-1.5 px-2 rounded-md transition-colors text-center ${
                activeTab === 'noAction'
                  ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
              }`}
            >
              Sin Acción
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-1.5 px-2 rounded-md transition-colors text-center ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-neutral-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-neutral-200'
              }`}
            >
              Actividad
            </button>
          </div>

          {/* Tab 1: Attention */}
          {activeTab === 'attention' && (
            <div className="space-y-2.5 overflow-y-auto max-h-[360px]">
              {overdueTasks.length === 0 && due7DaysTasks.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-neutral-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400 mx-auto mb-2 opacity-80" />
                  ¡Todo al día! No hay tareas vencidas ni críticas pendientes.
                </div>
              ) : (
                [...overdueTasks, ...due7DaysTasks].slice(0, 8).map((task) => {
                  const isOverdue = task.due && task.due < todayStr;
                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-lg border flex items-start gap-3 transition-colors ${
                        isOverdue
                          ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                          : 'bg-slate-50 dark:bg-neutral-800/40 border-slate-200 dark:border-neutral-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={task.status === 'Completado'}
                        onChange={() => toggleTaskDone(task)}
                        className="mt-0.5 rounded border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-blue-600 dark:text-cyan-600 focus:ring-0 cursor-pointer"
                      />
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-medium text-slate-800 dark:text-neutral-200 truncate">
                          {task.title}
                        </h5>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-neutral-400 mt-1">
                          <span className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}>
                            Vence: {task.due}
                          </span>
                          <span>·</span>
                          <span>{task.owner || 'Sin asignar'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Tab 2: Sessions */}
          {activeTab === 'sessions' && (
            <div className="space-y-2.5 overflow-y-auto max-h-[360px]">
              {Object.values(state.records)
                .filter((r) => r.kind === 'note' && !r.deletedAt)
                .map((note: any) => (
                  <div
                    key={note.id}
                    className="p-3 bg-slate-50 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-800 rounded-lg"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-neutral-400 mb-1">
                      <span className="font-semibold text-blue-600 dark:text-cyan-400">{note.type}</span>
                      <span>{note.date}</span>
                    </div>
                    <h5 className="text-xs font-medium text-slate-800 dark:text-neutral-200">{note.title}</h5>
                  </div>
                ))}
            </div>
          )}

          {/* Tab 3: No Action */}
          {activeTab === 'noAction' && (
            <div className="space-y-2.5 overflow-y-auto max-h-[360px]">
              {noNextActionProjects.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 dark:text-neutral-500">
                  Todos los proyectos tienen siguiente acción definida.
                </div>
              ) : (
                noNextActionProjects.map(({ project }) => (
                  <div
                    key={project.id}
                    onClick={() => store.setActiveView('projects', project.id)}
                    className="p-3 bg-slate-50 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 rounded-lg cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <BrandLogo
                        brandId={project.brandId}
                        projectName={project.name}
                        size="xs"
                      />
                      <h5 className="text-xs font-semibold text-slate-800 dark:text-neutral-200">{project.name}</h5>
                    </div>
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">Falta definir siguiente paso</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 4: History */}
          {activeTab === 'history' && (
            <div className="space-y-2.5 overflow-y-auto max-h-[360px]">
              {Object.values(state.records)
                .filter((r) => r.kind === 'hist')
                .sort((a: any, b: any) => new Date(b.at).getTime() - new Date(a.at).getTime())
                .slice(0, 8)
                .map((h: any) => (
                  <div
                    key={h.id}
                    className="p-2.5 bg-slate-50 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-800 rounded-lg text-xs"
                  >
                    <p className="text-slate-700 dark:text-neutral-300 leading-relaxed">{h.text}</p>
                    <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-mono mt-1 block">
                      {new Date(h.at).toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Right Column: Status Distribution */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100 mb-3">Distribución de Actividades</h3>
          <div className="space-y-2.5">
            {Object.entries(taskStats).map(([status, count]) => (
              <div
                key={status}
                onClick={() => store.setActiveView('kanban')}
                className="p-3 bg-slate-50 dark:bg-neutral-800/40 border border-slate-200 dark:border-neutral-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-neutral-800/70 transition-colors flex items-center justify-between"
              >
                <span className="text-xs text-slate-700 dark:text-neutral-300 font-medium">{status}</span>
                <span className="text-base font-bold text-slate-900 dark:text-neutral-100 font-mono tabular-nums">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Executive Report Modal */}
      <DashboardExecutiveReportModal
        isOpen={isExecutiveReportOpen}
        onClose={() => setIsExecutiveReportOpen(false)}
        initialFilter={
          portfolioTypeFilter === 'all' || portfolioTypeFilter === 'split'
            ? 'all'
            : portfolioTypeFilter
        }
      />
    </div>
  );
};
