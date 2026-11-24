import { Suspense } from "react";
import { DeskBackdrop } from "@/components/auth/desk-backdrop";
import { LoginCard } from "@/components/auth/login-card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to CodeHarem with Google or GitHub to manage your client projects.",
  alternates: { canonical: "/login" },
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="relative isolate flex min-h-dvh flex-1 items-center justify-center bg-background px-5 py-16 text-foreground md:px-10 lg:px-16">
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
