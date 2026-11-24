"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, FolderPlusCorner, Menu, UserRound, X } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { LINKS } from "./nav-links";

type Props = {
  loggedIn: boolean;
  projectsHref: string;
};

/** Phone/tablet navigation: a menu button and a full-screen panel under the header. */
export function MobileMenu({ loggedIn, projectsHref }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  // Esc closes; the page behind doesn't scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="grid size-10 place-items-center rounded-action text-white/80 ring-1 ring-white/10 transition hover:bg-white/[0.05] hover:text-white focus-visible:outline-2 focus-visible:outline-leaf"
      >
        {open ? <X aria-hidden strokeWidth={1.75} className="size-5" /> : <Menu aria-hidden strokeWidth={1.75} className="size-5" />}
      </button>

      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 top-(--header-h) bottom-0 z-40 flex flex-col overflow-y-auto border-t border-white/[0.06] bg-background px-5 pt-4 pb-8 md:px-10"
        >
          <nav aria-label="Main" className="flex flex-col">
            {LINKS.map(({ href, label }) => {
              const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  aria-current={active ? "page" : undefined}
                  className={`group flex items-center justify-between border-b border-white/[0.06] py-4 text-lg transition-colors ${
                    active ? "text-foreground" : "text-white/70 hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {active && <span aria-hidden className="h-4 w-0.5 rounded-xs bg-leaf" />}
                    {label}
                  </span>
                  <ArrowRight
                    aria-hidden
                    strokeWidth={1.5}
                    className="size-4 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-leaf"
                  />
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-3 pt-8">
            <ButtonLink href={projectsHref} onClick={close} size="lg" iconRight={<FolderPlusCorner />} className="w-full">
              {loggedIn ? "My projects" : "Add new project"}
            </ButtonLink>
            {!loggedIn && (
              <ButtonLink href="/login" onClick={close} variant="secondary" size="lg" iconRight={<UserRound />} className="w-full">
                Log in
              </ButtonLink>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
