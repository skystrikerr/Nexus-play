import { ACCENT_HEX, type Accent } from "@/types";

interface ProgressBarProps {
  value: number;
  accent?: Accent;
  /** Rendered thicker on cards, thinner in dense summary rows. */
  size?: "sm" | "md";
  label?: string;
}

export function ProgressBar({ value, accent = "blue", size = "md", label }: ProgressBarProps) {
  const { from, to } = ACCENT_HEX[accent];
  const height = size === "sm" ? 7 : 12;
  return (
    <div
      className="relative w-full overflow-hidden rounded-full bg-[var(--track)] ring-1 ring-inset ring-white/5"
      style={{ height }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className="relative h-full overflow-hidden rounded-full transition-[width] duration-700 ease-out"
        style={{
          width: `${value}%`,
          backgroundImage: `linear-gradient(90deg, ${from}, ${to})`,
          boxShadow: value > 0 ? `0 0 18px -2px ${from}aa, inset 0 1px 0 rgba(255,255,255,0.35)` : undefined,
        }}
      >
        {value > 0 && value < 100 ? <span className="shimmer absolute inset-0" /> : null}
      </div>
    </div>
  );
}
