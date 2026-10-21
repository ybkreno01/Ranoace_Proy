export type ProjectStatus =
  | 'Borrador'
  | 'Planificado'
  | 'En ejecución'
  | 'En espera'
  | 'Completado'
  | 'Cancelado';

export type TaskStatus =
  | 'Pendiente'
  | 'En curso'
  | 'En espera'
  | 'En validación'
  | 'Completado';

export type TaskPriority = 'Baja' | 'Media' | 'Alta' | 'Crítica';

export type NoteType = 'Sesión' | 'Nota' | 'Acuerdo' | 'Decisión' | 'Compromiso';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Phase {
  id: string;
  name: string;
  order: number;
}

export interface Section {
  id: string;
  name: string;
  weight: number;
  phaseId: string;
  guideTplId?: string;
  guideWeight?: number;
  order: number;
}

export interface ProjectPlan {
  phases: Phase[];
  sections: Section[];
}

export interface ProjectCriteria {
  id: string;
  text: string;
  done: boolean;
}

export interface ProjectClosure {
  executed: boolean;
  result: 'Exitosa' | 'Parcialmente exitosa' | 'No exitosa' | 'Completado' | 'Cancelado';
  date: string;
  notes: string;
  criteriaState: Record<string, boolean>;
}

export interface Project {
  id: string;
  kind: 'project';
  name: string;
  clientId: string;
  channelId?: string;
  brandId?: string;
  brands: string[];
  typeId: string;
  status: ProjectStatus;
  condition?: string;
  start: string;
  target: string;
  targetOriginal: string;
  objective: string;
  scope?: string;
  nextAction?: string;
  nextActionDate?: string;
  blocker?: string;
  blockerOwner?: string;
  contacts: string[];
  tags: string[];
  vars: Record<string, string>;
  criteria: ProjectCriteria[];
  closure?: ProjectClosure;
  plan: ProjectPlan;
  planTplId?: string;
  folders: string[];
  tasksWeight: number;
  otherWeight: number;
  archived: boolean;
  waitingMs: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  deletedWith?: string | null;
}

