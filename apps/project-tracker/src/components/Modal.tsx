import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { iconButton } from "@/lib/ui";

interface ModalProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, title, description, onClose, children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="glass-strong glass-sheen animate-scale-in relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl shadow-2xl sm:rounded-3xl"
      >
        <div
          className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full bg-violet-500/25 blur-3xl"
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-4 border-b border-[var(--glass-border)] px-5 py-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-sm text-[var(--muted)]">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={iconButton}
          >
            <X size={18} />
          </button>
        </div>
        <div className="relative flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? (
          <div className="relative flex justify-end gap-2 border-t border-[var(--glass-border)] px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
