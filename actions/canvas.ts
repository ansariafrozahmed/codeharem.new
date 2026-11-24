"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { deleteObject, keyFromPublicUrl, presignUpload, publicUrlFor, r2Configured } from "@/lib/r2";
import { imageUrlsFromRows } from "@/lib/canvas-types";

type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** True only if the signed-in user owns the project (row-level security hides others). */
async function ownsProject(projectId: string) {
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("projects").select("id").eq("id", projectId).maybeSingle();
  return { supabase, owns: !!data };
}

/** Signed upload URL for an image card. Files live under projects/<projectId>/. */
export async function createCanvasImageUpload(
  projectId: string,
  contentType: string,
  size: number,
): Promise<Result<{ uploadUrl: string; publicUrl: string }>> {
  if (!r2Configured()) return { ok: false, error: "Image uploads aren't set up yet (R2 keys missing)." };
  const { owns } = await ownsProject(projectId);
  if (!owns) return { ok: false, error: "You can't add images to this project." };

  const ext = IMAGE_TYPES[contentType];
  if (!ext) return { ok: false, error: "Use a JPG, PNG, WebP or GIF image." };
  if (size > MAX_IMAGE_BYTES) return { ok: false, error: "Images can be up to 10 MB." };

  const key = `projects/${projectId}/${crypto.randomUUID()}.${ext}`;
  const uploadUrl = await presignUpload(key, contentType, size);
  return { ok: true, data: { uploadUrl, publicUrl: publicUrlFor(key) } };
}

/** Best effort: remove image files that belonged to deleted cards. */
export async function deleteCanvasImages(projectId: string, urls: string[]): Promise<void> {
  if (!urls.length || !r2Configured()) return;
  const { owns } = await ownsProject(projectId);
  if (!owns) return;
  await Promise.allSettled(
    urls
      .map((u) => keyFromPublicUrl(u))
      .filter((k): k is string => !!k?.startsWith(`projects/${projectId}/`))
      .map((k) => deleteObject(k)),
  );
}

/** Remove every card and link on the canvas (links go with their cards), plus image files. */
/** Returns the new canvas version (clearing counts as a change). */
export async function clearCanvas(projectId: string): Promise<Result<{ version: number }>> {
  const { supabase, owns } = await ownsProject(projectId);
  if (!owns) return { ok: false, error: "You can't change this project." };

  const { data: rows } = await supabase
    .from("project_nodes")
    .select("type, data")
    .eq("project_id", projectId)
    .in("type", ["image", "reference"]);

  const { error } = await supabase.from("project_nodes").delete().eq("project_id", projectId);
  if (error) return { ok: false, error: "Couldn't clear the canvas. Please try again." };

  const { data: project } = await supabase.from("projects").select("canvas_version").eq("id", projectId).single();
  const version = ((project?.canvas_version as number | undefined) ?? 0) + 1;
  await supabase.from("projects").update({ canvas_version: version }).eq("id", projectId);

  await deleteCanvasImages(projectId, imageUrlsFromRows(rows ?? []));
  return { ok: true, data: { version } };
}
