export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 disabled:opacity-50 disabled:pointer-events-none";

export const buttonPrimary = `${buttonBase} bg-blue-600 px-3.5 py-2 text-white hover:bg-blue-500`;

export const buttonGhost = `${buttonBase} px-3 py-2 text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--text)]`;

export const buttonOutline = `${buttonBase} border border-[var(--border)] bg-[var(--panel)] px-3 py-2 hover:bg-[var(--panel-2)]`;

export const buttonDanger = `${buttonBase} bg-rose-600 px-3.5 py-2 text-white hover:bg-rose-500`;

/** Shared field chrome; `inputBase` fills its container, `selectBase` hugs its content. */
const fieldBase =
  "rounded-lg border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/25";

export const inputBase = `${fieldBase} w-full`;

export const selectBase = fieldBase;

export const labelBase = "mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--muted)]";
