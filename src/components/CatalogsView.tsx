import React, { useState } from 'react';
import { Tag, Plus, Trash2, Edit, Building2, Radio, Bookmark, X, Image as ImageIcon } from 'lucide-react';
import { store } from '../services/store';
import { CatalogItem } from '../types';
import { ConfirmModal } from './modals/ConfirmModal';

export const CatalogsView: React.FC = () => {
  const state = store.getState();
  const [activeCatalog, setActiveCatalog] = useState<
    'brand' | 'client' | 'channel' | 'worktype' | 'tag'
  >('brand');
  const [newItemName, setNewItemName] = useState('');
  const [newItemColor, setNewItemColor] = useState('#06b6d4');

  // Edit modal state
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#06b6d4');
  const [editAliases, setEditAliases] = useState('');
  const [editLogo, setEditLogo] = useState('');
  const [itemToDelete, setItemToDelete] = useState<CatalogItem | null>(null);

  const items = Object.values(state.records).filter(
    (r) => r.kind === activeCatalog && !r.deletedAt
  ) as CatalogItem[];

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const id = `${activeCatalog}-${Math.random().toString(36).substring(2, 8)}`;
    const newItem: CatalogItem = {
      id,
      kind: activeCatalog,
      name: newItemName.trim(),
      color: activeCatalog === 'brand' ? newItemColor : undefined,
      aliases: activeCatalog === 'brand' ? [newItemName.trim().toLowerCase()] : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.putRecord(newItem);
    setNewItemName('');
  };

  const handleOpenEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditColor(item.color || '#06b6d4');
    setEditAliases(item.aliases ? item.aliases.join(', ') : '');
    setEditLogo(item.logo || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editName.trim()) return;

    const aliasesArr = editAliases
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    const updated: CatalogItem = {
      ...editingItem,
      name: editName.trim(),
      color: editingItem.kind === 'brand' ? editColor : editingItem.color,
      aliases: editingItem.kind === 'brand' ? aliasesArr : editingItem.aliases,
      logo: editingItem.kind === 'brand' ? editLogo : undefined,
      updatedAt: new Date().toISOString(),
    };

    store.putRecord(updated);
    setEditingItem(null);
  };

  const handleDeleteItem = (item: CatalogItem) => {
    setItemToDelete(item);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Catálogos Maestros</h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
          Gestión de marcas con colores y logos, clientes, canales de venta, tipos de servicio y etiquetas
        </p>
      </div>

      {/* Catalog Kind Switcher */}
      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-lg text-xs font-medium">
        {[
          { id: 'brand', label: 'Marcas y Tecnologías' },
          { id: 'client', label: 'Clientes' },
          { id: 'channel', label: 'Canales' },
          { id: 'worktype', label: 'Tipos de Trabajo' },
          { id: 'tag', label: 'Etiquetas' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCatalog(cat.id as any)}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeCatalog === cat.id
                ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-cyan-400 shadow-xs'
                : 'text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Add new item form */}
      <form
        onSubmit={handleAddItem}
        className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl shadow-2xs"
      >
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder={`Nombre de nuevo elemento en ${activeCatalog}...`}
          className="flex-1 text-xs bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-200 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden focus:border-blue-500 dark:focus:border-cyan-500"
        />

        {activeCatalog === 'brand' && (
          <input
            type="color"
            value={newItemColor}
            onChange={(e) => setNewItemColor(e.target.value)}
            className="w-9 h-8 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded cursor-pointer p-0.5"
            title="Color de marca"
          />
        )}

        <button
          type="submit"
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 rounded-lg transition-colors shrink-0 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Agregar</span>
        </button>
      </form>

      {/* Items list */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl divide-y divide-slate-200 dark:divide-neutral-800 overflow-hidden shadow-xs">
        {items.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 dark:text-neutral-500">
            No hay registros en este catálogo.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-neutral-800/40 transition-colors text-xs"
            >
              <div className="flex items-center gap-3">
                {item.logo ? (
                  <img
                    src={item.logo}
                    alt={item.name}
                    className="w-5 h-5 object-contain rounded shrink-0 bg-slate-100 dark:bg-neutral-800 p-0.5"
                  />
                ) : item.color ? (
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: item.color }}
                  />
                ) : null}

                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-neutral-200">{item.name}</h4>
                  {item.aliases && item.aliases.length > 0 && (
                    <span className="text-[11px] text-slate-400 dark:text-neutral-500">
                      Alias: {item.aliases.join(', ')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-1.5 text-slate-400 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteItem(item)}
                  className="p-1.5 text-slate-400 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Catalog Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 pb-2">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">
                Editar {editingItem.kind.toUpperCase()}
              </h4>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 dark:text-neutral-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-slate-700 dark:text-neutral-300 block mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 focus:outline-hidden focus:border-blue-500 dark:focus:border-cyan-500"
                />
              </div>

              {editingItem.kind === 'brand' && (
                <>
                  <div className="grid grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="text-slate-700 dark:text-neutral-300 block mb-1">Color de Marca</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="w-9 h-8 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded cursor-pointer p-0.5"
                        />
                        <span className="font-mono text-slate-600 dark:text-neutral-400">{editColor}</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-700 dark:text-neutral-300 block mb-1">Logo / Icono</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => setEditLogo(reader.result as string);
                          reader.readAsDataURL(file);
                        }}
                        className="text-xs text-slate-500 dark:text-neutral-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-slate-100 dark:file:bg-neutral-700 file:text-slate-700 dark:file:text-neutral-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-700 dark:text-neutral-300 block mb-1">
                      Alias de búsqueda (separados por coma)
                    </label>
                    <input
                      type="text"
                      value={editAliases}
                      onChange={(e) => setEditAliases(e.target.value)}
                      placeholder="Ej. cyberark, ca, epv"
                      className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 focus:outline-hidden focus:border-blue-500 dark:focus:border-cyan-500"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3.5 py-1.5 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-semibold text-white bg-blue-600 hover:bg-blue-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 rounded-lg shadow-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm deletion modal */}
      <ConfirmModal
        isOpen={!!itemToDelete}
        title="Eliminar del Catálogo"
        message={`¿Estás seguro de que deseas eliminar "${itemToDelete?.name}" del catálogo?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={() => {
          if (itemToDelete) {
            store.deleteRecord(itemToDelete.id, true);
            setItemToDelete(null);
          }
        }}
        onCancel={() => setItemToDelete(null)}
      />
    </div>
  );
};
