"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import type { Project } from "@/lib/projects";
import { DeleteProject } from "./delete-project";
import { ProjectDetailsForm } from "./project-details-form";

/** Gear button in the workspace top bar: project details + delete. */
export function ProjectSettingsDialog({ project }: { project: Project }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Project settings"
        title="Project settings"
        className="flex h-8 items-center gap-2 rounded-action px-2.5 text-[13px] text-white/65 ring-1 ring-white/10 transition hover:bg-white/[0.05] hover:text-white focus-visible:outline-2 focus-visible:outline-leaf"
      >
        <Settings2 aria-hidden strokeWidth={1.75} className="size-4" />
        <span className="hidden md:inline">Settings</span>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} size="lg" title="Project settings" description="Details, URL and status for this project.">
        <div className="space-y-8 p-5 md:p-6">
          <ProjectDetailsForm project={project} />
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80">Danger zone</h3>
            <DeleteProject projectId={project.id} slug={project.slug} />
          </div>
        </div>
      </Dialog>
    </>
  );
}
