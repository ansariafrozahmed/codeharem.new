"use client";

import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
  type Connection,
  type EdgeTypes,
  type NodeTypes,
  type XYPosition,
} from "@xyflow/react";
import { CircleAlert, MousePointerClick } from "lucide-react";
import { clearCanvas, createCanvasImageUpload } from "@/actions/canvas";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useCanvasSync } from "@/hooks/use-canvas-sync";
import {
  DEFAULT_SIZE,
  LINKABLE_TYPES,
  defaultData,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeType,
  type CanvasViewport,
  type ReferenceData,
  type ReferenceItem,
} from "@/lib/canvas-types";
import { BrandNode } from "./brand-node";
import { CanvasActionsContext } from "./canvas-context";
import { CanvasToolbar } from "./canvas-toolbar";
import { LinkEdge } from "./link-edge";
import { ListNode } from "./list-node";
import { NoteNode } from "./note-node";
import { ReferenceNode, normalizeUrl } from "./reference-node";
import { RequirementNode } from "./requirement-node";
import { useReportSync } from "./sync-context";

const nodeTypes: NodeTypes = { note: NoteNode, requirement: RequirementNode, list: ListNode, reference: ReferenceNode, brand: BrandNode };
const edgeTypes: EdgeTypes = { link: LinkEdge };
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
/** Below this zoom cards are hard to read */
const READABLE_ZOOM = 0.5;

type Props = {
  projectId: string;
  initialNodes: CanvasNode[];
  initialEdges: CanvasEdge[];
  initialViewport: CanvasViewport | null;
  initialVersion: number;
};

export function ProjectCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}

