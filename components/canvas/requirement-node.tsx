"use client";

import { memo } from "react";
import type { NodeProps } from "@xyflow/react";
import { ChevronDown, MessageSquareText } from "lucide-react";
import { REQUIREMENT_SOURCES, SOURCE_LABELS, type RequirementNode as RequirementNodeType, type RequirementSource } from "@/lib/canvas-types";
import { useCanvasActions } from "./canvas-context";
import { CardShell } from "./card-shell";
import { Checklist, checklistProgress } from "./checklist";

function RequirementNodeComponent({ id, data, selected }: NodeProps<RequirementNodeType>) {
  const { patchData } = useCanvasActions();
  const { done, total, allDone } = checklistProgress(data.items);

  return (
    <CardShell
      id={id}
      selected={!!selected}
      minWidth={240}
      minHeight={140}
      className={`bg-surface ${allDone ? "ring-leaf/50" : "ring-white/10"}`}
      header={
        <>
          <MessageSquareText aria-hidden strokeWidth={1.75} className="size-3.5 text-leaf" />
          <span className="text-[11px] font-medium tracking-wide text-white/55 uppercase">Requirement</span>
          {total > 0 && <Progress done={done} total={total} allDone={allDone} />}
        </>
      }
    >
      <div className="flex h-full flex-col">
        <div className="nodrag flex items-center gap-2 px-3 pb-2">
          <label className="relative">
            <span className="sr-only">Source</span>
            <select
              value={data.source}
              onChange={(e) => patchData(id, { source: e.target.value as RequirementSource })}
              className="h-6 cursor-pointer appearance-none rounded-action bg-white/[0.06] pr-6 pl-2 text-[11px] text-white/75 ring-1 ring-white/10 outline-none transition hover:bg-white/[0.09] focus:ring-leaf/60"
            >
              {REQUIREMENT_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {SOURCE_LABELS[s]}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden strokeWidth={1.75} className="pointer-events-none absolute top-1/2 right-1.5 size-3 -translate-y-1/2 text-white/45" />
          </label>
          {total > 0 && <ProgressBar done={done} total={total} />}
        </div>
        <div className="min-h-0 flex-1">
          <Checklist items={data.items} onChange={(items) => patchData(id, { items })} firstPlaceholder="What did the client ask for?" />
        </div>
      </div>
    </CardShell>
  );
}

export function Progress({ done, total, allDone }: { done: number; total: number; allDone: boolean }) {
  return <span className={`text-[11px] tabular-nums ${allDone ? "text-[#7fd1ab]" : "text-white/35"}`}>{done}/{total}</span>;
}

export function ProgressBar({ done, total }: { done: number; total: number }) {
  return (
    <div aria-hidden className="h-1 flex-1 overflow-hidden rounded-xs bg-white/[0.07]">
      <div className="h-full rounded-xs bg-leaf transition-[width] duration-300" style={{ width: `${(done / total) * 100}%` }} />
    </div>
  );
}

export const RequirementNode = memo(RequirementNodeComponent);
