import { Suspense } from "react";
import { FolderKanban } from "lucide-react";
import { requireOwnProfile } from "@/lib/profile";
import { listProjects } from "@/lib/projects";
import { projectPath } from "@/lib/project-path";
import { NewProjectButton } from "@/components/project/new-project-button";
import { ProjectCard } from "@/components/project/project-card";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage({ params }: PageProps<"/profile/[username]/projects">) {
  return (
    <Suspense fallback={<ProjectsSkeleton />}>
      <Projects params={params} />
    </Suspense>
  );
}

async function Projects({ params }: { params: PageProps<"/profile/[username]/projects">["params"] }) {
  const { username } = await params;
  const profile = await requireOwnProfile(username, "projects");
  const projects = await listProjects();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-[15px] text-white/55">
            {projects.length
              ? `${projects.length} ${projects.length === 1 ? "project" : "projects"}, newest activity first.`
              : "Every client build, with its brief, design and progress."}
          </p>
        </div>
        {projects.length > 0 && <NewProjectButton />}
      </header>

      {projects.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} href={projectPath(profile.username, p.slug)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-white/10 px-6 py-20 text-center">
          <span className="grid size-12 place-items-center rounded-card bg-leaf/10 ring-1 ring-leaf/25">
            <FolderKanban aria-hidden strokeWidth={1.5} className="size-6 text-leaf" />
          </span>
          <p className="mt-5 font-medium">No projects yet</p>
          <p className="mt-1 mb-6 text-sm text-balance text-white/50">
            Create your first project to keep the client&apos;s requirements, research, design and sitemap together.
          </p>
          <NewProjectButton label="Create your first project" />
        </div>
      )}
    </div>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-14 w-64 animate-pulse rounded-action bg-white/[0.04]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-card bg-white/[0.03]" />
        ))}
      </div>
    </div>
  );
}
