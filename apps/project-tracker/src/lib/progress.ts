import type { Project } from "@/types";

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function taskCounts(project: Project): { done: number; total: number } {
  return {
    done: project.tasks.filter((task) => task.done).length,
    total: project.tasks.length,
  };
}

/**
 * Tasks drive the percentage when a project has a checklist; projects without
 * tasks (or set to manual) fall back to the slider value.
 */
export function projectProgress(project: Project): number {
  if (project.progressMode === "manual") return clampPercent(project.manualProgress);
  const { done, total } = taskCounts(project);
  if (total === 0) return clampPercent(project.manualProgress);
  return clampPercent((done / total) * 100);
}

export function isTaskDriven(project: Project): boolean {
  return project.progressMode === "tasks" && project.tasks.length > 0;
}

export function averageProgress(projects: Project[]): number {
  if (projects.length === 0) return 0;
  const total = projects.reduce((sum, project) => sum + projectProgress(project), 0);
  return Math.round(total / projects.length);
}
