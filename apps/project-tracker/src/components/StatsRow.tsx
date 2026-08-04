import { CircleDot, ListChecks, Layers, TrendingUp } from "lucide-react";
import { ProgressBar } from "@/components/ProgressBar";
import { averageProgress, projectProgress, taskCounts } from "@/lib/progress";
import type { Project } from "@/types";

interface StatsRowProps {
  projects: Project[];
}

export function StatsRow({ projects }: StatsRowProps) {
  const active = projects.filter((project) => project.status === "active").length;
  const complete = projects.filter((project) => projectProgress(project) >= 100).length;
  const tasks = projects.reduce(
    (totals, project) => {
      const { done, total } = taskCounts(project);
      return { done: totals.done + done, total: totals.total + total };
    },
    { done: 0, total: 0 },
  );
  const average = averageProgress(projects);

  const tiles = [
    { label: "Projects", value: String(projects.length), icon: Layers, hint: `${active} active` },
    {
      label: "Average progress",
      value: `${average}%`,
      icon: TrendingUp,
      hint: `${complete} at 100%`,
    },
    {
      label: "Tasks done",
      value: `${tasks.done}/${tasks.total}`,
      icon: ListChecks,
      hint: tasks.total > 0 ? `${Math.round((tasks.done / tasks.total) * 100)}% of all tasks` : "no tasks yet",
    },
    {
      label: "Needs attention",
      value: String(projects.filter((project) => project.status === "paused").length),
      icon: CircleDot,
      hint: "paused projects",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map(({ label, value, icon: Icon, hint }) => (
        <div
          key={label}
          className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3.5"
        >
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
            <Icon size={14} />
            {label}
          </div>
          <div className="mt-1.5 text-2xl font-semibold tabular-nums">{value}</div>
          <div className="mt-0.5 text-xs text-[var(--muted)]">{hint}</div>
          {label === "Average progress" ? (
            <div className="mt-2.5">
              <ProgressBar value={average} size="sm" accent="blue" label="Average progress" />
            </div>
          ) : null}
        </div>
      ))}
    </section>
  );
}
