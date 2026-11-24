"use client";

import { NodeResizer } from "@xyflow/react";
import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { useCanvasActions } from "./canvas-context";

type Props = {
  id: string;
  selected: boolean;
  /** Left side of the header (drag area) */
  header: ReactNode;
  /** Extra controls on the right of the header, shown when selected */
  tools?: ReactNode;
  className: string;
  /** e.g. a taller header for blocks */
  headerClassName?: string;
  minWidth: number;
  minHeight: number;
  children: ReactNode;
};

/** Frame shared by every card: drag header, resize handles, delete. */
export function CardShell({ id, selected, header, tools, className, headerClassName = "h-9", minWidth, minHeight, children }: Props) {
  const { saveResize, removeNode } = useCanvasActions();

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={minWidth}
        minHeight={minHeight}
        color="#429872"
        handleClassName="!size-2.5 !rounded-xs !border-2 !border-background !bg-leaf"
        lineClassName="!border-leaf/60"
        onResizeEnd={() => saveResize(id)}
      />
      <div
        className={`flex h-full w-full flex-col overflow-hidden rounded-card ring-1 shadow-[0_12px_30px_-12px_rgba(0,0,0,0.7)] transition-[box-shadow,ring-color] ${className} ${
          selected ? "ring-2 ring-leaf/80" : ""
        }`}
      >
        <div className={`flex ${headerClassName} shrink-0 cursor-grab items-center justify-between gap-2 px-3 active:cursor-grabbing`}>
          <div className="flex min-w-0 flex-1 items-center gap-2">{header}</div>
          <div className={`nodrag flex items-center gap-1 transition-opacity ${selected ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            {tools}
            <button
              type="button"
              onClick={() => removeNode(id)}
              aria-label="Delete card"
              className="grid size-6 place-items-center rounded-action text-white/45 transition hover:bg-red-400/15 hover:text-red-300"
            >
              <Trash2 aria-hidden strokeWidth={1.75} className="size-3.5" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </>
  );
}

/** Text area inside a card: typing and scrolling don't drag or zoom the canvas. */
export function CardText({
  value,
  placeholder,
  onChange,
  className = "",
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={5000}
      className={`nodrag nowheel h-full w-full resize-none bg-transparent px-3 pb-3 text-[13px] leading-relaxed text-white/90 outline-none placeholder:text-white/30 ${className}`}
    />
  );
}
