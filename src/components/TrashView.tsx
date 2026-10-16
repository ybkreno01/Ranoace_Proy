import React, { useState, useMemo } from 'react';
import {
  Trash2,
  RotateCcw,
  Search,
  AlertTriangle,
  FolderKanban,
  CheckSquare,
  BookOpen,
  Terminal,
  AlertCircle,
  Sparkles,
  Tag,
  FileText,
  Calendar,
} from 'lucide-react';
import { store } from '../services/store';
import { ConfirmModal } from './modals/ConfirmModal';

export const TrashView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [itemToPurge, setItemToPurge] = useState<any | null>(null);
  const [restoredToast, setRestoredToast] = useState<string | null>(null);

  const trashItems = store.getTrashItems();

  const filteredTrash = useMemo(() => {
    return trashItems.filter((item: any) => {
      if (filterType !== 'all' && item.kind !== filterType) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const name = (item.name || item.title || item.id || '').toLowerCase();
        const desc = (item.description || item.scope || '').toLowerCase();
        if (!name.includes(q) && !desc.includes(q)) return false;
      }
      return true;
    });
  }, [trashItems, filterType, search]);

  const handleRestore = (item: any) => {
    store.restoreRecord(item.id);
    const itemName = item.name || item.title || item.id;
    setRestoredToast(`"${itemName}" ha sido restaurado exitosamente.`);
    setTimeout(() => setRestoredToast(null), 3000);
  };

  const handlePurgeSingle = () => {
    if (itemToPurge) {
      store.deleteRecord(itemToPurge.id, false);
      setItemToPurge(null);
    }
  };

  const handleEmptyTrash = () => {
    store.emptyTrash();
    setIsPurgeModalOpen(false);
  };

  const getKindInfo = (kind: string) => {
    switch (kind) {
      case 'project':
        return { label: 'Proyecto', icon: FolderKanban, color: 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-cyan-300 border-blue-200 dark:border-blue-800' };
      case 'task':
        return { label: 'Tarea', icon: CheckSquare, color: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
      case 'guide':
      case 'pguide':
        return { label: 'Guía Técnica', icon: BookOpen, color: 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
      case 'interactive_guide':
        return { label: 'Guía Interactiva', icon: Sparkles, color: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
      case 'script':
        return { label: 'Script', icon: Terminal, color: 'bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800' };
      case 'trouble':
        return { label: 'Troubleshooting', icon: AlertCircle, color: 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' };
      case 'deliverable':
        return { label: 'Entregable', icon: FileText, color: 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' };
      case 'note':
        return { label: 'Minuta/Nota', icon: FileText, color: 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' };
      default:
        return { label: kind || 'Registro', icon: Tag, color: 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border-slate-200 dark:border-neutral-700' };
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {restoredToast && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between shadow-xs">
          <span>{restoredToast}</span>
          <button
            onClick={() => setRestoredToast(null)}
            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Papelera de Reciclaje
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300 border border-slate-200 dark:border-neutral-700">
                {trashItems.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
              Elementos eliminados temporalmente. Puedes restaurarlos o purgarlos definitivamente.
            </p>
          </div>
        </div>

        {trashItems.length > 0 && (
          <button
            type="button"
            onClick={() => setIsPurgeModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-white bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 dark:hover:bg-rose-700 border border-rose-200 dark:border-rose-800/80 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>Vaciar Papelera</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar en papelera por nombre o ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        {/* Filter Types */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'project', label: 'Proyectos' },
            { id: 'task', label: 'Tareas' },
            { id: 'guide', label: 'Guías' },
            { id: 'interactive_guide', label: 'Runbooks' },
            { id: 'script', label: 'Scripts' },
            { id: 'trouble', label: 'Trouble' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trash Items List */}
      {filteredTrash.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center text-slate-400 dark:text-neutral-500 mx-auto">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-800 dark:text-neutral-200">
              {trashItems.length === 0 ? 'La papelera está vacía' : 'No hay elementos que coincidan con el filtro'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-neutral-400 max-w-sm mx-auto mt-1">
              {trashItems.length === 0
                ? 'Cuando elimines proyectos, tareas o guías, se almacenarán aquí antes de su purga definitiva.'
                : 'Prueba buscando con otros términos o cambia la categoría de filtro seleccionada.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTrash.map((item: any) => {
            const kindInfo = getKindInfo(item.kind);
            const KindIcon = kindInfo.icon;
            const displayName = item.name || item.title || item.id;
            const dateStr = item.deletedAt ? new Date(item.deletedAt).toLocaleString() : 'Fecha desconocida';

            return (
              <div
                key={item.id}
                className="p-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-neutral-800 shrink-0 text-slate-500 dark:text-neutral-400">
                    <KindIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${kindInfo.color}`}>
                        {kindInfo.label}
                      </span>
                      <h4 className="font-semibold text-slate-900 dark:text-neutral-100 truncate">
                        {displayName}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-neutral-400 mt-1 flex-wrap">
                      <span className="font-mono text-[10px] text-slate-400">ID: {item.id}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Eliminado: {dateStr}</span>
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-[11px] text-slate-500 dark:text-neutral-400 line-clamp-1 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRestore(item)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors cursor-pointer shadow-2xs"
                    title="Restaurar este elemento a su ubicación original"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setItemToPurge(item)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    title="Eliminar definitivamente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Empty Trash */}
      <ConfirmModal
        isOpen={isPurgeModalOpen}
        title="Vaciar Papelera de Reciclaje"
        message={`Se eliminarán definitivamente ${trashItems.length} registros de la base de datos. Esta acción es irreversible.`}
        confirmText="Vaciar definitivamente"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={handleEmptyTrash}
        onCancel={() => setIsPurgeModalOpen(false)}
      />

      {/* Confirmation Modal for Single Item Purge */}
      <ConfirmModal
        isOpen={!!itemToPurge}
        title="Eliminar Registro Definitivamente"
        message={`¿Estás seguro de que deseas purgar permanentemente "${itemToPurge?.name || itemToPurge?.title || itemToPurge?.id}"? No se podrá recuperar.`}
        confirmText="Sí, eliminar definitivamente"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={handlePurgeSingle}
        onCancel={() => setItemToPurge(null)}
      />
    </div>
  );
};
