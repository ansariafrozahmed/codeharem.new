"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactFlowInstance } from "@xyflow/react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { deleteCanvasImages } from "@/actions/canvas";
import { idbDel, idbGet, idbSet } from "@/lib/idb";
import {
  rowToEdge,
  rowToNode,
  type CanvasEdge,
  type CanvasNode,
  type CanvasViewport,
  type EdgeRow,
  type NodeRow,
  type ReferenceData,
} from "@/lib/canvas-types";

/**
 * saved   – everything is on the server
 * local   – saved on this device, waiting to sync
 * syncing – sending to the server
 * offline – no connection; saved on this device, syncs when back online
 * error   – the server refused; retrying
 * conflict – the project was saved elsewhere since you opened it
 */
export type SyncStatus = "saved" | "local" | "syncing" | "offline" | "error" | "conflict";

const IDLE_MS = 4000; // sync this long after the last change…
const MAX_WAIT_MS = 30000; // …and at least this often while you keep editing
const DRAFT_MS = 300; // write the local draft this soon after a change

type Pending = { nodes: string[]; deletedNodes: string[]; newEdges: string[]; deletedEdges: string[]; files: string[] };
type Draft = {
  v: 1;
  baseVersion: number;
  savedAt: number;
  nodes: NodeRow[];
  edges: EdgeRow[];
  viewport: CanvasViewport | null;
  pending: Pending;
};

type Options = {
  projectId: string;
  rf: ReactFlowInstance<CanvasNode, CanvasEdge>;
  initialVersion: number;
  /** Put unsynced work from an earlier session back on the board */
  onRestore: (nodes: CanvasNode[], edges: CanvasEdge[]) => void;
};

/**
 * Local-first sync. Every change is written to this browser (IndexedDB) right
 * away, so nothing is lost. The server gets one batched request with only the
 * changed cards: after a pause, at least every 30s, on tab hide/close, when the
 * connection returns, or on Ctrl/⌘+S. A version number stops one tab or device
 * from silently overwriting newer changes made in another.
 */
