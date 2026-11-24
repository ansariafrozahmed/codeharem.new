"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { ExternalLink, LoaderCircle, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { deleteProject } from "@/actions/projects";

/** ⋯ menu on a project card: open or delete. */
export function ProjectCardMenu({ projectId, name, href }: { projectId: string; name: string; href: string }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function onDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteProject(projectId); // redirects back to the list when done
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Actions for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className="grid size-8 place-items-center rounded-action text-white/45 transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-2 focus-visible:outline-leaf"
      >
        <MoreHorizontal aria-hidden strokeWidth={1.75} className="size-4" />
      </button>

      {open && (
        <div role="menu" className="absolute top-full right-0 z-20 mt-1 w-44 overflow-hidden rounded-card bg-surface p-1 ring-1 ring-white/10 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.8)]">
          <Link
            href={href}
            role="menuitem"
            className="flex items-center gap-2.5 rounded-action px-2.5 py-2 text-[13px] text-white/80 transition hover:bg-white/[0.06] hover:text-white"
          >
            <ExternalLink aria-hidden strokeWidth={1.75} className="size-4" />
            Open
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setConfirm(true);
            }}
            className="flex w-full items-center gap-2.5 rounded-action px-2.5 py-2 text-[13px] text-red-300 transition hover:bg-red-400/10 hover:text-red-200"
          >
            <Trash2 aria-hidden strokeWidth={1.75} className="size-4" />
            Delete project
          </button>
        </div>
      )}

      <Dialog
        open={confirm}
        onClose={() => !pending && setConfirm(false)}
        title={`Delete “${name}”?`}
        description="The project, its canvas and every image in it will be deleted. This can't be undone."
      >
        {error && <p role="alert" className="mx-5 mt-4 text-sm text-red-300 md:mx-6">{error}</p>}
        <div className="flex justify-end gap-2 px-5 py-4 md:px-6">
          <Button variant="secondary" onClick={() => setConfirm(false)} disabled={pending}>
            Cancel
          </Button>
          <Button
            onClick={onDelete}
            disabled={pending}
            iconLeft={pending ? <LoaderCircle className="animate-spin" /> : <Trash2 strokeWidth={1.75} />}
            className="bg-none! bg-red-500/80! hover:bg-red-500! hover:shadow-none!"
          >
            {pending ? "Deleting…" : "Delete project"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
