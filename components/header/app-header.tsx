import { Suspense } from "react";
import { getCurrentProfile, profilePath } from "@/lib/profile";
import { Logo } from "@/components/logo";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";
import { MobileMenu } from "./mobile-menu";
import { ButtonLink } from "@/components/ui/button";
import { FolderPlusCorner, UserRound } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background">
      <div className="flex h-(--header-h) w-full items-center justify-between gap-6 px-5 md:px-10 lg:px-16">
        <div className="flex items-center gap-6 lg:gap-16">
          <Logo />
          <Suspense fallback={null}>
            <NavLinks />
          </Suspense>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Suspense fallback={<span className="h-9 w-10 rounded-action bg-white/[0.04] lg:w-40" />}>
            <HeaderActions />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

async function HeaderActions() {
  const profile = await getCurrentProfile();
  const projectsHref = profile?.username
    ? profilePath(profile.username, "projects")
    : "/login";

  // TODO: point to the new-project page once the Projects module exists
  const createButton = (
    <ButtonLink
      href={projectsHref}
      variant="primary"
      iconRight={<FolderPlusCorner className="size-3.5!" />}
    >
      Add new project
    </ButtonLink>
  );

  const goToProjects = (
    <ButtonLink
      href={projectsHref}
      variant="primary"
      iconRight={<FolderPlusCorner className="size-3.5!" />}
    >
      My projects
    </ButtonLink>
  );

  if (!profile) {
    return (
      <>
        {/* Desktop */}
        <div className="hidden items-center gap-3 lg:flex">
          {createButton}
          <ButtonLink
            href="/login"
            variant="secondary"
            iconRight={<UserRound className="size-3.5!" />}
          >
            Log in
          </ButtonLink>
        </div>
        {/* Mobile */}
        <MobileMenu loggedIn={false} projectsHref={projectsHref} />
      </>
    );
  }

  return (
    <>
      <div className="hidden lg:flex">{goToProjects}</div>
      <UserMenu
        name={profile.full_name}
        username={profile.username}
        email={profile.email}
        avatarUrl={profile.avatar_url}
      />
      <MobileMenu loggedIn projectsHref={projectsHref} />
    </>
  );
}