export function useCanvasSync({ projectId, rf, initialVersion, onRestore }: Options) {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const key = `canvas:${projectId}`;

  const [status, setStatus] = useState<SyncStatus>("saved");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  /** An unsynced draft from an earlier session that clashes with a newer server version */
  const [staleDraft, setStaleDraft] = useState<Draft | null>(null);
  const [restoredNotice, setRestoredNotice] = useState(false);

  const baseVersion = useRef(initialVersion);
  const dirtyNodes = useRef(new Set<string>());
  const deletedNodes = useRef(new Set<string>());
  const newEdges = useRef(new Set<string>());
  const deletedEdges = useRef(new Set<string>());
  const filesToDelete = useRef(new Set<string>());
  const viewportDirty = useRef(false);

  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  const again = useRef(false);
  const failures = useRef(0);
  const blocked = useRef(false); // conflict: stop syncing until you choose
  const syncRef = useRef<(opts?: { force?: boolean }) => void>(() => {});

  const hasPending = () =>
    dirtyNodes.current.size > 0 ||
    deletedNodes.current.size > 0 ||
    newEdges.current.size > 0 ||
    deletedEdges.current.size > 0 ||
    filesToDelete.current.size > 0;

  // ---------- Local draft ----------
  const writeDraft = useCallback(async () => {
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = null;
    if (!hasPending()) {
      await idbDel(key);
      return;
    }
    const draft: Draft = {
      v: 1,
      baseVersion: baseVersion.current,
      savedAt: Date.now(),
      nodes: rf.getNodes().map(toRow),
      edges: rf.getEdges().map(toEdgeRow),
      viewport: rf.getViewport(),
      pending: {
        nodes: [...dirtyNodes.current],
        deletedNodes: [...deletedNodes.current],
        newEdges: [...newEdges.current],
        deletedEdges: [...deletedEdges.current],
        files: [...filesToDelete.current],
      },
    };
    await idbSet(key, draft);
  }, [key, rf]);

  const writeDraftSoon = useCallback(() => {
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => void writeDraft(), DRAFT_MS);
  }, [writeDraft]);

  // ---------- Scheduling ----------
  const clearSyncTimers = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (maxTimer.current) clearTimeout(maxTimer.current);
    idleTimer.current = maxTimer.current = null;
  };

  const schedule = useCallback(() => {
    if (blocked.current) return;
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => syncRef.current(), IDLE_MS);
    if (!maxTimer.current) maxTimer.current = setTimeout(() => syncRef.current(), MAX_WAIT_MS);
  }, []);

  const changed = useCallback(() => {
    setStatus((s) => (s === "syncing" || s === "conflict" || s === "offline" ? s : "local"));
    writeDraftSoon();
    schedule();
  }, [schedule, writeDraftSoon]);

  // ---------- Sync to the server ----------
  const sync = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      clearSyncTimers();
      if (retryTimer.current) clearTimeout(retryTimer.current);
      if (blocked.current && !force) return;
      if (inFlight.current) {
        again.current = true;
        return;
      }
      if (!hasPending() && !viewportDirty.current) {
        setStatus((s) => (s === "conflict" ? s : "saved"));
        return;
      }
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        setStatus("offline");
        return;
      }

      // Snapshot what changed; cards with images still uploading go again next time
      const nodes: CanvasNode[] = [];
      const keep: string[] = [];
      for (const id of dirtyNodes.current) {
        const n = rf.getNode(id);
        if (!n) continue;
        if (n.type === "reference" && (n.data as ReferenceData).items.some((i) => i.uploading)) keep.push(id);
        nodes.push(n);
      }
      const deleted = [...deletedNodes.current];
      const edges = [...newEdges.current]
        .map((id) => rf.getEdge(id))
        .filter((e): e is CanvasEdge => !!e && !!rf.getNode(e.source) && !!rf.getNode(e.target));
      const removedEdges = [...deletedEdges.current];
      const files = [...filesToDelete.current];
      const viewport = viewportDirty.current ? rf.getViewport() : null;

      dirtyNodes.current = new Set(keep);
      deletedNodes.current.clear();
      newEdges.current.clear();
      deletedEdges.current.clear();
      filesToDelete.current.clear();
      viewportDirty.current = false;

      inFlight.current = true;
      setStatus("syncing");
      const { data, error } = await supabase.rpc("save_canvas", {
        p_project_id: projectId,
        p_base_version: force ? null : baseVersion.current,
        p_nodes: nodes.map(toRow),
        p_deleted_nodes: deleted,
        p_edges: edges.map(toEdgeRow),
        p_deleted_edges: removedEdges,
        p_viewport: viewport,
      });
      inFlight.current = false;

      if (error) {
        // Put everything back; it's still safe in the local draft
        nodes.forEach((n) => dirtyNodes.current.add(n.id));
        deleted.forEach((id) => deletedNodes.current.add(id));
        edges.forEach((e) => newEdges.current.add(e.id));
        removedEdges.forEach((id) => deletedEdges.current.add(id));
        files.forEach((u) => filesToDelete.current.add(u));
        if (viewport) viewportDirty.current = true;
        void writeDraft();

        if (error.message === "CANVAS_CONFLICT") {
          blocked.current = true;
          setStatus("conflict");
          return;
        }
        const offline = !navigator.onLine || /fetch|network/i.test(error.message);
        if (offline) {
          setStatus("offline");
          return; // the "online" event resumes syncing
        }
        console.error("[canvas] sync failed", error);
        setErrorMessage(`${error.message}${error.code ? ` (${error.code})` : ""}`);
        setStatus("error");
        failures.current += 1;
        retryTimer.current = setTimeout(() => syncRef.current(), Math.min(30000, 1000 * 2 ** failures.current));
        return;
      }

      failures.current = 0;
      blocked.current = false;
      setErrorMessage(null);
      if (typeof data === "number") baseVersion.current = data;
      if (files.length) void deleteCanvasImages(projectId, files);

      if (again.current || hasPending()) {
        again.current = false;
        void writeDraft();
        if (hasPending()) {
          setStatus("local");
          schedule();
          return;
        }
      }
      void idbDel(key);
      setStatus("saved");
    },
    [key, projectId, rf, schedule, supabase, writeDraft],
  );

  useEffect(() => {
    syncRef.current = sync;
  }, [sync]);

  // ---------- On open: restore unsynced work from this device ----------
  const restoredOnce = useRef(false);
  useEffect(() => {
    if (restoredOnce.current) return;
    restoredOnce.current = true;
    void (async () => {
      const draft = await idbGet<Draft>(key);
      if (!draft || draft.v !== 1) return;
      const p = draft.pending;
      const any = p.nodes.length + p.deletedNodes.length + p.newEdges.length + p.deletedEdges.length + p.files.length > 0;
      if (!any) return void idbDel(key);

      if (draft.baseVersion === initialVersion) {
        applyDraft(draft);
        setRestoredNotice(true);
        changed();
      } else {
        setStaleDraft(draft); // the server moved on since: let you choose
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyDraft(draft: Draft) {
    onRestore(draft.nodes.map(rowToNode), draft.edges.map(rowToEdge));
    draft.pending.nodes.forEach((id) => dirtyNodes.current.add(id));
    draft.pending.deletedNodes.forEach((id) => deletedNodes.current.add(id));
    draft.pending.newEdges.forEach((id) => newEdges.current.add(id));
    draft.pending.deletedEdges.forEach((id) => deletedEdges.current.add(id));
    draft.pending.files.forEach((u) => filesToDelete.current.add(u));
  }

  // ---------- Background triggers ----------
  useEffect(() => {
    const flushAll = () => {
      void writeDraft();
      syncRef.current();
    };
    const onVisibility = () => document.visibilityState === "hidden" && flushAll();
    const onOnline = () => syncRef.current();
    const onOffline = () => setStatus((s) => (s === "saved" ? s : "offline"));
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        syncRef.current();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flushAll);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flushAll);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("keydown", onKey);
      clearSyncTimers();
      if (draftTimer.current) clearTimeout(draftTimer.current);
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [writeDraft]);

  // ---------- API for the canvas ----------
  const api = useMemo(
    () => ({
      /** A card was added, moved, resized or edited */
      nodes: (ids: string[]) => {
        ids.forEach((id) => {
          dirtyNodes.current.add(id);
          deletedNodes.current.delete(id);
        });
        changed();
      },
      nodesDeleted: (ids: string[]) => {
        ids.forEach((id) => {
          dirtyNodes.current.delete(id);
          deletedNodes.current.add(id);
        });
        changed();
      },
      edgeAdded: (id: string) => {
        newEdges.current.add(id);
        changed();
      },
      edgesDeleted: (ids: string[]) => {
        ids.forEach((id) => {
          if (newEdges.current.has(id)) newEdges.current.delete(id); // never synced: nothing to delete
          else deletedEdges.current.add(id);
        });
        changed();
      },
      /** Pan/zoom: kept with the next sync, never triggers one by itself */
      viewport: () => {
        viewportDirty.current = true;
      },
      deleteFilesAfterSave: (urls: string[]) => {
        urls.forEach((u) => filesToDelete.current.add(u));
        changed();
      },
      /** After "clear canvas" the server already removed everything */
      reset: (version: number) => {
        clearSyncTimers();
        dirtyNodes.current.clear();
        deletedNodes.current.clear();
        newEdges.current.clear();
        deletedEdges.current.clear();
        filesToDelete.current.clear();
        baseVersion.current = version;
        blocked.current = false;
        void idbDel(key);
        setStatus("saved");
      },
      syncNow: () => syncRef.current(),
    }),
    [changed, key],
  );

  /** Conflict choices */
  const resolve = {
    /** Keep my changes: save them over the newer version */
    keepMine: () => {
      if (staleDraft) {
        applyDraft(staleDraft);
        setStaleDraft(null);
      }
      blocked.current = false;
      setStatus("local");
      void writeDraft();
      void syncRef.current({ force: true });
    },
    /** Use the latest saved version and drop the changes made here */
    useLatest: async () => {
      await idbDel(key);
      window.location.reload();
    },
    dismissRestored: () => setRestoredNotice(false),
  };

  return { status, errorMessage, staleDraft, restoredNotice, api, resolve };
}

/** Card → database row (images still uploading are left out) */
function toRow(n: CanvasNode): NodeRow {
  const data =
    n.type === "reference"
      ? { ...n.data, items: (n.data as ReferenceData).items.filter((i) => !i.uploading && !i.url.startsWith("blob:")) }
      : n.data;
  return {
    id: n.id,
    type: n.type,
    x: n.position.x,
    y: n.position.y,
    width: n.width ?? null,
    height: n.height ?? null,
    data: data as Record<string, unknown>,
  };
}

function toEdgeRow(e: CanvasEdge): EdgeRow {
  return { id: e.id, source: e.source, target: e.target, source_handle: e.sourceHandle ?? null, target_handle: e.targetHandle ?? null };
}
