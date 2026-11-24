"use client";

import { memo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ListNode as ListNodeType } from "@/lib/canvas-types";
import { useCanvasActions } from "./canvas-context";
import { CardShell } from "./card-shell";
import { Checklist, checklistProgress } from "./checklist";
import { Progress, ProgressBar } from "./requirement-node";

const SIDES = [Position.Top, Position.Right, Position.Bottom, Position.Left];

/** "Block": a named checklist that can be linked to other blocks. Grows with its content. */
function ListNodeComponent({ id, data, selected }: NodeProps<ListNodeType>) {
  const { patchData } = useCanvasActions();
  const { done, total, allDone } = checklistProgress(data.items);
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div className="group/list h-full w-full" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {/* Connection dots on every side (loose mode: any dot can start or end a link) */}
      {SIDES.map((side) => (
        <Handle
          key={side}
          id={side}
          type="source"
          position={side}
          className={`!size-3 !rounded-xs !border-2 !border-background !bg-leaf transition-opacity ${
            selected ? "opacity-100" : "opacity-0 group-hover/list:opacity-100"
          }`}
        />
      ))}

      <CardShell
        id={id}
        selected={!!selected}
        minWidth={200}
        minHeight={44}
        className={`bg-[#1a2421] ${allDone ? "ring-leaf/60" : "ring-leaf/25"}`}
        headerClassName="h-11"
        header={
          <>
            {/* Name: drags the block until you click into it, then it's a normal text field */}
            <input
              value={data.title}
              onChange={(e) => patchData(id, { title: e.target.value })}
              onFocus={() => setEditing(true)}
              onBlur={() => setEditing(false)}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              placeholder="Untitled"
              maxLength={80}
              aria-label="Block name"
              className={`min-w-0 flex-1 cursor-[inherit] bg-transparent text-[15px] font-semibold text-foreground outline-none placeholder:text-white/35 focus:cursor-text ${
                editing ? "nodrag" : ""
              }`}
            />
            {total > 0 && <Progress done={done} total={total} allDone={allDone} />}
          </>
        }
      >
        <div className="flex h-full flex-col">
          {total > 0 && (
            <div className="flex px-3 pb-2">
              <ProgressBar done={done} total={total} />
            </div>
          )}
          <div className="min-h-0 flex-1">
            <Checklist
              items={data.items}
              onChange={(items) => patchData(id, { items })}
              firstPlaceholder="First item…"
              allowEmpty
              showAdd={!!selected || hovered}
            />
          </div>
        </div>
      </CardShell>
    </div>
  );
}

export const ListNode = memo(ListNodeComponent);
