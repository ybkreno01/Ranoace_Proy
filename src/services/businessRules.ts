import { Guide, GuideStep, Project, Task } from '../types';

/**
 * Calculates step progress according to Section 7.1.
 */
export function calculateStepProgress(step: GuideStep): number {
  if (step.na) return 0;
  if (!step.evaluable) return 0;

  if (step.mode === 'checklist') {
    const checklistBlocks = step.blocks.filter((b) => b.type === 'checklist');
    const allItems = checklistBlocks.flatMap((b) => b.items || []);
    if (allItems.length === 0) return step.progress || 0;
    const completed = allItems.filter((i) => i.done).length;
    return Math.round((completed / allItems.length) * 100);
  }

  return Math.min(100, Math.max(0, step.progress || 0));
}

/**
 * Calculates section and guide progress according to Section 7.1.
 * Returns null if there are no evaluable steps.
 */
export function calculateGuideProgress(guide: Guide): {
  progress: number | null;
  evaluableCount: number;
  completedCount: number;
} {
  let totalWeight = 0;
  let weightedProgressSum = 0;
  let evaluableCount = 0;
  let completedCount = 0;

  for (const section of guide.sections || []) {
    for (const step of section.steps || []) {
      if (step.evaluable && !step.na) {
        evaluableCount++;
        const weight = step.weight > 0 ? step.weight : 1;
        const p = calculateStepProgress(step);
        totalWeight += weight;
        weightedProgressSum += p * weight;
        if (p >= 100) completedCount++;
      }
    }
  }

  if (totalWeight === 0 || evaluableCount === 0) {
    return { progress: null, evaluableCount: 0, completedCount: 0 };
  }

  const result = Math.round((weightedProgressSum / totalWeight) * 10) / 10;
  return { progress: result, evaluableCount, completedCount };
}

/**
 * Calculates task progress according to Section 7.2.
 */
export function calculateTaskProgress(
  task: Task,
  allGuides?: Record<string, Guide>
): number {
  if (task.status === 'Completado') return 100;

  if (task.guideRef && allGuides && allGuides[task.guideRef]) {
    const gProg = calculateGuideProgress(allGuides[task.guideRef]);
    return gProg.progress ?? 0;
  }

  if (task.stepRef && allGuides && allGuides[task.stepRef.pguideId]) {
    const g = allGuides[task.stepRef.pguideId];
    for (const sec of g.sections || []) {
      const step = sec.steps.find((s) => s.id === task.stepRef?.stepId);
      if (step) {
        return calculateStepProgress(step);
      }
    }
  }

  if (task.checklist && task.checklist.length > 0 && task.progressMode === 'auto') {
    const doneCount = task.checklist.filter((i) => i.done).length;
    return Math.round((doneCount / task.checklist.length) * 100);
  }

  return Math.min(100, Math.max(0, task.progress || 0));
}

export interface SectionCalculationResult {
  sectionId: string;
  name: string;
  weight: number;
  calculatedProgress: number;
  contributionToProject: number; // in percentage points (e.g. 5.0%)
  activitiesCount: number;
  completedActivitiesCount: number;
}

export interface ProjectCalculationResult {
  progress: number;
  sections: SectionCalculationResult[];
  otherActivitiesContribution: number;
  isStale: boolean;
  effectiveNextAction: string;
  effectiveNextActionDate?: string;
  totalActivitiesCount: number;
  completedActivitiesCount: number;
}

/**
 * Calculates project with work plan progress according to Section 7.3.
 */
