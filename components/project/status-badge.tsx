import { STATUS_META, type ProjectStatus } from "@/lib/project-status";

export function StatusBadge({ status, className = "" }: { status: ProjectStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-action px-2 py-0.5 text-[11px] font-medium ring-1 ${meta.className} ${className}`}
    >
      <span aria-hidden className={`size-1.5 rounded-xs ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
