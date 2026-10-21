import { store } from './store';
import { AnyRecord, Project, Guide, Script, Trouble, InteractiveGuide, PlanTpl } from '../types';

export interface SingleItemPackage {
  format: 'CentroControlIngenieria';
  formatVersion: 1;
  scope: 'guia' | 'demo' | 'interactive_guide' | 'script' | 'trouble' | 'plantilla' | 'proyecto' | 'item';
  exportedAt: string;
  item: AnyRecord;
  records?: AnyRecord[];
  metadata?: {
    totalRecords?: number;
    appName?: string;
  };
}

export interface ParsedSingleItem {
  isValid: boolean;
  kind: 'guide' | 'demo' | 'interactive_guide' | 'script' | 'trouble' | 'plantpl' | 'project' | 'unknown';
  kindLabel: string;
  id: string;
  name: string;
  item: any;
  records: any[];
  error?: string;
}

/**
 * Sanitizes filename for downloads
 */
function sanitizeFileName(name: string): string {
  return name
    .trim()
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 80);
}

/**
 * Exports a single item (Guide, Interactive Guide, Script, Troubleshooting, Plan Template, or Project) as JSON
 */
export function exportSingleItemAsJson(record: any): void {
  if (!record || !record.id) {
    throw new Error('Registro inválido para exportación');
  }

  const kind = record.kind || (record.client ? 'project' : 'unknown');
  let scope: SingleItemPackage['scope'] = 'item';
  let relatedRecords: AnyRecord[] = [record];
  let fileNamePrefix = record.name || record.title || 'elemento';

  if (kind === 'project') {
    scope = 'proyecto';
    const allRecords = Object.values(store.getState().records);
    // Include all child records that belong to this project (tasks, deliverables, notes, etc.)
    const children = allRecords.filter(
      (r: any) => r.projectId === record.id && !r.deletedAt
    );
    relatedRecords = [record, ...children];
  } else if (kind === 'demo') {
    scope = 'demo';
  } else if (kind === 'guide' || kind === 'pguide') {
    scope = 'guia';
  } else if (kind === 'interactive_guide') {
    scope = 'interactive_guide';
  } else if (kind === 'script') {
    scope = 'script';
  } else if (kind === 'trouble') {
    scope = 'trouble';
  } else if (kind === 'plantpl') {
    scope = 'plantilla';
    // Incluye las guías maestras referenciadas para que la plantilla viaje completa.
    const all = store.getState().records;
    const ids = new Set<string>();
    (record.sections || []).forEach((s: any) => s.guideTplId && ids.add(s.guideTplId));
    (record.acts || []).forEach((a: any) => a.guideTplId && ids.add(a.guideTplId));
    const guides = Array.from(ids)
      .map((id) => all[id])
      .filter((g: any) => g && g.kind === 'guide' && !g.deletedAt) as AnyRecord[];
    relatedRecords = [record, ...guides];
  }

  const payload: SingleItemPackage = {
    format: 'CentroControlIngenieria',
    formatVersion: 1,
    scope,
    exportedAt: new Date().toISOString(),
    item: record,
    records: relatedRecords,
    metadata: {
      totalRecords: relatedRecords.length,
      appName: 'Centro de Control de Ingeniería',
    },
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFileName(fileNamePrefix)}_${scope}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Parses and validates a JSON string or object for single item import
 */
export function parseSingleItemJson(rawContent: string): ParsedSingleItem {
  try {
    const data = JSON.parse(rawContent);

    // Case 1: CCI structured package
    if (data.format === 'CentroControlIngenieria' && (data.item || Array.isArray(data.records))) {
      const primary = data.item || (Array.isArray(data.records) && data.records[0]);
      if (!primary) {
        return {
          isValid: false,
          kind: 'unknown',
          kindLabel: 'Desconocido',
          id: '',
          name: '',
          item: null,
          records: [],
          error: 'El archivo de paquete no contiene ningún registro utilizable.',
        };
      }

      const kind = primary.kind || (data.scope === 'proyecto' ? 'project' : 'unknown');
      return {
        isValid: true,
        kind: mapKindToStandard(kind),
        kindLabel: getKindLabel(kind),
        id: primary.id,
        name: primary.name || primary.title || 'Elemento importado',
        item: primary,
        records: Array.isArray(data.records) ? data.records : [primary],
      };
    }

    // Case 2: Direct raw JSON of the record
    if (data && typeof data === 'object' && (data.id || data.kind || data.name)) {
      const kind = data.kind || (data.typeId ? 'project' : data.htmlContent ? 'interactive_guide' : 'guide');
      return {
        isValid: true,
        kind: mapKindToStandard(kind),
        kindLabel: getKindLabel(kind),
        id: data.id || `imported-${Date.now()}`,
        name: data.name || data.title || 'Elemento importado',
        item: data,
        records: [data],
      };
    }

    return {
      isValid: false,
      kind: 'unknown',
      kindLabel: 'Desconocido',
      id: '',
      name: '',
      item: null,
      records: [],
      error: 'Estructura de JSON no reconocida. Asegúrate de importar un archivo generado por la aplicación.',
    };
  } catch (err: any) {
    return {
      isValid: false,
      kind: 'unknown',
      kindLabel: 'Desconocido',
      id: '',
      name: '',
      item: null,
      records: [],
      error: `Error al procesar JSON: ${err?.message || 'Sintaxis inválida'}`,
    };
  }
}

function mapKindToStandard(kind: string): ParsedSingleItem['kind'] {
  if (kind === 'demo') return 'demo';
  if (kind === 'guide' || kind === 'pguide') return 'guide';
  if (kind === 'interactive_guide') return 'interactive_guide';
  if (kind === 'script') return 'script';
  if (kind === 'trouble') return 'trouble';
  if (kind === 'plantpl') return 'plantpl';
  if (kind === 'project') return 'project';
  return 'unknown';
}

export function getKindLabel(kind: string): string {
  switch (kind) {
    case 'demo':
      return 'Demo';
    case 'guide':
    case 'pguide':
      return 'Guía Técnica';
    case 'interactive_guide':
      return 'Guía Interactiva (Runbook)';
    case 'script':
      return 'Script de Operación';
    case 'trouble':
      return 'Ficha de Troubleshooting';
    case 'plantpl':
      return 'Plantilla de Plan';
    case 'project':
      return 'Proyecto Completo';
    default:
      return 'Elemento';
  }
}

/**
 * Commits imported single item and any associated records into store
 */
export function commitSingleItemImport(
  parsed: ParsedSingleItem,
  options: { asCopy?: boolean } = {}
): { count: number; importedId: string; kind: string } {
  if (!parsed.isValid || !parsed.item) {
    throw new Error(parsed.error || 'No se puede importar un elemento inválido');
  }

  const { asCopy = false } = options;
  const idMap: Record<string, string> = {};

  if (asCopy) {
    // Generate new IDs for main item and child records
    parsed.records.forEach((rec) => {
      const oldId = rec.id;
      const newId = `${rec.kind || 'rec'}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      idMap[oldId] = newId;
    });
  }

  let importedCount = 0;
  let finalPrimaryId = parsed.item.id;

  parsed.records.forEach((rec) => {
    const finalRec = { ...rec };
    if (asCopy) {
      finalRec.id = idMap[rec.id] || finalRec.id;
      if (finalRec.id === idMap[parsed.item.id]) {
        finalPrimaryId = finalRec.id;
        finalRec.name = `${finalRec.name || finalRec.title || 'Copia'} (Copia importada)`;
      }
      // Re-mapea las guías referenciadas por una plantilla de plan
      if (finalRec.kind === 'plantpl') {
        finalRec.sections = (finalRec.sections || []).map((x: any) => ({ ...x, guideTplId: x.guideTplId && idMap[x.guideTplId] ? idMap[x.guideTplId] : x.guideTplId }));
        finalRec.acts = (finalRec.acts || []).map((x: any) => ({ ...x, guideTplId: x.guideTplId && idMap[x.guideTplId] ? idMap[x.guideTplId] : x.guideTplId }));
      }
      // Re-map parent project ID if this is a child task/deliverable
      if (finalRec.projectId && idMap[finalRec.projectId]) {
        finalRec.projectId = idMap[finalRec.projectId];
      }
    }
    delete finalRec.deletedAt; // Ensure it's not marked as deleted
    finalRec.updatedAt = new Date().toISOString();
    if (!finalRec.createdAt) {
      finalRec.createdAt = new Date().toISOString();
    }

    store.putRecord(finalRec);
    importedCount++;
  });

  return {
    count: importedCount,
    importedId: finalPrimaryId,
    kind: parsed.kind,
  };
}
