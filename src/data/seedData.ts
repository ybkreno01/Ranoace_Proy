import { AnyRecord, PlanTpl, Settings } from '../types';
import { SEGURA_CLUSTER_HTML } from './seguraClusterInteractiveGuide';

export const defaultSettings: Settings = {
  id: 'settings',
  kind: 'settings',
  theme: 'dark',
  palette: 'blue',
  me: 'Ing. Carlos Mendoza (Inntech)',
  staleDays: 14,
  backupEveryDays: 1,
  backupKeep: 10,
  pamTplSeeded: true,
  createdAt: '2026-10-09T08:00:00.000Z',
  updatedAt: '2026-10-09T08:00:00.000Z',
};

// Plantilla oficial con las 9 etapas exactas de la especificación y captura del usuario
export const pamSaaSPlantilla: PlanTpl = {
  id: 'plantpl-pam-saas',
  kind: 'plantpl',
  name: 'Implementación PAM SaaS (Segura)',
  version: '2.0',
  brandId: 'brand-segura',
  typeId: 'type-impl',
  description:
    'Plantilla oficial de despliegue y puesta en marcha para plataforma Privileged Access Management (PAM) estructurada en 3 fases y 9 secciones ponderadas.',
  fav: true,
  phases: [
    { id: 'f1', name: 'Planeación' },
    { id: 'f2', name: 'Ejecución' },
    { id: 'f3', name: 'Liberación y cierre' },
  ],
  sections: [
    { id: 'sec-1', name: '01 Planeación', weight: 5, phaseId: 'f1' },
    { id: 'sec-2', name: '02 Aprovisionamiento de Ova Onpremise', weight: 25, phaseId: 'f2' },
    { id: 'sec-3', name: '03 Levantamiento de Información', weight: 10, phaseId: 'f2' },
    { id: 'sec-4', name: '04 Configuraciones Estándar', weight: 10, phaseId: 'f2' },
    { id: 'sec-5', name: '05 Configuraciones Empresariales', weight: 5, phaseId: 'f2' },
    { id: 'sec-6', name: '06 Rollout Inicial de Accesos', weight: 35, phaseId: 'f2' },
    { id: 'sec-7', name: '07 Validaciones Funcionales', weight: 5, phaseId: 'f2' },
    { id: 'sec-8', name: '08 Entrenamientos', weight: 3, phaseId: 'f3' },
    { id: 'sec-9', name: '09 Cierre de Proyecto', weight: 3, phaseId: 'f3' },
  ],
  acts: [
    // 01 Planeación (5%)
    { id: 'act-1-1', sectionId: 'sec-1', title: 'Reunión de alineación y objetivos', owner: 'Líder Técnico', d0: 0, d1: 1, weight: 1, milestone: true, checklist: [] },
    { id: 'act-1-2', sectionId: 'sec-1', title: 'Definición de matriz RACI y alcance', owner: 'Líder Técnico', d0: 1, d1: 2, weight: 1, milestone: false, checklist: [] },
    { id: 'act-1-3', sectionId: 'sec-1', title: 'Revisión de prerrequisitos de red y firewall', owner: 'Ingeniero de Redes', d0: 2, d1: 3, weight: 1, milestone: false, checklist: [] },
    { id: 'act-1-4', sectionId: 'sec-1', title: 'Validación de puertos 443 salientes y DNS', owner: 'Ingeniero de Redes', d0: 3, d1: 4, weight: 1, milestone: false, checklist: [] },
    { id: 'act-1-5', sectionId: 'sec-1', title: 'Aprobación del plan de trabajo por el cliente', owner: 'Gerente de Proyecto', d0: 4, d1: 5, weight: 1, milestone: true, checklist: [] },

    // 02 Aprovisionamiento de Ova Onpremise (25%)
    { id: 'act-2-1', sectionId: 'sec-2', title: 'Descarga y despliegue del template OVA en VMware', owner: 'Admin Virtualización', d0: 5, d1: 7, weight: 6, milestone: false, checklist: [] },
    { id: 'act-2-2', sectionId: 'sec-2', title: 'Asignación de IP estática y configuración de red', owner: 'Admin Servidores', d0: 7, d1: 8, weight: 6, milestone: false, checklist: [] },
    { id: 'act-2-3', sectionId: 'sec-2', title: 'Instalación de certificados TLS y certificados CA', owner: 'Especialista PKI', d0: 8, d1: 10, weight: 6, milestone: false, checklist: [] },
    { id: 'act-2-4', sectionId: 'sec-2', title: 'Enrolamiento y handshake con el Cloud Vault', owner: 'Líder Técnico', d0: 10, d1: 12, weight: 7, milestone: true, checklist: [] },

    // 03 Levantamiento de Información (10%)
    { id: 'act-3-1', sectionId: 'sec-3', title: 'Inventario de servidores Windows y Linux objetivo', owner: 'Ingeniero Ciberseguridad', d0: 12, d1: 14, weight: 3, milestone: false, checklist: [] },
    { id: 'act-3-2', sectionId: 'sec-3', title: 'Identificación de cuentas Domain Admins y Root', owner: 'Ingeniero Ciberseguridad', d0: 14, d1: 15, weight: 4, milestone: false, checklist: [] },
    { id: 'act-3-3', sectionId: 'sec-3', title: 'Mapeo de accesos de terceros y proveedores', owner: 'Líder Técnico', d0: 15, d1: 16, weight: 3, milestone: false, checklist: [] },

    // 04 Configuraciones Estándar (10%)
    { id: 'act-4-1', sectionId: 'sec-4', title: 'Políticas de complejidad y longitud de credenciales', owner: 'Administrador PAM', d0: 16, d1: 17, weight: 2, milestone: false, checklist: [] },
    { id: 'act-4-2', sectionId: 'sec-4', title: 'Configuración de rotación automática cada 30 días', owner: 'Administrador PAM', d0: 17, d1: 18, weight: 2, milestone: false, checklist: [] },
    { id: 'act-4-3', sectionId: 'sec-4', title: 'Parámetros de auditoría y retención de logs', owner: 'Auditor Seguridad', d0: 18, d1: 19, weight: 2, milestone: false, checklist: [] },
    { id: 'act-4-4', sectionId: 'sec-4', title: 'Integración LDAP con Active Directory', owner: 'Administrador AD', d0: 19, d1: 20, weight: 2, milestone: false, checklist: [] },
    { id: 'act-4-5', sectionId: 'sec-4', title: 'Creación de roles RBAC (Administradores, Auditores)', owner: 'Administrador PAM', d0: 20, d1: 21, weight: 1, milestone: false, checklist: [] },
    { id: 'act-4-6', sectionId: 'sec-4', title: 'Configuración de factores MFA obligatorios', owner: 'Especialista Identidad', d0: 21, d1: 22, weight: 1, milestone: true, checklist: [] },

    // 05 Configuraciones Empresariales (5%)
    { id: 'act-5-1', sectionId: 'sec-5', title: 'Configuración de segregación por OUs y departamentos', owner: 'Líder Técnico', d0: 22, d1: 23, weight: 3, milestone: false, checklist: [] },
    { id: 'act-5-2', sectionId: 'sec-5', title: 'Personalización de marca corporativa y logos', owner: 'Ingeniero Soporte', d0: 23, d1: 24, weight: 2, milestone: false, checklist: [] },

    // 06 Rollout Inicial de Accesos (35%)
    { id: 'act-6-1', sectionId: 'sec-6', title: 'Enrolamiento de primeros 25 servidores Windows (RDP)', owner: 'Ingeniero Ciberseguridad', d0: 24, d1: 26, weight: 12, milestone: false, checklist: [] },
    { id: 'act-6-2', sectionId: 'sec-6', title: 'Enrolamiento de 15 servidores Linux core (SSH)', owner: 'Ingeniero Ciberseguridad', d0: 26, d1: 28, weight: 12, milestone: false, checklist: [] },
    { id: 'act-6-3', sectionId: 'sec-6', title: 'Grabación de sesiones y comprobación de OCR en vivo', owner: 'Auditor Seguridad', d0: 28, d1: 30, weight: 11, milestone: true, checklist: [] },

    // 07 Validaciones Funcionales (5%)
    { id: 'act-7-1', sectionId: 'sec-7', title: 'Pruebas de cambio y verificación de contraseñas', owner: 'Líder Técnico', d0: 30, d1: 31, weight: 3, milestone: false, checklist: [] },
    { id: 'act-7-2', sectionId: 'sec-7', title: 'Simulación de contingencia y failover de conectores', owner: 'Ingeniero de Redes', d0: 31, d1: 32, weight: 2, milestone: false, checklist: [] },

    // 08 Entrenamientos (3%)
    { id: 'act-8-1', sectionId: 'sec-8', title: 'Capacitación a operadores de TI y mesa de ayuda', owner: 'Instructor Inntech', d0: 32, d1: 33, weight: 2, milestone: false, checklist: [] },
    { id: 'act-8-2', sectionId: 'sec-8', title: 'Capacitación a equipo de auditoría y cumplimiento', owner: 'Instructor Inntech', d0: 33, d1: 34, weight: 1, milestone: false, checklist: [] },

    // 09 Cierre de Proyecto (3%)
    { id: 'act-9-1', sectionId: 'sec-9', title: 'Elaboración de Memoria Técnica As-Built', owner: 'Líder Técnico', d0: 34, d1: 35, weight: 1, milestone: false, checklist: [] },
    { id: 'act-9-2', sectionId: 'sec-9', title: 'Reunión de cierre ejecutivo con patrocinadores', owner: 'Gerente de Proyecto', d0: 35, d1: 36, weight: 1, milestone: false, checklist: [] },
    { id: 'act-9-3', sectionId: 'sec-9', title: 'Firma de los términos de aceptación', owner: 'Cliente', d0: 36, d1: 37, weight: 1, milestone: true, checklist: [] },
  ],
  createdAt: '2026-10-01T08:00:00.000Z',
  updatedAt: '2026-10-09T08:00:00.000Z',
};

