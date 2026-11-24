// The site's own public URL, from NEXT_PUBLIC_BASE_URL (e.g. http://localhost:3000 locally,
// https://yourdomain.com in production). Use this everywhere a frontend URL is needed.

const raw = process.env.NEXT_PUBLIC_BASE_URL;

if (!raw) {
  throw new Error("NEXT_PUBLIC_BASE_URL is not set. Add it to .env.local (and to your host's environment variables).");
}

/** e.g. "https://yourdomain.com" (no trailing slash) */
export const BASE_URL = raw.replace(/\/+$/, "");

/** Absolute URL for a path on this site: absoluteUrl("/login") → "https://yourdomain.com/login" */
export function absoluteUrl(path = "/") {
  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
