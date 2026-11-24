"use client";

import { createContext, use } from "react";
import type { CanvasNode } from "@/lib/canvas-types";

type CanvasActions = {
  /** Update a card's data in the UI; it's saved with the next batch */
  patchData: (id: string, patch: Partial<CanvasNode["data"]>) => void;
  /** A card was resized */
  saveResize: (id: string) => void;
  removeNode: (id: string) => void;
  /** Upload image files into a reference card */
  uploadReferenceImages: (nodeId: string, files: File[]) => void;
  /** Remove these uploaded images from storage once the change is saved */
  deleteFilesAfterSave: (urls: string[]) => void;
  /** Show a short message at the top of the canvas */
  notify: (message: string) => void;
};

export const CanvasActionsContext = createContext<CanvasActions | null>(null);

export function useCanvasActions() {
  const ctx = use(CanvasActionsContext);
  if (!ctx) throw new Error("useCanvasActions must be used inside the project canvas");
  return ctx;
}
