"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getCurrentProfile, profilePath } from "@/lib/profile";
import { projectPath } from "@/lib/project-path";
import { isProjectStatus } from "@/lib/project-status";
import { slugify, validateSlug } from "@/lib/slug";
import { deleteObject, keyFromPublicUrl, r2Configured } from "@/lib/r2";
import { imageUrlsFromRows } from "@/lib/canvas-types";

type FieldErrors = Partial<Record<"name" | "slug" | "client" | "description" | "status" | "dueDate" | "website" | "form", string>>;
export type ProjectFormState = { errors?: FieldErrors; saved?: boolean };

type Fields = {
  name: string;
  client_name: string | null;
  description: string | null;
  status: string;
  due_date: string | null;
  website_url: string | null;
};

function readFields(formData: FormData): { fields: Fields; errors: FieldErrors } {
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const name = text("name").replace(/\s+/g, " ");
  const client = text("client");
  const description = text("description");
  const status = text("status") || "planning";
  const dueDate = text("dueDate");
  let website = text("website");

  const errors: FieldErrors = {};
  if (name.length < 1 || name.length > 80) errors.name = "Use 1–80 characters.";
  if (client.length > 80) errors.client = "Keep it under 80 characters.";
  if (description.length > 2000) errors.description = "Keep it under 2000 characters.";
  if (!isProjectStatus(status)) errors.status = "Pick a status.";
  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) errors.dueDate = "Pick a valid date.";
  if (website) {
    if (!/^https?:\/\//i.test(website)) website = `https://${website}`;
    try {
      new URL(website);
    } catch {
      errors.website = "Enter a valid URL.";
    }
  }

  return {
    fields: {
      name,
      client_name: client || null,
      description: description || null,
      status,
      due_date: dueDate || null,
      website_url: website || null,
    },
    errors,
  };
}

async function signedIn() {
  const profile = await getCurrentProfile();
  const supabase = await createServerSupabase();
  return { profile, supabase };
}

/** A free slug for this user: "halden-physio", then "halden-physio-2", … */
async function freeSlug(supabase: Awaited<ReturnType<typeof createServerSupabase>>, base: string) {
  const root = base || "project";
  const { data } = await supabase.from("projects").select("slug").like("slug", `${root}%`);
  const taken = new Set((data ?? []).map((r) => r.slug as string));
  if (!taken.has(root)) return root;
  for (let n = 2; ; n++) {
    const candidate = `${root.slice(0, 56)}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

export type CreateProjectState = { error?: string };

/** Only a name is asked; the URL (slug) is made from it, with -2, -3… if you already use it. */
export async function createProject(_: CreateProjectState, formData: FormData): Promise<CreateProjectState> {
  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 80) return { error: "Use 1–80 characters." };

  const { profile, supabase } = await signedIn();
  if (!profile) return { error: "You're signed out. Log in again." };

  const base = slugify(name) || "project";
  for (let attempt = 0; attempt < 3; attempt++) {
    const slug = await freeSlug(supabase, base);
    const { error } = await supabase.from("projects").insert({ name, slug, status: "planning", owner_id: profile.id });
    if (!error) redirect(projectPath(profile.username, slug));
    if (error.code !== "23505") return { error: "Couldn't create the project. Please try again." };
    // that slug was just taken (another tab): try the next number
  }
  return { error: "Couldn't create the project. Please try again." };
}

export async function updateProject(projectId: string, _: ProjectFormState, formData: FormData): Promise<ProjectFormState> {
  const { fields, errors } = readFields(formData);
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const slugError = validateSlug(slug);
  if (slugError) errors.slug = slugError;
  if (Object.keys(errors).length) return { errors };

  const { profile, supabase } = await signedIn();
  if (!profile) return { errors: { form: "You're signed out. Log in again." } };

  const { data: before } = await supabase.from("projects").select("slug").eq("id", projectId).single();
  const { error } = await supabase.from("projects").update({ ...fields, slug }).eq("id", projectId);

  if (error) {
    if (error.code === "23505") return { errors: { slug: "You already have a project with this URL name." } };
    return { errors: { form: "Couldn't save. Please try again." } };
  }

  // The URL contains the slug, so move to the new address
  if (before && before.slug !== slug) redirect(`${projectPath(profile.username, slug)}?saved=1`);
  refresh();
  return { saved: true };
}

export async function deleteProject(projectId: string): Promise<{ error: string } | void> {
  const { profile, supabase } = await signedIn();
  if (!profile) return { error: "You're signed out. Log in again." };

  // Image files on R2 aren't removed by the database cascade, so collect them first
  const { data: rows } = await supabase
    .from("project_nodes")
    .select("type, data")
    .eq("project_id", projectId)
    .in("type", ["image", "reference"]);
  const imageUrls = imageUrlsFromRows(rows ?? []);

  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) return { error: "Couldn't delete the project. Please try again." };

  // Best effort: the project is already gone, leftover files are harmless
  if (imageUrls.length && r2Configured()) {
    await Promise.allSettled(
      imageUrls
        .map((u) => keyFromPublicUrl(u))
        .filter((k): k is string => !!k?.startsWith(`projects/${projectId}/`))
        .map((k) => deleteObject(k)),
    );
  }

  redirect(profilePath(profile.username, "projects"));
}
