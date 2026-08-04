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
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-[var(--track)]"
      style={{ height: size === "sm" ? 6 : 10 }}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{
          width: `${value}%`,
          backgroundImage: `linear-gradient(90deg, ${from}, ${to})`,
          boxShadow: value > 0 ? `0 0 12px ${from}55` : undefined,
        }}
      />
    </div>
  );
}
