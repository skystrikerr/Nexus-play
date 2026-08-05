export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-solid)] disabled:opacity-40 disabled:pointer-events-none";

/** Gradient fill + glow: the one loud button on the page. */
export const buttonPrimary = `${buttonBase} bg-gradient-to-r from-violet-600 via-indigo-500 to-sky-500 px-4 py-2.5 text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.85)] hover:shadow-[0_14px_36px_-10px_rgba(124,58,237,0.95)] hover:-translate-y-0.5`;

export const buttonGhost = `${buttonBase} px-3 py-2.5 text-[var(--muted)] hover:bg-[var(--glass-hover)] hover:text-[var(--text)]`;

export const buttonOutline = `${buttonBase} glass px-4 py-2.5 text-[var(--text)] hover:bg-[var(--glass-hover)]`;

export const buttonDanger = `${buttonBase} bg-gradient-to-r from-rose-600 to-red-500 px-4 py-2.5 text-white shadow-[0_10px_30px_-12px_rgba(244,63,94,0.9)] hover:-translate-y-0.5`;

export const iconButton =
  "inline-flex h-9 w-9 items-center justify-center rounded-xl text-[var(--muted)] transition-all duration-200 hover:bg-[var(--glass-hover)] hover:text-[var(--text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70";

const fieldBase =
  "rounded-xl border border-[var(--glass-border)] bg-[var(--glass)] px-3.5 py-2.5 text-sm text-[var(--text)] backdrop-blur-xl transition placeholder:text-[var(--faint)] focus:border-violet-400/60 focus:outline-none focus:ring-4 focus:ring-violet-500/15";

export const inputBase = `${fieldBase} w-full`;

export const selectBase = fieldBase;

export const labelBase =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--faint)]";

/** Small glass pill used for meta chips (due date, task counts). */
export const chipBase =
  "inline-flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--glass)] px-2.5 py-1 text-xs font-medium text-[var(--muted)]";
