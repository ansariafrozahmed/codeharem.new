// Same rule as the projects_slug_format constraint in 0003_projects.sql

export const SLUG_MAX = 60;
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;

/** "Halden Physio — Website!" → "halden-physio-website" */
export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, SLUG_MAX)
    .replace(/-+$/g, "");
}

export function validateSlug(slug: string): string | null {
  if (!slug) return "Add a URL name.";
  if (!SLUG_RE.test(slug)) return "Use lowercase letters, numbers and dashes. Start and end with a letter or number.";
  return null;
}
