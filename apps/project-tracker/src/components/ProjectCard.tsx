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
import { cn } from "@/lib/ui";
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
        "animate-fade-up group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-sm transition hover:shadow-md",
        project.archived && "opacity-60",
      )}
    >
      <div
        className="h-1 w-full"
        style={{ backgroundImage: `linear-gradient(90deg, ${accent.from}, ${accent.to})` }}
      />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold" title={project.name}>
              {project.name}
            </h3>
            {project.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{project.description}</p>
            ) : null}
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
              status.chip,
            )}
          >
            {status.label}
          </span>
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              {taskDriven ? `${done} of ${total} tasks` : "Progress"}
            </span>
            <span className="text-lg font-semibold tabular-nums">{progress}%</span>
          </div>
          <ProgressBar value={progress} accent={project.accent} label={`${project.name} progress`} />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted)]">
          {project.dueDate ? (
            <span className={cn("inline-flex items-center gap-1", overdue && "text-rose-500")}>
              <CalendarDays size={13} />
              {formatDueDate(project.dueDate)}
            </span>
          ) : null}
          {total > 0 ? (
            <span className="inline-flex items-center gap-1">
              <ListChecks size={13} />
              {done}/{total}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            {taskDriven ? null : <SlidersHorizontal size={13} />}
            Updated {formatRelativeTime(project.updatedAt)}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
          >
            <ChevronDown
              size={15}
              className={cn("transition-transform", expanded && "rotate-180")}
            />
            {expanded ? "Hide details" : total > 0 ? "Tasks" : "Details"}
          </button>

          <div className="flex items-center gap-0.5 opacity-0 transition focus-within:opacity-100 group-hover:opacity-100 max-sm:opacity-100">
            <button
              type="button"
              onClick={onEdit}
              aria-label={`Edit ${project.name}`}
              className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={onArchiveToggle}
              aria-label={project.archived ? `Restore ${project.name}` : `Archive ${project.name}`}
              className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-[var(--panel-2)] hover:text-[var(--text)]"
            >
              {project.archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
            </button>
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Delete ${project.name}`}
              className="rounded-lg p-1.5 text-[var(--muted)] transition hover:bg-rose-500/10 hover:text-rose-500"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {expanded ? (
          <div className="animate-fade-up space-y-3 border-t border-[var(--border)] pt-3">
            {project.progressMode === "manual" || total === 0 ? (
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
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
                  className="w-full accent-blue-600"
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
