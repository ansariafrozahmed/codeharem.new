"use client";

import { useActionState, useState } from "react";
import { LoaderCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { createProject, type CreateProjectState } from "@/actions/projects";
import { slugify } from "@/lib/slug";

/** "New project": asks only for the name; the URL is made from it. */
export function NewProjectButton({
  label = "New project",
}: {
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [state, action, pending] = useActionState<CreateProjectState, FormData>(
    createProject,
    {},
  );
  const slug = slugify(name);

  function close() {
    if (pending) return;
    setOpen(false);
    setName("");
  }

  return (
    <>
      <Button iconLeft={<Plus strokeWidth={2} />} onClick={() => setOpen(true)}>
        {label}
      </Button>

      <Dialog
        open={open}
        onClose={close}
        title="New project"
        description="Give it a name. You can add the rest on the canvas."
      >
        <form action={action}>
          <div className="px-5 text-left py-5 md:px-6">
            <Field
              label="Project name"
              htmlFor="np-name"
              error={state.error}
              hint={
                slug ? `URL: …/projects/${slug}` : "e.g. Halden Physio website"
              }
            >
              <Input
                id="np-name"
                name="name"
                required
                autoFocus
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
                autoComplete="off"
                aria-invalid={!!state.error}
              />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-white/[0.06] bg-white/[0.015] px-5 py-3 md:px-6">
            <Button variant="secondary" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || !name.trim()}
              iconLeft={
                pending ? <LoaderCircle className="animate-spin" /> : undefined
              }
            >
              {pending ? "Creating…" : "Create project"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
