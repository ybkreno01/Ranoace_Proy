import React, { useState, useEffect } from 'react';
import { store } from './services/store';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ProjectsView } from './components/ProjectsView';
import { ProjectDetailView } from './components/ProjectDetailView';
import { MyWorkView } from './components/MyWorkView';
import { KanbanView } from './components/KanbanView';
import { CalendarView } from './components/CalendarView';
import { DailyPlanningView } from './components/DailyPlanningView';
import { GanttView } from './components/GanttView';
import { TechnicalLibraryView } from './components/TechnicalLibraryView';
import { CatalogsView } from './components/CatalogsView';
import { ReportsView } from './components/ReportsView';
import { GoogleDriveBackupsView } from './components/GoogleDriveBackupsView';
import { TrashView } from './components/TrashView';
import { SettingsView } from './components/SettingsView';
import { AdminConsoleView } from './components/AdminConsoleView';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ProjectModal } from './components/modals/ProjectModal';
import { TaskModal } from './components/modals/TaskModal';
import { NoteModal } from './components/modals/NoteModal';
import { GuideModal } from './components/modals/GuideModal';
import { ScriptModal } from './components/modals/ScriptModal';
import { TroubleModal } from './components/modals/TroubleModal';
import { ConfirmModal } from './components/modals/ConfirmModal';
import { PlanTplModal } from './components/modals/PlanTplModal';
import { Project, Task, Guide, Script, Trouble, PlanTpl } from './types';
import { auth, googleSignIn, subscribeToAuth, testConnection } from './services/firebase';

