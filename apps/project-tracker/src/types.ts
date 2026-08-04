export const PROJECT_STATUSES = ["planning", "active", "paused", "done"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const ACCENTS = ["blue", "violet", "emerald", "amber", "rose", "cyan"] as const;
export type Accent = (typeof ACCENTS)[number];

/** How a project's percentage is decided. */
export type ProgressMode = "tasks" | "manual";

export interface Task {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  accent: Accent;
  /** ISO date (yyyy-mm-dd) or null when the project has no deadline. */
  dueDate: string | null;
  /** Used when progressMode is "manual", or when "tasks" but there are no tasks yet. */
  manualProgress: number;
  progressMode: ProgressMode;
  tasks: Task[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export const STATUS_META: Record<ProjectStatus, { label: string; dot: string; chip: string }> = {
  planning: {
    label: "Planning",
    dot: "bg-sky-400",
    chip: "bg-sky-500/10 text-sky-500 ring-sky-500/20",
  },
  active: {
    label: "Active",
    dot: "bg-emerald-400",
    chip: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20",
  },
  paused: {
    label: "Paused",
    dot: "bg-amber-400",
    chip: "bg-amber-500/10 text-amber-500 ring-amber-500/20",
  },
  done: {
    label: "Done",
    dot: "bg-violet-400",
    chip: "bg-violet-500/10 text-violet-500 ring-violet-500/20",
  },
};

export const ACCENT_HEX: Record<Accent, { from: string; to: string }> = {
  blue: { from: "#3b82f6", to: "#60a5fa" },
  violet: { from: "#8b5cf6", to: "#c084fc" },
  emerald: { from: "#10b981", to: "#34d399" },
  amber: { from: "#f59e0b", to: "#fbbf24" },
  rose: { from: "#f43f5e", to: "#fb7185" },
  cyan: { from: "#06b6d4", to: "#22d3ee" },
};
