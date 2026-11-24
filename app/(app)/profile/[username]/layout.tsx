import { Suspense } from "react";
import { Sidebar, SidebarSkeleton } from "@/components/profile/sidebar";
import type { Metadata } from "next";

// Private area: keep it out of search results
export const metadata: Metadata = {
  title: { default: "Profile", template: "%s · CodeHarem" },
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: LayoutProps<"/profile/[username]">) {
  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      {/* Sidebar: a row on mobile, a fixed-height column below the header on desktop */}
      <aside className="border-b border-white/[0.06] px-5 py-3 md:px-10 lg:sticky lg:top-(--header-h) lg:h-[calc(100dvh-var(--header-h))] lg:w-72 lg:shrink-0 lg:border-r lg:border-b-0 lg:py-8 lg:pr-6 lg:pl-16">
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>
      </aside>

      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 lg:px-16 lg:py-10">{children}</main>
    </div>
  );
}
