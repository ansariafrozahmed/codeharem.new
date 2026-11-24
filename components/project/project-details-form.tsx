"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { SettingsRow } from "@/components/ui/settings-row";
import { updateProject, type ProjectFormState } from "@/actions/projects";
import { PROJECT_STATUSES, STATUS_META } from "@/lib/project-status";
import type { Project } from "@/lib/projects";

export function ProjectDetailsForm({ project }: { project: Project }) {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(updateProject.bind(null, project.id), {});
  const [dirty, setDirty] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const savedViaRedirect = useSearchParams().get("saved") === "1";
  const saved = !dirty && (state.saved || savedViaRedirect);
  const e = state.errors ?? {};

  return (
    <form
      key={formKey}
      action={action}
      onSubmit={() => setDirty(false)}
      onChange={() => setDirty(true)}
      className="overflow-hidden rounded-card border border-white/[0.08] bg-surface/40"
    >
      <div className="divide-y divide-white/[0.06]">
        <SettingsRow label="Project name" htmlFor="p-name" error={e.name}>
          <Input id="p-name" name="name" defaultValue={project.name} maxLength={80} required aria-invalid={!!e.name} />
        </SettingsRow>

        <SettingsRow label="URL name" hint="Changing it changes this project's address." htmlFor="p-slug" error={e.slug}>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-white/35">…/projects/</span>
            <Input
              id="p-slug"
              name="slug"
              defaultValue={project.slug}
              maxLength={60}
              spellCheck={false}
              autoComplete="off"
              aria-invalid={!!e.slug}
              className="pl-[5.6rem]"
            />
          </div>
        </SettingsRow>

        <SettingsRow label="Client" htmlFor="p-client" error={e.client}>
          <Input id="p-client" name="client" defaultValue={project.client_name ?? ""} maxLength={80} placeholder="Client or company name" />
        </SettingsRow>

        <SettingsRow label="Status" htmlFor="p-status" error={e.status}>
          <Select id="p-status" name="status" defaultValue={project.status}>
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
          </Select>
        </SettingsRow>

        <SettingsRow label="Due date" htmlFor="p-due" error={e.dueDate}>
          <Input id="p-due" name="dueDate" type="date" defaultValue={project.due_date ?? ""} className="[color-scheme:dark]" />
        </SettingsRow>

        <SettingsRow label="Website" hint="Live or staging URL." htmlFor="p-web" error={e.website}>
          <Input id="p-web" name="website" defaultValue={project.website_url ?? ""} placeholder="https://" inputMode="url" />
        </SettingsRow>

        <SettingsRow label="Description" htmlFor="p-desc" error={e.description}>
          <Textarea id="p-desc" name="description" defaultValue={project.description ?? ""} maxLength={2000} rows={4} placeholder="What are you building for them?" />
        </SettingsRow>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] bg-white/[0.015] px-5 py-3 md:px-6">
        <p role="status" className={`mr-auto text-xs ${e.form ? "text-red-300" : "text-leaf"}`}>
          {e.form ?? (saved ? "Saved" : "")}
        </p>
        {dirty && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setFormKey((k) => k + 1); // remount resets fields to saved values
              setDirty(false);
            }}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" size="sm" disabled={!dirty || pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
