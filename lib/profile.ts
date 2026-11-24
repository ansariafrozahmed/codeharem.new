import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  email: string;
  /** "google" | "github" */
  provider: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
};

/** The signed-in user's profile, or null when signed out. */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, banner_url, created_at")
    .eq("id", user.id)
    .single();
  if (error?.code === "42703") {
    throw new Error("profiles.banner_url is missing. Run supabase/migrations/0002_profile_banner.sql in Supabase.");
  }

  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? "",
    // Fallbacks keep the UI working if the profile row is missing
    username: data?.username ?? "",
    full_name: data?.full_name ?? meta.full_name ?? meta.name ?? null,
    avatar_url: data?.avatar_url ?? meta.avatar_url ?? meta.picture ?? null,
    banner_url: data?.banner_url ?? null,
    provider: user.app_metadata?.provider ?? null,
    created_at: data?.created_at ?? user.created_at ?? null,
    last_sign_in_at: user.last_sign_in_at ?? null,
  };
}

/** Profile pages are private: returns the profile only if the URL username is yours. */
export async function requireOwnProfile(username: string, section = ""): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  assertHasUsername(profile);
  if (decodeURIComponent(username).toLowerCase() !== profile.username) {
    redirect(profilePath(profile.username, section));
  }
  return profile;
}

/** /profile/<username>[/section] */
export function profilePath(username: string, section = "") {
  return `/profile/${username}${section ? `/${section}` : ""}`;
}

/** No username means the profiles table/trigger isn't set up yet. */
export function assertHasUsername(profile: Profile) {
  if (!profile.username) {
    throw new Error("No profile row for this user. Run supabase/migrations/0001_profiles.sql in Supabase.");
  }
}