function Canvas({ projectId, initialNodes, initialEdges, initialViewport, initialVersion }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CanvasEdge>(initialEdges);
  const rf = useReactFlow<CanvasNode, CanvasEdge>();
  const {
    status: syncStatus,
    errorMessage: syncError,
    staleDraft,
    restoredNotice,
    api: save,
    resolve,
  } = useCanvasSync({
    projectId,
    rf,
    initialVersion,
    onRestore: (restoredNodes, restoredEdges) => {
      setNodes(restoredNodes);
      setEdges(restoredEdges);
    },
  });
  const wrapper = useRef<HTMLDivElement>(null);

  // Opening the board: restore your last view only if it was readable (50%+).
  // Otherwise fit the cards, never smaller than 60%. Empty boards open at 100%.
  const savedView = initialViewport && initialViewport.zoom >= READABLE_ZOOM ? initialViewport : null;
  const nodesReady = useNodesInitialized();
  const fitted = useRef(false);
  useEffect(() => {
    if (fitted.current || savedView || !nodesReady || initialNodes.length === 0) return;
    fitted.current = true;
    rf.fitView({ padding: 0.2, minZoom: 0.6, maxZoom: 1 });
  }, [nodesReady, savedView, initialNodes.length, rf]);

  // The Save button lives in the header; tell it how syncing is going
  useReportSync(syncStatus, save.syncNow);

  // ---------- Notices ----------
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  const viewportCenter = useCallback(() => {
    const box = wrapper.current!.getBoundingClientRect();
    return rf.screenToFlowPosition({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
  }, [rf]);

  // ---------- Adding cards ----------
  const addNode = useCallback(
    (type: CanvasNodeType, at?: XYPosition, data?: CanvasNode["data"]) => {
      const size = DEFAULT_SIZE[type];
      const center = at ?? viewportCenter();
      const node = {
        id: crypto.randomUUID(),
        type,
        position: { x: center.x - size.width / 2, y: center.y - (size.height || 60) / 2 },
        width: size.width,
        ...(size.height ? { height: size.height } : {}),
        data: data ?? defaultData(type),
        selected: true,
      } as CanvasNode;
      setNodes((ns) => [...ns.map((n) => ({ ...n, selected: false })), node]);
      save.nodes([node.id]);
      // Zoomed far out? Glide to the new card at 100% so it's readable
      if (rf.getZoom() < 0.75) {
        rf.setCenter(center.x, center.y, { zoom: 1, duration: 350 });
      }
      return node.id;
    },
    [rf, save, setNodes, viewportCenter],
  );

  // ---------- Reference images ----------
  const uploadReferenceImages = useCallback(
    (nodeId: string, files: File[]) => {
      const images = files.filter((f) => IMAGE_TYPES.includes(f.type));
      if (files.length && !images.length) setNotice("Use a JPG, PNG, WebP or GIF image.");

      for (const file of images) {
        const item: ReferenceItem = {
          id: crypto.randomUUID(),
          kind: "image",
          url: URL.createObjectURL(file),
          title: file.name.replace(/\.[^.]+$/, ""),
          uploading: true,
        };
        const setItems = (fn: (items: ReferenceItem[]) => ReferenceItem[]) =>
          rf.updateNodeData(nodeId, (n) => ({ items: fn((n.data as ReferenceData).items) }));
        setItems((items) => [...items, item]);

        (async () => {
          try {
            const signed = await createCanvasImageUpload(projectId, file.type, file.size);
            if (!signed.ok) throw new Error(signed.error);
            const put = await fetch(signed.data.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
            if (!put.ok) throw new Error("Image upload failed. Please try again.");
            if (!rf.getNode(nodeId)) return save.deleteFilesAfterSave([signed.data.publicUrl]); // card removed meanwhile
            setItems((items) => items.map((i) => (i.id === item.id ? { ...i, url: signed.data.publicUrl, uploading: false } : i)));
            save.nodes([nodeId]);
          } catch (e) {
            setItems((items) => items.filter((i) => i.id !== item.id));
            setNotice(e instanceof Error ? e.message : "Image upload failed.");
          } finally {
            setTimeout(() => URL.revokeObjectURL(item.url), 3000);
          }
        })();
      }
    },
    [projectId, rf, save],
  );

  /** Images dropped or pasted on the canvas → a new reference card */
  const addImagesAsReference = useCallback(
    (files: File[], at?: XYPosition) => {
      if (!files.some((f) => IMAGE_TYPES.includes(f.type))) return setNotice("Use a JPG, PNG, WebP or GIF image.");
      const id = addNode("reference", at);
      // wait a tick so the new node exists before items are added
      setTimeout(() => uploadReferenceImages(id, files), 0);
    },
    [addNode, uploadReferenceImages],
  );

  // Paste an image or a link anywhere (not while typing in a card)
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const el = document.activeElement;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return;
      const files = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
      if (files.length) {
        e.preventDefault();
        return addImagesAsReference(files);
      }
      const url = normalizeUrl(e.clipboardData?.getData("text") ?? "");
      if (url) {
        e.preventDefault();
        addNode("reference", undefined, { title: "", items: [{ id: crypto.randomUUID(), kind: "link", url }] });
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [addImagesAsReference, addNode]);

  // ---------- Links between blocks ----------
  const isValidConnection = useCallback(
    (c: Connection | CanvasEdge) => {
      if (!c.source || !c.target || c.source === c.target) return false;
      const a = rf.getNode(c.source);
      const b = rf.getNode(c.target);
      if (!a || !b || !LINKABLE_TYPES.includes(a.type) || !LINKABLE_TYPES.includes(b.type)) return false;
      return !rf
        .getEdges()
        .some((e) => (e.source === c.source && e.target === c.target) || (e.source === c.target && e.target === c.source));
    },
    [rf],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (!isValidConnection(c)) return;
      const edge: CanvasEdge = {
        id: crypto.randomUUID(),
        source: c.source,
        target: c.target,
        sourceHandle: c.sourceHandle,
        targetHandle: c.targetHandle,
        type: "link",
      };
      setEdges((es) => [...es, edge]);
      save.edgeAdded(edge.id);
    },
    [isValidConnection, save, setEdges],
  );

  // ---------- Clear canvas ----------
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  async function onClear() {
    setClearing(true);
    const res = await clearCanvas(projectId);
    setClearing(false);
    if (!res.ok) return setNotice(res.error);
    save.reset(res.data.version);
    setNodes([]);
    setEdges([]);
    setConfirmClear(false);
  }

  // ---------- Actions for cards ----------
  const actions = useMemo(
    () => ({
      patchData: (id: string, patch: Partial<CanvasNode["data"]>) => {
        rf.updateNodeData(id, patch);
        save.nodes([id]);
      },
      saveResize: (id: string) => save.nodes([id]),
      removeNode: (id: string) => {
        rf.deleteElements({ nodes: [{ id }] });
      },
      uploadReferenceImages,
      deleteFilesAfterSave: save.deleteFilesAfterSave,
      notify: setNotice,
    }),
    [rf, save, uploadReferenceImages],
  );

  return (
    <CanvasActionsContext value={actions}>
      <div
        ref={wrapper}
        className="relative h-full w-full bg-[radial-gradient(ellipse_80%_70%_at_50%_45%,#181c1b_0%,var(--background)_75%)]"
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) e.preventDefault();
        }}
        onDrop={(e) => {
          const files = Array.from(e.dataTransfer.files);
          if (!files.length) return;
          e.preventDefault();
          addImagesAsReference(files, rf.screenToFlowPosition({ x: e.clientX, y: e.clientY }));
        }}
        onDoubleClick={(e) => {
          // Double-click (double-tap) on empty canvas adds a note right there
          if ((e.target as HTMLElement).classList.contains("react-flow__pane")) {
            addNode("note", rf.screenToFlowPosition({ x: e.clientX, y: e.clientY }));
          }
        }}
      >
        <ReactFlow<CanvasNode, CanvasEdge>
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          connectionMode={ConnectionMode.Loose}
          connectionLineStyle={{ stroke: "#429872", strokeWidth: 1.75, strokeDasharray: "6 4" }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          forceColorMode="dark"
          defaultViewport={savedView ?? { x: 0, y: 0, zoom: 1 }}
          minZoom={0.25}
          proOptions={{ hideAttribution: true }}
          maxZoom={2.5}
          zoomOnDoubleClick={false}
          deleteKeyCode={["Backspace", "Delete"]}
          selectionKeyCode="Shift"
          multiSelectionKeyCode={["Meta", "Control"]}
          // Only *mark* changes; the Save button sends them together
          onNodeDragStop={(_, __, dragged) => save.nodes(dragged.map((n) => n.id))}
          onNodesDelete={(deleted) => {
            save.nodesDeleted(deleted.map((n) => n.id));
            const files = deleted
              .filter((n) => n.type === "reference")
              .flatMap((n) => (n.data as ReferenceData).items)
              .filter((i) => i.kind === "image" && !i.uploading)
              .map((i) => i.url);
            if (files.length) save.deleteFilesAfterSave(files);
          }}
          onEdgesDelete={(deleted) => save.edgesDeleted(deleted.map((e) => e.id))}
          onMoveEnd={(event) => {
            // only your own pans/zooms (fitView etc. pass no event)
            if (event) save.viewport();
          }}
          className="project-canvas"
        >
          <Background id="minor" variant={BackgroundVariant.Dots} gap={24} size={1.3} color="rgba(255,255,255,0.13)" />
          <Background id="major" variant={BackgroundVariant.Cross} gap={120} size={7} lineWidth={1} color="rgba(66,152,114,0.35)" />

          {nodes.length > 0 && (
            <MiniMap
              pannable
              zoomable
              position="bottom-right"
              nodeBorderRadius={6}
              nodeColor={(n) =>
                n.type === "list" ? "#7fd1ab" : n.type === "requirement" ? "#429872" : n.type === "reference" ? "#8a7a4e" : n.type === "brand" ? "#9a6b73" : "#3a403e"
              }
              className="!m-4 hidden !rounded-card overflow-hidden ring-1 ring-white/10 lg:block"
            />
          )}

          <Panel position="top-right" className="!m-3 md:!m-4">
            <div className="flex flex-col items-end gap-2">
              {syncStatus === "error" && syncError && (
                <p role="alert" className="w-[min(22rem,calc(100vw-1.5rem))] rounded-action bg-red-500/15 px-3 py-2 text-[12px] leading-snug text-red-200 ring-1 ring-red-400/30 backdrop-blur-md">
                  Sync failed: {syncError}. Your work is saved on this device.
                </p>
              )}
              {restoredNotice && (
                <p
                  role="status"
                  className="flex w-[min(22rem,calc(100vw-1.5rem))] items-start gap-2 rounded-action bg-leaf/15 px-3 py-2 text-[12px] leading-snug text-[#bfe3cf] ring-1 ring-leaf/30 backdrop-blur-md"
                >
                  <span className="flex-1">Restored changes you made on this device that hadn&apos;t synced yet. Syncing them now.</span>
                  <button type="button" onClick={resolve.dismissRestored} aria-label="Dismiss" className="text-white/60 hover:text-white">
                    ×
                  </button>
                </p>
              )}
            </div>
          </Panel>

          <Panel position="bottom-center" className="!mb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <CanvasToolbar
              onAdd={(type) => addNode(type)}
              onClear={() => setConfirmClear(true)}
              canClear={nodes.length > 0}
            />
          </Panel>

          {notice && (
            <Panel position="top-center" className="!mt-3 md:!mt-4">
              <p role="alert" className="flex items-center gap-2 rounded-action bg-red-500/15 px-3 py-2 text-sm text-red-200 ring-1 ring-red-400/30 backdrop-blur-md">
                <CircleAlert aria-hidden strokeWidth={1.75} className="size-4 shrink-0" />
                {notice}
              </p>
            </Panel>
          )}

          {nodes.length === 0 && (
            <Panel position="top-center" className="pointer-events-none !mt-[18vh] w-[calc(100%-2.5rem)] md:w-auto">
              <div className="flex flex-col items-center text-center">
                <span className="grid size-12 place-items-center rounded-card bg-leaf/10 ring-1 ring-leaf/25">
                  <MousePointerClick aria-hidden strokeWidth={1.5} className="size-6 text-leaf" />
                </span>
                <p className="mt-4 font-medium">This board is empty</p>
                <p className="mt-1 text-sm text-balance text-white/50">
                  <span className="hidden md:inline">Double-click to add a note, drop or paste an image or link, or use </span>
                  <span className="md:hidden">Tap </span>
                  <span className="font-medium text-white/70">Add</span> below.
                </p>
              </div>
            </Panel>
          )}
        </ReactFlow>


        <Dialog
          open={syncStatus === "conflict" || !!staleDraft}
          onClose={() => {}}
          dismissible={false}
          title="This board was changed somewhere else"
          description={
            staleDraft
              ? "You have changes on this device that never synced, but the project has been saved from another tab or device since."
              : "Someone (maybe you, in another tab or device) saved this board after you opened it."
          }
        >
          <div className="space-y-3 px-5 py-4 md:px-6">
            <p className="text-sm text-white/60">Pick which version to keep:</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={resolve.useLatest}>
                Use the latest saved version
              </Button>
              <Button onClick={resolve.keepMine}>Keep my changes</Button>
            </div>
          </div>
        </Dialog>

        <Dialog
          open={confirmClear}
          onClose={() => setConfirmClear(false)}
          title="Clear the whole canvas?"
          description="Every card, link and image on this board will be deleted. This can't be undone."
        >
          <div className="flex justify-end gap-2 px-5 py-4 md:px-6">
            <Button variant="secondary" onClick={() => setConfirmClear(false)}>
              Cancel
            </Button>
            <Button onClick={onClear} disabled={clearing} className="bg-none! bg-red-500/80! hover:bg-red-500! hover:shadow-none!">
              {clearing ? "Clearing…" : "Clear canvas"}
            </Button>
          </div>
        </Dialog>
      </div>
    </CanvasActionsContext>
  );
}
