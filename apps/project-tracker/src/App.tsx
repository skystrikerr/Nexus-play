import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  FolderPlus,
  Moon,
  Plus,
  Search,
  Sparkles,
  Sun,
  Upload,
} from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectDialog } from "@/components/ProjectDialog";
import { StatsRow } from "@/components/StatsRow";
import { Modal } from "@/components/Modal";
import { useProjects, type ProjectDraft } from "@/hooks/useProjects";
import { daysUntil } from "@/lib/format";
import { projectProgress } from "@/lib/progress";
import {
  buttonDanger,
  buttonGhost,
  buttonOutline,
  buttonPrimary,
  cn,
  inputBase,
  selectBase,
} from "@/lib/ui";
import {
  exportProjects,
  loadTheme,
  readProjectsFile,
  sampleProjects,
  saveTheme,
} from "@/lib/storage";
import { PROJECT_STATUSES, STATUS_META, type Project, type ProjectStatus } from "@/types";

type StatusFilter = ProjectStatus | "all";
type SortKey = "updated" | "name" | "progress-desc" | "progress-asc" | "due";

const SORT_LABELS: Record<SortKey, string> = {
  updated: "Recently updated",
  name: "Name (A–Z)",
  "progress-desc": "Most complete",
  "progress-asc": "Least complete",
  due: "Due soonest",
};

