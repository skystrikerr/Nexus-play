/** Local-midnight date for a yyyy-mm-dd string, so due dates never shift a day by timezone. */
function parseDueDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function daysUntil(iso: string): number | null {
  const due = parseDueDate(iso);
  if (!due) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((due.getTime() - startOfToday().getTime()) / msPerDay);
}

export function formatDueDate(iso: string): string {
  const due = parseDueDate(iso);
  if (!due) return iso;
  const days = daysUntil(iso);
  const label = due.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: due.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
  if (days === null) return label;
  if (days === 0) return `Due today`;
  if (days === 1) return `Due tomorrow`;
  if (days === -1) return `1 day overdue`;
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days <= 14) return `Due in ${days} days`;
  return `Due ${label}`;
}

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(then).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
