"use client";

import { useState } from "react";
import { createImageUpload, removeBanner, saveProfileImage, type ImageKind } from "@/actions/profile";

/** Upload flow: signed URL → PUT to R2 → save on profile. Shows a local preview meanwhile. */
export function useImageUpload(kind: ImageKind) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<"upload" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy("upload");
    const local = URL.createObjectURL(file);
    setPreview(local);
    try {
      const signed = await createImageUpload(kind, file.type, file.size);
      if (!signed.ok) throw new Error(signed.error);
      const put = await fetch(signed.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!put.ok) throw new Error("Upload failed. Please try again.");
      const saved = await saveProfileImage(kind, signed.data.publicUrl);
      if (!saved.ok) throw new Error(saved.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setPreview(null);
      URL.revokeObjectURL(local);
      setBusy(null);
    }
  }

  async function remove() {
    setError(null);
    setBusy("remove");
    const res = await removeBanner();
    if (!res.ok) setError(res.error);
    setBusy(null);
  }

  return { preview, busy, error, upload, remove };
}
