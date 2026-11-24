import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

export async function createServerSupabase() {
  // Everything that talks to Supabase is per request. connection() tells Next
  // to stop prerendering here, so Supabase's token-expiry checks (Date.now())
  // never run during prerender / prefetch renders.
  await connection();
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component: safe to ignore,
            // the proxy refreshes the session cookie.
          }
        },
      },
    },
  );
}
