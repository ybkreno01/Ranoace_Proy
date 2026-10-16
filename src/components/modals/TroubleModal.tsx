import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { store } from '../../services/store';
import { Trouble } from '../../types';

interface TroubleModalProps {
  isOpen: boolean;
  trouble?: Trouble | null;
  onClose: () => void;
}

export const TroubleModal: React.FC<TroubleModalProps> = ({ isOpen, trouble, onClose }) => {
  const [name, setName] = useState('');
  const [os, setOs] = useState('Linux / NGINX');
  const [symptom, setSymptom] = useState('');
  const [evidence, setEvidence] = useState('');
  const [hypothesis, setHypothesis] = useState('');
  const [test, setTest] = useState('');
  const [result, setResult] = useState('');
  const [fix, setFix] = useState('');
  const [validation, setValidation] = useState('');

  useEffect(() => {
    if (trouble) {
      setName(trouble.name);
      setOs(trouble.os || 'Linux / NGINX');
      setSymptom(trouble.symptom || '');
      setEvidence(trouble.evidence || '');
      setHypothesis(trouble.hypothesis || '');
      setTest(trouble.test || '');
      setResult(trouble.result || '');
      setFix(trouble.fix || '');
      setValidation(trouble.validation || '');
    } else {
      setName('');
      setOs('Linux / NGINX');
      setSymptom('');
      setEvidence('');
      setHypothesis('');
      setTest('');
      setResult('');
      setFix('');
      setValidation('');
    }
  }, [trouble, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !symptom.trim() || !fix.trim()) return;

    const id = trouble?.id || `trouble-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const newTrouble: Trouble = {
      id,
      kind: 'trouble',
      name: name.trim(),
      os,
      symptom: symptom.trim(),
      evidence: evidence.trim(),
      hypothesis: hypothesis.trim(),
      test: test.trim(),
      result: result.trim(),
      fix: fix.trim(),
      validation: validation.trim(),
      projects: trouble?.projects || [],
      blocks: trouble?.blocks || [],
      createdAt: trouble?.createdAt || now,
      updatedAt: now,
    };

    store.putRecord(newTrouble);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-2xl p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500 dark:text-rose-400" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
              {trouble ? 'Editar Ficha Troubleshooting' : 'Nueva Ficha Troubleshooting'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-neutral-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Título de la Falla *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Error 504 Gateway Timeout en Proxy"
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Tecnología / SO</label>
              <input
                type="text"
                value={os}
                onChange={(e) => setOs(e.target.value)}
                placeholder="Ej. Ubuntu Server / NGINX"
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-200"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 dark:text-neutral-300 block mb-1">Síntoma Observado *</label>
            <textarea
              rows={2}
              required
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              placeholder="Mensaje de error exacto, código HTTP o comportamiento anómalo..."
              className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg p-2 text-slate-800 dark:text-neutral-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Evidencia / Log</label>
              <input
                type="text"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="Ej. upstream timed out en /var/log/proxy.log"
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-200"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Hipótesis</label>
              <input
                type="text"
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                placeholder="Ej. El firewall de destino descarta paquetes SYN"
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Prueba Realizada</label>
              <input
                type="text"
                value={test}
                onChange={(e) => setTest(e.target.value)}
                placeholder="Ej. Test-NetConnection -Port 3389"
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-200"
              />
            </div>

            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Resultado de la Prueba</label>
              <input
                type="text"
                value={result}
                onChange={(e) => setResult(e.target.value)}
                placeholder="Ej. Timeout sin respuesta TCP ACK"
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-200"
              />
            </div>
          </div>

          <div>
            <label className="text-emerald-600 dark:text-emerald-400 block mb-1 font-medium">
              Corrección / Solución Comprobada *
            </label>
            <textarea
              rows={2}
              required
              value={fix}
              onChange={(e) => setFix(e.target.value)}
              placeholder="Procedimiento exacto o regla aplicada para corregir el problema..."
              className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg p-2 text-slate-800 dark:text-neutral-100"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-neutral-300 block mb-1">Validación Posterior</label>
            <input
              type="text"
              value={validation}
              onChange={(e) => setValidation(e.target.value)}
              placeholder="Ej. Sesión web conecta exitosamente en menos de 2s"
              className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-slate-700 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-800 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-xs transition-colors"
            >
              Guardar Ficha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
