import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { requireOwnProfile, profilePath } from "@/lib/profile";
import { getProjectBySlug } from "@/lib/projects";
import { StatusBadge } from "./status-badge";
import { ProjectSettingsDialog } from "./project-settings-dialog";
import { HeaderSaveButton } from "./header-save-button";
import { Avatar } from "@/components/ui/avatar";
import logo from "@/public/weblogo.webp";

type Props = { params: Promise<{ username: string; slug: string }> };

/** Top bar of the project workspace: logo, breadcrumb, back link, you. */
export async function WorkspaceTopbar({ params }: Props) {
  const { username, slug } = await params;
  const profile = await requireOwnProfile(username, `projects/${slug}`);
  const projectsHref = profilePath(profile.username, "projects");
  const project = await getProjectBySlug(slug);
  const name = profile.full_name ?? profile.username;

  return (
    <div className="flex h-full items-center justify-between gap-4 px-5 md:px-10 lg:px-6">
      <div className="flex min-w-0 items-center gap-3 md:gap-4">
        <Link
          href={projectsHref}
          aria-label="Back to projects"
          className="grid size-8 shrink-0 place-items-center rounded-action text-white/60 ring-1 ring-white/10 transition hover:bg-white/[0.05] hover:text-white focus-visible:outline-2 focus-visible:outline-leaf"
        >
          <ArrowLeft aria-hidden strokeWidth={1.75} className="size-4" />
        </Link>

        <Link href="/" className="hidden shrink-0 rounded-action focus-visible:outline-2 focus-visible:outline-leaf sm:block">
          <Image src={logo} alt="codeharem" style={{ height: 20, width: "auto" }} />
        </Link>

        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px]">
          <Link href={projectsHref} className="hidden shrink-0 text-white/50 transition hover:text-white md:inline">
            Projects
          </Link>
          <ChevronRight aria-hidden strokeWidth={1.75} className="hidden size-3.5 shrink-0 text-white/25 md:block" />
          <span aria-current="page" className="truncate font-medium text-foreground">
            {project.name}
          </span>
          <StatusBadge status={project.status} className="ml-1.5 hidden sm:inline-flex" />
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        <HeaderSaveButton />
        <ProjectSettingsDialog project={project} />
        <Link
          href={profilePath(profile.username)}
          aria-label="Your profile"
          className="shrink-0 rounded-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
        >
          <Avatar name={name} url={profile.avatar_url} size={30} />
        </Link>
      </div>
    </div>
  );
}

export function WorkspaceTopbarSkeleton() {
  return (
    <div className="flex h-full items-center gap-4 px-5 md:px-10 lg:px-6">
      <span className="size-8 animate-pulse rounded-action bg-white/[0.05]" />
      <span className="h-4 w-48 animate-pulse rounded-action bg-white/[0.04]" />
    </div>
  );
}
