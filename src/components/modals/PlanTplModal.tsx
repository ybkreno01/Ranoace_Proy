import React, { useState, useEffect } from 'react';
import { X, Layers, Plus, Trash2, BookOpen, AlertCircle } from 'lucide-react';
import { store } from '../../services/store';
import { PlanTpl, PlanTplSection, PlanTplActivity, CatalogItem, Guide } from '../../types';

interface PlanTplModalProps {
  isOpen: boolean;
  plantpl?: PlanTpl | null;
  onClose: () => void;
  onSaved?: (plantpl: PlanTpl) => void;
}

export const PlanTplModal: React.FC<PlanTplModalProps> = ({
  isOpen,
  plantpl,
  onClose,
  onSaved,
}) => {
  const state = store.getState();
  const brands = Object.values(state.records).filter(
    (r): r is CatalogItem => r.kind === 'brand' && !r.deletedAt
  );
  const workTypes = Object.values(state.records).filter(
    (r): r is CatalogItem => r.kind === 'worktype' && !r.deletedAt
  );
  const guides = Object.values(state.records).filter(
    (r): r is Guide => r.kind === 'guide' && !r.deletedAt
  );

  const [name, setName] = useState('');
  const [version, setVersion] = useState('1.0');
  const [brandId, setBrandId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [description, setDescription] = useState('');
  const [fav, setFav] = useState(false);

  // Sections
  const [sections, setSections] = useState<PlanTplSection[]>([]);
  // Activities
  const [acts, setActs] = useState<PlanTplActivity[]>([]);

  // Active section for viewing/adding activities
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');

  useEffect(() => {
    if (plantpl) {
      setName(plantpl.name);
      setVersion(plantpl.version || '1.0');
      setBrandId(plantpl.brandId || brands[0]?.id || '');
      setTypeId(plantpl.typeId || workTypes[0]?.id || '');
      setDescription(plantpl.description || '');
      setFav(plantpl.fav || false);
      setSections(plantpl.sections || []);
      setActs(plantpl.acts || []);
      if (plantpl.sections && plantpl.sections.length > 0) {
        setSelectedSectionId(plantpl.sections[0].id);
      }
    } else {
      setName('');
      setVersion('1.0');
      setBrandId(brands[0]?.id || '');
      setTypeId(workTypes[0]?.id || '');
      setDescription('');
      setFav(false);

      const defaultSections: PlanTplSection[] = [
        { id: `sec-${Date.now()}-1`, name: '1. Preparación y Prerrequisitos', weight: 15, phaseId: 'ph-1' },
        { id: `sec-${Date.now()}-2`, name: '2. Despliegue de Componentes', weight: 35, phaseId: 'ph-1' },
        { id: `sec-${Date.now()}-3`, name: '3. Pruebas de Funcionamiento', weight: 30, phaseId: 'ph-2' },
        { id: `sec-${Date.now()}-4`, name: '4. Entrega y Cierre Técnico', weight: 20, phaseId: 'ph-2' },
      ];
      setSections(defaultSections);
      setSelectedSectionId(defaultSections[0].id);

      setActs([
        {
          id: `act-${Date.now()}-1`,
          sectionId: defaultSections[0].id,
          title: 'Levantamiento de accesos y puertos de red',
          owner: 'Ingeniero Consultor',
          d0: 0,
          d1: 2,
          weight: 1,
          milestone: false,
          checklist: [{ id: 'chk-1', text: 'Validar acceso SSH/RDP', done: false }],
        },
        {
          id: `act-${Date.now()}-2`,
          sectionId: defaultSections[1].id,
          title: 'Instalación del conector / agente principal',
          owner: 'Ingeniero Consultor',
          d0: 2,
          d1: 5,
          weight: 2,
          milestone: true,
          checklist: [{ id: 'chk-2', text: 'Ejecutar script instalador', done: false }],
        },
      ]);
    }
  }, [plantpl, isOpen]);

  if (!isOpen) return null;

  const totalSectionWeight = sections.reduce((sum, s) => sum + (s.weight || 0), 0);

  // Normalize weights to 100%
  const handleNormalizeWeights = () => {
    if (sections.length === 0 || totalSectionWeight === 0) return;
    const factor = 100 / totalSectionWeight;
    setSections(
      sections.map((s) => ({
        ...s,
        weight: Math.round(s.weight * factor * 10) / 10,
      }))
    );
  };

  // Add a new section
  const handleAddSection = () => {
    const newId = `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newSec: PlanTplSection = {
      id: newId,
      name: `Nueva Etapa ${sections.length + 1}`,
      weight: 10,
      phaseId: 'ph-1',
    };
    setSections([...sections, newSec]);
    setSelectedSectionId(newId);
  };

  // Remove section
  const handleRemoveSection = (secId: string) => {
    if (sections.length <= 1) {
      alert('La plantilla debe tener al menos una sección/etapa.');
      return;
    }
    setSections(sections.filter((s) => s.id !== secId));
    setActs(acts.filter((a) => a.sectionId !== secId));
    if (selectedSectionId === secId) {
      setSelectedSectionId(sections.find((s) => s.id !== secId)?.id || '');
    }
  };

  // Add activity to current section
  const handleAddActivity = () => {
    if (!selectedSectionId) return;
    const newAct: PlanTplActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sectionId: selectedSectionId,
      title: 'Nueva Actividad',
      owner: 'Ingeniero Responsable',
      d0: 0,
      d1: 3,
      weight: 1,
      milestone: false,
      checklist: [],
    };
    setActs([...acts, newAct]);
  };

  // Remove activity
  const handleRemoveActivity = (actId: string) => {
    setActs(acts.filter((a) => a.id !== actId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tplId = plantpl?.id || `plantpl-${Date.now()}`;
    const now = new Date().toISOString();

    const phases = [
      { id: 'ph-1', name: 'Fase 1: Implementación' },
      { id: 'ph-2', name: 'Fase 2: Validación y Cierre' },
    ];

    const updatedTemplate: PlanTpl = {
      id: tplId,
      kind: 'plantpl',
      name: name.trim(),
      version: version.trim() || '1.0',
      brandId: brandId || undefined,
      typeId: typeId || undefined,
      description: description.trim() || undefined,
      fav,
      phases,
      sections,
      acts,
      createdAt: plantpl?.createdAt || now,
      updatedAt: now,
    };

    store.putRecord(updatedTemplate);
    if (onSaved) onSaved(updatedTemplate);
    onClose();
  };

  const sectionActivities = acts.filter((a) => a.sectionId === selectedSectionId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-neutral-800 bg-slate-50/90 dark:bg-neutral-900/90">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
              {plantpl ? 'Editar Plantilla de Plan de Trabajo' : 'Nueva Plantilla de Plan de Trabajo (RF-26)'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-neutral-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto text-xs flex-1">
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-medium">Nombre de la Plantilla *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Plan Estándar Despliegue PAM Cloud..."
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 text-sm focus:outline-hidden focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Versión</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Marca / Fabricante Tecnológico</label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-2.5 py-2 text-slate-800 dark:text-neutral-200"
              >
                <option value="">(Sin marca específica / Multi-marca)</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Tipo de Servicio / Trabajo</label>
              <select
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-2.5 py-2 text-slate-800 dark:text-neutral-200"
              >
                <option value="">(Seleccionar tipo de trabajo)</option>
                {workTypes.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-700 dark:text-neutral-300 block mb-1">Descripción u Objetivo de la Plantilla</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del alcance y prerrequisitos del plan..."
              className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-100 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Sections & Activities Manager */}
          <div className="border-t border-slate-200 dark:border-neutral-800 pt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-neutral-100">Etapas / Secciones y Actividades</h4>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400">
                  Define las secciones del plan con sus ponderaciones (% de peso) y las actividades de cada una con sus guías asociadas.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-xs px-2 py-1 rounded border ${
                    Math.round(totalSectionWeight) === 100
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-400'
                      : 'bg-rose-100 border-rose-300 text-rose-700 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-400'
                  }`}
                >
                  Suma pesos: {Math.round(totalSectionWeight)}%
                </span>
                {Math.round(totalSectionWeight) !== 100 && (
                  <button
                    type="button"
                    onClick={handleNormalizeWeights}
                    className="px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-100 border border-amber-300 rounded hover:bg-amber-200 dark:text-amber-300 dark:bg-amber-950 dark:border-amber-800 dark:hover:bg-amber-900 transition-colors"
                  >
                    Ajustar a 100%
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-950/60 dark:border-indigo-800 dark:hover:bg-indigo-900/60 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Sección</span>
                </button>
              </div>
            </div>

            {/* Sections Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setSelectedSectionId(sec.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap flex items-center gap-2 transition-colors ${
                    selectedSectionId === sec.id
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-600/30 dark:border-indigo-500 dark:text-indigo-200'
                      : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-750'
                  }`}
                >
                  <span>{sec.name}</span>
                  <span className="font-mono text-[11px] opacity-80">({sec.weight}%)</span>
                </button>
              ))}
            </div>

            {/* Active Section Editor */}
            {selectedSectionId && (
              <div className="bg-slate-50 dark:bg-neutral-800/60 border border-slate-200 dark:border-neutral-700/80 rounded-xl p-4 space-y-4">
                {(() => {
                  const currentSec = sections.find((s) => s.id === selectedSectionId);
                  if (!currentSec) return null;

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                        <div className="sm:col-span-2">
                          <label className="text-slate-600 dark:text-neutral-400 block mb-1">Nombre de esta Sección / Etapa</label>
                          <input
                            type="text"
                            value={currentSec.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSections(sections.map((s) => (s.id === currentSec.id ? { ...s, name: val } : s)));
                            }}
                            className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-neutral-100"
                          />
                        </div>

                        <div>
                          <label className="text-slate-600 dark:text-neutral-400 block mb-1">Peso en el Proyecto (%)</label>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={currentSec.weight}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setSections(sections.map((s) => (s.id === currentSec.id ? { ...s, weight: val } : s)));
                            }}
                            className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-neutral-100 font-mono"
                          />
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveSection(currentSec.id)}
                            className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 rounded-lg flex items-center gap-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar Etapa</span>
                          </button>
                        </div>
                      </div>

                      {/* Guía Técnica asociada a la sección */}
                      <div className="pt-2 border-t border-slate-200 dark:border-neutral-700/60">
                        <label className="text-slate-600 dark:text-neutral-400 block mb-1 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          <span>Guía Técnica vinculada a esta Etapa (opcional)</span>
                        </label>
                        <select
                          value={currentSec.guideTplId || ''}
                          onChange={(e) => {
                            const val = e.target.value || undefined;
                            setSections(
                              sections.map((s) => (s.id === currentSec.id ? { ...s, guideTplId: val } : s))
                            );
                          }}
                          className="w-full bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-neutral-200"
                        >
                          <option value="">(Ninguna guía asociada a nivel sección)</option>
                          {guides.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name} (v{g.version})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Activities for this section */}
                      <div className="pt-3 border-t border-slate-200 dark:border-neutral-700/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="font-semibold text-slate-800 dark:text-neutral-200">
                            Actividades de la Etapa ({sectionActivities.length})
                          </h5>
                          <button
                            type="button"
                            onClick={handleAddActivity}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 dark:text-cyan-400 dark:bg-cyan-950/60 dark:border-cyan-800 dark:hover:bg-cyan-900/60 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Agregar Actividad</span>
                          </button>
                        </div>

                        {sectionActivities.length === 0 ? (
                          <div className="p-4 bg-white dark:bg-neutral-900/80 border border-dashed border-slate-300 dark:border-neutral-700 rounded-lg text-center text-slate-500 dark:text-neutral-400">
                            Esta sección no tiene actividades definidas aún.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {sectionActivities.map((act) => (
                              <div
                                key={act.id}
                                className="p-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700/80 rounded-lg space-y-2 shadow-2xs"
                              >
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                  <div className="sm:col-span-5">
                                    <input
                                      type="text"
                                      value={act.title}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setActs(acts.map((a) => (a.id === act.id ? { ...a, title: val } : a)));
                                      }}
                                      placeholder="Título de actividad..."
                                      className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded px-2.5 py-1 text-slate-900 dark:text-neutral-100"
                                    />
                                  </div>

                                  <div className="sm:col-span-3">
                                    <input
                                      type="text"
                                      value={act.owner}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setActs(acts.map((a) => (a.id === act.id ? { ...a, owner: val } : a)));
                                      }}
                                      placeholder="Responsable / Rol..."
                                      className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded px-2 py-1 text-slate-800 dark:text-neutral-300"
                                    />
                                  </div>

                                  <div className="sm:col-span-2 flex items-center gap-1">
                                    <span className="text-slate-500 dark:text-neutral-400 text-[11px]">Días:</span>
                                    <input
                                      type="number"
                                      min={0}
                                      value={act.d1}
                                      onChange={(e) => {
                                        const val = Number(e.target.value) || 1;
                                        setActs(acts.map((a) => (a.id === act.id ? { ...a, d1: val } : a)));
                                      }}
                                      className="w-12 bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded px-1.5 py-1 text-slate-900 dark:text-neutral-100 font-mono text-center"
                                    />
                                  </div>

                                  <div className="sm:col-span-2 flex items-center justify-end gap-2">
                                    <label className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={act.milestone}
                                        onChange={(e) => {
                                          const val = e.target.checked;
                                          setActs(acts.map((a) => (a.id === act.id ? { ...a, milestone: val } : a)));
                                        }}
                                        className="rounded border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-amber-500 focus:ring-0"
                                      />
                                      <span>Hito</span>
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveActivity(act.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400"
                                      title="Eliminar actividad"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Guía técnica asociada a la actividad */}
                                <div className="flex items-center gap-2 pt-1">
                                  <BookOpen className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                                  <select
                                    value={act.guideTplId || ''}
                                    onChange={(e) => {
                                      const val = e.target.value || undefined;
                                      setActs(acts.map((a) => (a.id === act.id ? { ...a, guideTplId: val } : a)));
                                    }}
                                    className="bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded px-2 py-0.5 text-slate-800 dark:text-neutral-300 text-[11px] flex-1"
                                  >
                                    <option value="">(Sin guía técnica vinculada a esta actividad)</option>
                                    {guides.map((g) => (
                                      <option key={g.id} value={g.id}>
                                        Guía: {g.name} (v{g.version})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-xs"
            >
              Guardar Plantilla
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