export default function App() {
  const [, setTick] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(auth.currentUser));
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Modals state
  const [projectModalState, setProjectModalState] = useState<{
    isOpen: boolean;
    project?: Project | null;
    defaultTypeId?: string;
  }>({ isOpen: false, project: null });

  const [taskModalState, setTaskModalState] = useState<{
    isOpen: boolean;
    task?: Task | null;
    projectId?: string;
    sectionId?: string;
  }>({ isOpen: false, task: null });

  const [noteModalState, setNoteModalState] = useState<{
    isOpen: boolean;
    projectId: string;
  }>({ isOpen: false, projectId: '' });

  const [guideModalState, setGuideModalState] = useState<{
    isOpen: boolean;
    guide?: Guide | null;
  }>({ isOpen: false, guide: null });

  const [scriptModalState, setScriptModalState] = useState<{
    isOpen: boolean;
    script?: Script | null;
  }>({ isOpen: false, script: null });

  const [troubleModalState, setTroubleModalState] = useState<{
    isOpen: boolean;
    trouble?: Trouble | null;
  }>({ isOpen: false, trouble: null });

  const [planTplModalState, setPlanTplModalState] = useState<{
    isOpen: boolean;
    plantpl?: PlanTpl | null;
  }>({ isOpen: false, plantpl: null });

  const [deleteConfirmProject, setDeleteConfirmProject] = useState<Project | null>(null);

  // Theme state: default to 'light' as requested in user screenshots
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('cci_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('cci_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Subscribe to store updates and pull latest Google Drive state on app launch
  useEffect(() => {
    const unsub = store.subscribe(() => setTick((t) => t + 1));
    testConnection(); // Mandated initial Firestore connection test
    store.pullLatestFromGoogleDrive().catch((err) =>
      console.warn('Startup Google Drive sync:', err)
    );
    return () => {
      unsub();
    };
  }, []);

  useEffect(() => subscribeToAuth((user) => {
    setIsAuthenticated(Boolean(user));
    setIsAuthReady(true);
  }), []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setLoginError('');
    try {
      await googleSignIn();
    } catch {
      setLoginError('No se pudo iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Global Ctrl+K / Cmd+K hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const state = store.getState();
  const currentView = state.activeView;

  // Handle selecting a record from Global Search
  const handleSelectSearchResult = (record: any) => {
    if (record.kind === 'project') {
      store.setActiveView('projects', record.id);
    } else if (record.kind === 'task') {
      if (record.projectId) {
        store.setActiveView('projects', record.projectId);
      } else {
        store.setActiveView('my-work');
      }
    } else if (record.kind === 'guide' || record.kind === 'pguide' || record.kind === 'interactive_guide') {
      store.setActiveView('library', null, record.id);
    } else if (record.kind === 'script' || record.kind === 'trouble') {
      store.setActiveView('library');
    } else if (['brand', 'client', 'channel', 'worktype', 'tag'].includes(record.kind)) {
      store.setActiveView('catalogs');
    }
  };

  // Clone project (RF-15)
  const handleCloneProject = (sourceProject: Project) => {
    const newId = `proj-${Math.random().toString(36).substring(2, 8)}`;
    const clonedProject: Project = {
      ...sourceProject,
      id: newId,
      name: `${sourceProject.name} (Copia Clonada)`,
      status: 'Borrador',
      condition: 'Clonado de ' + sourceProject.name,
      criteria: (sourceProject.criteria || []).map((c) => ({ ...c, done: false })),
      closure: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.putRecord(clonedProject);

    // Duplicate project tasks as well and reset to 0% progress
    const sourceTasks = store.getProjectTasks(sourceProject.id);
    sourceTasks.forEach((t) => {
      const newTaskId = `task-${newId}-${Math.random().toString(36).substring(2, 8)}`;
      store.putRecord({
        ...t,
        id: newTaskId,
        projectId: newId,
        status: 'Pendiente',
        progress: 0,
        realStart: undefined,
        realEnd: undefined,
        checklist: (t.checklist || []).map((c: any) => ({ ...c, done: false })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    store.setActiveView('projects', newId);
  };

  // Quick Create dispatcher
  const handleQuickCreate = (type: 'project' | 'task' | 'guide' | 'script' | 'trouble') => {
    if (type === 'project') {
      setProjectModalState({ isOpen: true, project: null });
    } else if (type === 'task') {
      setTaskModalState({ isOpen: true, task: null });
    } else if (type === 'guide') {
      setGuideModalState({ isOpen: true, guide: null });
    } else if (type === 'script') {
      setScriptModalState({ isOpen: true, script: null });
    } else if (type === 'trouble') {
      setTroubleModalState({ isOpen: true, trouble: null });
    }
  };

  const selectedProject = state.selectedProjectId
    ? (state.records[state.selectedProjectId] as Project)
    : null;

  if (!isAuthReady) {
    return <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-600">Validando acceso…</div>;
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen grid place-items-center bg-slate-50 p-6 text-center text-slate-800">
        <section className="max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-blue-600 text-lg font-bold text-white">CC</div>
          <h1 className="text-xl font-bold">Centro de Control</h1>
          <p className="mt-2 text-sm text-slate-600">Accede con tu cuenta de Google para abrir tu espacio personal.</p>
          <button
            type="button"
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white disabled:opacity-60"
          >
            {isSigningIn ? 'Accediendo…' : 'Acceder con Google'}
          </button>
          {loginError && <p className="mt-3 text-sm text-red-600">{loginError}</p>}
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 text-slate-800 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-150">
      {/* Top Navbar */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onQuickCreate={handleQuickCreate}
        theme={theme}
        onToggleTheme={toggleTheme}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Collapsible Desktop Sidebar & Off-Canvas Mobile Drawer */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/60 dark:bg-neutral-950/60 pb-16">
          {currentView === 'dashboard' && (
            <DashboardView
              onOpenProjectModal={(p, defaultTypeId) =>
                setProjectModalState({ isOpen: true, project: p, defaultTypeId })
              }
              onDeleteProject={(p) => setDeleteConfirmProject(p)}
              onOpenTaskModal={(t, pId) =>
                setTaskModalState({ isOpen: true, task: t, projectId: pId })
              }
            />
          )}

          {currentView === 'projects' && (
            <>
              {selectedProject ? (
                <ProjectDetailView
                  project={selectedProject}
                  onBack={() => store.setSelectedProject(null)}
                  onOpenTaskModal={(t, pId, sId) =>
                    setTaskModalState({ isOpen: true, task: t, projectId: pId, sectionId: sId })
                  }
                  onOpenNoteModal={(pId) => setNoteModalState({ isOpen: true, projectId: pId })}
                  onOpenScriptModal={(s) => setScriptModalState({ isOpen: true, script: s })}
                  onOpenTroubleModal={(tr) => setTroubleModalState({ isOpen: true, trouble: tr })}
                  onOpenProjectModal={(p) => setProjectModalState({ isOpen: true, project: p })}
                />
              ) : (
                <ProjectsView
                  onOpenProjectModal={(p) => setProjectModalState({ isOpen: true, project: p })}
                  onCloneProject={handleCloneProject}
                  onDeleteProject={(p) => setDeleteConfirmProject(p)}
                />
              )}
            </>
          )}

          {currentView === 'my-work' && <MyWorkView />}

          {currentView === 'kanban' && (
            <KanbanView onOpenTaskModal={(t) => setTaskModalState({ isOpen: true, task: t })} />
          )}

          {currentView === 'calendar' && <CalendarView />}

          {currentView === 'daily-planning' && <DailyPlanningView />}

          {currentView === 'gantt' && <GanttView />}

          {currentView === 'library' && (
            <TechnicalLibraryView
              onOpenGuideModal={(g) => setGuideModalState({ isOpen: true, guide: g })}
              onOpenScriptModal={(s) => setScriptModalState({ isOpen: true, script: s })}
              onOpenTroubleModal={(tr) => setTroubleModalState({ isOpen: true, trouble: tr })}
              onOpenPlanTplModal={(tpl) => setPlanTplModalState({ isOpen: true, plantpl: tpl })}
              initialSelectedGuideId={state.selectedGuideId}
            />
          )}

          {currentView === 'catalogs' && <CatalogsView />}

          {currentView === 'reports' && <ReportsView />}

          {currentView === 'drive-backups' && <GoogleDriveBackupsView />}

          {currentView === 'trash' && <TrashView />}

          {currentView === 'settings' && <SettingsView />}

          {currentView === 'admin-console' && <AdminConsoleView />}
        </main>
      </div>

      {/* Global Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleSelectSearchResult}
      />

      {/* Create / Edit Project Modal */}
      <ProjectModal
        isOpen={projectModalState.isOpen}
        project={projectModalState.project}
        initialTypeId={projectModalState.defaultTypeId}
        onClose={() => setProjectModalState({ isOpen: false, project: null, defaultTypeId: undefined })}
      />

      {/* Create / Edit Task Modal */}
      <TaskModal
        isOpen={taskModalState.isOpen}
        task={taskModalState.task}
        projectId={taskModalState.projectId}
        sectionId={taskModalState.sectionId}
        onClose={() => setTaskModalState({ isOpen: false, task: null })}
      />

      {/* Create Note / Minuta Modal */}
      <NoteModal
        isOpen={noteModalState.isOpen}
        projectId={noteModalState.projectId}
        onClose={() => setNoteModalState({ isOpen: false, projectId: '' })}
      />

      {/* Create / Edit Guide Modal */}
      <GuideModal
        isOpen={guideModalState.isOpen}
        guide={guideModalState.guide}
        onClose={() => setGuideModalState({ isOpen: false, guide: null })}
        onCreated={(g) => store.setActiveView('library', null, g.id)}
      />

      {/* Create / Edit Script Modal */}
      <ScriptModal
        isOpen={scriptModalState.isOpen}
        script={scriptModalState.script}
        onClose={() => setScriptModalState({ isOpen: false, script: null })}
      />

      {/* Create / Edit Troubleshooting Modal */}
      <TroubleModal
        isOpen={troubleModalState.isOpen}
        trouble={troubleModalState.trouble}
        onClose={() => setTroubleModalState({ isOpen: false, trouble: null })}
      />

      {/* Create / Edit Plan Template Modal */}
      <PlanTplModal
        isOpen={planTplModalState.isOpen}
        plantpl={planTplModalState.plantpl}
        onClose={() => setPlanTplModalState({ isOpen: false, plantpl: null })}
      />

      {/* Delete Project Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmProject}
        title="Enviar Proyecto a la Papelera"
        message={`¿Estás seguro de que deseas enviar "${deleteConfirmProject?.name}" a la papelera?\n\nTodas sus actividades, minutas y guías asociadas se conservarán en la papelera y podrán ser restauradas.`}
        confirmText="Enviar a papelera"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={() => {
          if (deleteConfirmProject) {
            store.deleteRecord(deleteConfirmProject.id, true);
            setDeleteConfirmProject(null);
          }
        }}
        onCancel={() => setDeleteConfirmProject(null)}
      />
    </div>
  );
}
