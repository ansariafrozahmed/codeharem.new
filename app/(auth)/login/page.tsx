import { Suspense } from "react";
import { DeskBackdrop } from "./desk-backdrop";
import { LoginCard } from "./login-card";

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="relative isolate flex min-h-dvh flex-1 items-center justify-center bg-ink px-5 py-16 text-white">
      <DeskBackdrop />
      <LoginCard
        error={
          <Suspense>
            <OAuthError searchParams={searchParams} />
          </Suspense>
        }
      />
    </main>
  );
}

async function OAuthError({
  searchParams,
}: {
  searchParams: PageProps<"/login">["searchParams"];
}) {
  const { error } = await searchParams;
  if (!error) return null;
  return (
    <p role="alert" className="text-center text-sm text-red-300">
      Sign-in didn&apos;t go through. Please try again.
    </p>
  );
}
