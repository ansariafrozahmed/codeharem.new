// Shared by server and client code.

export const PROJECT_STATUSES = ["planning", "in_progress", "review", "completed", "on_hold"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const STATUS_META: Record<ProjectStatus, { label: string; className: string; dot: string }> = {
  planning: { label: "Planning", className: "bg-white/[0.06] text-white/75 ring-white/15", dot: "bg-white/60" },
  in_progress: { label: "In progress", className: "bg-leaf/15 text-[#7fd1ab] ring-leaf/30", dot: "bg-leaf" },
  review: { label: "In review", className: "bg-amber-300/10 text-amber-200 ring-amber-300/25", dot: "bg-amber-300" },
  completed: { label: "Completed", className: "bg-[#7fd1ab]/15 text-[#a5e3c6] ring-[#7fd1ab]/30", dot: "bg-[#7fd1ab]" },
  on_hold: { label: "On hold", className: "bg-white/[0.04] text-white/45 ring-white/10", dot: "bg-white/30" },
};

export function isProjectStatus(value: string): value is ProjectStatus {
  return (PROJECT_STATUSES as readonly string[]).includes(value);
}
