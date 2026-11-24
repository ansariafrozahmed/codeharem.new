"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { profilePath } from "@/lib/profile";
import { normalizeUsername, validateUsername } from "@/lib/username";
import { deleteObject, keyFromPublicUrl, presignUpload, publicUrlFor, r2Configured } from "@/lib/r2";

export type ImageKind = "avatar" | "banner";
type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MAX_BYTES: Record<ImageKind, number> = { avatar: 2 * 1024 * 1024, banner: 5 * 1024 * 1024 };
const COLUMN: Record<ImageKind, "avatar_url" | "banner_url"> = { avatar: "avatar_url", banner: "banner_url" };

async function currentUserId() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

/** Step 1: get a one-minute upload URL for the browser to PUT the file to R2. */
export async function createImageUpload(
  kind: ImageKind,
  contentType: string,
  size: number,
): Promise<Result<{ uploadUrl: string; publicUrl: string }>> {
  if (!r2Configured()) return { ok: false, error: "Image uploads aren't set up yet (R2 keys missing)." };
  const { userId } = await currentUserId();
  if (!userId) return { ok: false, error: "You're signed out. Log in again." };

  const ext = TYPES[contentType];
  if (!ext) return { ok: false, error: "Use a JPG, PNG or WebP image." };
  if (size > MAX_BYTES[kind]) return { ok: false, error: `Max size is ${MAX_BYTES[kind] / 1024 / 1024} MB.` };

  const key = `users/${userId}/${kind}-${Date.now()}.${ext}`;
  const uploadUrl = await presignUpload(key, contentType, size);
  return { ok: true, data: { uploadUrl, publicUrl: publicUrlFor(key) } };
}

/** Step 2: after the upload succeeds, store the URL on the profile and delete the old file. */
export async function saveProfileImage(kind: ImageKind, publicUrl: string): Promise<Result> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return { ok: false, error: "You're signed out. Log in again." };

  // Only accept files inside this user's own folder
  const key = keyFromPublicUrl(publicUrl);
  if (!key?.startsWith(`users/${userId}/${kind}-`)) return { ok: false, error: "Invalid image." };

  const column = COLUMN[kind];
  const { data: before } = await supabase.from("profiles").select(column).eq("id", userId).single();
  const { error } = await supabase.from("profiles").update({ [column]: publicUrl }).eq("id", userId);
  if (error) return { ok: false, error: "Couldn't save the image. Please try again." };

  await removeOldFile(before?.[column as keyof typeof before] as string | null | undefined, userId);
  refresh();
  return { ok: true, data: undefined };
}

export async function removeBanner(): Promise<Result> {
  const { supabase, userId } = await currentUserId();
  if (!userId) return { ok: false, error: "You're signed out. Log in again." };

  const { data: before } = await supabase.from("profiles").select("banner_url").eq("id", userId).single();
  const { error } = await supabase.from("profiles").update({ banner_url: null }).eq("id", userId);
  if (error) return { ok: false, error: "Couldn't remove the cover. Please try again." };

  await removeOldFile(before?.banner_url, userId);
  refresh();
  return { ok: true, data: undefined };
}

export async function updateFullName(name: string): Promise<Result> {
  const fullName = name.trim().replace(/\s+/g, " ");
  if (fullName.length < 1 || fullName.length > 60) return { ok: false, error: "Use 1–60 characters." };

  const { supabase, userId } = await currentUserId();
  if (!userId) return { ok: false, error: "You're signed out. Log in again." };

  const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", userId);
  if (error) return { ok: false, error: "Couldn't save your name. Please try again." };

  refresh();
  return { ok: true, data: undefined };
}

// Best effort: delete a previous upload from R2 if it's ours (never Google/GitHub photos)
async function removeOldFile(url: string | null | undefined, userId: string) {
  const key = url ? keyFromPublicUrl(url) : null;
  if (!key?.startsWith(`users/${userId}/`)) return;
  try {
    await deleteObject(key);
  } catch {
    // leaving an orphaned file is fine; the profile is already updated
  }
}

export type ProfileFormState = {
  errors?: { fullName?: string; username?: string; form?: string };
  saved?: boolean;
};

/** Saves name + username together. A new username changes the URL, so we redirect. */
export async function updateProfile(_: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const fullName = String(formData.get("fullName") ?? "").trim().replace(/\s+/g, " ");
  const username = normalizeUsername(String(formData.get("username") ?? ""));

  const errors: ProfileFormState["errors"] = {};
  if (fullName.length < 1 || fullName.length > 60) errors.fullName = "Use 1–60 characters.";
  const usernameError = validateUsername(username);
  if (usernameError) errors.username = usernameError;
  if (errors.fullName || errors.username) return { errors };

  const { supabase, userId } = await currentUserId();
  if (!userId) return { errors: { form: "You're signed out. Log in again." } };

  const { data: before } = await supabase.from("profiles").select("username").eq("id", userId).single();
  const { error } = await supabase.from("profiles").update({ full_name: fullName, username }).eq("id", userId);

  if (error) {
    if (error.code === "23505") return { errors: { username: `@${username} is already taken.` } };
    if (error.code === "23514") return { errors: { username: "That username isn't allowed." } };
    return { errors: { form: "Couldn't save. Please try again." } };
  }

  if (before?.username !== username) redirect(`${profilePath(username)}?saved=1`);
  refresh();
  return { saved: true };
}
