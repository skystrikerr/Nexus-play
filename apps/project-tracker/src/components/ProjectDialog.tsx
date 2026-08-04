import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { ProgressBar } from "@/components/ProgressBar";
import type { ProjectDraft } from "@/hooks/useProjects";
import { clampPercent } from "@/lib/progress";
import {
  buttonOutline,
  buttonPrimary,
  cn,
  inputBase,
  labelBase,
} from "@/lib/ui";
import {
  ACCENTS,
  ACCENT_HEX,
  PROJECT_STATUSES,
  STATUS_META,
  type Project,
} from "@/types";

const emptyDraft: ProjectDraft = {
  name: "",
  description: "",
  status: "active",
  accent: "blue",
  dueDate: null,
  manualProgress: 0,
  progressMode: "tasks",
};

function toDraft(project: Project): ProjectDraft {
  return {
    name: project.name,
    description: project.description,
    status: project.status,
    accent: project.accent,
    dueDate: project.dueDate,
    manualProgress: project.manualProgress,
    progressMode: project.progressMode,
  };
}

interface ProjectDialogProps {
  open: boolean;
  /** Present when editing, absent when creating. */
  project?: Project;
  onClose: () => void;
  onSubmit: (draft: ProjectDraft) => void;
}

export function ProjectDialog({ open, project, onClose, onSubmit }: ProjectDialogProps) {
  const [draft, setDraft] = useState<ProjectDraft>(emptyDraft);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setDraft(project ? toDraft(project) : emptyDraft);
    setError("");
  }, [open, project]);

  const taskCount = project?.tasks.length ?? 0;
  const manualApplies = draft.progressMode === "manual" || taskCount === 0;

  const handleSubmit = () => {
    const name = draft.name.trim();
    if (!name) {
      setError("Give the project a name.");
      return;
    }
    onSubmit({ ...draft, name, description: draft.description.trim() });
  };

  return (
    <Modal
      open={open}
      title={project ? "Edit project" : "New project"}
      description={
        project ? "Update the details for this project." : "Add something you're working on."
      }
      onClose={onClose}
      footer={
        <>
          <button type="button" className={buttonOutline} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={buttonPrimary} onClick={handleSubmit}>
            {project ? "Save changes" : "Create project"}
          </button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <div>
          <label className={labelBase} htmlFor="project-name">
            Name
          </label>
          <input
            id="project-name"
            className={inputBase}
            value={draft.name}
            autoFocus
            placeholder="Kitchen remodel"
            onChange={(event) => {
              setDraft({ ...draft, name: event.target.value });
              setError("");
            }}
          />
          {error ? <p className="mt-1.5 text-sm text-rose-500">{error}</p> : null}
        </div>

        <div>
          <label className={labelBase} htmlFor="project-description">
            Description
          </label>
          <textarea
            id="project-description"
            className={cn(inputBase, "min-h-[72px] resize-y")}
            value={draft.description}
            placeholder="What does done look like?"
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelBase} htmlFor="project-status">
              Status
            </label>
            <select
              id="project-status"
              className={inputBase}
              value={draft.status}
              onChange={(event) =>
                setDraft({ ...draft, status: event.target.value as Project["status"] })
              }
            >
              {PROJECT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_META[status].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelBase} htmlFor="project-due">
              Due date
            </label>
            <input
              id="project-due"
              type="date"
              className={inputBase}
              value={draft.dueDate ?? ""}
              onChange={(event) => setDraft({ ...draft, dueDate: event.target.value || null })}
            />
          </div>
        </div>

        <div>
          <span className={labelBase}>Color</span>
          <div className="flex flex-wrap gap-2">
            {ACCENTS.map((accent) => (
              <button
                key={accent}
                type="button"
                aria-label={accent}
                aria-pressed={draft.accent === accent}
                onClick={() => setDraft({ ...draft, accent })}
                className={cn(
                  "h-8 w-8 rounded-full ring-offset-2 ring-offset-[var(--panel)] transition",
                  draft.accent === accent ? "ring-2 ring-[var(--text)]" : "hover:scale-110",
                )}
                style={{
                  backgroundImage: `linear-gradient(135deg, ${ACCENT_HEX[accent].from}, ${ACCENT_HEX[accent].to})`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] p-3">
          <span className={labelBase}>Progress</span>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["tasks", "From tasks", "Auto-calculated from your checklist"],
                ["manual", "Manual", "You set the percentage yourself"],
              ] as const
            ).map(([mode, label, hint]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setDraft({ ...draft, progressMode: mode })}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left transition",
                  draft.progressMode === mode
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-[var(--border)] hover:bg-[var(--panel)]",
                )}
              >
                <span className="block text-sm font-medium">{label}</span>
                <span className="mt-0.5 block text-xs text-[var(--muted)]">{hint}</span>
              </button>
            ))}
          </div>

          {manualApplies ? (
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">
                  {draft.progressMode === "tasks"
                    ? "No tasks yet — using manual percentage"
                    : "Percentage complete"}
                </span>
                <span className="font-semibold tabular-nums">
                  {clampPercent(draft.manualProgress)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={clampPercent(draft.manualProgress)}
                onChange={(event) =>
                  setDraft({ ...draft, manualProgress: Number(event.target.value) })
                }
                className="w-full accent-blue-600"
                aria-label="Percentage complete"
              />
              <div className="mt-2">
                <ProgressBar
                  value={clampPercent(draft.manualProgress)}
                  accent={draft.accent}
                  size="sm"
                />
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--muted)]">
              Progress comes from {taskCount} task{taskCount === 1 ? "" : "s"} on this project.
            </p>
          )}
        </div>
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
