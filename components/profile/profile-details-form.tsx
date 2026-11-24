"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { USERNAME_MAX } from "@/lib/username";
import { updateProfile, type ProfileFormState } from "@/actions/profile";
import { SettingsRow } from "@/components/ui/settings-row";

type Props = {
  fullName: string;
  username: string;
};

export function ProfileDetailsForm({ fullName, username }: Props) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(updateProfile, {});
  const [name, setName] = useState(fullName);
  const [handle, setHandle] = useState(username);
  const savedViaRedirect = useSearchParams().get("saved") === "1";

  const dirty = name.trim() !== fullName || handle.trim().toLowerCase() !== username;
  const saved = !dirty && (state.saved || savedViaRedirect);

  return (
    <form action={action} className="overflow-hidden rounded-card border border-white/[0.08] bg-surface/40">
      <div className="divide-y divide-white/[0.06]">

        <SettingsRow label="Full name" htmlFor="fullName" error={state.errors?.fullName}>
          <Input
            id="fullName"
            name="fullName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="Your name"
            autoComplete="name"
            aria-invalid={!!state.errors?.fullName}
          />
        </SettingsRow>

        <SettingsRow
          label="Username"
          hint="Unique across CodeHarem. Changing it changes your profile URL."
          htmlFor="username"
          error={state.errors?.username}
        >
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-white/35">@</span>
            <Input
              id="username"
              name="username"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
              maxLength={USERNAME_MAX}
              autoComplete="off"
              spellCheck={false}
              aria-invalid={!!state.errors?.username}
              className="pl-7"
            />
          </div>
        </SettingsRow>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] bg-white/[0.015] px-5 py-3 md:px-6">
        <p role="status" className={`mr-auto text-xs ${state.errors?.form ? "text-red-300" : "text-leaf"}`}>
          {state.errors?.form ?? (saved ? "Saved" : "")}
        </p>
        {dirty && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setName(fullName);
              setHandle(username);
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
