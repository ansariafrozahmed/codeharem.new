import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import { rowToEdge, rowToNode, type CanvasEdge, type CanvasNode, type CanvasViewport, type EdgeRow, type NodeRow } from "@/lib/canvas-types";

/** All cards on a project's canvas, plus where you left the view. */
export async function getCanvas(projectId: string): Promise<{
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  viewport: CanvasViewport | null;
  /** Bumped on every save; used to detect saves from another tab/device */
  version: number;
}> {
  const supabase = await createServerSupabase();
  const [nodesRes, edgesRes, projectRes] = await Promise.all([
    supabase.from("project_nodes").select("id, type, x, y, width, height, data").eq("project_id", projectId).order("created_at"),
    supabase.from("project_edges").select("id, source, target, source_handle, target_handle").eq("project_id", projectId),
    supabase.from("projects").select("canvas_viewport, canvas_version").eq("id", projectId).single(),
  ]);

  if (nodesRes.error?.code === "42P01" || nodesRes.error?.code === "PGRST205") {
    throw new Error("The canvas tables are missing. Run supabase/migrations/0004_project_canvas.sql in Supabase.");
  }

  if (projectRes.error?.code === "42703") {
    throw new Error("Canvas sync needs an update. Run supabase/migrations/0010_canvas_version.sql in Supabase.");
  }

  if (edgesRes.error?.code === "42P01" || edgesRes.error?.code === "PGRST205") {
    throw new Error("Canvas links are missing. Run supabase/migrations/0005_canvas_lists_and_links.sql in Supabase.");
  }

  return {
    edges: ((edgesRes.data ?? []) as EdgeRow[]).map(rowToEdge),
    nodes: ((nodesRes.data ?? []) as NodeRow[]).map(rowToNode),
    viewport: (projectRes.data?.canvas_viewport as CanvasViewport | null) ?? null,
    version: (projectRes.data?.canvas_version as number | undefined) ?? 0,
  };
}
