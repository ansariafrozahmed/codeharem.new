import { Suspense } from "react";
import { requireOwnProfile, type Profile } from "@/lib/profile";
import { ProfileDetailsForm } from "@/components/profile/profile-details-form";
import { ProfileHero } from "@/components/profile/profile-hero";
import { SettingsRow } from "@/components/ui/settings-row";

export default function ProfilePage({ params }: PageProps<"/profile/[username]">) {
  return (
    <div className="space-y-12">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-[15px] text-white/55">Your photo, cover, name and account details.</p>
      </header>

      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileSections params={params} />
      </Suspense>
    </div>
  );
}

async function ProfileSections({ params }: { params: PageProps<"/profile/[username]">["params"] }) {
  const { username } = await params;
  const profile = await requireOwnProfile(username);
  const name = profile.full_name ?? profile.username;

  return (
    <>
      <ProfileHero
        username={profile.username}
        name={name}
        avatarUrl={profile.avatar_url}
        bannerUrl={profile.banner_url}
      />

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Profile information</h2>
        <ProfileDetailsForm fullName={profile.full_name ?? ""} username={profile.username} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Account details</h2>
          <p className="mt-1 text-sm text-white/50">Managed by your sign-in provider. These can&apos;t be edited.</p>
        </div>
        <AccountDetails profile={profile} />
      </section>
    </>
  );
}

function AccountDetails({ profile }: { profile: Profile }) {
  const provider = profile.provider === "github" ? "GitHub" : profile.provider === "google" ? "Google" : "Email";

  return (
    <div className="divide-y divide-white/[0.06] overflow-hidden rounded-card border border-white/[0.08] bg-surface/40">
      <SettingsRow label="Email" hint="Used for sign-in and account notices.">
        <p className="truncate pt-0.5 text-sm">{profile.email || "—"}</p>
      </SettingsRow>
      <SettingsRow label="Signed in with">
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-action bg-white/[0.04] ring-1 ring-white/10">
            {profile.provider === "github" ? <GitHubIcon /> : <GoogleIcon />}
          </span>
          <span className="text-sm">{provider}</span>
          <span className="rounded-action bg-leaf/15 px-2 py-0.5 text-[11px] font-medium text-[#7fd1ab] ring-1 ring-leaf/30">
            Connected
          </span>
        </div>
      </SettingsRow>
      <SettingsRow label="Member since">
        <p className="pt-0.5 text-sm">{formatDate(profile.created_at)}</p>
      </SettingsRow>
      <SettingsRow label="Last sign-in">
        <p className="pt-0.5 text-sm">{formatDate(profile.last_sign_in_at, true)}</p>
      </SettingsRow>
      <SettingsRow label="Profile URL" hint="Private: only you can open it.">
        <p className="truncate pt-0.5 font-mono text-[13px] text-white/70">/profile/{profile.username}</p>
      </SettingsRow>
    </div>
  );
}

function formatDate(iso: string | null, withTime = false) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-[340px] animate-pulse rounded-card bg-white/[0.03] md:h-[400px]" />
      <div className="h-6 w-44 animate-pulse rounded-action bg-white/[0.04]" />
      <div className="h-[460px] animate-pulse rounded-card bg-white/[0.03]" />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-4" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="size-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
