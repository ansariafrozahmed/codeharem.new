"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/actions/auth";
import Link from "next/link";
import { ChevronDown, LogOut, UserRound } from "lucide-react";

type Props = {
  name: string | null;
  username: string;
  email: string;
  avatarUrl: string | null;
};

export function UserMenu({ name, username, email, avatarUrl }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="flex h-9 items-center gap-2 rounded-sm p-1 pr-2.5 ring-1 ring-white/10 transition hover:-translate-y-px hover:bg-white/[0.05] hover:ring-white/20 active:translate-y-0 focus-visible:outline-2 focus-visible:outline-leaf"
      >
        <Avatar name={name} email={email} url={avatarUrl} radius="rounded-xs" />
        {name && <span className="hidden text-[11px] font-light sm:inline">{name}</span>}
        <ChevronDown
          aria-hidden
          strokeWidth={1.75}
          className={`size-3.5 text-white/50 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 overflow-hidden rounded-card bg-surface shadow-[0_20px_40px_-12px_rgba(0,0,0,0.7)] ring-1 ring-white/10"
        >
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-3.5 py-3">
            <Avatar name={name} email={email} url={avatarUrl} size={36} />
            <div className="min-w-0">
              {name && (
                <p className="truncate text-sm font-medium text-foreground">
                  {name}
                </p>
              )}
              {username && (
                <p className="truncate text-xs text-leaf">@{username}</p>
              )}
              <p className="truncate text-xs text-white/50">{email}</p>
            </div>
          </div>
          <div className="border-b border-white/[0.06] p-1.5">
            <Link
              href={`/profile/${username}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-2.5 rounded-action px-2.5 py-2 text-sm text-white/75 transition-colors hover:bg-white/[0.06] hover:text-foreground"
            >
              <UserRound aria-hidden strokeWidth={1.75} className="size-4" />
              My profile
            </Link>
          </div>
          <form action={logout} className="p-1.5">
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 rounded-action px-2.5 py-2 text-sm text-white/75 transition-colors hover:bg-white/[0.06] hover:text-foreground"
            >
              <LogOut aria-hidden strokeWidth={1.75} className="size-4" />
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Avatar({
  name,
  email,
  url,
  size = 28,
  radius = "rounded-action",
}: {
  name: string | null;
  email: string;
  url: string | null;
  size?: number;
  radius?: string;
}) {
  if (url) {
    return (
      <Image
        src={url}
        alt=""
        width={size}
        height={size}
        className={radius}
        style={{ width: size, height: size }}
      />
    );
  }
  const initial = (name ?? email).charAt(0).toUpperCase();
  return (
    <span
      aria-hidden
      className={`grid place-items-center ${radius} bg-pine text-xs font-semibold text-leaf ring-1 ring-leaf/30`}
      style={{ width: size, height: size }}
    >
      {initial}
    </span>
  );
}