export default function App() {
  const {
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
  } = useProjects();

  const [theme, setTheme] = useState<"light" | "dark">(() => loadTheme());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [showArchived, setShowArchived] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Project | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<Project | undefined>(undefined);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    saveTheme(theme);
  }, [theme]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = projects.filter((project) => {
      if (project.archived !== showArchived) return false;
      if (statusFilter !== "all" && project.status !== statusFilter) return false;
      if (!query) return true;
      return (
        project.name.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.tasks.some((task) => task.title.toLowerCase().includes(query))
      );
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      switch (sortKey) {
        case "name":
          return a.name.localeCompare(b.name);
        case "progress-desc":
          return projectProgress(b) - projectProgress(a);
        case "progress-asc":
          return projectProgress(a) - projectProgress(b);
        case "due": {
          // Projects without a due date sort last, keeping dated work up top.
          const left = a.dueDate ? daysUntil(a.dueDate) ?? Infinity : Infinity;
          const right = b.dueDate ? daysUntil(b.dueDate) ?? Infinity : Infinity;
          return left - right;
        }
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
    return sorted;
  }, [projects, search, statusFilter, showArchived, sortKey]);

  const activeProjects = useMemo(
    () => projects.filter((project) => !project.archived),
    [projects],
  );
  const archivedCount = projects.length - activeProjects.length;

  const openCreate = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditing(project);
    setDialogOpen(true);
  };

  const handleSubmit = (draft: ProjectDraft) => {
    if (editing) updateProject(editing.id, draft);
    else createProject(draft);
    setDialogOpen(false);
    setEditing(undefined);
  };

  const handleImport = async (file: File) => {
    setImportError("");
    try {
      const imported = await readProjectsFile(file);
      setProjects((current) => {
        const existing = new Set(current.map((project) => project.id));
        return [...imported.filter((project) => !existing.has(project.id)), ...current];
      });
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Import failed.");
    }
  };

  const statusCounts = useMemo(() => {
    const pool = projects.filter((project) => project.archived === showArchived);
    const counts: Record<StatusFilter, number> = {
      all: pool.length,
      planning: 0,
      active: 0,
      paused: 0,
      done: 0,
    };
    for (const project of pool) counts[project.status] += 1;
    return counts;
  }, [projects, showArchived]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 text-white">
              <Sparkles size={17} />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Project Tracker</h1>
              <p className="text-xs text-[var(--muted)]">
                {activeProjects.length} project{activeProjects.length === 1 ? "" : "s"} in flight
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              className={buttonGhost}
              onClick={() => exportProjects(projects)}
              title="Download a JSON backup"
              disabled={projects.length === 0}
            >
              <Download size={16} />
              <span className="max-sm:hidden">Export</span>
            </button>
            <button
              type="button"
              className={buttonGhost}
              onClick={() => fileInputRef.current?.click()}
              title="Import a JSON backup"
            >
              <Upload size={16} />
              <span className="max-sm:hidden">Import</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleImport(file);
                event.target.value = "";
              }}
            />
            <button
              type="button"
              className={buttonGhost}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button type="button" className={buttonPrimary} onClick={openCreate}>
              <Plus size={16} />
              New project
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        {importError ? (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
            {importError}
          </p>
        ) : null}

        <StatsRow projects={activeProjects} />

        <section className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            />
            <input
              className={cn(inputBase, "pl-9")}
              value={search}
              placeholder="Search projects and tasks…"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            className={selectBase}
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            aria-label="Sort projects"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
          {archivedCount > 0 || showArchived ? (
            <button
              type="button"
              className={cn(buttonOutline, showArchived && "border-blue-500 bg-blue-500/10")}
              onClick={() => setShowArchived((value) => !value)}
            >
              Archived ({archivedCount})
            </button>
          ) : null}
        </section>

        <section className="flex flex-wrap gap-1.5">
          {(["all", ...PROJECT_STATUSES] as StatusFilter[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition",
                statusFilter === status
                  ? "bg-[var(--text)] text-[var(--bg)]"
                  : "text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]",
              )}
            >
              {status === "all" ? "All" : STATUS_META[status].label}
              <span className="ml-1.5 tabular-nums opacity-60">{statusCounts[status]}</span>
            </button>
          ))}
        </section>

        {visible.length === 0 ? (
          <EmptyState
            hasProjects={projects.length > 0}
            onCreate={openCreate}
            onLoadSamples={() => setProjects(sampleProjects())}
          />
        ) : (
          <section className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={() => openEdit(project)}
                onDelete={() => setPendingDelete(project)}
                onArchiveToggle={() => setArchived(project.id, !project.archived)}
                onManualProgress={(value) => setManualProgress(project.id, value)}
                onAddTask={(title) => addTask(project.id, title)}
                onToggleTask={(taskId) => toggleTask(project.id, taskId)}
                onDeleteTask={(taskId) => deleteTask(project.id, taskId)}
              />
            ))}
          </section>
        )}

        <p className="pt-2 text-center text-xs text-[var(--muted)]">
          Everything is saved in this browser. Use Export for a backup you can move between devices.
        </p>
      </main>

      <ProjectDialog
        open={dialogOpen}
        project={editing}
        onClose={() => {
          setDialogOpen(false);
          setEditing(undefined);
        }}
        onSubmit={handleSubmit}
      />

      <Modal
        open={pendingDelete !== undefined}
        title="Delete project"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" and its tasks will be removed. This can't be undone.`
            : undefined
        }
        onClose={() => setPendingDelete(undefined)}
        footer={
          <>
            <button
              type="button"
              className={buttonOutline}
              onClick={() => setPendingDelete(undefined)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={buttonDanger}
              onClick={() => {
                if (pendingDelete) deleteProject(pendingDelete.id);
                setPendingDelete(undefined);
              }}
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-[var(--muted)]">
          Prefer to keep the history? Archive it instead — archived projects stay searchable but
          drop out of your stats.
        </p>
      </Modal>
    </div>
  );
}

function EmptyState({
  hasProjects,
  onCreate,
  onLoadSamples,
}: {
  hasProjects: boolean;
  onCreate: () => void;
  onLoadSamples: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[var(--border)] px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--panel-2)] text-[var(--muted)]">
        <FolderPlus size={22} />
      </div>
      <h2 className="text-lg font-semibold">
        {hasProjects ? "Nothing matches those filters" : "No projects yet"}
      </h2>
      <p className="max-w-sm text-sm text-[var(--muted)]">
        {hasProjects
          ? "Try a different search, status, or clear the archived view."
          : "Add the things you're working on and watch the bars fill up as you check tasks off."}
      </p>
      <div className="mt-1 flex flex-wrap justify-center gap-2">
        <button type="button" className={buttonPrimary} onClick={onCreate}>
          <Plus size={16} />
          New project
        </button>
        {hasProjects ? null : (
          <button type="button" className={buttonOutline} onClick={onLoadSamples}>
            Load sample projects
          </button>
        )}
      </div>
    </div>
  );
}
