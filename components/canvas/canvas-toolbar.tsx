"use client";

import { useEffect, useRef, useState } from "react";
import { useReactFlow, useViewport } from "@xyflow/react";
import {
  Bookmark,
  Eraser,
  Maximize,
  MessageSquareText,
  Palette,
  Minus,
  Plus,
  SquareCheckBig,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import type { CanvasNodeType } from "@/lib/canvas-types";

type Props = {
  onAdd: (type: CanvasNodeType) => void;
  onClear: () => void;
  canClear: boolean;
};

const ADD_ITEMS: { key: string; label: string; hint: string; Icon: LucideIcon; tint: string }[] = [
  { key: "note", label: "Note", hint: "Free text, in colour", Icon: StickyNote, tint: "text-white/70" },
  { key: "requirement", label: "Requirement", hint: "What the client asked, as a checklist", Icon: MessageSquareText, tint: "text-leaf" },
  { key: "list", label: "Block", hint: "Named checklist you can link", Icon: SquareCheckBig, tint: "text-[#7fd1ab]" },
  { key: "reference", label: "Reference", hint: "Images and links", Icon: Bookmark, tint: "text-amber-200" },
  { key: "brand", label: "Brand", hint: "Colour palette and fonts", Icon: Palette, tint: "text-rose-200" },
];

const iconBtn =
  "grid size-10 place-items-center rounded-action text-white/65 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-2 focus-visible:outline-leaf active:scale-[0.95] md:size-9";

/** Floating bar. Desktop: every card type + zoom. Phones: an Add menu. Both: fit, clear. */
export function CanvasToolbar({ onAdd, onClear, canClear }: Props) {
  const { zoomIn, zoomOut, fitView, zoomTo } = useReactFlow();
  const { zoom } = useViewport();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(key: string) {
    setOpen(false);
    onAdd(key as CanvasNodeType);
  }

  return (
    <div ref={ref} className="relative">
      {/* Add menu */}
      {open && (
        // phones only (the button that opens it is hidden on desktop)
        <div
          role="menu"
          aria-label="Add to canvas"
          className="absolute bottom-full left-0 mb-2 w-[min(18rem,calc(100vw-2.5rem))] overflow-hidden rounded-card bg-surface p-1.5 ring-1 ring-white/10 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.85)]"
        >
          {ADD_ITEMS.map(({ key, label, hint, Icon, tint }, i) => (
            <button
              key={key}
              type="button"
              role="menuitem"
              autoFocus={i === 0}
              onClick={() => pick(key)}
              className="flex w-full items-center gap-3 rounded-action px-2.5 py-2.5 text-left transition hover:bg-white/[0.06] focus-visible:bg-white/[0.06] focus-visible:outline-none"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-action bg-white/[0.05] ring-1 ring-white/10">
                <Icon aria-hidden strokeWidth={1.75} className={`size-4 ${tint}`} />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-foreground">{label}</span>
                <span className="block truncate text-[11.5px] text-white/45">{hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      <div
        role="toolbar"
        aria-label="Canvas tools"
        className="flex items-center gap-1 rounded-card bg-surface/95 p-1 ring-1 ring-white/10 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-md"
      >
        {/* Desktop: every card type inline */}
        <div className="hidden items-center gap-0.5 md:flex">
          {ADD_ITEMS.map(({ key, label, hint, Icon, tint }) => (
            <button
              key={key}
              type="button"
              onClick={() => onAdd(key as CanvasNodeType)}
              title={hint}
              className="flex h-9 items-center gap-2 rounded-action px-3 text-[13px] text-white/75 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-2 focus-visible:outline-leaf active:scale-[0.97]"
            >
              <Icon aria-hidden strokeWidth={1.75} className={`size-4 ${tint}`} />
              {label}
            </button>
          ))}
        </div>

        {/* Phones: one Add button with a menu */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="menu"
          className="flex h-10 items-center gap-2 rounded-action bg-[linear-gradient(135deg,#143f39_0%,#429872_100%)] px-4 text-[13px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf active:scale-[0.97] md:hidden"
        >
          <Plus aria-hidden strokeWidth={2} className={`size-4 transition-transform duration-200 ${open ? "rotate-45" : ""}`} />
          Add
        </button>

        <span aria-hidden className="mx-1 h-5 w-px bg-white/10" />

        {/* Zoom: buttons on desktop; phones pinch */}
        <div className="hidden items-center gap-1 md:flex">
          <button type="button" className={iconBtn} onClick={() => zoomOut({ duration: 200 })} aria-label="Zoom out">
            <Minus aria-hidden strokeWidth={1.75} className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => zoomTo(1, { duration: 200 })}
            aria-label="Reset zoom to 100%"
            title="Reset to 100%"
            className="h-9 w-14 rounded-action text-center text-[12px] text-white/70 tabular-nums transition hover:bg-white/[0.07] hover:text-white"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button type="button" className={iconBtn} onClick={() => zoomIn({ duration: 200 })} aria-label="Zoom in">
            <Plus aria-hidden strokeWidth={1.75} className="size-4" />
          </button>
        </div>

        <button type="button" className={iconBtn} onClick={() => fitView({ padding: 0.3, duration: 300, maxZoom: 1 })} aria-label="Fit all cards" title="Fit all cards">
          <Maximize aria-hidden strokeWidth={1.75} className="size-4" />
        </button>
        <button
          type="button"
          className={`${iconBtn} hover:!bg-red-400/15 hover:!text-red-300 disabled:pointer-events-none disabled:opacity-30`}
          onClick={onClear}
          disabled={!canClear}
          aria-label="Clear canvas"
          title="Clear canvas"
        >
          <Eraser aria-hidden strokeWidth={1.75} className="size-4" />
        </button>
      </div>
    </div>
  );
}
