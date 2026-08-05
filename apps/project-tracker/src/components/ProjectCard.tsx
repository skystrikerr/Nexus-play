import { useState } from "react";
import {
  Archive,
  ArchiveRestore,
  CalendarDays,
  ChevronDown,
  ListChecks,
  Pencil,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { ProgressBar } from "@/components/ProgressBar";
import { TaskList } from "@/components/TaskList";
import { daysUntil, formatDueDate, formatRelativeTime } from "@/lib/format";
import { isTaskDriven, projectProgress, taskCounts } from "@/lib/progress";
import { chipBase, cn, iconButton } from "@/lib/ui";
import { ACCENT_HEX, STATUS_META, type Project } from "@/types";

interface ProjectCardProps {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
  onArchiveToggle: () => void;
  onManualProgress: (value: number) => void;
  onAddTask: (title: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export function ProjectCard({
  project,
  onEdit,
  onDelete,
  onArchiveToggle,
  onManualProgress,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const progress = projectProgress(project);
  const { done, total } = taskCounts(project);
  const taskDriven = isTaskDriven(project);
  const status = STATUS_META[project.status];
  const accent = ACCENT_HEX[project.accent];
  const overdue =
    project.dueDate !== null && project.status !== "done" && (daysUntil(project.dueDate) ?? 1) < 0;

  return (
    <article
      className={cn(
        "glass glass-sheen group relative flex flex-col overflow-hidden rounded-2xl p-5 shadow-[var(--shadow)] transition-all duration-300 hover:-translate-y-1",
        project.archived && "opacity-60",
      )}
    >
      {/* Accent glow, tinted per project, sitting behind the content. */}
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full opacity-25 blur-3xl transition-opacity duration-300 group-hover:opacity-40"
        style={{ backgroundColor: accent.from }}
        aria-hidden
      />

      <div className="relative flex flex-1 flex-col gap-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className="mt-1 h-9 w-1.5 shrink-0 rounded-full"
              style={{
                backgroundImage: `linear-gradient(180deg, ${accent.from}, ${accent.to})`,
                boxShadow: `0 0 14px -2px ${accent.from}`,
              }}
              aria-hidden
            />
            <div className="min-w-0">
              <h3 className="truncate text-[17px] font-semibold tracking-tight" title={project.name}>
                {project.name}
              </h3>
              {project.description ? (
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--muted)]">
                  {project.description}
                </p>
              ) : null}
            </div>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
              status.chip,
            )}
          >
            {status.label}
          </span>
        </div>

        <div>
          <div className="mb-2 flex items-end justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
              {taskDriven ? `${done} of ${total} tasks` : "Progress"}
            </span>
            <span
              className="text-2xl font-bold leading-none tabular-nums"
              style={{
                backgroundImage: `linear-gradient(120deg, ${accent.from}, ${accent.to})`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {progress}%
            </span>
          </div>
          <ProgressBar value={progress} accent={project.accent} label={`${project.name} progress`} />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {project.dueDate ? (
            <span
              className={cn(
                chipBase,
                overdue && "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
              )}
            >
              <CalendarDays size={12} />
              {formatDueDate(project.dueDate)}
            </span>
          ) : null}
          {total > 0 ? (
            <span className={chipBase}>
              <ListChecks size={12} />
              {done}/{total}
            </span>
          ) : (
            <span className={chipBase}>
              <SlidersHorizontal size={12} />
              Manual
            </span>
          )}
          <span className="px-1 text-xs text-[var(--faint)]">
            {formatRelativeTime(project.updatedAt)}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--glass-border)] pt-3">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--text)]"
          >
            <ChevronDown
              size={15}
              className={cn("transition-transform duration-300", expanded && "rotate-180")}
            />
            {expanded ? "Hide" : total > 0 ? "Tasks" : "Details"}
          </button>

          <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${project.name}`}
              className={cn(iconButton, "h-8 w-8")}
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={onArchiveToggle}
              aria-label={project.archived ? `Restore ${project.name}` : `Archive ${project.name}`}
              className={cn(iconButton, "h-8 w-8")}
            >
              {project.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Delete ${project.name}`}
              className={cn(iconButton, "h-8 w-8 hover:bg-rose-500/15 hover:text-rose-400")}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {expanded ? (
          <div className="animate-fade-up space-y-3 border-t border-[var(--glass-border)] pt-3">
            {project.progressMode === "manual" || total === 0 ? (
              <div>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">
                    {project.progressMode === "manual"
                      ? "Manual progress"
                      : "Manual progress (no tasks yet)"}
                  </span>
                  <span className="font-semibold tabular-nums">{project.manualProgress}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={project.manualProgress}
                  onChange={(event) => onManualProgress(Number(event.target.value))}
                  className="w-full accent-violet-500"
                  aria-label={`${project.name} percentage complete`}
                />
              </div>
            ) : null}
            <TaskList
              tasks={project.tasks}
              onAdd={onAddTask}
              onToggle={onToggleTask}
              onDelete={onDeleteTask}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}