export function calculateProjectProgress(
  project: Project,
  projectTasks: Task[],
  allGuides?: Record<string, Guide>,
  staleDays = 14
): ProjectCalculationResult {
  const sections = project.plan?.sections || [];
  const totalSectionWeight = sections.reduce((sum, s) => sum + (s.weight || 0), 0) || 1;

  const sectionResults: SectionCalculationResult[] = [];
  let projectWeightedSum = 0;
  let totalActs = 0;
  let completedActs = 0;

  for (const sec of sections) {
    const acts = projectTasks.filter((t) => t.sectionId === sec.id && !t.deletedAt);
    totalActs += acts.length;
    completedActs += acts.filter((t) => t.status === 'Completado' || (t.progress >= 100)).length;

    let secTotalWeight = 0;
    let secWeightedSum = 0;

    for (const act of acts) {
      const w = act.weight > 0 ? act.weight : 1;
      const p = calculateTaskProgress(act, allGuides);
      secTotalWeight += w;
      secWeightedSum += p * w;
    }

    // Guide associated directly to section
    if (sec.guideTplId && allGuides && allGuides[sec.guideTplId]) {
      const gWeight = sec.guideWeight || 1;
      const gProg = calculateGuideProgress(allGuides[sec.guideTplId]).progress ?? 0;
      secTotalWeight += gWeight;
      secWeightedSum += gProg * gWeight;
    }

    const secProgress =
      secTotalWeight > 0 ? Math.round((secWeightedSum / secTotalWeight) * 10) / 10 : 0;

    // Contribution of this section to the overall project
    const sectionContrib =
      Math.round(((sec.weight / totalSectionWeight) * secProgress) * 100) / 100;

    projectWeightedSum += (sec.weight / totalSectionWeight) * secProgress;

    sectionResults.push({
      sectionId: sec.id,
      name: sec.name,
      weight: sec.weight,
      calculatedProgress: secProgress,
      contributionToProject: sectionContrib,
      activitiesCount: acts.length,
      completedActivitiesCount: acts.filter((a) => a.status === 'Completado' || a.progress >= 100).length,
    });
  }

  // Standalone tasks without section
  // Standalone tasks without section
  const orphanedTasks = projectTasks.filter(
    (t) => (!t.sectionId || !sections.some((s) => s.id === t.sectionId)) && !t.deletedAt
  );
  totalActs += orphanedTasks.length;
  completedActs += orphanedTasks.filter((t) => t.status === 'Completado' || t.progress >= 100).length;

  let otherContrib = 0;
  let finalProgress = 0;

  if (sections.length === 0) {
    // If project has no explicit sections, project progress is directly driven equally by its tasks
    const validTasks = projectTasks.filter((t) => !t.deletedAt);
    if (validTasks.length > 0) {
      const taskSum = validTasks.reduce(
        (sum, t) => sum + calculateTaskProgress(t, allGuides),
        0
      );
      // 1 task = 100%, 2 tasks = 50% each, 3 tasks = 33.3% each
      finalProgress = Math.min(100, Math.max(0, Math.round((taskSum / validTasks.length) * 10) / 10));
      otherContrib = finalProgress;
    }
  } else {
    // Project has sections
    if (orphanedTasks.length > 0) {
      const orphanSum = orphanedTasks.reduce(
        (sum, t) => sum + calculateTaskProgress(t, allGuides),
        0
      );
      const orphanAvg = orphanSum / orphanedTasks.length;
      const assignedActsCount = totalActs - orphanedTasks.length;

      if (assignedActsCount === 0) {
        finalProgress = Math.min(100, Math.max(0, Math.round(orphanAvg * 10) / 10));
        otherContrib = finalProgress;
      } else {
        const otherWeight = (project.otherWeight && project.otherWeight > 0)
          ? project.otherWeight
          : Math.round((orphanedTasks.length / totalActs) * 100);
        const sectionsWeightPortion = Math.max(0, 100 - otherWeight);
        finalProgress = Math.min(
          100,
          Math.max(0, Math.round(((projectWeightedSum * (sectionsWeightPortion / 100)) + (orphanAvg * (otherWeight / 100))) * 10) / 10)
        );
        otherContrib = Math.round((orphanAvg * (otherWeight / 100)) * 10) / 10;
      }
    } else {
      finalProgress = Math.min(100, Math.max(0, Math.round(projectWeightedSum * 10) / 10));
    }
  }

  // Check if stale (7.5: sin movimiento tras staleDays sin cambios)
  const lastUpdate = new Date(project.updatedAt).getTime();
  const now = Date.now();
  const isStale = (now - lastUpdate) / (1000 * 60 * 60 * 24) >= staleDays;

  // Next action (7.5: la capturada o la tarea abierta más urgente)
  let nextAction = project.nextAction || '';
  let nextActionDate = project.nextActionDate;
  if (!nextAction) {
    const openTasks = projectTasks
      .filter((t) => t.status !== 'Completado' && !t.deletedAt)
      .sort((a, b) => {
        const da = a.due ? new Date(a.due).getTime() : Infinity;
        const db = b.due ? new Date(b.due).getTime() : Infinity;
        return da - db;
      });
    if (openTasks.length > 0) {
      nextAction = openTasks[0].title;
      nextActionDate = openTasks[0].due;
    }
  }

  return {
    progress: finalProgress,
    sections: sectionResults,
    otherActivitiesContribution: otherContrib,
    isStale,
    effectiveNextAction: nextAction,
    effectiveNextActionDate: nextActionDate,
    totalActivitiesCount: totalActs,
    completedActivitiesCount: completedActs,
  };
}

/**
 * Calculates activity contribution in its section and in the project.
 * If 1 task: 100%, if 2: 50% each, if 3: 33.3% each.
 */
export function calculateActivityContribution(
  task: Task,
  project: Project,
  sectionTasks: Task[]
): { inSection: number; inProject: number } {
  const sections = project.plan?.sections || [];
  const section = sections.find((s) => s.id === task.sectionId);

  // If project has no sections or task has no section, distribute equally across project tasks
  if (sections.length === 0 || !section) {
    const allProjTasks = sectionTasks.length > 0 ? sectionTasks : [task];
    const totalCount = allProjTasks.length;
    const share = totalCount > 0 ? Math.round((100 / totalCount) * 10) / 10 : 100;
    return {
      inSection: share,
      inProject: share,
    };
  }

  const totalSecWeight =
    sections.reduce((sum, s) => sum + (s.weight || 0), 0) || 1;
  const totalTasksWeight =
    sectionTasks.reduce((sum, t) => sum + (t.weight > 0 ? t.weight : 1), 0) || 1;

  const taskWeight = task.weight > 0 ? task.weight : 1;
  const inSection = (taskWeight / totalTasksWeight) * 100;
  const inProject = (section.weight / totalSecWeight) * (taskWeight / totalTasksWeight) * 100;

  return {
    inSection: Math.round(inSection * 10) / 10,
    inProject: Math.round(inProject * 100) / 100,
  };
}
