import { Suspense } from "react";
import { LoaderCircle } from "lucide-react";
import { requireOwnProfile } from "@/lib/profile";
import { getProjectBySlug } from "@/lib/projects";
import { getCanvas } from "@/lib/canvas";
import { ProjectCanvas } from "@/components/canvas/project-canvas";

// The project canvas (/profile/<username>/projects/<slug>)
export default function ProjectPage({ params }: PageProps<"/profile/[username]/projects/[slug]">) {
  return (
    <Suspense fallback={<CanvasLoading />}>
      <Canvas params={params} />
    </Suspense>
  );
}

async function Canvas({ params }: { params: PageProps<"/profile/[username]/projects/[slug]">["params"] }) {
  const { username, slug } = await params;
  await requireOwnProfile(username, `projects/${slug}`);
  const project = await getProjectBySlug(slug);
  const { nodes, edges, viewport, version } = await getCanvas(project.id);

  // key: a different project (or renamed URL) gets a fresh canvas state
  return <ProjectCanvas key={project.id} projectId={project.id} initialNodes={nodes} initialEdges={edges} initialViewport={viewport} initialVersion={version} />;
}

function CanvasLoading() {
  return (
    <div className="grid h-full place-items-center bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:24px_24px]">
      <LoaderCircle aria-label="Loading canvas" className="size-6 animate-spin text-white/40" />
    </div>
  );
}
