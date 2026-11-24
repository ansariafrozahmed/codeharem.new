// Same rules as the database constraints in supabase/migrations/0001_profiles.sql

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

const USERNAME_RE = /^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/;

const RESERVED = new Set([
  "admin", "administrator", "api", "app", "auth", "callback", "codeharem",
  "dashboard", "edit", "help", "login", "logout", "me", "new", "null",
  "products", "projects", "resources", "root", "settings", "signin",
  "signup", "support", "system", "undefined", "user", "users",
]);

export function normalizeUsername(input: string) {
  return input.trim().toLowerCase().replace(/^@/, "");
}

/** Returns an error message, or null when the username is valid. */
export function validateUsername(username: string): string | null {
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) {
    return `Use ${USERNAME_MIN}–${USERNAME_MAX} characters.`;
  }
  if (!USERNAME_RE.test(username)) {
    return "Use lowercase letters, numbers, - or _. Start and end with a letter or number.";
  }
  if (RESERVED.has(username)) {
    return "That username is reserved. Try another.";
  }
  return null;
}
