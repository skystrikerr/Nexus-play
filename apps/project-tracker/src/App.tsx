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
  Zap,
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
  buttonOutline,
  buttonPrimary,
  cn,
  iconButton,
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
      {/* Opaque, with its own gradient wash: translucency let card text read through when scrolled. */}
      <header className="sticky top-0 z-30 border-b border-[var(--glass-border)] bg-[var(--bg-solid)]">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-violet-500/10 via-transparent to-sky-500/10"
          aria-hidden
        />
        <div className="relative mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-500 to-sky-500 text-white shadow-[0_10px_26px_-10px_rgba(124,58,237,0.95)]">
              <Sparkles size={18} />
            </div>
            <div className="leading-tight max-sm:sr-only">
              <h1 className="whitespace-nowrap text-[15px] font-bold tracking-tight">
                Project Tracker
              </h1>
              <p className="text-xs text-[var(--faint)]">
                {activeProjects.length} in flight
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              className={iconButton}
              onClick={() => exportProjects(projects)}
              title="Download a JSON backup"
              aria-label="Export"
              disabled={projects.length === 0}
            >
              <Download size={17} />
            </button>
            <button
              type="button"
              className={iconButton}
              onClick={() => fileInputRef.current?.click()}
              title="Import a JSON backup"
              aria-label="Import"
            >
              <Upload size={17} />
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
              className={iconButton}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button type="button" className={cn(buttonPrimary, "ml-1.5")} onClick={openCreate}>
              <Plus size={16} />
              <span className="whitespace-nowrap">
                New<span className="max-sm:hidden"> project</span>
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <section className="animate-fade-up">
          <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-[var(--muted)]">
            <Zap size={12} className="text-violet-400" />
            Saved in your browser — no account, no sync, no cost
          </span>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Everything you&rsquo;re <span className="text-gradient">building</span>
          </h2>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-[var(--muted)]">
            One place for every project, with a bar that fills itself in as you check tasks off.
          </p>
        </section>

        {importError ? (
          <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-400">
            {importError}
          </p>
        ) : null}

        <StatsRow projects={activeProjects} />

        <section className="glass glass-sheen relative flex flex-wrap items-center gap-2 rounded-2xl p-2 shadow-[var(--shadow)]">
          <div className="relative min-w-[200px] flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--faint)]"
            />
            <input
              className="w-full rounded-xl bg-transparent py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-[var(--faint)]"
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
              className={cn(
                buttonOutline,
                showArchived && "border-violet-400/70 bg-violet-500/15 text-[var(--text)]",
              )}
              onClick={() => setShowArchived((value) => !value)}
            >
              Archived ({archivedCount})
            </button>
          ) : null}
        </section>

        <section className="flex flex-wrap gap-2">
          {(["all", ...PROJECT_STATUSES] as StatusFilter[]).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all duration-200",
                statusFilter === status
                  ? "bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-[0_10px_24px_-12px_rgba(124,58,237,0.95)]"
                  : "glass text-[var(--muted)] hover:-translate-y-0.5 hover:text-[var(--text)]",
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
            {visible.map((project, index) => (
              <div
                key={project.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
              >
                <ProjectCard
                  project={project}
                  onEdit={() => openEdit(project)}
                  onDelete={() => setPendingDelete(project)}
                  onArchiveToggle={() => setArchived(project.id, !project.archived)}
                  onManualProgress={(value) => setManualProgress(project.id, value)}
                  onAddTask={(title) => addTask(project.id, title)}
                  onToggleTask={(taskId) => toggleTask(project.id, taskId)}
                  onDeleteTask={(taskId) => deleteTask(project.id, taskId)}
                />
              </div>
            ))}
          </section>
        )}

        <p className="pt-2 text-center text-xs text-[var(--faint)]">
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
    <div className="glass glass-sheen relative flex flex-col items-center gap-3 overflow-hidden rounded-3xl border-dashed px-6 py-16 text-center">
      <div
        className="pointer-events-none absolute -top-16 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl"
        aria-hidden
      />
      <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-500 to-sky-500 text-white shadow-[0_14px_30px_-12px_rgba(124,58,237,0.95)]">
        <FolderPlus size={24} />
      </div>
      <h3 className="relative text-xl font-bold tracking-tight">
        {hasProjects ? "Nothing matches those filters" : "No projects yet"}
      </h3>
      <p className="relative max-w-sm text-sm leading-relaxed text-[var(--muted)]">
        {hasProjects
          ? "Try a different search, status, or clear the archived view."
          : "Add the things you're working on and watch the bars fill up as you check tasks off."}
      </p>
      <div className="relative mt-1 flex flex-wrap justify-center gap-2">
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
