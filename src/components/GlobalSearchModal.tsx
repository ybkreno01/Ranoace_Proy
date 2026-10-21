import React, { useState, useEffect, useMemo, useRef } from 'react';
import { htmlToPlainText } from '../services/textUtils';
import { Search, X, FolderKanban, CheckSquare, BookOpen, Terminal, AlertCircle, Users, ArrowRight, Presentation } from 'lucide-react';
import { store } from '../services/store';
import { AnyRecord } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (record: AnyRecord) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const state = store.getState();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Normalize string helper (case & accent insensitive)
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = normalize(query.trim());
    const records = Object.values(state.records).filter((r) => !r.deletedAt);

    return records
      .map((r: any) => {
        let score = 0;
        let matchText = '';

        const name = normalize(r.name || r.title || '');
        if (name.includes(q)) {
          score += 10;
          matchText = r.name || r.title;
        }

        const desc = normalize(r.description || r.objective || r.symptom || htmlToPlainText(r.body) || '');
        if (desc.includes(q)) {
          score += 5;
          if (!matchText) matchText = r.description || r.objective || r.symptom || htmlToPlainText(r.body);
        }

        // Aliases for brands
        if (r.kind === 'brand' && Array.isArray(r.aliases)) {
          for (const alias of r.aliases) {
            if (normalize(alias).includes(q)) {
              score += 8;
              matchText = `Alias: ${alias}`;
            }
          }
        }

        // Tags
        if (Array.isArray(r.tags)) {
          for (const tag of r.tags) {
            if (normalize(tag).includes(q)) {
              score += 4;
            }
          }
        }

        // Code in scripts/trouble
        if (Array.isArray(r.blocks)) {
          for (const b of r.blocks) {
            if (b.code && normalize(b.code).includes(q)) {
              score += 6;
              if (!matchText) matchText = `Comando: ${b.code.substring(0, 80)}`;
            }
          }
        }

        return { record: r, score, matchText };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);
  }, [query, state.records]);

  if (!isOpen) return null;

  const getIcon = (kind: string) => {
    switch (kind) {
      case 'project':
        return <FolderKanban className="w-4 h-4 text-cyan-400" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-emerald-400" />;
      case 'guide':
      case 'pguide':
        return <BookOpen className="w-4 h-4 text-amber-400" />;
      case 'demo':
        return <Presentation className="w-4 h-4 text-fuchsia-400" />;
      case 'script':
        return <Terminal className="w-4 h-4 text-violet-400" />;
      case 'trouble':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      default:
        return <Users className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getKindLabel = (kind: string) => {
    switch (kind) {
      case 'project':
        return 'Proyecto';
      case 'task':
        return 'Actividad / Tarea';
      case 'guide':
        return 'Guía Técnica';
      case 'pguide':
        return 'Guía de Proyecto';
      case 'demo':
        return 'Demo';
      case 'interactive_guide':
        return 'Guía Interactiva';
      case 'script':
        return 'Script Automatización';
      case 'trouble':
        return 'Troubleshooting';
      case 'client':
        return 'Cliente';
      case 'brand':
        return 'Marca';
      case 'note':
        return 'Bitácora / Minuta';
      default:
        return kind;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-neutral-800 bg-slate-50/90 dark:bg-neutral-900/90">
          <Search className="w-5 h-5 text-slate-400 dark:text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar proyectos, tareas, guías, scripts, troubleshooting, marcas (ej. senhasegura)..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-neutral-100 placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 dark:text-neutral-400 hover:text-slate-600 dark:hover:text-neutral-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[11px] font-mono text-slate-400 dark:text-neutral-500 px-1.5 py-0.5 border border-slate-200 dark:border-neutral-700 rounded-sm">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-neutral-800/60 p-2">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-sm text-slate-400 dark:text-neutral-500">
              Escribe cualquier término para buscar con tolerancia a mayúsculas, acentos y alias.
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400 dark:text-neutral-500">
              No se encontraron registros que coincidan con &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map(({ record, matchText }) => (
              <button
                key={record.id}
                onClick={() => {
                  onSelectResult(record);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-neutral-800/70 transition-colors text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-md bg-slate-100 dark:bg-neutral-800/90 shrink-0">
                    {getIcon(record.kind)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500 dark:text-neutral-400">
                        {getKindLabel(record.kind)}
                      </span>
                      <span className="text-slate-300 dark:text-neutral-600">·</span>
                      <h4 className="text-sm font-medium text-slate-800 dark:text-neutral-200 truncate group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                        {record.name || record.title}
                      </h4>
                    </div>
                    {matchText && (
                      <p className="text-xs text-slate-500 dark:text-neutral-500 truncate mt-0.5 max-w-lg">
                        {matchText.replace(/<[^>]*>/g, '')}
                      </p>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 dark:text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
