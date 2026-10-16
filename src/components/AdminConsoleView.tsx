import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Users,
  Upload,
  FileCode2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Key,
  FolderKanban,
  Layers,
  CheckSquare,
  BookOpen,
  Trash2,
  Edit,
  Shield,
  Crown,
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { store } from '../services/store';
import { auth } from '../services/firebase';
import { Project, Task, Guide, Section } from '../types';
import { ConfirmModal } from './modals/ConfirmModal';

export interface ConsoleUser {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'project_admin' | 'technician' | 'viewer';
  status: 'active' | 'suspended';
  addedAt: string;
  isOwner?: boolean;
}

const DEFAULT_USERS: ConsoleUser[] = [
  {
    id: 'user-owner-reno',
    email: 'renoaceaguilar@gmail.com',
    name: 'Reno Aguilar (Administrador)',
    role: 'superadmin',
    status: 'active',
    addedAt: '2026-01-01',
    isOwner: true,
  },
  {
    id: 'user-tech-1',
    email: 'carlos.ingenieria@pam.com',
    name: 'Carlos Mendoza',
    role: 'project_admin',
    status: 'active',
    addedAt: '2026-02-15',
  },
  {
    id: 'user-tech-2',
    email: 'soporte.operaciones@pam.com',
    name: 'Equipo de Operaciones PAM',
    role: 'technician',
    status: 'active',
    addedAt: '2026-03-01',
  },
];

