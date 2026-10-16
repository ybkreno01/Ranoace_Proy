import React, { useState, useEffect } from 'react';
import { X, BookOpen } from 'lucide-react';
import { store } from '../../services/store';
import { Guide, CatalogItem } from '../../types';

interface GuideModalProps {
  isOpen: boolean;
  guide?: Guide | null;
  onClose: () => void;
  onCreated?: (guide: Guide) => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, guide, onClose, onCreated }) => {
  const state = store.getState();
  const brands = Object.values(state.records).filter(
    (r): r is CatalogItem => r.kind === 'brand' && !r.deletedAt
  );

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [brandId, setBrandId] = useState('');
  const [product, setProduct] = useState('');
  const [folder, setFolder] = useState('');
  const [version, setVersion] = useState('1.0');
  const [env, setEnv] = useState('Producción');
  const [prereqs, setPrereqs] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [fav, setFav] = useState(false);

  useEffect(() => {
    if (guide) {
      setName(guide.name);
      setDescription(guide.description || '');
      setBrandId(guide.brandId || brands[0]?.id || '');
      setProduct(guide.product || '');
      setFolder(guide.folder || '');
      setVersion(guide.version || '1.0');
      setEnv(guide.env || 'Producción');
      setPrereqs(guide.prereqs || '');
      setReviewDate(guide.reviewDate || '');
      setFav(guide.fav || false);
    } else {
      setName('');
      setDescription('');
      setBrandId(brands[0]?.id || '');
      setProduct('');
      setFolder('Implementación / General');
      setVersion('1.0');
      setEnv('Producción');
      setPrereqs('');
      setReviewDate('');
      setFav(false);
    }
  }, [guide, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const guideId = guide?.id || `guide-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const newGuide: Guide = {
      id: guideId,
      kind: 'guide',
      name: name.trim(),
      description: description.trim() || undefined,
      brandId: brandId || brands[0]?.id || undefined,
      product: product.trim() || undefined,
      folder: folder.trim() || undefined,
      version: version.trim() || '1.0',
      env: env.trim() || undefined,
      prereqs: prereqs.trim() || undefined,
      reviewDate: reviewDate || undefined,
      tags: guide?.tags || ['PAM'],
      fav,
      sections: guide?.sections || [
        {
          id: `sec-${Math.random().toString(36).substring(2, 8)}`,
          title: 'Prerrequisitos y Preparación',
          order: 0,
          steps: [
            {
              id: `step-${Math.random().toString(36).substring(2, 8)}`,
              title: 'Verificación de accesos y red',
              evaluable: true,
              weight: 1,
              mode: 'check',
              progress: 0,
              na: false,
              blocks: [
                {
                  id: `b-${Math.random().toString(36).substring(2, 8)}`,
                  type: 'text',
                  html: 'Compruebe que el servidor cuenta con salida a internet en el puerto 443.',
                },
              ],
            },
          ],
        },
      ],
      createdAt: guide?.createdAt || now,
      updatedAt: now,
    };

    store.putRecord(newGuide);
    if (onCreated) onCreated(newGuide);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-neutral-800 bg-slate-50/90 dark:bg-neutral-900/90">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
              {guide ? 'Editar Guía Técnica' : 'Nueva Guía Técnica (Biblioteca)'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-neutral-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
          <div>
            <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-medium">Nombre de la Guía *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Despliegue de Agente Segura en Linux"
              className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 text-sm focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Marca / Tecnología</label>
              <select
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

            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Producto / Módulo</label>
              <input
                type="text"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="Ej. Segura PAM (Connector)"
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-200 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Carpeta de Agrupación</label>
              <input
                type="text"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                placeholder="Ej. Conectores / Linux"
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-200 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Versión</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-200 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 dark:text-neutral-300 block mb-1">Descripción Breve</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Procedimiento estándar para la instalación y configuración..."
              className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg p-2 text-slate-800 dark:text-neutral-200 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-neutral-300 block mb-1">Prerrequisitos</label>
            <textarea
              rows={2}
              value={prereqs}
              onChange={(e) => setPrereqs(e.target.value)}
              placeholder="Requisitos de red, puertos y permisos administrativos requeridos..."
              className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg p-2 text-slate-800 dark:text-neutral-200 focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={fav}
                onChange={(e) => setFav(e.target.checked)}
                className="rounded border-slate-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-amber-500 focus:ring-0"
              />
              <span>Marcar como favorita (★)</span>
            </label>
          </div>

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
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors shadow-xs"
            >
              {guide ? 'Guardar Cambios' : 'Crear Guía y Abrir Editor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
