import { CircleDot, Layers, ListChecks } from "lucide-react";
import { RingProgress } from "@/components/RingProgress";
import { averageProgress, projectProgress, taskCounts } from "@/lib/progress";
import { cn } from "@/lib/ui";
import type { Project } from "@/types";

interface StatsRowProps {
  projects: Project[];
}

const tileClass =
  "glass glass-sheen relative overflow-hidden rounded-2xl p-4 shadow-[var(--shadow)]";

export function StatsRow({ projects }: StatsRowProps) {
  const active = projects.filter((project) => project.status === "active").length;
  const complete = projects.filter((project) => projectProgress(project) >= 100).length;
  const paused = projects.filter((project) => project.status === "paused").length;
  const tasks = projects.reduce(
    (totals, project) => {
      const { done, total } = taskCounts(project);
      return { done: totals.done + done, total: totals.total + total };
    },
    { done: 0, total: 0 },
  );
  const average = averageProgress(projects);

  const small = [
    {
      label: "Projects",
      value: String(projects.length),
      hint: `${active} active`,
      icon: Layers,
      gradient: "from-violet-500 to-indigo-500",
    },
    {
      label: "Tasks done",
      value: `${tasks.done}/${tasks.total}`,
      hint:
        tasks.total > 0 ? `${Math.round((tasks.done / tasks.total) * 100)}% of all tasks` : "no tasks yet",
      icon: ListChecks,
      gradient: "from-sky-500 to-cyan-400",
    },
    {
      label: "Paused",
      value: String(paused),
      hint: paused === 1 ? "needs a nudge" : "needing a nudge",
      icon: CircleDot,
      gradient: "from-amber-500 to-orange-400",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className={cn(tileClass, "sm:col-span-2")}>
        <div
          className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-violet-500/25 blur-3xl"
          aria-hidden
        />
        <div className="relative flex items-center gap-4">
          <RingProgress value={average} />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
              Average progress
            </p>
            <p className="mt-1 text-2xl font-bold leading-tight">
              {complete} of {projects.length} finished
            </p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {projects.length === 0
                ? "Add a project to get started"
                : `${active} project${active === 1 ? "" : "s"} moving right now`}
            </p>
          </div>
        </div>
      </div>

      {small.map(({ label, value, hint, icon: Icon, gradient }) => (
        <div key={label} className={tileClass}>
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
              gradient,
            )}
          >
            <Icon size={16} />
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--faint)]">
            {label}
          </p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums leading-tight">{value}</p>
          <p className="mt-0.5 text-xs text-[var(--muted)]">{hint}</p>
        </div>
      ))}
    </section>
  );
}
