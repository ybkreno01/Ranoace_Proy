import React, { useState, useEffect } from 'react';
import { X, Terminal } from 'lucide-react';
import { store } from '../../services/store';
import { Script } from '../../types';

interface ScriptModalProps {
  isOpen: boolean;
  script?: Script | null;
  onClose: () => void;
}

export const ScriptModal: React.FC<ScriptModalProps> = ({ isOpen, script, onClose }) => {
  const [name, setName] = useState('');
  const [os, setOs] = useState('Windows / Linux');
  const [lang, setLang] = useState('powershell');
  const [version, setVersion] = useState('1.0');
  const [objective, setObjective] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => {
    if (script) {
      setName(script.name);
      setOs(script.os || 'Windows / Linux');
      setLang(script.lang || 'powershell');
      setVersion(script.version || '1.0');
      setObjective(script.objective || '');
      setCode(script.blocks?.[0]?.code || '');
    } else {
      setName('');
      setOs('Windows / Linux');
      setLang('powershell');
      setVersion('1.0');
      setObjective('');
      setCode('# Script de automatización\nWrite-Host "Iniciando proceso..."');
    }
  }, [script, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const id = script?.id || `script-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const newScript: Script = {
      id,
      kind: 'script',
      name: name.trim(),
      os,
      lang,
      version,
      objective: objective.trim(),
      projects: script?.projects || [],
      blocks: [
        {
          id: `sb-${Date.now()}`,
          label: 'Código principal',
          code: code.trim(),
        },
      ],
      createdAt: script?.createdAt || now,
      updatedAt: now,
    };

    store.putRecord(newScript);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-2xl p-6 space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
              {script ? 'Editar Script' : 'Nuevo Script Reutilizable'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-neutral-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-700 dark:text-neutral-300 block mb-1">Nombre del Script *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Comprobación de puertos y certificados SSL"
              className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 focus:outline-hidden focus:border-violet-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Lenguaje</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-2.5 py-2 text-slate-800 dark:text-neutral-200 focus:outline-hidden focus:border-violet-500"
              >
                <option value="powershell">PowerShell (.ps1)</option>
                <option value="bash">Bash / Shell (.sh)</option>
                <option value="python">Python (.py)</option>
                <option value="sql">SQL Query</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Sistema Operativo</label>
              <input
                type="text"
                value={os}
                onChange={(e) => setOs(e.target.value)}
                placeholder="Ej. Windows Server 2022"
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-200 focus:outline-hidden focus:border-violet-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 dark:text-neutral-300 block mb-1">Objetivo del Script</label>
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Ej. Validar conectividad TCP en puertos 443, 22, 3389..."
              className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-200 focus:outline-hidden focus:border-violet-500"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-neutral-300 block mb-1">Código del Script</label>
            <textarea
              rows={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-slate-900 dark:bg-neutral-950 font-mono text-violet-300 border border-slate-300 dark:border-neutral-700 rounded-lg p-2.5 text-xs focus:outline-hidden focus:border-violet-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 font-semibold text-white bg-violet-600 hover:bg-violet-500 rounded-lg shadow-xs transition-colors"
            >
              Guardar Script
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
