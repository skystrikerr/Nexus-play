import {
  ACCENTS,
  PROJECT_STATUSES,
  type Accent,
  type Project,
  type ProgressMode,
  type ProjectStatus,
  type Task,
} from "@/types";
import { clampPercent } from "@/lib/progress";

const STORAGE_KEY = "project-tracker:v1";
const THEME_KEY = "project-tracker:theme";

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asIsoDate(value: unknown): string {
  const raw = asString(value);
  return raw && !Number.isNaN(new Date(raw).getTime()) ? raw : new Date().toISOString();
}

function asStatus(value: unknown): ProjectStatus {
  return PROJECT_STATUSES.includes(value as ProjectStatus) ? (value as ProjectStatus) : "active";
}

function asAccent(value: unknown): Accent {
  return ACCENTS.includes(value as Accent) ? (value as Accent) : "blue";
}

function asProgressMode(value: unknown): ProgressMode {
  return value === "manual" ? "manual" : "tasks";
}

function normalizeTask(raw: unknown): Task | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const title = asString(record.title).trim();
  if (!title) return null;
  return {
    id: asString(record.id) || createId(),
    title,
    done: record.done === true,
    createdAt: asIsoDate(record.createdAt),
  };
}

/** Data from localStorage is untrusted (hand-edited exports, older versions), so every field is checked. */
function normalizeProject(raw: unknown): Project | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const name = asString(record.name).trim();
  if (!name) return null;
  const dueDate = asString(record.dueDate);
  return {
    id: asString(record.id) || createId(),
    name,
    description: asString(record.description),
    status: asStatus(record.status),
    accent: asAccent(record.accent),
    dueDate: /^\d{4}-\d{2}-\d{2}$/.test(dueDate) ? dueDate : null,
    manualProgress: clampPercent(Number(record.manualProgress ?? 0)),
    progressMode: asProgressMode(record.progressMode),
    tasks: Array.isArray(record.tasks)
      ? record.tasks.map(normalizeTask).filter((task): task is Task => task !== null)
      : [],
    archived: record.archived === true,
    createdAt: asIsoDate(record.createdAt),
    updatedAt: asIsoDate(record.updatedAt),
  };
}

export function normalizeProjects(raw: unknown): Project[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeProject).filter((project): project is Project => project !== null);
}

export function loadProjects(): Project[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return normalizeProjects(JSON.parse(stored));
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    // Storage full or blocked (private mode) — the app keeps working in memory.
  }
}

export function loadTheme(): "light" | "dark" {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // ignore
  }
  const prefersDark =
    typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

export function saveTheme(theme: "light" | "dark"): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
}

export function exportProjects(projects: Project[]): void {
  const blob = new Blob([JSON.stringify(projects, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `projects-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function readProjectsFile(file: File): Promise<Project[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      try {
        const projects = normalizeProjects(JSON.parse(String(reader.result)));
        if (projects.length === 0) throw new Error("No projects found in that file.");
        resolve(projects);
      } catch (error) {
        reject(error instanceof Error ? error : new Error("That file isn't a valid export."));
      }
    };
    reader.readAsText(file);
  });
}

function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function sampleTasks(titles: [string, boolean][]): Task[] {
  return titles.map(([title, done]) => ({
    id: createId(),
    title,
    done,
    createdAt: new Date().toISOString(),
  }));
}

export function sampleProjects(): Project[] {
  const now = new Date().toISOString();
  const base = { archived: false, createdAt: now, updatedAt: now };
  return [
    {
      ...base,
      id: createId(),
      name: "Portfolio site redesign",
      description: "New layout, case studies, and a proper about page.",
      status: "active",
      accent: "violet",
      dueDate: daysFromNow(21),
      manualProgress: 0,
      progressMode: "tasks",
      tasks: sampleTasks([
        ["Sketch the new homepage", true],
        ["Pick a type scale", true],
        ["Write two case studies", false],
        ["Ship to hosting", false],
      ]),
    },
    {
      ...base,
      id: createId(),
      name: "Learn Rust",
      description: "Working through the book, one chapter at a time.",
      status: "active",
      accent: "amber",
      dueDate: null,
      manualProgress: 35,
      progressMode: "manual",
      tasks: [],
    },
    {
      ...base,
      id: createId(),
      name: "Garage cleanout",
      description: "Sort, sell, donate, done.",
      status: "paused",
      accent: "emerald",
      dueDate: daysFromNow(-3),
      manualProgress: 0,
      progressMode: "tasks",
      tasks: sampleTasks([
        ["Clear the workbench", true],
        ["List old bike parts", false],
        ["Donate run", false],
      ]),
    },
  ];
}
