import { Suspense } from "react";
import { redirect } from "next/navigation";
import { assertHasUsername, getCurrentProfile, profilePath } from "@/lib/profile";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profile", robots: { index: false, follow: false } };

// /profile → your own /profile/<username>
export default function ProfileIndex() {
  return (
    <Suspense>
      <GoToOwnProfile />
    </Suspense>
  );
}

async function GoToOwnProfile(): Promise<null> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  assertHasUsername(profile);
  redirect(profilePath(profile.username));
}
