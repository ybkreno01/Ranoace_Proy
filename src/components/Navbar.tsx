import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Cloud,
  CheckCircle2,
  HardDrive,
  LogOut,
  ChevronDown,
  FolderKanban,
  CheckSquare,
  BookOpen,
  Terminal,
  AlertCircle,
  Sun,
  Moon,
  Bell,
  Check,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  RefreshCw,
} from 'lucide-react';
import { store } from '../services/store';
import { googleSignIn, logOut, auth, subscribeToAuth } from '../services/firebase';
import { User } from 'firebase/auth';

interface NavbarProps {
  onOpenSearch: () => void;
  onQuickCreate: (type: 'project' | 'task' | 'guide' | 'script' | 'trouble') => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  isMobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onQuickCreate,
  theme = 'light',
  onToggleTheme,
  isSidebarCollapsed = false,
  onToggleSidebar,
  isMobileMenuOpen = false,
  onToggleMobileMenu,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [driveToast, setDriveToast] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<{ text: string; tone: 'ok' | 'warn' } | null>(null);
  const state = store.getState();

  useEffect(() => {
    const unsub = subscribeToAuth((user) => {
      setCurrentUser(user);
      store.handleAuthChange(user ? user.uid : null);
    });
    return () => unsub();
  }, []);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        // Immediately consume data from Google Drive
        const pullRes = await store.pullLatestFromGoogleDrive(true);
        if (pullRes.updated) {
          setDriveToast(`¡Datos consumidos de Google Drive! (${pullRes.count} registros sincronizados)`);
          setTimeout(() => setDriveToast(null), 4000);
        } else {
          setDriveToast('Google Drive conectado y datos actualizados.');
          setTimeout(() => setDriveToast(null), 3000);
        }
      }
    } catch (err) {
      console.error('Login error', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  // Guardado manual: sincroniza en ambos sentidos con la nube (Firestore) y con Google Drive
  const handleManualSave = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const r = await store.syncNow();
      const parts: string[] = [];
      let warn = false;
      if (r.firestore === 'ok') {
        const moves = [r.pulledFromCloud > 0 ? `${r.pulledFromCloud} recibidos` : '', r.pushedToCloud > 0 ? `${r.pushedToCloud} enviados` : ''].filter(Boolean).join(', ');
        parts.push(`Nube ✓${moves ? ` (${moves})` : ''}`);
      } else if (r.firestore === 'sin-sesion') {
        parts.push('Nube: inicia sesión con Google para sincronizar entre equipos');
        warn = true;
      } else {
        const detail = r.errors.find((error) => error.startsWith('Firestore:'))?.replace('Firestore: ', '');
        parts.push(`Nube: error${detail ? ` (${detail.slice(0, 90)})` : ', se reintentará'}`);
        warn = true;
      }
      if (r.drive === 'ok') {
        parts.push(`Drive ✓${r.pulledFromDrive > 0 ? ` (${r.pulledFromDrive} traídos)` : ''}`);
      } else if (r.drive === 'expired') {
        parts.push('Drive: la autorización venció, reconecta en "Google Drive y Respaldos"');
        warn = true;
      } else if (r.drive === 'disconnected') {
        parts.push('Drive: sin sesión de Google');
        warn = true;
      } else {
        const detail = r.errors.find((error) => error.startsWith('Drive:'))?.replace('Drive: ', '');
        parts.push(`Drive: error al respaldar${detail ? ` (${detail.slice(0, 90)})` : ''}`);
        warn = true;
      }
      setSyncToast({ text: parts.join(' · '), tone: warn ? 'warn' : 'ok' });
    } catch (err) {
      console.error('Manual save error', err);
      setSyncToast({ text: 'No se pudo completar el guardado manual.', tone: 'warn' });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncToast(null), 7000);
    }
  };

  const handleLogout = async () => {
    try {
      // 1. Guarantee all pending changes are flushed to localStorage, Firestore and Google Drive
      await store.flushPendingSave();
      // 2. Perform sign out - note that all user records and changes remain fully intact in localStorage!
      await logOut();
      setIsUserMenuOpen(false);
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  return (
    <header className="h-14 border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-6 z-30 sticky top-0 transition-colors">
      {/* Zone 1: Mobile Hamburger + Logo & Brand + Desktop Sidebar Toggle */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Mobile Hamburger toggle */}
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-1.5 -ml-1 rounded-lg text-slate-600 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-label="Menú principal"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-slate-700 dark:text-white" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <button
          onClick={() => store.setActiveView('dashboard')}
          className="flex items-center gap-2 sm:gap-2.5 text-left group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs tracking-tight shadow-xs group-hover:bg-blue-700 transition-colors">
            CC
          </div>
          <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-neutral-100 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors truncate max-w-[130px] sm:max-w-none">
            Centro de Control
          </span>
        </button>

        {/* Desktop Sidebar Collapse / Expand Toggle */}
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden md:flex items-center justify-center p-1.5 rounded-lg text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors ml-1 cursor-pointer"
            title={isSidebarCollapsed ? 'Expandir menú lateral' : 'Contraer menú a la izquierda'}
            aria-label="Contraer o expandir barra lateral"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Zone 2: Big Centered Search Bar as in Screenshot 1 */}
      <div className="flex-1 max-w-xl mx-auto hidden md:block">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2.5 bg-slate-100/90 dark:bg-neutral-800/80 hover:bg-slate-200/70 dark:hover:bg-neutral-800 border border-slate-200/90 dark:border-neutral-700/80 rounded-lg px-3.5 py-1.5 text-xs text-slate-500 dark:text-neutral-400 transition-colors shadow-2xs text-left"
          title="Buscar en todo el sistema (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-neutral-500 shrink-0" />
          <span className="truncate">
            Buscar proyectos, tareas, comandos, notas, archivos... ( / ) · Ctrl+K: comandos
          </span>
        </button>
      </div>

      {/* Zone 3: Right Action Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 text-xs">
        {/* Mobile search trigger */}
        <button
          onClick={onOpenSearch}
          className="md:hidden p-2 rounded-lg text-slate-500 dark:text-neutral-400 hover:bg-slate-100 dark:hover:bg-neutral-800"
          title="Buscar"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Persistence Status Badge */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 dark:text-neutral-400 font-medium">
          {state.saveStatus === 'saved' ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
              <span className="text-[11px]">Guardado {state.lastSavedAt}</span>
            </>
          ) : state.saveStatus === 'saving' ? (
            <>
              <Cloud className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span className="text-[11px]">Guardando...</span>
            </>
          ) : (
            <>
              <HardDrive className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px]">Local</span>
            </>
          )}
        </div>

        {/* Guardado manual */}
        <button
          type="button"
          onClick={handleManualSave}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700/80 text-emerald-800 dark:text-emerald-300 disabled:opacity-60"
          title="Guardar ahora: sincroniza con la nube y con Google Drive, y trae los cambios hechos en otros equipos"
          aria-label="Guardar ahora"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isSyncing ? 'Guardando…' : 'Guardar ahora'}</span>
        </button>

        {/* Google Drive Status Indicator */}
        <button
          type="button"
          onClick={() => store.setActiveView('drive-backups')}
          className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
            state.driveStatus === 'expired' || (state.driveStatus === 'disconnected' && state.settings.lastDriveSync)
              ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 border-amber-300 dark:border-amber-700/80 text-amber-800 dark:text-amber-300'
              : 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-cyan-300'
          }`}
          title={
            state.driveStatus === 'expired'
              ? 'La autorización de Google Drive venció: los respaldos automáticos están detenidos. Haz clic para reconectar.'
              : state.driveStatus === 'disconnected' && state.settings.lastDriveSync
              ? 'Sin sesión de Google: los respaldos automáticos en Drive están detenidos.'
              : state.settings.lastDriveSync
              ? `Google Drive sincronizado automáticamente: ${new Date(state.settings.lastDriveSync).toLocaleTimeString()}`
              : 'Configurar o sincronizar Google Drive'
          }
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>
            {state.driveStatus === 'expired'
              ? 'Drive: reconectar'
              : state.driveStatus === 'disconnected' && state.settings.lastDriveSync
              ? 'Drive: sin sesión'
              : `Drive ${state.settings.lastDriveSync ? 'Sincronizado' : 'Conectar'}`}
          </span>
        </button>

        {/* Theme Toggle Button (Sun / Moon) matching Screenshot 1 */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-lg text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 hover:text-indigo-600" />
            )}
          </button>
        )}

        {/* Quick Create Dropdown Button */}
        <div className="relative">
          <button
            onClick={() => setIsCreateOpen(!isCreateOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear</span>
            <ChevronDown className="w-3 h-3 opacity-80" />
          </button>

          {isCreateOpen && (
            <div
              className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-xl py-1.5 z-50 text-xs"
              onClick={() => setIsCreateOpen(false)}
            >
              <button
                onClick={() => onQuickCreate('project')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors text-left"
              >
                <FolderKanban className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span>Nuevo Proyecto</span>
              </button>
              <button
                onClick={() => onQuickCreate('task')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors text-left"
              >
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                <span>Nueva Tarea / Actividad</span>
              </button>
              <button
                onClick={() => onQuickCreate('guide')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors text-left"
              >
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span>Nueva Guía Técnica</span>
              </button>
              <button
                onClick={() => onQuickCreate('script')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors text-left"
              >
                <Terminal className="w-4 h-4 text-violet-500" />
                <span>Nuevo Script</span>
              </button>
              <button
                onClick={() => onQuickCreate('trouble')}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 dark:text-neutral-200 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors text-left"
              >
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span>Ficha Troubleshooting</span>
              </button>
            </div>
          )}
        </div>

        {/* User Auth Profile / Google Sign-in */}
        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-blue-500/50 transition-all"
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Usuario'}
                  className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-neutral-700"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center border border-blue-300 dark:border-blue-700">
                  {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                </div>
              )}
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-xl p-3 z-50 text-xs">
                <div className="pb-2 border-b border-slate-100 dark:border-neutral-800 mb-2">
                  <p className="font-semibold text-slate-800 dark:text-neutral-200 truncate">
                    {currentUser.displayName || 'Usuario Google'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-neutral-400 truncate">
                    {currentUser.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors text-left font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleGoogleLogin}
            disabled={isSigningIn}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-neutral-200 bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 border border-slate-200 dark:border-neutral-700 rounded-lg transition-colors whitespace-nowrap"
          >
            <span>{isSigningIn ? 'Conectando...' : 'Acceder'}</span>
          </button>
        )}
      </div>

      {syncToast && (
        <div
          role="status"
          className={`absolute top-16 left-1/2 -translate-x-1/2 z-50 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 border max-w-[92vw] ${
            syncToast.tone === 'ok' ? 'bg-emerald-600 border-emerald-400' : 'bg-amber-600 border-amber-400'
          }`}
        >
          <Cloud className="w-4 h-4 text-white shrink-0" />
          <span>{syncToast.text}</span>
        </div>
      )}

      {/* Floating Google Drive Sync Toast */}
      {driveToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-400 animate-in fade-in slide-in-from-top-2 duration-200">
          <Cloud className="w-4 h-4 text-white shrink-0" />
          <span>{driveToast}</span>
        </div>
      )}
    </header>
  );
};
