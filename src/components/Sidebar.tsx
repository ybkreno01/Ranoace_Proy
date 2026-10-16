import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Columns3,
  Calendar,
  GanttChartSquare,
  BookOpen,
  Tag,
  BarChart3,
  HardDriveDownload,
  Trash2,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { store } from '../services/store';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const state = store.getState();
  const currentView = state.activeView;

  // Overdue count badge for Mi trabajo (RF-01)
  const allTasks = store.getAllTasks();
  const now = new Date().toISOString().split('T')[0];
  const overdueCount = allTasks.filter(
    (t: any) => t.status !== 'Completado' && t.due && t.due < now
  ).length;

  const trashCount = store.getTrashItems().length;

  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'projects', label: 'Proyectos', icon: FolderKanban },
    {
      id: 'my-work',
      label: 'Mi trabajo',
      icon: CheckSquare,
      badge: overdueCount > 0 ? overdueCount : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-500 dark:text-rose-400 border border-rose-500/30',
    },
    { id: 'kanban', label: 'Kanban', icon: Columns3 },
    { id: 'calendar', label: 'Calendario', icon: Calendar },
    { id: 'gantt', label: 'Cronograma', icon: GanttChartSquare },
    { id: 'library', label: 'Biblioteca técnica', icon: BookOpen },
    { id: 'catalogs', label: 'Catálogos', icon: Tag },
    { id: 'reports', label: 'Reportes & Entregables', icon: BarChart3 },
    { id: 'drive-backups', label: 'Google Drive y Respaldos', icon: HardDriveDownload },
    {
      id: 'trash',
      label: 'Papelera',
      icon: Trash2,
      badge: trashCount > 0 ? trashCount : undefined,
      badgeColor: 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700',
    },
    {
      id: 'admin-console',
      label: 'Consola Admin & Usuarios',
      icon: ShieldCheck,
      badge: 'Admin',
      badgeColor: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
    },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const handleNavClick = (viewId: string) => {
    store.setActiveView(viewId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Sidebar (< md) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-neutral-900 border-r border-slate-200 dark:border-neutral-800 shadow-2xl flex flex-col justify-between md:hidden transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Mobile Header with brand & close */}
          <div className="p-4 border-b border-slate-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                CC
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-neutral-100 block">
                  Centro de Control
                </span>
                <span className="text-[10px] text-slate-500 dark:text-neutral-400">
                  Ingeniería & Proyectos
                </span>
              </div>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items (Touch-friendly) */}
          <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentView === item.id ||
                (item.id === 'projects' && currentView === 'project-detail');

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-medium transition-colors group relative ${
                    isActive
                      ? 'bg-blue-50 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-cyan-500/20 font-semibold shadow-2xs'
                      : 'text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-blue-600 dark:text-cyan-400' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>

                  {item.badge !== undefined && (
                    <span
                      className={`ml-auto px-2 py-0.5 text-[10px] font-mono rounded-full tabular-nums ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-3 border-t border-slate-200 dark:border-neutral-800/80 text-[11px] text-slate-500 dark:text-neutral-400 text-center">
          Versión Móvil Optimizada · CCI
        </div>
      </aside>

      {/* Desktop Sidebar (hidden on mobile, visible md:flex) */}
      <aside
        className={`hidden md:flex border-r border-slate-800 bg-slate-900 shadow-xl shadow-slate-950/10 transition-all duration-200 flex-col justify-between shrink-0 z-20 select-none ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Navigation items list */}
        <div className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentView === item.id ||
              (item.id === 'projects' && currentView === 'project-detail');

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors group relative cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-950/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}

                {/* Badges */}
                {!isCollapsed && item.badge !== undefined && (
                  <span
                    className={`ml-auto px-1.5 py-0.5 text-[10px] font-mono rounded-full tabular-nums ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Floating dot for collapsed sidebar */}
                {isCollapsed && item.badge !== undefined && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Collapse Toggle Footer */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expandir barra lateral' : 'Contraer barra lateral a la izquierda'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium">
                <ChevronLeft className="w-4 h-4" />
                <span>Contraer menú</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
