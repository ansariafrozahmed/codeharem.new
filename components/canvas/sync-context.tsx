"use client";

import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { SyncStatus } from "@/hooks/use-canvas-sync";

type SyncBridge = {
  status: SyncStatus;
  syncNow: () => void;
  /** The canvas reports its state here */
  register: (status: SyncStatus, syncNow: () => void) => void;
};

const SyncContext = createContext<SyncBridge | null>(null);

/** Shares the canvas sync state with the workspace header (Save button). */
export function CanvasSyncProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>("saved");
  const syncRef = useRef<() => void>(() => {});

  const register = useCallback((s: SyncStatus, fn: () => void) => {
    setStatus(s);
    syncRef.current = fn;
  }, []);

  const syncNow = useCallback(() => syncRef.current(), []);

  return <SyncContext value={{ status, syncNow, register }}>{children}</SyncContext>;
}

export function useCanvasSyncBridge() {
  return use(SyncContext);
}

/** Called by the canvas whenever its sync state changes. */
export function useReportSync(status: SyncStatus, syncNow: () => void) {
  const bridge = use(SyncContext);
  useEffect(() => {
    bridge?.register(status, syncNow);
  }, [bridge, status, syncNow]);
}
