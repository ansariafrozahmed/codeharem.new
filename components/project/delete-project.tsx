"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { deleteProject } from "@/actions/projects";

/** Danger zone: delete after typing the project's URL name. */
export function DeleteProject({ projectId, slug }: { projectId: string; slug: string }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteProject(projectId);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-card border border-red-400/20 bg-red-400/[0.03] px-5 py-5 sm:flex-row sm:items-center sm:justify-between md:px-6">
      <div>
        <p className="text-sm font-medium">Delete this project</p>
        <p className="mt-1 text-[13px] text-white/45">Removes the project and everything in it. This can&apos;t be undone.</p>
      </div>
      <Button
        variant="secondary"
        iconLeft={<Trash2 strokeWidth={1.75} />}
        onClick={() => setOpen(true)}
        className="self-start border-red-400/30 text-red-200 hover:border-red-400/60 hover:bg-red-400/10 hover:text-red-100 sm:self-auto"
      >
        Delete project
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Delete project?" description="This permanently removes the project and everything in it.">
        <div className="space-y-4 px-5 py-5 md:px-6">
          <Field label={`Type ${slug} to confirm`} htmlFor="confirm-delete" error={error ?? undefined}>
            <Input id="confirm-delete" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" spellCheck={false} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-white/[0.06] bg-white/[0.015] px-5 py-3 md:px-6">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={onDelete}
            disabled={confirm !== slug || pending}
            className="bg-none! bg-red-500/80! hover:bg-red-500! hover:shadow-none!"
          >
            {pending ? "Deleting…" : "Delete forever"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
