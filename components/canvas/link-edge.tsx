"use client";

import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow, type EdgeProps } from "@xyflow/react";
import { X } from "lucide-react";

/** Curved leaf line between two lists; selected → shows a remove button. */
export function LinkEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected }: EdgeProps) {
  const { deleteElements } = useReactFlow();
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        interactionWidth={20}
        style={{
          stroke: selected ? "#7fd1ab" : "rgba(66,152,114,0.75)",
          strokeWidth: selected ? 2.5 : 1.75,
        }}
      />
      {selected && (
        <EdgeLabelRenderer>
          <button
            type="button"
            onClick={() => deleteElements({ edges: [{ id }] })}
            aria-label="Remove link"
            className="nodrag nopan pointer-events-auto absolute grid size-6 place-items-center rounded-action bg-surface text-white/70 ring-1 ring-leaf/50 shadow-lg transition hover:bg-red-400/20 hover:text-red-200 hover:ring-red-400/50"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            <X aria-hidden strokeWidth={2} className="size-3.5" />
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
