"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export type OAuthProvider = "google" | "github";
const PROVIDERS: OAuthProvider[] = ["google", "github"];

export async function signInWithProvider(provider: OAuthProvider) {
  if (!PROVIDERS.includes(provider)) redirect("/login?error=oauth");

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createServerSupabase();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

export async function logout() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}
