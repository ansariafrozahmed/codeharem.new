"use client";

import { Check, CloudAlert, CloudOff, GitCompareArrows, LoaderCircle, Save } from "lucide-react";
import { useCanvasSyncBridge } from "@/components/canvas/sync-context";
import type { SyncStatus } from "@/hooks/use-canvas-sync";

const MAP: Record<SyncStatus, { Icon: typeof Check; text: string; title: string; className: string; disabled?: boolean }> = {
  saved: { Icon: Check, text: "Saved", title: "All changes saved", className: "text-white/45 ring-white/10", disabled: true },
  local: {
    Icon: Save,
    text: "Save",
    title: "Save now (Ctrl/⌘+S). Also saves automatically in a moment.",
    className:
      "text-white ring-white/15 bg-[linear-gradient(135deg,#143f39_0%,#429872_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] hover:brightness-110",
  },
  syncing: { Icon: LoaderCircle, text: "Saving…", title: "Saving your changes", className: "text-white/70 ring-white/10", disabled: true },
  offline: {
    Icon: CloudOff,
    text: "Offline",
    title: "No connection. Your changes are kept and will save when you're back online.",
    className: "text-amber-200 ring-amber-300/30 bg-amber-300/10",
  },
  error: { Icon: CloudAlert, text: "Retry", title: "Saving failed. Click to try again.", className: "text-red-200 ring-red-400/40 bg-red-500/15 hover:bg-red-500/25" },
  conflict: {
    Icon: GitCompareArrows,
    text: "Changed elsewhere",
    title: "Choose which version to keep",
    className: "text-amber-200 ring-amber-300/30 bg-amber-300/10",
    disabled: true,
  },
};

/** Save button in the workspace header. Shows the canvas sync state. */
export function HeaderSaveButton() {
  const bridge = useCanvasSyncBridge();
  if (!bridge) return null;
  const m = MAP[bridge.status];

  return (
    <button
      type="button"
      onClick={bridge.syncNow}
      disabled={m.disabled}
      title={m.title}
      aria-live="polite"
      className={`flex h-8 items-center gap-2 rounded-action px-3 text-[13px] font-medium ring-1 transition active:scale-[0.97] disabled:cursor-default ${m.className}`}
    >
      <m.Icon aria-hidden strokeWidth={2} className={`size-4 ${bridge.status === "syncing" ? "animate-spin" : ""}`} />
      <span className={bridge.status === "conflict" ? "hidden md:inline" : ""}>{m.text}</span>
    </button>
  );
}
