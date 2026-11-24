import { getCurrentProfile } from "@/lib/profile";
import { Avatar } from "@/components/ui/avatar";
import { logout } from "@/actions/auth";
import { LogOut } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";

const itemClass =
  "flex items-center gap-3 rounded-action px-3 py-2 text-[13px] transition-colors focus-visible:outline-2 focus-visible:outline-leaf";

export async function Sidebar() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const name = profile.full_name ?? profile.username;

  return (
    <div className="flex h-full flex-col gap-6 lg:gap-8">
      {/* You */}
      <div className="hidden items-center gap-3 lg:flex">
        <Avatar name={name} url={profile.avatar_url} size={40} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-leaf">@{profile.username}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:flex-col lg:items-stretch lg:gap-0">
        <p className="mb-2 hidden px-3 text-[11px] tracking-wider text-white/35 uppercase lg:block">Workspace</p>
        <SidebarNav username={profile.username} itemClass={itemClass} />

        {/* Log out: right below the links on desktop, end of the row on mobile */}
        <form action={logout} className="ml-auto lg:mt-1 lg:ml-0">
          <button
            type="submit"
            className={`${itemClass} w-full text-white/55 hover:bg-red-400/10 hover:text-red-300`}
          >
            <LogOut aria-hidden strokeWidth={1.75} className="size-4 shrink-0" />
            <span className="hidden lg:inline">Log out</span>
            <span className="sr-only lg:hidden">Log out</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="hidden items-center gap-3 lg:flex">
        <span className="size-10 animate-pulse rounded-action bg-white/[0.05]" />
        <span className="h-8 flex-1 animate-pulse rounded-action bg-white/[0.04]" />
      </div>
      <div className="flex gap-2 lg:flex-col">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-9 w-24 animate-pulse rounded-action bg-white/[0.04] lg:w-full" />
        ))}
      </div>
    </div>
  );
}