export interface Task {
  id: string;
  kind: 'task';
  title: string;
  description?: string;
  projectId?: string;
  sectionId?: string;
  order: number;
  owner: string;
  status: TaskStatus;
  priority: TaskPriority;
  start?: string;
  due?: string;
  dueOriginal?: string;
  realStart?: string;
  realEnd?: string;
  progress: number;
  progressMode: 'auto' | 'manual';
  weight: number;
  milestone: boolean;
  checklist: ChecklistItem[];
  deps: string[];
  guideRef?: string;
  stepRef?: { pguideId: string; stepId: string };
  blockReason?: string;
  blockOwner?: string;
  followUp?: string;
  estimate?: number;
  actual?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type BlockType =
  | 'text'
  | 'command'
  | 'script'
  | 'checklist'
  | 'image'
  | 'file'
  | 'validation'
  | 'warning'
  | 'table';

export interface GuideBlock {
  id: string;
  type: BlockType;
  label?: string;
  html?: string;
  lang?: string;
  code?: string;
  filename?: string;
  instructions?: string;
  items?: ChecklistItem[];
  path?: string;
  caption?: string;
  widthPct?: number;
  expected?: string;
  observed?: string;
  obsState?: 'ok' | 'fail' | 'pending';
  evidence?: string;
  level?: 'Impacto' | 'Precaución' | 'Limitación';
  rows?: string[][];
}

export interface GuideStep {
  id: string;
  title: string;
  desc?: string;
  evaluable: boolean;
  weight: number;
  mode: 'check' | 'checklist' | 'manual';
  progress: number;
  comment?: string;
  na: boolean;
  naReason?: string;
  blocks: GuideBlock[];
  srcId?: string;
  srcHash?: string;
}

export interface GuideSection {
  id: string;
  title: string;
  order: number;
  steps: GuideStep[];
}

export interface Guide {
  id: string;
  kind: 'guide' | 'pguide' | 'demo';
  name: string;
  version: string;
  brandId?: string;
  product?: string;
  env?: string;
  prereqs?: string;
  folder?: string;
  tags: string[];
  fav: boolean;
  reviewDate?: string;
  description?: string;
  sections: GuideSection[];
  projectId?: string;
  sourceId?: string;
  sourceVersion?: string;
  weight?: number;
  order?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface InteractiveGuide {
  id: string;
  kind: 'interactive_guide';
  name: string;
  version?: string;
  brandId?: string;
  product?: string;
  folder?: string;
  tags?: string[];
  fav?: boolean;
  description?: string;
  htmlContent: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ScriptBlock {
  id: string;
  type?: BlockType;
  code?: string;
  label?: string;
  lang?: string;
  html?: string;
  path?: string;
  caption?: string;
  items?: ChecklistItem[];
  level?: 'Impacto' | 'Precaución' | 'Limitación';
}

export interface Script {
  id: string;
  kind: 'script';
  name: string;
  os: string;
  lang: string;
  version: string;
  objective: string;
  requirements?: string;
  params?: string;
  impact?: string;
  validation?: string;
  rollback?: string;
  projects: string[];
  blocks: ScriptBlock[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Trouble {
  id: string;
  kind: 'trouble';
  name: string;
  os: string;
  symptom: string;
  evidence?: string;
  hypothesis?: string;
  test?: string;
  result?: string;
  fix: string;
  validation?: string;
  projects: string[];
  blocks: ScriptBlock[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface PlanTplActivity {
  id: string;
  sectionId: string;
  title: string;
  owner: string;
  d0: number;
  d1: number;
  weight: number;
  milestone: boolean;
  guideTplId?: string;
  checklist: ChecklistItem[];
}

export interface PlanTplSection {
  id: string;
  name: string;
  weight: number;
  phaseId: string;
  guideTplId?: string;
  guideWeight?: number;
}

export interface PlanTpl {
  id: string;
  kind: 'plantpl';
  name: string;
  version: string;
  brandId?: string;
  typeId?: string;
  description?: string;
  fav: boolean;
  phases: { id: string; name: string }[];
  sections: PlanTplSection[];
  acts: PlanTplActivity[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Note {
  id: string;
  kind: 'note';
  name?: string;
  projectId: string;
  type: NoteType;
  title: string;
  date: string;
  time?: string;
  attendees?: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ProjectFile {
  id: string;
  kind: 'file';
  projectId: string;
  taskId?: string;
  folder: string;
  name: string;
  path: string;
  size: number;
  mime: string;
  category?: string;
  note?: string;
  dataBase64?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface CatalogItem {
  id: string;
  kind: 'client' | 'channel' | 'brand' | 'contact' | 'worktype' | 'tag';
  name: string;
  color?: string;
  logo?: string;
  aliases?: string[];
  role?: string;
  orgId?: string;
  email?: string;
  phone?: string;
  group?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Hist {
  id: string;
  kind: 'hist';
  name?: string;
  entityId: string;
  entityKind: string;
  projectId?: string;
  at: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface DailyPlanItem {
  id: string;
  kind: 'daily_plan';
  title: string;
  description?: string;
  objective?: string;
  date?: string;
  done: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Settings {
  id: 'settings';
  kind: 'settings';
  name?: string;
  theme: 'dark' | 'light' | 'system';
  palette: string;
  me: string;
  staleDays: number;
  backupEveryDays: number;
  backupKeep: number;
  pamTplSeeded: boolean;
  googleDriveFolderId?: string;
  googleDriveFolderName?: string;
  autoSyncDrive?: boolean;
  lastDriveSync?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export type AnyRecord =
  | Project
  | Task
  | Guide
  | InteractiveGuide
  | Script
  | Trouble
  | PlanTpl
  | Note
  | ProjectFile
  | CatalogItem
  | Hist
  | DailyPlanItem
  | Settings;

export interface AppState {
  records: Record<string, AnyRecord>;
  settings: Settings;
  activeView: string;
  selectedProjectId: string | null;
  selectedTaskId: string | null;
  selectedGuideId: string | null;
  searchQuery: string;
  isSearchOpen: boolean;
  saveStatus: 'saved' | 'saving' | 'offline' | 'error';
  /** Estado de la autorización de Google Drive: ok, vencida o sin sesión. */
  driveStatus?: 'ok' | 'expired' | 'disconnected';
  lastSavedAt: string;
}
