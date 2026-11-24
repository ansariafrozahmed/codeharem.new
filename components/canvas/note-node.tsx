"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { StickyNote } from "lucide-react";
import { NOTE_COLORS, type NoteColor, type NoteNode as NoteNodeType } from "@/lib/canvas-types";
import { useCanvasActions } from "./canvas-context";
import { CardShell, CardText } from "./card-shell";

export const NOTE_STYLE: Record<NoteColor, { card: string; swatch: string }> = {
  slate: { card: "bg-[#1d2120] ring-white/10", swatch: "bg-[#3a403e]" },
  pine: { card: "bg-[#12302b] ring-pine", swatch: "bg-pine" },
  leaf: { card: "bg-[#173a2e] ring-leaf/40", swatch: "bg-leaf" },
  amber: { card: "bg-[#2e2716] ring-amber-300/25", swatch: "bg-amber-300/80" },
  rose: { card: "bg-[#2e1a1d] ring-rose-300/25", swatch: "bg-rose-300/80" },
};

function NoteNodeComponent({ id, data, selected }: NodeProps<NoteNodeType>) {
  const { patchData } = useCanvasActions();
  const style = NOTE_STYLE[data.color] ?? NOTE_STYLE.slate;

  return (
    <CardShell
      id={id}
      selected={!!selected}
      minWidth={160}
      minHeight={110}
      className={style.card}
      header={
        <>
          <StickyNote aria-hidden strokeWidth={1.75} className="size-3.5 text-white/45" />
          <span className="text-[11px] font-medium tracking-wide text-white/45 uppercase">Note</span>
        </>
      }
      tools={NOTE_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => patchData(id, { color: c })}
          aria-label={`${c} note`}
          aria-pressed={data.color === c}
          className={`size-3.5 rounded-xs ${NOTE_STYLE[c].swatch} ring-offset-1 ring-offset-transparent transition ${
            data.color === c ? "ring-2 ring-white/80" : "opacity-70 hover:opacity-100"
          }`}
        />
      ))}
    >
      <CardText value={data.text} placeholder="Write a note…" onChange={(text) => patchData(id, { text })} />
    </CardShell>
  );
}

export const NoteNode = memo(NoteNodeComponent);
