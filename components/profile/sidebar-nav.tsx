"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, UserRound } from "lucide-react";

const LINKS = [
  { section: "", label: "Profile", Icon: UserRound },
  { section: "projects", label: "Projects", Icon: FolderKanban },
];

export function SidebarNav({ username, itemClass }: { username: string; itemClass: string }) {
  const pathname = usePathname();
  const base = `/profile/${username}`;

  return (
    <nav aria-label="Profile" className="flex gap-1 overflow-x-auto lg:flex-col">
      {LINKS.map(({ section, label, Icon }) => {
        const href = section ? `${base}/${section}` : base;
        const active = section ? pathname.startsWith(href) : pathname === base;
        return (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`${itemClass} relative whitespace-nowrap ${
              active
                ? "bg-white/[0.06] text-foreground"
                : "text-white/55 hover:bg-white/[0.03] hover:text-foreground"
            }`}
          >
            {/* active marker */}
            <span
              aria-hidden
              className={`absolute top-1/2 left-0 hidden h-4 w-0.5 -translate-y-1/2 rounded-xs bg-leaf transition-opacity lg:block ${
                active ? "opacity-100" : "opacity-0"
              }`}
            />
            <Icon aria-hidden strokeWidth={1.75} className={`size-4 shrink-0 ${active ? "text-leaf" : ""}`} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
