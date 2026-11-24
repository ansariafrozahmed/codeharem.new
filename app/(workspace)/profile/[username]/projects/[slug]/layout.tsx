import { Suspense } from "react";
import { WorkspaceTopbar, WorkspaceTopbarSkeleton } from "@/components/project/workspace-topbar";
import { CanvasSyncProvider } from "@/components/canvas/sync-context";
import type { Metadata } from "next";

// Private project workspace: keep it out of search results
export const metadata: Metadata = { title: "Project", robots: { index: false, follow: false } };

// Project workspace: top bar + a full-screen canvas. No site header, no sidebar.
export default function ProjectWorkspaceLayout({
  children,
  params,
}: LayoutProps<"/profile/[username]/projects/[slug]">) {
  return (
    // Provider: the header Save button and the canvas share the sync state
    <CanvasSyncProvider>
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="relative z-10 h-14 shrink-0 border-b border-white/[0.06] bg-background">
        <Suspense fallback={<WorkspaceTopbarSkeleton />}>
          <WorkspaceTopbar params={params} />
        </Suspense>
      </header>
      <main className="relative min-h-0 flex-1">{children}</main>
    </div>
    </CanvasSyncProvider>
  );
}
