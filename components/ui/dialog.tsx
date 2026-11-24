"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "md" | "lg";
  /** false: no ✕, and Esc / clicking outside don't close it (a choice is required) */
  dismissible?: boolean;
};

/** Modal built on <dialog>: focus trap, Esc and backdrop click close it. */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  dismissible = true,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => !dismissible && e.preventDefault()}
      onClick={(e) => dismissible && e.target === ref.current && onClose()}
      aria-labelledby="dialog-title"
      className={`m-auto w-[calc(100%-2.5rem)] max-h-[calc(100dvh-2.5rem)] overflow-visible rounded-card bg-transparent p-0 text-foreground backdrop:bg-black/60 backdrop:backdrop-blur-sm ${size === "lg" ? "sm:w-[760px]" : "sm:w-[520px]"}`}
    >
      <div className="max-h-[calc(100dvh-2.5rem)] text-left overflow-y-auto rounded-card bg-surface ring-1 ring-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4 md:px-6">
          <div>
            <h2 id="dialog-title" className="text-base font-medium">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-sm text-white/50">{description}</p>
            )}
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-8 shrink-0 place-items-center rounded-action text-white/50 transition hover:bg-white/[0.06] hover:text-white focus-visible:outline-2 focus-visible:outline-leaf"
            >
              <X aria-hidden strokeWidth={1.75} className="size-4" />
            </button>
          )}
        </div>
        {children}
      </div>
    </dialog>
  );
}
