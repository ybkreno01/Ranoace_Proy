import React, { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import { store } from '../../services/store';
import { Note, NoteType } from '../../types';
import { RichTextEditor } from '../common/RichTextEditor';

// Fecha local (no UTC) en formato YYYY-MM-DD
const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

interface NoteModalProps {
  isOpen: boolean;
  projectId: string;
  /** Si se indica, el modal edita esa minuta en lugar de crear una nueva. */
  note?: Note | null;
  onClose: () => void;
}

export const NoteModal: React.FC<NoteModalProps> = ({ isOpen, projectId, note, onClose }) => {
  const [type, setType] = useState<NoteType>('Sesión');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayLocal());
  const [time, setTime] = useState('10:00');
  const [attendees, setAttendees] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (note) {
      setType(note.type);
      setTitle(note.title);
      setDate(note.date || todayLocal());
      setTime(note.time || '10:00');
      setAttendees(note.attendees || '');
      setBody(note.body || '');
    } else {
      setType('Sesión');
      setTitle('');
      setDate(todayLocal());
      setTime('10:00');
      setAttendees('');
      setBody('');
    }
  }, [isOpen, note]);

  if (!isOpen) return null;

  const isEmptyBody = (html: string) => !html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const id = note?.id || `note-${projectId}-${Date.now()}`;
    const now = new Date().toISOString();

    const newNote: Note = {
      id,
      kind: 'note',
      projectId: note?.projectId || projectId,
      type,
      title: title.trim(),
      date,
      time,
      attendees: attendees.trim(),
      body: isEmptyBody(body) ? '<p>Sin notas registradas.</p>' : body,
      createdAt: note?.createdAt || now,
      updatedAt: now,
    };

    store.putRecord(newNote);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-neutral-800 bg-slate-50/90 dark:bg-neutral-900/90">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-neutral-100">
              {note ? 'Editar Minuta / Sesión / Acuerdo' : 'Nueva Minuta / Sesión / Acuerdo'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-neutral-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Tipo de Registro</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-2.5 py-2 text-slate-800 dark:text-neutral-200 focus:outline-hidden focus:border-blue-500 dark:focus:border-cyan-500"
              >
                <option value="Sesión">Sesión Técnica</option>
                <option value="Nota">Nota Operativa</option>
                <option value="Acuerdo">Acuerdo con Cliente</option>
                <option value="Decisión">Decisión de Arquitectura</option>
                <option value="Compromiso">Compromiso / Entregable</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 dark:text-neutral-300 block mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-2.5 py-2 text-slate-800 dark:text-neutral-200 font-mono focus:outline-hidden focus:border-blue-500 dark:focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-medium">Título de la Minuta *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Revisión de puertos y validación de arquitectura..."
              className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 text-sm focus:outline-hidden focus:border-blue-500 dark:focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-neutral-300 block mb-1">Asistentes / Convocados</label>
            <input
              type="text"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="Ej. Roberto Garza (CISO), Carlos Mendoza (Inntech)..."
              className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-800 dark:text-neutral-200 focus:outline-hidden focus:border-blue-500 dark:focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-slate-700 dark:text-neutral-300 block mb-1">Cuerpo / Acuerdos Tomados</label>
            <RichTextEditor
              value={body}
              onChange={setBody}
              rows={8}
              placeholder="Puntos discutidos, decisiones tomadas y próximos compromisos..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-neutral-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 rounded-lg transition-colors shadow-xs"
            >
              {note ? 'Guardar Cambios' : 'Guardar Minuta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
