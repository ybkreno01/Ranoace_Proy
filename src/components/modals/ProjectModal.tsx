import React, { useState, useEffect } from 'react';
import { X, FolderKanban, Layers } from 'lucide-react';
import { store } from '../../services/store';
import { Project, ProjectStatus, CatalogItem, PlanTpl } from '../../types';
import { pamSaaSPlantilla } from '../../data/seedData';
import { BrandLogo } from '../common/BrandLogo';

interface ProjectModalProps {
  isOpen: boolean;
  project?: Project | null;
  initialTypeId?: string;
  onClose: () => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, project, initialTypeId, onClose }) => {
  const state = store.getState();
  const clients = Object.values(state.records).filter(
    (r): r is CatalogItem => r.kind === 'client' && !r.deletedAt
  );
  const brands = Object.values(state.records).filter(
    (r): r is CatalogItem => r.kind === 'brand' && !r.deletedAt
  );
  const channels = Object.values(state.records).filter(
    (r): r is CatalogItem => r.kind === 'channel' && !r.deletedAt
  );
  const workTypes = Object.values(state.records).filter(
    (r): r is CatalogItem => r.kind === 'worktype' && !r.deletedAt
  );
  const plantpls = Object.values(state.records).filter(
    (r): r is PlanTpl => r.kind === 'plantpl' && !r.deletedAt
  );

  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Planificado');
  const [condition, setCondition] = useState('');
  const [start, setStart] = useState('');
  const [target, setTarget] = useState('');
  const [objective, setObjective] = useState('');
  const [scope, setScope] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextActionDate, setNextActionDate] = useState('');
  const [blocker, setBlocker] = useState('');
  const [blockerOwner, setBlockerOwner] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(pamSaaSPlantilla.id);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setClientId(project.clientId || '');
      setChannelId(project.channelId || '');
      setBrandId(project.brandId || '');
      setTypeId(project.typeId || '');
      setStatus(project.status);
      setCondition(project.condition || '');
      setStart(project.start || '');
      setTarget(project.target || '');
      setObjective(project.objective || '');
      setScope(project.scope || '');
      setNextAction(project.nextAction || '');
      setNextActionDate(project.nextActionDate || '');
      setBlocker(project.blocker || '');
      setBlockerOwner(project.blockerOwner || '');
      setSelectedTemplateId('');
    } else {
      const todayStr = new Date().toISOString().split('T')[0];
      const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setName('');
      setClientId(clients[0]?.id || '');
      setChannelId(channels[0]?.id || '');
      setBrandId(brands[0]?.id || '');
      setTypeId(initialTypeId || workTypes[0]?.id || '');
      setStatus('Planificado');
      setCondition('');
      setStart(todayStr);
      setTarget(in30Days);
      setObjective('');
      setScope('');
      setNextAction('');
      setNextActionDate('');
      setBlocker('');
      setBlockerOwner('');
      setSelectedTemplateId(plantpls[0]?.id || pamSaaSPlantilla.id);
    }
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const projectId = project?.id || `proj-${Date.now()}`;
    const now = new Date().toISOString();

    const chosenTpl = plantpls.find((t) => t.id === selectedTemplateId);

    const planData =
      project?.plan ||
      (chosenTpl
        ? {
            phases: (chosenTpl.phases || []).map((p, idx) => ({ ...p, order: idx })),
            sections: (chosenTpl.sections || []).map((s, idx) => ({ ...s, order: idx })),
          }
        : {
            phases: [{ id: 'ph-1', name: 'Fase 1: Ejecución', order: 0 }],
            sections: [
              { id: 'sec-1', name: '1. Preparación y Prerrequisitos', weight: 30, phaseId: 'ph-1', order: 0 },
              { id: 'sec-2', name: '2. Despliegue y Configuración', weight: 40, phaseId: 'ph-1', order: 1 },
              { id: 'sec-3', name: '3. Pruebas y Aceptación', weight: 30, phaseId: 'ph-1', order: 2 },
            ],
          });

    const newProject: Project = {
      id: projectId,
      kind: 'project',
      name: name.trim(),
      clientId: clientId || clients[0]?.id || '',
      channelId: channelId || undefined,
      brandId: brandId || brands[0]?.id || '',
      brands: brandId ? [brandId] : [],
      typeId: typeId || workTypes[0]?.id || '',
      status,
      condition: condition.trim() || undefined,
      start: start || now.split('T')[0],
      target: target || now.split('T')[0],
      targetOriginal: project?.targetOriginal || target || now.split('T')[0],
      objective: objective.trim(),
      scope: scope.trim() || undefined,
      nextAction: nextAction.trim() || undefined,
      nextActionDate: nextActionDate || undefined,
      blocker: blocker.trim() || undefined,
      blockerOwner: blockerOwner.trim() || undefined,
      contacts: project?.contacts || [],
      tags: project?.tags || ['Ingeniería'],
      vars: project?.vars || {
        IP_SERVIDOR: '10.0.0.10',
        URL_PORTAL: 'https://portal.cliente.local',
      },
      criteria: project?.criteria || [
        { id: 'cr1', text: 'Instalación y conectividad con nube verificada', done: false },
        { id: 'cr2', text: 'Sesiones grabadas y auditables con MFA', done: false },
      ],
      closure: project?.closure,
      plan: planData,
      planTplId: chosenTpl?.id,
      folders: project?.folders || [
        'Alcance',
        'Prerrequisitos',
        'Evidencias',
        'Memoria técnica',
        'Entregables',
        'Minutas y acuerdos',
      ],
      tasksWeight: project?.tasksWeight ?? 1,
      otherWeight: project?.otherWeight ?? 0,
      archived: project?.archived ?? false,
      waitingMs: project?.waitingMs ?? 0,
      createdAt: project?.createdAt || now,
      updatedAt: now,
    };

    store.putRecord(newProject);

    // If new project and applied a template, also instantiate template activities!
    if (!project && chosenTpl && chosenTpl.acts) {
      chosenTpl.acts.forEach((act, idx) => {
        const taskId = `task-${projectId}-${act.id}`;
        store.putRecord({
          id: taskId,
          kind: 'task',
          title: act.title,
          description: `<p>Actividad del plan para <b>${act.title}</b>.</p>`,
          projectId,
          sectionId: act.sectionId,
          order: idx,
          owner: act.owner,
          status: 'Pendiente',
          priority: act.milestone ? 'Alta' : 'Media',
          start,
          due: target,
          dueOriginal: target,
          progress: 0,
          progressMode: act.checklist && act.checklist.length > 0 ? 'auto' : 'manual',
          weight: act.weight || 1,
          milestone: act.milestone || false,
          checklist: (act.checklist || []).map((c) => ({ ...c, done: false })),
          guideRef: act.guideTplId,
          deps: [],
          createdAt: now,
          updatedAt: now,
        });
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-neutral-800 bg-slate-50/90 dark:bg-neutral-900/90">
          <div className="flex items-center gap-2.5">
            <BrandLogo brandId={brandId} projectName={name} size="sm" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
              {project ? 'Editar Proyecto (Expediente)' : 'Nuevo Proyecto (RF-10)'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-neutral-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
          <div>
            <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-medium">Nombre del Proyecto *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. PoC PAM Segura - Banco Mercantil"
              className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 text-sm focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Cliente *</label>
              <select
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-2.5 py-2 text-slate-800 dark:text-neutral-200"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-medium">Marca / Tecnología *</label>
              <div className="flex items-center gap-2">
                <BrandLogo brandId={brandId} size="sm" />
                <select
                  required
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-2.5 py-2 text-slate-800 dark:text-neutral-200"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Canal de Venta</label>
              <select
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-2.5 py-2 text-slate-800 dark:text-neutral-200"
              >
                <option value="">(Sin canal especificado)</option>
                {channels.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Tipo de Trabajo</label>
              <select
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-2.5 py-2 text-slate-800 dark:text-neutral-200"
              >
                {workTypes.map((wt) => (
                  <option key={wt.id} value={wt.id}>
                    {wt.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Estado del Proyecto</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-2.5 py-2 text-slate-800 dark:text-neutral-200"
              >
                <option value="Borrador">Borrador</option>
                <option value="Planificado">Planificado</option>
                <option value="En ejecución">En ejecución</option>
                <option value="En espera">En espera</option>
                <option value="Completado">Completado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-mono">Fecha Inicio</label>
                <input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-2 py-1.5 text-slate-800 dark:text-neutral-200 font-mono"
                />
              </div>
              <div>
                <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-mono">Fecha Meta</label>
                <input
                  type="date"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-2 py-1.5 text-slate-800 dark:text-neutral-200 font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-slate-700 dark:text-neutral-300 block mb-1">Objetivo del Proyecto</label>
            <textarea
              rows={2}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Describa el objetivo principal que debe cumplirse..."
              className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-200 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-neutral-300 block mb-1">Condición / Situación Actual</label>
            <input
              type="text"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="Ej. En riesgo por licenciamiento pendiente del cliente..."
              className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-200 focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          {/* Plantilla de Plan Selector for New Projects */}
          {!project && (
            <div className="p-3.5 bg-slate-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700 rounded-lg space-y-2">
              <label className="text-slate-800 dark:text-neutral-200 font-medium flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <span>Plantilla de Plan de Trabajo para Inicializar</span>
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-100"
              >
                <option value="">(Sin plantilla - Crear plan vacío)</option>
                {plantpls.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} (v{tpl.version}) - {tpl.sections?.length || 0} etapas y {tpl.acts?.length || 0} actividades
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                La plantilla creará automáticamente las etapas ponderadas, actividades y vinculará las guías técnicas correspondientes.
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 rounded-lg transition-colors shadow-xs"
            >
              {project ? 'Guardar Cambios' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
