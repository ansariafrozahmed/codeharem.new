import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { Project } from "@/lib/projects";
import { daysUntil, formatDate, relativeTime } from "@/lib/format";
import { StatusBadge } from "./status-badge";
import { ProjectCardMenu } from "./project-card-menu";

export function ProjectCard({ project, href }: { project: Project; href: string }) {
  const due = project.due_date ? daysUntil(project.due_date) : null;
  const overdue = due !== null && due < 0 && project.status !== "completed";

  return (
    <div className="group relative">
      <Link
        href={href}
        className="flex h-full flex-col rounded-card border border-white/[0.08] bg-surface/40 p-5 transition group-hover:-translate-y-0.5 group-hover:border-leaf/40 group-hover:bg-surface/70 focus-visible:outline-2 focus-visible:outline-leaf"
      >
        <div className="flex h-8 items-center pr-10">
          <StatusBadge status={project.status} />
        </div>

        <h3 className="mt-3 truncate text-base font-medium">{project.name}</h3>
        <p className="mt-0.5 truncate text-sm text-white/50">{project.client_name ?? "No client yet"}</p>

        {project.description && <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-white/45">{project.description}</p>}

        <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs text-white/40">
          <span className={`flex items-center gap-1.5 ${overdue ? "text-red-300" : ""}`}>
            <CalendarDays aria-hidden strokeWidth={1.75} className="size-3.5" />
            {project.due_date ? (overdue ? `Overdue · ${formatDate(project.due_date)}` : formatDate(project.due_date)) : "No due date"}
          </span>
          <span>Updated {relativeTime(project.updated_at)}</span>
        </div>
      </Link>

      {/* Outside the link, so opening the menu doesn't open the project */}
      <div className="absolute top-5 right-4 transition group-hover:-translate-y-0.5">
        <ProjectCardMenu projectId={project.id} name={project.name} href={href} />
      </div>
    </div>
  );
}
