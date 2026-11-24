import "server-only";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { ProjectStatus } from "@/lib/project-status";

export type Project = {
  id: string;
  name: string;
  slug: string;
  client_name: string | null;
  description: string | null;
  status: ProjectStatus;
  due_date: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS = "id, name, slug, client_name, description, status, due_date, website_url, created_at, updated_at";

function missingTable(code?: string) {
  if (code === "42P01" || code === "PGRST205") {
    throw new Error("The projects table is missing. Run supabase/migrations/0003_projects.sql in Supabase.");
  }
}

/** Your projects, most recently updated first. */
export async function listProjects(): Promise<Project[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("projects").select(COLUMNS).order("updated_at", { ascending: false });
  missingTable(error?.code);
  return (data ?? []) as Project[];
}

/** One of your projects by slug, or a 404. Row-level security limits this to your own. */
export async function getProjectBySlug(slug: string): Promise<Project> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("projects")
    .select(COLUMNS)
    .eq("slug", decodeURIComponent(slug).toLowerCase())
    .maybeSingle();
  missingTable(error?.code);
  if (!data) notFound();
  return data as Project;
}
