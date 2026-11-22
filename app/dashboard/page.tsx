import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { logout } from "../(auth)/actions";

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <form action={logout}>
          <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm">
            Log out
          </button>
        </form>
      </header>

      <Suspense fallback={<p className="mt-6 text-sm text-neutral-500">Loading…</p>}>
        <Welcome />
      </Suspense>
    </main>
  );
}

async function Welcome() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <p className="mt-6 text-neutral-600">
      Signed in as <span className="font-medium text-neutral-900">{user.email}</span>.
      Projects come in the next module.
    </p>
  );
}
