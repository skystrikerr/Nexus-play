import { useCallback, useEffect, useState } from "react";
import type { Project } from "@/types";
import { createId, loadProjects, saveProjects } from "@/lib/storage";
import { clampPercent } from "@/lib/progress";

export type ProjectDraft = Pick<
  Project,
  "name" | "description" | "status" | "accent" | "dueDate" | "manualProgress" | "progressMode"
>;

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  const patchProject = useCallback((id: string, patch: (project: Project) => Project) => {
    setProjects((current) =>
      current.map((project) =>
        project.id === id ? { ...patch(project), updatedAt: new Date().toISOString() } : project,
      ),
    );
  }, []);

  const createProject = useCallback((draft: ProjectDraft) => {
    const now = new Date().toISOString();
    const project: Project = {
      ...draft,
      manualProgress: clampPercent(draft.manualProgress),
      id: createId(),
      tasks: [],
      archived: false,
      createdAt: now,
      updatedAt: now,
    };
    setProjects((current) => [project, ...current]);
    return project.id;
  }, []);

  const updateProject = useCallback(
    (id: string, draft: ProjectDraft) => {
      patchProject(id, (project) => ({
        ...project,
        ...draft,
        manualProgress: clampPercent(draft.manualProgress),
      }));
    },
    [patchProject],
  );

  const deleteProject = useCallback((id: string) => {
    setProjects((current) => current.filter((project) => project.id !== id));
  }, []);

  const setArchived = useCallback(
    (id: string, archived: boolean) => {
      patchProject(id, (project) => ({ ...project, archived }));
    },
    [patchProject],
  );

  const setManualProgress = useCallback(
    (id: string, value: number) => {
      patchProject(id, (project) => ({ ...project, manualProgress: clampPercent(value) }));
    },
    [patchProject],
  );

  const addTask = useCallback(
    (id: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      patchProject(id, (project) => ({
        ...project,
        tasks: [
          ...project.tasks,
          { id: createId(), title: trimmed, done: false, createdAt: new Date().toISOString() },
        ],
      }));
    },
    [patchProject],
  );

  const toggleTask = useCallback(
    (id: string, taskId: string) => {
      patchProject(id, (project) => ({
        ...project,
        tasks: project.tasks.map((task) =>
          task.id === taskId ? { ...task, done: !task.done } : task,
        ),
      }));
    },
    [patchProject],
  );

  const deleteTask = useCallback(
    (id: string, taskId: string) => {
      patchProject(id, (project) => ({
        ...project,
        tasks: project.tasks.filter((task) => task.id !== taskId),
      }));
    },
    [patchProject],
  );

  return {
    projects,
    setProjects,
    createProject,
    updateProject,
    deleteProject,
    setArchived,
    setManualProgress,
    addTask,
    toggleTask,
    deleteTask,
  };
}
