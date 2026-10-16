import React, { useState } from 'react';
import { Settings as SettingsIcon, Palette, Moon, Sun, User, Clock, Check } from 'lucide-react';
import { store } from '../services/store';

const PALETTES = [
  { id: 'cyan', name: 'Azul Ingeniería', color: '#06b6d4' },
  { id: 'indigo', name: 'Índigo Técnico', color: '#6366f1' },
  { id: 'emerald', name: 'Esmeralda Operativo', color: '#10b981' },
  { id: 'amber', name: 'Ámbar Industrial', color: '#f59e0b' },
  { id: 'rose', name: 'Carmesí Crítico', color: '#f43f5e' },
  { id: 'violet', name: 'Púrpura Enterprise', color: '#8b5cf6' },
  { id: 'slate', name: 'Grafito Minimalista', color: '#64748b' },
];

export const SettingsView: React.FC = () => {
  const state = store.getState();
  const [me, setMe] = useState(state.settings.me || '');
  const [staleDays, setStaleDays] = useState(state.settings.staleDays || 14);
  const [selectedPalette, setSelectedPalette] = useState(state.settings.palette || 'cyan');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    store.putRecord({
      ...state.settings,
      me,
      staleDays: Number(staleDays),
      palette: selectedPalette,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Configuración y Preferencias</h2>
        <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
          Ajustes visuales, paleta de acento, umbrales de inactividad y perfil local (RF-03)
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Accent Palettes */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">
              Paletas de Color de Acento (RF-03)
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400">
            Selecciona la paleta cromática aplicada a los estados activos y elementos focales.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PALETTES.map((pal) => (
              <button
                key={pal.id}
                type="button"
                onClick={() => setSelectedPalette(pal.id)}
                className={`p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                  selectedPalette === pal.id
                    ? 'bg-blue-50 dark:bg-neutral-800 border-blue-400 dark:border-neutral-600 ring-2 ring-blue-500/30 dark:ring-cyan-500/50'
                    : 'bg-slate-50/70 dark:bg-neutral-800/40 border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: pal.color }}
                  />
                  <span className="text-xs text-slate-800 dark:text-neutral-200 font-medium">{pal.name}</span>
                </div>
                {selectedPalette === pal.id && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Operational Thresholds & User Profile */}
        <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">
              Perfil Operativo y Umbrales
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-semibold">Nombre / Identidad Operativa</label>
              <input
                type="text"
                value={me}
                onChange={(e) => setMe(e.target.value)}
                placeholder="Ej. Reno Aguilar (Líder Técnico)"
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-200 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-semibold">
                Días de Inactividad para Proyecto Sin Movimiento (staleDays)
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={staleDays}
                onChange={(e) => setStaleDays(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-200 font-mono focus:outline-hidden focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {savedSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>Preferencias guardadas</span>
            </span>
          )}
          <button
            type="submit"
            className="px-5 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors shadow-xs"
          >
            Guardar Preferencias
          </button>
        </div>
      </form>
    </div>
  );
};