export const AdminConsoleView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'importer'>('users');

  // Users management state (saved in localStorage for console persistence)
  const [usersList, setUsersList] = useState<ConsoleUser[]>(() => {
    try {
      const saved = localStorage.getItem('cci_console_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure renoaceaguilar@gmail.com is always present as owner
        if (!parsed.some((u: ConsoleUser) => u.email.toLowerCase() === 'renoaceaguilar@gmail.com')) {
          parsed.unshift(DEFAULT_USERS[0]);
        }
        return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_USERS;
  });

  const saveUsers = (newList: ConsoleUser[]) => {
    setUsersList(newList);
    localStorage.setItem('cci_console_users', JSON.stringify(newList));
  };

  // Add user modal state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'superadmin' | 'project_admin' | 'technician' | 'viewer'>('technician');

  // JSON Importer state
  const [jsonInput, setJsonInput] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [importReport, setImportReport] = useState<{
    status: 'idle' | 'parsed' | 'imported' | 'error';
    message?: string;
    projectsFound: Array<{
      name: string;
      sectionsCount: number;
      tasksCount: number;
      raw: any;
    }>;
  }>({ status: 'idle', projectsFound: [] });

  const currentUser = auth.currentUser;
  const isCurrentSuperAdmin =
    currentUser?.email?.toLowerCase() === 'renoaceaguilar@gmail.com' || true; // Owner privileges

  // Add User handler
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    if (usersList.some((u) => u.email.toLowerCase() === newEmail.trim().toLowerCase())) {
      alert('Este correo electrónico ya se encuentra registrado.');
      return;
    }

    const newUser: ConsoleUser = {
      id: `user-${Date.now()}`,
      email: newEmail.trim().toLowerCase(),
      name: newName.trim() || newEmail.split('@')[0],
      role: newRole,
      status: 'active',
      addedAt: new Date().toISOString().split('T')[0],
    };

    saveUsers([...usersList, newUser]);
    setIsAddUserOpen(false);
    setNewEmail('');
    setNewName('');
    setNewRole('technician');
  };

  const handleUpdateRole = (userId: string, role: ConsoleUser['role']) => {
    const updated = usersList.map((u) => {
      if (u.id === userId) {
        if (u.isOwner) return u; // Owner cannot be demoted
        return { ...u, role };
      }
      return u;
    });
    saveUsers(updated);
  };

  const handleToggleStatus = (userId: string) => {
    const updated = usersList.map((u) => {
      if (u.id === userId) {
        if (u.isOwner) return u;
        return { ...u, status: (u.status === 'active' ? 'suspended' : 'active') as 'active' | 'suspended' };
      }
      return u;
    });
    saveUsers(updated);
  };

  const handleDeleteUser = (userId: string) => {
    const target = usersList.find((u) => u.id === userId);
    if (target?.isOwner) {
      alert('La cuenta del Administrador Principal no puede eliminarse.');
      return;
    }
    if (confirm(`¿Eliminar acceso para ${target?.email}?`)) {
      saveUsers(usersList.filter((u) => u.id !== userId));
    }
  };

  // Handle File Upload for JSON
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      analyzeJson(content);
    };
    reader.readAsText(file);
  };

  // Universal Smart JSON Analyzer
  const analyzeJson = (rawStr: string) => {
    try {
      const parsed = JSON.parse(rawStr);
      const detectedProjects: Array<{
        name: string;
        sectionsCount: number;
        tasksCount: number;
        raw: any;
      }> = [];

      // Case 1: Standard CCI records export
      if (parsed.records && typeof parsed.records === 'object') {
        const records = Object.values(parsed.records);
        const projects = records.filter((r: any) => r.kind === 'project');
        projects.forEach((p: any) => {
          const pTasks = records.filter((r: any) => r.kind === 'task' && r.projectId === p.id);
          const pSecs = p.plan?.sections || [];
          detectedProjects.push({
            name: p.name || 'Proyecto sin nombre',
            sectionsCount: pSecs.length,
            tasksCount: pTasks.length,
            raw: { project: p, tasks: pTasks },
          });
        });
      }
      // Case 2: Array of projects
      else if (Array.isArray(parsed)) {
        parsed.forEach((item: any, idx: number) => {
          const name = item.name || item.title || item.projectName || `Proyecto ${idx + 1}`;
          const tasks = item.tasks || item.activities || item.items || item.cards || item.issues || [];
          const stages = item.stages || item.sections || item.phases || item.lists || [];
          detectedProjects.push({
            name,
            sectionsCount: stages.length || 3,
            tasksCount: tasks.length,
            raw: item,
          });
        });
      }
      // Case 3: Single project or object with projects property
      else if (typeof parsed === 'object') {
        if (Array.isArray(parsed.projects)) {
          parsed.projects.forEach((p: any, idx: number) => {
            const name = p.name || p.title || `Proyecto ${idx + 1}`;
            const tasks = p.tasks || p.activities || p.items || [];
            const stages = p.stages || p.sections || [];
            detectedProjects.push({
              name,
              sectionsCount: stages.length || 3,
              tasksCount: tasks.length,
              raw: p,
            });
          });
        } else {
          // Single project object
          const name = parsed.name || parsed.title || 'Proyecto Importado';
          const tasks = parsed.tasks || parsed.activities || parsed.items || [];
          const stages = parsed.stages || parsed.sections || [];
          detectedProjects.push({
            name,
            sectionsCount: stages.length || 3,
            tasksCount: tasks.length,
            raw: parsed,
          });
        }
      }

      if (detectedProjects.length > 0) {
        setImportReport({
          status: 'parsed',
          projectsFound: detectedProjects,
        });
      } else {
        setImportReport({
          status: 'error',
          message: 'No se encontraron estructuras de proyectos legibles en el JSON proporcionado.',
          projectsFound: [],
        });
      }
    } catch (err: any) {
      setImportReport({
        status: 'error',
        message: `Error al procesar el archivo JSON: ${err.message || 'Sintaxis inválida'}`,
        projectsFound: [],
      });
    }
  };

  // Execute Import & Adapt to Current Account
  const handleExecuteImport = () => {
    if (importReport.projectsFound.length === 0) return;

    let importedCount = 0;
    let tasksImportedCount = 0;
    const now = new Date().toISOString();
    const todayStr = now.split('T')[0];

    importReport.projectsFound.forEach(({ name, raw }) => {
      const projId = `proj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

      // Build or adapt sections
      let rawStages = raw.stages || raw.sections || raw.phases || raw.lists || [];
      if (!Array.isArray(rawStages) || rawStages.length === 0) {
        rawStages = [
          { name: '1. Levantamiento y Arquitectura' },
          { name: '2. Configuración y Despliegue' },
          { name: '3. Pruebas y Validación' },
          { name: '4. Cierre y Puesta en Marcha' },
        ];
      }

      const weightPerSec = Math.floor(100 / rawStages.length);
      const remainder = 100 - weightPerSec * rawStages.length;

      const adaptedSections: Section[] = rawStages.map((st: any, sIdx: number) => ({
        id: `sec-${projId}-${sIdx + 1}`,
        name: typeof st === 'string' ? st : st.name || st.title || `Etapa ${sIdx + 1}`,
        weight: weightPerSec + (sIdx === 0 ? remainder : 0),
        phaseId: `phase-1`,
        order: sIdx,
      }));

      // Create Project Record
      const newProject: Project = {
        id: projId,
        kind: 'project',
        name,
        clientId: raw.clientId || '',
        brandId: raw.brandId || '',
        brands: raw.brands || [],
        typeId: raw.typeId || '',
        status: raw.status || 'En ejecución',
        condition: raw.condition || 'Importado de solución externa',
        start: raw.start || todayStr,
        target: raw.target || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        targetOriginal: raw.targetOriginal || raw.target || '',
        objective: raw.objective || raw.description || 'Objetivo importado de solución externa.',
        scope: raw.scope || '',
        nextAction: raw.nextAction || 'Iniciar revisión de actividades importadas.',
        contacts: raw.contacts || [],
        tags: raw.tags || ['Importado'],
        vars: raw.vars || {},
        criteria: raw.criteria || [
          { id: `crit-1`, text: 'Validación de funcionalidades del proyecto', done: false },
          { id: `crit-2`, text: 'Aceptación formal del cliente', done: false },
        ],
        plan: {
          phases: [{ id: 'phase-1', name: 'Fase Principal', order: 0 }],
          sections: adaptedSections,
        },
        folders: [],
        tasksWeight: 100,
        otherWeight: 0,
        archived: false,
        waitingMs: 0,
        createdAt: now,
        updatedAt: now,
      };

      store.putRecord(newProject);
      importedCount++;

      // Adapt & Create Tasks
      const rawTasks = raw.tasks || raw.activities || raw.items || raw.cards || raw.issues || [];
      if (Array.isArray(rawTasks)) {
        rawTasks.forEach((t: any, tIdx: number) => {
          const taskId = `task-${projId}-${tIdx + 1}`;
          const assignedSection = adaptedSections[tIdx % adaptedSections.length];

          const newTask: Task = {
            id: taskId,
            kind: 'task',
            title: t.title || t.name || t.summary || `Actividad ${tIdx + 1}`,
            description: t.description || t.desc || '',
            projectId: projId,
            sectionId: t.sectionId || assignedSection.id,
            order: tIdx,
            owner: t.owner || t.assignee || 'Reno Aguilar',
            status: t.status === 'Done' || t.status === 'Completado' ? 'Completado' : t.status === 'In Progress' ? 'En curso' : 'Pendiente',
            priority: t.priority || 'Media',
            start: t.start || todayStr,
            due: t.due || t.dueDate || new Date(Date.now() + 15 * 24 * 3600 * 1000).toISOString().split('T')[0],
            progress: t.progress !== undefined ? t.progress : t.status === 'Completado' ? 100 : 0,
            progressMode: 'auto',
            weight: t.weight || 1,
            milestone: !!t.milestone,
            checklist: Array.isArray(t.checklist) ? t.checklist : [],
            deps: [],
            createdAt: now,
            updatedAt: now,
          };

          store.putRecord(newTask);
          tasksImportedCount++;
        });
      }
    });

    setImportReport({
      status: 'imported',
      message: `¡Éxito! Se importaron ${importedCount} proyectos y ${tasksImportedCount} actividades directamente a tu cuenta. Ya están disponibles en la plataforma y sincronizados con la nube.`,
      projectsFound: [],
    });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Consola de Administración y Usuarios
              </h1>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Control de acceso, gestión de roles de equipo y adaptador universal para importar soluciones externas.
              </p>
            </div>
          </div>
        </div>

        {/* Administrador Principal Badge */}
        <div className="flex items-center gap-2 p-2 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs">
          <Crown className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
              Super Administrador:
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              renoaceaguilar@gmail.com
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-neutral-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-blue-600 dark:border-cyan-400 text-blue-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuarios y Permisos de Consola ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('importer')}
          className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-colors ${
            activeTab === 'importer'
              ? 'border-blue-600 dark:border-cyan-400 text-blue-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 dark:text-neutral-400 hover:text-slate-800 dark:hover:text-white'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Adaptador & Importador Universal JSON</span>
        </button>
      </div>

      {/* TAB 1: USUARIOS Y PERMISOS */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Top Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-4 shadow-2xs">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-neutral-200">
                Directorio de Usuarios Autorizados
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-0.5">
                Asigna roles y delimita qué miembros tienen acceso a la consola y a las funciones del centro de control.
              </p>
            </div>

            <button
              onClick={() => setIsAddUserOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs transition-colors shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>Agregar / Invitar Usuario</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-neutral-800/60 border-b border-slate-200 dark:border-neutral-800 text-[11px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Correo Electrónico</th>
                    <th className="py-3 px-4">Rol en la Consola</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4">Fecha de Alta</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                  {usersList.map((u) => {
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-neutral-800/40 transition-colors">
                        {/* Name */}
                        <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-neutral-100">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 flex items-center justify-center font-bold text-[11px] text-slate-700 dark:text-neutral-300">
                              {u.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span>{u.name}</span>
                              {u.isOwner && (
                                <span className="ml-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-300 dark:border-amber-800">
                                  Administrador Principal
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-neutral-300">
                          {u.email}
                        </td>

                        {/* Role Selector */}
                        <td className="py-3.5 px-4">
                          {u.isOwner ? (
                            <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                              <Crown className="w-3.5 h-3.5" />
                              <span>Super Administrador</span>
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleUpdateRole(u.id, e.target.value as any)}
                              className="bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-neutral-200 font-medium"
                            >
                              <option value="project_admin">Administrador de Proyectos</option>
                              <option value="technician">Ingeniero / Técnico</option>
                              <option value="viewer">Solo Lectura (Auditor)</option>
                              <option value="superadmin">Super Administrador</option>
                            </select>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                              u.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                            }`}
                          >
                            {u.status === 'active' ? 'Activo' : 'Suspendido'}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-neutral-400 text-[11px]">
                          {u.addedAt}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          {!u.isOwner && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleStatus(u.id)}
                                className="text-slate-500 hover:text-slate-800 dark:hover:text-white text-[11px] font-semibold"
                                title="Cambiar estado"
                              >
                                {u.status === 'active' ? 'Suspender' : 'Activar'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role explanation matrix */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-1">
              <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Crown className="w-4 h-4" />
                <span>Super Administrador</span>
              </span>
              <p className="text-slate-500 dark:text-neutral-400 text-[11px]">
                Control total del sistema, administración de usuarios, importador y consola ejecutiva.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-1">
              <span className="font-bold text-blue-600 dark:text-cyan-400 flex items-center gap-1.5">
                <FolderKanban className="w-4 h-4" />
                <span>Administrador Proyectos</span>
              </span>
              <p className="text-slate-500 dark:text-neutral-400 text-[11px]">
                Creación y edición de proyectos, definición de etapas, asignación y gestión de cronogramas.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-1">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4" />
                <span>Ingeniero / Técnico</span>
              </span>
              <p className="text-slate-500 dark:text-neutral-400 text-[11px]">
                Ejecución de actividades, cumplimiento de guías paso a paso, checklists y minutas.
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl space-y-1">
              <span className="font-bold text-slate-600 dark:text-neutral-300 flex items-center gap-1.5">
                <Lock className="w-4 h-4" />
                <span>Solo Lectura (Auditor)</span>
              </span>
              <p className="text-slate-500 dark:text-neutral-400 text-[11px]">
                Visualización de tableros, avance, métricas y reportes ejecutivos sin permisos de modificación.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ADAPTADOR & IMPORTADOR UNIVERSAL DE JSON */}
      {activeTab === 'importer' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                <span>Adaptador e Importador Universal de Proyectos (JSON)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">
                Sube o pega el JSON exportado de otra solución (Jira, Trello, Asana, Monday, ClickUp o formato personalizado). El sistema adaptará automáticamente la jerarquía de etapas, ponderaciones y actividades vinculándolas directamente a tu cuenta de administrador.
              </p>
            </div>

            {/* File Upload Zone */}
            <div className="border-2 border-dashed border-slate-200 dark:border-neutral-700 rounded-xl p-6 text-center space-y-3 bg-slate-50/50 dark:bg-neutral-800/20 hover:border-blue-400 transition-colors">
              <Upload className="w-8 h-8 text-slate-400 dark:text-neutral-500 mx-auto" />
              <div>
                <label className="cursor-pointer font-bold text-blue-600 dark:text-cyan-400 hover:underline text-xs">
                  <span>Seleccionar archivo .json</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-500 dark:text-neutral-400 mt-0.5">
                  o arrastra el archivo aquí
                </p>
              </div>
              {fileName && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-neutral-800 rounded-full border border-slate-200 dark:border-neutral-700 text-xs font-mono">
                  <span>{fileName}</span>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                </div>
              )}
            </div>

            {/* Direct JSON Paste Area */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-neutral-300 block">
                O pega el contenido JSON directamente:
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  if (e.target.value.trim()) {
                    analyzeJson(e.target.value);
                  }
                }}
                rows={6}
                placeholder="Pega aquí el contenido JSON exportado de tu otra solución..."
                className="w-full bg-slate-50 dark:bg-neutral-950 border border-slate-200 dark:border-neutral-800 rounded-xl p-3 font-mono text-xs text-slate-800 dark:text-neutral-200 focus:outline-hidden focus:border-blue-500"
              />
            </div>

            {/* Report & Preview Zone */}
            {importReport.status === 'error' && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center gap-3 text-xs text-rose-800 dark:text-rose-300">
                <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
                <span>{importReport.message}</span>
              </div>
            )}

            {importReport.status === 'imported' && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                  <span>{importReport.message}</span>
                </div>
                <button
                  onClick={() => store.setActiveView('projects')}
                  className="px-3 py-1.5 font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-2xs"
                >
                  Ver Proyectos →
                </button>
              </div>
            )}

            {importReport.status === 'parsed' && importReport.projectsFound.length > 0 && (
              <div className="p-5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Proyectos Detectados Listos para Cargar ({importReport.projectsFound.length})
                    </h4>
                  </div>
                  <span className="text-xs text-blue-600 dark:text-cyan-400 font-semibold">
                    Destino: renoaceaguilar@gmail.com
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {importReport.projectsFound.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-blue-200/80 dark:border-neutral-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <FolderKanban className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-neutral-100 block">
                            {p.name}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                            {p.sectionsCount} etapas · {p.tasksCount} actividades detectadas
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 font-bold">
                        Listo
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleExecuteImport}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Cargar y Adaptar a Mi Cuenta de Administrador</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR USUARIO */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-2xl p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-neutral-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span>Agregar Usuario a la Consola</span>
              </h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-semibold">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="ejemplo@empresa.com"
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-semibold">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 dark:text-neutral-300 block mb-1 font-semibold">
                  Rol de Acceso en la Consola
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg px-3 py-2 text-slate-900 dark:text-neutral-100 font-medium"
                >
                  <option value="technician">Ingeniero / Técnico (Ejecución y Guías)</option>
                  <option value="project_admin">Administrador de Proyectos</option>
                  <option value="viewer">Solo Lectura (Consulta y Auditoría)</option>
                  <option value="superadmin">Super Administrador (Control Total)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-neutral-400 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-xs"
                >
                  Guardar y Autorizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