export function generateSeedRecords(): Record<string, AnyRecord> {
  const records: Record<string, AnyRecord> = {};

  records['settings'] = defaultSettings;

  // Catalogs
  const brands: AnyRecord[] = [
    {
      id: 'brand-segura',
      kind: 'brand',
      name: 'Segura',
      color: '#10b981',
      aliases: ['senhasegura', 'segura', 'segurapam'],
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-09T08:00:00.000Z',
    },
    {
      id: 'brand-cyberark',
      kind: 'brand',
      name: 'CyberArk',
      color: '#3b82f6',
      aliases: ['cyberark', 'privilege cloud'],
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-09T08:00:00.000Z',
    },
    {
      id: 'brand-fortinet',
      kind: 'brand',
      name: 'Fortinet',
      color: '#ef4444',
      aliases: ['fortigate', 'forti'],
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-09T08:00:00.000Z',
    },
    {
      id: 'brand-microsoft',
      kind: 'brand',
      name: 'Microsoft',
      color: '#0284c7',
      aliases: ['azure', 'entra id', 'windows'],
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-09T08:00:00.000Z',
    },
    {
      id: 'brand-aikido',
      kind: 'brand',
      name: 'Aikido',
      color: '#5850ec',
      aliases: ['aikido', 'aikido security'],
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-09T08:00:00.000Z',
    },
    {
      id: 'brand-veracode',
      kind: 'brand',
      name: 'Veracode',
      color: '#00a3e0',
      aliases: ['veracode'],
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-09T08:00:00.000Z',
    },
    {
      id: 'brand-greenradius',
      kind: 'brand',
      name: 'GreenRadius + Yubikey',
      color: '#16a34a',
      aliases: ['greenradius', 'greenrdius', 'yubikey'],
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-09T08:00:00.000Z',
    },
  ];

  const clients: AnyRecord[] = [
    {
      id: 'client-municipio-leon',
      kind: 'client',
      name: 'Municipio de León',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-09T08:00:00.000Z',
    },
    {
      id: 'client-banco-mercantil',
      kind: 'client',
      name: 'Banco Mercantil del Centro',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-09T08:00:00.000Z',
    },
  ];

  const channels: AnyRecord[] = [
    {
      id: 'channel-circulo-daat',
      kind: 'channel',
      name: 'Circulo Daat',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-09T08:00:00.000Z',
    },
    {
      id: 'channel-vanguardia',
      kind: 'channel',
      name: 'Mayorista Vanguardia Tech',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-09T08:00:00.000Z',
    },
  ];

  const workTypes: AnyRecord[] = [
    {
      id: 'type-impl',
      kind: 'worktype',
      name: 'Implementación',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-09T08:00:00.000Z',
    },
    {
      id: 'type-poc',
      kind: 'worktype',
      name: 'PoC / PLC (Prueba de Concepto)',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-09T08:00:00.000Z',
    },
  ];

  const tags: AnyRecord[] = [
    { id: 'tag-pam', kind: 'tag', name: 'PAM', group: 'Tecnología', createdAt: '2026-10-01T08:00:00.000Z', updatedAt: '2026-10-09T08:00:00.000Z' },
    { id: 'tag-cloud', kind: 'tag', name: 'Cloud', group: 'Ambiente', createdAt: '2026-10-01T08:00:00.000Z', updatedAt: '2026-10-09T08:00:00.000Z' },
  ];

  [...brands, ...clients, ...channels, ...workTypes, ...tags].forEach((c) => {
    records[c.id] = c;
  });

  records[pamSaaSPlantilla.id] = pamSaaSPlantilla;

  // Demo Project matching EXACTLY the User Screenshot (Implementación_PAM_Municipio de León, 98% avance)
  const projectId = 'proj-municipio-leon';
  const demoProject: AnyRecord = {
    id: projectId,
    kind: 'project',
    name: 'Implementación_PAM_Municipio de León',
    clientId: 'client-municipio-leon',
    channelId: 'channel-circulo-daat',
    brandId: 'brand-segura',
    brands: ['brand-segura'],
    typeId: 'type-impl',
    status: 'En ejecución',
    condition: 'En ejecución según calendario acordado.',
    start: '2026-09-01',
    target: '2026-10-06',
    targetOriginal: '2026-10-06',
    objective:
      'Garantizar el gobierno y la trazabilidad de accesos privilegiados a servidores Windows y bases de datos del Municipio de León.',
    scope: 'Despliegue de appliance PAM, conectores locales y enrolamiento de 50 cuentas privilegiadas.',
    nextAction: 'Firma de los términos de aceptación',
    nextActionDate: '2026-10-06',
    blocker: '',
    blockerOwner: '',
    contacts: ['Lic. Roberto Garza (Director TI)', 'Ing. Laura Valdés'],
    tags: ['tag-pam'],
    vars: {
      IP_SERVIDOR: '10.150.10.45',
      URL_PORTAL: 'https://pam.municipio-leon.gob.mx',
      DOMINIO_AD: 'LEON.GOB.MX',
      PUERTO_PROXY: '8443',
    },
    criteria: [
      { id: 'cr1', text: 'Appliance y conector en línea y sincronizado', done: true },
      { id: 'cr2', text: 'Sesiones grabadas y auditables con MFA', done: true },
      { id: 'cr3', text: 'Firma de términos de aceptación', done: false },
    ],
    plan: {
      phases: pamSaaSPlantilla.phases.map((p, idx) => ({ ...p, order: idx })),
      sections: pamSaaSPlantilla.sections.map((s, idx) => ({ ...s, order: idx })),
    },
    planTplId: pamSaaSPlantilla.id,
    folders: [
      'Alcance',
      'Prerrequisitos',
      'Evidencias',
      'Memoria técnica',
      'Entregables',
      'Minutas y acuerdos',
      'Otros',
    ],
    tasksWeight: 1,
    otherWeight: 0,
    archived: false,
    waitingMs: 0,
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt: '2026-10-09T08:00:00.000Z',
  };
  records[projectId] = demoProject;

  // Generate activities for demo project matching exact 98% progress from screenshot
  pamSaaSPlantilla.acts.forEach((act, idx) => {
    // In section 5 (Configuraciones Empresariales, 2 activities): act-5-1 is 100%, act-5-2 is 34% -> avg 67%
    // In section 9 (Cierre de Proyecto, 3 activities): act-9-1 is 100%, act-9-2 is 100%, act-9-3 is 50% -> avg 92%
    // All other sections are 100%
    let prog = 100;
    let status: any = 'Completado';
    if (act.id === 'act-5-2') {
      prog = 34;
      status = 'En curso';
    } else if (act.id === 'act-9-3') {
      prog = 50;
      status = 'En curso';
    }

    const task: AnyRecord = {
      id: `task-${projectId}-${act.id}`,
      kind: 'task',
      title: act.title,
      description: `<p>Actividad del plan de trabajo para <b>${act.title}</b>.</p>`,
      projectId,
      sectionId: act.sectionId,
      order: idx,
      owner: act.owner,
      status,
      priority: act.milestone ? 'Alta' : 'Media',
      start: '2026-09-01',
      due: act.id === 'act-9-3' ? '2026-10-06' : '2026-09-25',
      dueOriginal: act.id === 'act-9-3' ? '2026-10-06' : '2026-09-25',
      realStart: '2026-09-01',
      realEnd: prog === 100 ? '2026-09-20' : undefined,
      progress: prog,
      progressMode: 'auto',
      weight: act.weight,
      milestone: act.milestone,
      checklist: [
        { id: `chk-${act.id}-1`, text: 'Paso 1 de verificación completado', done: prog >= 50 },
        { id: `chk-${act.id}-2`, text: 'Paso 2 de verificación completado', done: prog === 100 },
      ],
      deps: [],
      createdAt: '2026-09-01T09:00:00.000Z',
      updatedAt: '2026-10-09T08:00:00.000Z',
    };
    records[task.id] = task;
  });

  // Demo PoC Project (Prueba de Concepto / PLC técnica con CyberArk Cloud)
  const pocProjectId = 'proj-poc-cyberark';
  const demoPocProject: AnyRecord = {
    id: pocProjectId,
    kind: 'project',
    name: 'PoC_PAM_CyberArk_Banco Mercantil',
    clientId: 'client-banco-mercantil',
    channelId: 'channel-vanguardia',
    brandId: 'brand-cyberark',
    brands: ['brand-cyberark'],
    typeId: 'type-poc', // 'PoC (Prueba de Concepto)'
    status: 'En ejecución',
    condition: 'PoC técnica en fase de validación de casos de uso y grabación de sesiones.',
    start: '2026-10-01',
    target: '2026-10-28',
    targetOriginal: '2026-10-28',
    objective:
      'Demostración técnica y validación de arquitectura de CyberArk Privilege Cloud para banca regulada y cumplimiento.',
    scope: 'Conector CPM/PSM en ambiente de pruebas, 15 servidores Windows/Linux y pruebas de rotación de credenciales.',
    nextAction: 'Pruebas de rotación automática y validación de MFA',
    nextActionDate: '2026-10-18',
    blocker: '',
    blockerOwner: '',
    contacts: ['Ing. Fernando Morales (CISO Banco Mercantil)', 'Lic. Rocío Valdés (Seguridad TI)'],
    tags: ['tag-pam', 'PoC', 'PLC'],
    vars: {
      URL_TENANT: 'https://banco-mercantil.privilegecloud.cyberark.cloud',
      DOMINIO: 'MERCANTIL.COM',
      IP_CONNECTOR: '172.16.20.15',
    },
    criteria: [
      { id: 'poc-cr1', text: 'Despliegue y handshake de Connector Management con Cloud Vault', done: true },
      { id: 'poc-cr2', text: 'Conexión transparente RDP/SSH y grabación de sesiones en tiempo real', done: true },
      { id: 'poc-cr3', text: 'Rotación automática y reconciliación de contraseñas de cuentas Domain Admin', done: false },
      { id: 'poc-cr4', text: 'Firma de matriz de criterios de éxito de la PoC para pase a producción', done: false },
    ],
    plan: {
      phases: [
        { id: 'f-plan', name: 'Arquitectura', order: 0 },
        { id: 'f-impl', name: 'Despliegue Conectores', order: 1 },
        { id: 'f-close', name: 'Validación', order: 2 },
      ],
      sections: [
        { id: 'sec-cyb-1', name: '01 Definición Arquitectura y Red', weight: 20, phaseId: 'f-plan', order: 0 },
        { id: 'sec-cyb-2', name: '02 Instalación de Connector Management', weight: 35, phaseId: 'f-impl', order: 1 },
        { id: 'sec-cyb-3', name: '03 Enrolamiento de Plataformas y Safes', weight: 30, phaseId: 'f-impl', order: 2 },
        { id: 'sec-cyb-4', name: '04 Certificación y Aceptación', weight: 15, phaseId: 'f-close', order: 3 },
      ],
    },
    planTplId: 'plantpl-cyberark-cloud',
    folders: [
      'Alcance de la PoC',
      'Matriz de Criterios de Éxito',
      'Evidencias y Grabaciones',
      'Minutas Técnicas',
    ],
    tasksWeight: 1,
    otherWeight: 0,
    archived: false,
    waitingMs: 0,
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-10T08:00:00.000Z',
  };
  records[pocProjectId] = demoPocProject;

  // PoC Tasks
  const pocTasks: AnyRecord[] = [
    {
      id: `task-${pocProjectId}-1`,
      kind: 'task',
      title: 'Apertura de puertos de firewall y verificación de tenant CyberArk',
      description: '<p>Validación de conectividad saliente 443 a la nube y aprovisionamiento inicial.</p>',
      projectId: pocProjectId,
      sectionId: 'sec-cyb-1',
      order: 0,
      owner: 'Ing. Redes',
      status: 'Completado',
      priority: 'Alta',
      start: '2026-10-01',
      due: '2026-10-05',
      dueOriginal: '2026-10-05',
      realStart: '2026-10-01',
      realEnd: '2026-10-04',
      progress: 100,
      progressMode: 'auto',
      weight: 2,
      milestone: true,
      checklist: [{ id: 'chk-poc-1', text: 'Puertos 443 salientes verificados', done: true }],
      deps: [],
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-04T08:00:00.000Z',
    },
    {
      id: `task-${pocProjectId}-2`,
      kind: 'task',
      title: 'Instalación de Connector Management y componentes PSM/CPM',
      description: '<p>Despliegue de conectores en servidor Windows Server 2022 de pruebas.</p>',
      projectId: pocProjectId,
      sectionId: 'sec-cyb-2',
      order: 1,
      owner: 'Especialista CyberArk',
      status: 'Completado',
      priority: 'Alta',
      start: '2026-10-05',
      due: '2026-10-10',
      dueOriginal: '2026-10-10',
      realStart: '2026-10-05',
      realEnd: '2026-10-10',
      progress: 100,
      progressMode: 'auto',
      weight: 3,
      milestone: false,
      checklist: [{ id: 'chk-poc-2', text: 'Agente en línea y sincronizado', done: true }],
      deps: [],
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-10T08:00:00.000Z',
    },
    {
      id: `task-${pocProjectId}-3`,
      kind: 'task',
      title: 'Enrolamiento de cuentas privilegiadas y pruebas de grabación PSM',
      description: '<p>Pruebas de acceso RDP y SSH auditado con OCR en vivo de sesiones.</p>',
      projectId: pocProjectId,
      sectionId: 'sec-cyb-3',
      order: 2,
      owner: 'Líder Técnico',
      status: 'En curso',
      priority: 'Media',
      start: '2026-10-11',
      due: '2026-10-18',
      dueOriginal: '2026-10-18',
      realStart: '2026-10-11',
      progress: 60,
      progressMode: 'auto',
      weight: 3,
      milestone: false,
      checklist: [{ id: 'chk-poc-3', text: 'Grabación de sesiones comprobada', done: true }],
      deps: [],
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-12T08:00:00.000Z',
    },
    {
      id: `task-${pocProjectId}-4`,
      kind: 'task',
      title: 'Pruebas de rotación y presentación ejecutiva de resultados de la PoC',
      description: '<p>Reunión final de validación de criterios de éxito con CISO y equipo técnico.</p>',
      projectId: pocProjectId,
      sectionId: 'sec-cyb-4',
      order: 3,
      owner: 'Gerente de Proyecto',
      status: 'Pendiente',
      priority: 'Alta',
      start: '2026-10-19',
      due: '2026-10-25',
      dueOriginal: '2026-10-25',
      progress: 0,
      progressMode: 'auto',
      weight: 2,
      milestone: true,
      checklist: [{ id: 'chk-poc-4', text: 'Minuta de cierre de PoC firmada', done: false }],
      deps: [],
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-01T08:00:00.000Z',
    },
  ];
  pocTasks.forEach((t) => {
    records[t.id] = t;
  });

  // Sample Independent Tasks (Tareas sin proyecto relacionado / generales)
  const indepTask1: AnyRecord = {
    id: 'task-indep-ssl',
    kind: 'task',
    title: 'Renovación y monitoreo de certificados SSL/TLS wildcard anual',
    description: '<p>Verificar vencimiento de certificados y actualizar dominios en Cloudflare y balanceadores.</p>',
    order: 100,
    owner: 'Ing. Carlos Mendoza',
    status: 'En curso',
    priority: 'Alta',
    start: '2026-10-01',
    due: '2026-10-25',
    dueOriginal: '2026-10-25',
    realStart: '2026-10-01',
    progress: 60,
    progressMode: 'auto',
    weight: 2,
    milestone: false,
    checklist: [
      { id: 'chk-ssl-1', text: 'Inventario de dominios *.inntech.net y *.empresa.com', done: true },
      { id: 'chk-ssl-2', text: 'Generar CSR y solicitar firmas en DigiCert', done: true },
      { id: 'chk-ssl-3', text: 'Desplegar nuevos certificados en servidores web e ingress', done: false },
    ],
    deps: [],
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-10T10:00:00.000Z',
  };
  records[indepTask1.id] = indepTask1;

  const indepTask2: AnyRecord = {
    id: 'task-indep-audit',
    kind: 'task',
    title: 'Revisión trimestral de accesos privilegiados y rotación de credenciales L3',
    description: '<p>Auditoría interna de cuentas de servicio, tokens de API y llaves SSH activas.</p>',
    order: 101,
    owner: 'Lic. Sofía Alarcón',
    status: 'Pendiente',
    priority: 'Media',
    start: '2026-10-12',
    due: '2026-10-30',
    dueOriginal: '2026-10-30',
    progress: 0,
    progressMode: 'auto',
    weight: 1,
    milestone: false,
    checklist: [
      { id: 'chk-aud-1', text: 'Descargar reporte de usuarios IAM y grupos activos', done: false },
      { id: 'chk-aud-2', text: 'Deshabilitar cuentas inactivas por más de 60 días', done: false },
    ],
    deps: [],
    createdAt: '2026-10-12T08:00:00.000Z',
    updatedAt: '2026-10-12T08:00:00.000Z',
  };
  records[indepTask2.id] = indepTask2;

  // Demo Guide matching screenshot (Preparación -> Validar las cuentas de los custodios)
  const guideId = 'guide-custodios';
  const demoGuide: AnyRecord = {
    id: guideId,
    kind: 'guide',
    name: 'Preparación y Custodia de Llaves Maestras Segura',
    version: '1.0',
    brandId: 'brand-segura',
    product: 'Segura® PAM (appliance)',
    env: 'Producción',
    prereqs: 'Ambos custodios deben tener correo electrónico institucional y dispositivo MFA configurado.',
    folder: 'Implementación / Custodios',
    tags: ['tag-pam'],
    fav: true,
    reviewDate: '2026-12-01',
    description: 'Procedimiento de alta y validación de custodios para resguardo compartido de la Master Key.',
    sections: [
      {
        id: 'gsec-prep',
        title: 'Preparación',
        order: 0,
        steps: [
          {
            id: 'gstep-custodios',
            title: 'Validar las cuentas de los custodios',
            desc: 'Verifique los requisitos indispensables antes de iniciar la ceremonia de partición de llaves.',
            evaluable: true,
            weight: 1,
            mode: 'checklist',
            progress: 100,
            na: false,
            blocks: [
              {
                id: 'b-req',
                type: 'checklist',
                label: 'Requisitos de los custodios',
                items: [
                  { id: 'c1', text: 'Ambos usuarios están habilitados y pueden iniciar sesión en Segura', done: true },
                  { id: 'c2', text: 'Ambos usuarios tienen correo registrado', done: true },
                  { id: 'c3', text: 'Ambos usuarios tienen MFA configurado para consultar su parte', done: true },
                  { id: 'c4', text: 'Los custodios son cuentas distintas', done: true },
                ],
              },
              {
                id: 'b-txt',
                type: 'text',
                label: 'Texto',
                html: 'Cada usuario custodiará una sola parte de la Master Key.',
              },
            ],
          },
        ],
      },
    ],
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt: '2026-10-09T08:00:00.000Z',
  };
  records[guideId] = demoGuide;

  // Templates for Work Plans (Plantillas de Plan de Trabajo)
  records[pamSaaSPlantilla.id] = pamSaaSPlantilla;

  const cyberarkPlantilla: PlanTpl = {
    id: 'plantpl-cyberark-cloud',
    kind: 'plantpl',
    name: 'Despliegue CyberArk Privilege Cloud',
    version: '1.2',
    brandId: 'brand-cyberark',
    typeId: 'type-impl',
    description: 'Plantilla de arquitectura e integración de conectores CPM, PSM y Secure Web Access.',
    fav: true,
    phases: [
      { id: 'f-plan', name: 'Arquitectura' },
      { id: 'f-impl', name: 'Despliegue Conectores' },
      { id: 'f-close', name: 'Validación' },
    ],
    sections: [
      { id: 'sec-cyb-1', name: '01 Definición Arquitectura y Red', weight: 20, phaseId: 'f-plan' },
      { id: 'sec-cyb-2', name: '02 Instalación de Connector Management', weight: 35, phaseId: 'f-impl' },
      { id: 'sec-cyb-3', name: '03 Enrolamiento de Plataformas y Safes', weight: 30, phaseId: 'f-impl' },
      { id: 'sec-cyb-4', name: '04 Certificación y Aceptación', weight: 15, phaseId: 'f-close' },
    ],
    acts: [
      { id: 'act-c-1', sectionId: 'sec-cyb-1', title: 'Apertura de puertos hacia ISP / Cloud', owner: 'Ingeniero Redes', d0: 0, d1: 2, weight: 1, milestone: true, checklist: [] },
      { id: 'act-c-2', sectionId: 'sec-cyb-2', title: 'Instalación de agentes en servidor Connector', owner: 'Especialista CyberArk', d0: 2, d1: 5, weight: 2, milestone: false, checklist: [] },
      { id: 'act-c-3', sectionId: 'sec-cyb-3', title: 'Creación de Safes e importación de cuentas', owner: 'Especialista CyberArk', d0: 5, d1: 8, weight: 2, milestone: false, checklist: [] },
      { id: 'act-c-4', sectionId: 'sec-cyb-4', title: 'Pruebas de conexión transparente RDP/SSH', owner: 'Líder Técnico', d0: 8, d1: 10, weight: 1, milestone: true, checklist: [] },
    ],
    createdAt: '2026-10-02T08:00:00.000Z',
    updatedAt: '2026-10-09T08:00:00.000Z',
  };
  records[cyberarkPlantilla.id] = cyberarkPlantilla;

  // Demo Interactive Guide (Constructor de Clúster Segura)
  const interactiveGuideId = 'interactive-guide-segura-cluster';
  const demoInteractiveGuide: AnyRecord = {
    id: interactiveGuideId,
    kind: 'interactive_guide',
    name: 'Constructor de Clúster Segura',
    version: '2.0',
    brandId: 'brand-segura',
    product: 'Segura® PAM On-Premises',
    folder: 'Alta Disponibilidad / Clúster',
    tags: ['tag-pam', 'tag-cloud'],
    fav: true,
    description:
      'Segura® PAM On-Premises · runbook de alta disponibilidad, nodo por nodo con generador de comandos y matriz de pruebas dinámicas.',
    htmlContent: SEGURA_CLUSTER_HTML,
    createdAt: '2026-10-13T12:00:00.000Z',
    updatedAt: '2026-10-13T12:00:00.000Z',
  };
  records[interactiveGuideId] = demoInteractiveGuide;

  return records;
}
