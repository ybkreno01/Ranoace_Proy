import React from 'react';
import { Project, CatalogItem } from '../../types';
import { store } from '../../services/store';
import { BrandLogo, resolveBrand } from './BrandLogo';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface ProjectNameCellProps {
  project: Project;
  brand?: CatalogItem | null;
  client?: CatalogItem | null;
  worktype?: CatalogItem | null;
  showExpandButton?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onClick?: () => void;
  className?: string;
  logoSize?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Calculates the exact expiration / status line matching the user's reference design:
 * - Overdue: "X dias vencido" (in red)
 * - Paused: "Proyecto en pausa" (in grey)
 * - Completed: "Completado" (in green)
 * - Future: "Fin 12 feb 2026" (in grey)
 */
export function formatProjectExpirationLine(project: Project): {
  text: string;
  type: 'overdue' | 'paused' | 'done' | 'normal' | 'none';
} {
  if (project.status === 'Completado') {
    return { text: 'Completado', type: 'done' };
  }
  if (project.status === 'En espera' || (project as any).status === 'Pausado') {
    return { text: 'Proyecto en pausa', type: 'paused' };
  }

  if (project.target) {
    const parts = project.target.split('-');
    let targetDate: Date;
    if (parts.length === 3) {
      targetDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      targetDate = new Date(project.target);
    }

    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
    const diffDays = Math.round((todayMidnight - targetMidnight) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return { text: `${diffDays} dias vencido`, type: 'overdue' };
    }

    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const formatted = `Fin ${targetDate.getDate()} ${months[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
    return { text: formatted, type: 'normal' };
  }

  return { text: 'Sin fecha límite', type: 'none' };
}

/**
 * High-fidelity project name cell matching the user reference layout:
 * [ PROMINENT LOGO ]  Project Title (Bold)
 *                     Brand · Type
 *                     Cliente: Name or '-'
 *                     Overdue / End Date / Paused
 */
export const ProjectNameCell: React.FC<ProjectNameCellProps> = ({
  project,
  brand,
  client,
  worktype,
  showExpandButton = false,
  isExpanded = false,
  onToggleExpand,
  onClick,
  className = '',
  logoSize = 'lg',
}) => {
  const state = store.getState();
  const resolvedBrand = brand || (project.brandId ? (state.records[project.brandId] as CatalogItem) : null);
  const resolvedClient = client || (project.clientId ? (state.records[project.clientId] as CatalogItem) : null);
  const resolvedWorktype = worktype || (project.typeId ? (state.records[project.typeId] as CatalogItem) : null);

  const brandInfo = resolveBrand(resolvedBrand, project.brandId, undefined, project.name);
  const brandName = resolvedBrand?.name || brandInfo.name || 'General';

  // Determine type description: e.g. "proyecto", "implementacion", "consultoria", "PoC"
  let typeLabel = 'proyecto';
  if (resolvedWorktype?.name) {
    typeLabel = resolvedWorktype.name.toLowerCase().replace(/[\(\)]/g, '').trim();
    if (typeLabel.includes('poc') || typeLabel.includes('prueba de concepto')) typeLabel = 'PoC';
    else if (typeLabel.includes('implement')) typeLabel = 'implementacion';
    else if (typeLabel.includes('consult')) typeLabel = 'consultoria';
  } else if (project.name.toLowerCase().includes('poc') || project.name.toLowerCase().includes('plc')) {
    typeLabel = 'PoC';
  } else if (project.name.toLowerCase().includes('implementac')) {
    typeLabel = 'implementacion';
  } else if (project.name.toLowerCase().includes('migraci') || project.name.toLowerCase().includes('actualizac')) {
    typeLabel = 'proyecto';
  } else if (project.name.toLowerCase().includes('consult') || project.name.toLowerCase().includes('servicio')) {
    typeLabel = 'consultoria';
  }

  const expiration = formatProjectExpirationLine(project);

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      store.setActiveView('projects', project.id);
    }
  };

  return (
    <div className={`flex items-center gap-3 min-w-0 ${className}`}>
      {/* Optional Expand Toggle Chevron */}
      {showExpandButton && onToggleExpand && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="text-slate-400 dark:text-neutral-500 hover:text-slate-800 dark:hover:text-white p-1 rounded-md cursor-pointer shrink-0 transition-colors"
          title={isExpanded ? 'Contraer actividades' : 'Expandir actividades'}
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      )}

      {/* Prominent Circular Brand Logo */}
      <div
        className="shrink-0 cursor-pointer transition-transform hover:scale-105"
        onClick={handleTitleClick}
        title={`Ver proyecto: ${project.name} (${brandName})`}
      >
        <BrandLogo
          brand={resolvedBrand}
          brandId={project.brandId}
          projectName={project.name}
          size={logoSize}
        />
      </div>

      {/* 4-Line Detailed Stack matching user image */}
      <div className="min-w-0 flex-1 flex flex-col justify-center space-y-0.5">
        {/* Line 1: Project Title in Bold (Full text, wrapped nicely without truncation) */}
        <h4
          onClick={handleTitleClick}
          className="text-sm font-bold text-slate-900 dark:text-neutral-100 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer break-words whitespace-normal leading-snug"
          title={project.name}
        >
          {project.name}
        </h4>

        {/* Line 2: Brand · Type */}
        <p className="text-xs text-slate-500 dark:text-neutral-400 leading-tight">
          <span>{brandName}</span>
          <span className="mx-1">·</span>
          <span>{typeLabel}</span>
        </p>

        {/* Line 3: Cliente */}
        <p className="text-xs text-slate-500 dark:text-neutral-400 leading-tight break-words whitespace-normal">
          <span>Cliente: </span>
          <span className="text-slate-600 dark:text-neutral-300 font-normal">
            {resolvedClient?.name || '-'}
          </span>
        </p>

        {/* Line 4: Expiration / Status */}
        <p className="text-xs leading-tight">
          {expiration.type === 'overdue' ? (
            <span className="text-red-600 dark:text-red-400 font-normal">
              {expiration.text}
            </span>
          ) : expiration.type === 'paused' ? (
            <span className="text-slate-500 dark:text-neutral-400">
              {expiration.text}
            </span>
          ) : expiration.type === 'done' ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {expiration.text}
            </span>
          ) : (
            <span className="text-slate-500 dark:text-neutral-400">
              {expiration.text}
            </span>
          )}
        </p>
      </div>
    </div>
  );
};
