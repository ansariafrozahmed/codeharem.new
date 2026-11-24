// Shared by server and client.
import type { Edge, Node, Viewport } from "@xyflow/react";

export const NOTE_COLORS = ["slate", "pine", "leaf", "amber", "rose"] as const;
export type NoteColor = (typeof NOTE_COLORS)[number];

export const REQUIREMENT_SOURCES = ["whatsapp", "email", "call", "meeting", "other"] as const;
export type RequirementSource = (typeof REQUIREMENT_SOURCES)[number];

export const SOURCE_LABELS: Record<RequirementSource, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  call: "Call",
  meeting: "Meeting",
  other: "Other",
};

// ---------- Card data ----------
export type NoteData = { text: string; color: NoteColor };
export type RequirementItem = { id: string; text: string; done: boolean };
export type RequirementData = { source: RequirementSource; items: RequirementItem[] };
export type ListData = { title: string; items: RequirementItem[] };

/** A reference: an uploaded image or a link. While uploading, url is a blob: preview. */
export type ReferenceItem = { id: string; kind: "image" | "link"; url: string; title?: string; uploading?: boolean };
export type ReferenceData = { title: string; items: ReferenceItem[] };

/** Brand: colour palette + fonts */
export type BrandColor = { id: string; hex: string; name: string };
export type BrandFont = { id: string; role: string; family: string };
export type BrandData = { colors: BrandColor[]; fonts: BrandFont[] };

export function newItem(text = ""): RequirementItem {
  return { id: crypto.randomUUID(), text, done: false };
}

export function newFont(role: string, family = ""): BrandFont {
  return { id: crypto.randomUUID(), role, family };
}

export type NoteNode = Node<NoteData, "note">;
export type RequirementNode = Node<RequirementData, "requirement">;
export type ListNode = Node<ListData, "list">;
export type ReferenceNode = Node<ReferenceData, "reference">;
export type BrandNode = Node<BrandData, "brand">;
export type CanvasNode = NoteNode | RequirementNode | ListNode | ReferenceNode | BrandNode;
export type CanvasNodeType = CanvasNode["type"];

/** Only blocks ("list" cards) can be linked to each other. */
export const LINKABLE_TYPES: CanvasNodeType[] = ["list"];

// ---------- Edges ----------
export type CanvasEdge = Edge;
/** A row in public.project_edges */
export type EdgeRow = { id: string; source: string; target: string; source_handle: string | null; target_handle: string | null };

export function rowToEdge(row: EdgeRow): CanvasEdge {
  return {
    id: row.id,
    source: row.source,
    target: row.target,
    sourceHandle: row.source_handle,
    targetHandle: row.target_handle,
    type: "link",
  };
}

// ---------- Rows ----------
/** A row in public.project_nodes ("image" is the old single-image card) */
export type NodeRow = {
  id: string;
  type: CanvasNodeType | "image";
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  data: Record<string, unknown>;
};

export type CanvasViewport = Viewport;

/** height 0 = the card grows with its content */
export const DEFAULT_SIZE: Record<CanvasNodeType, { width: number; height: number }> = {
  note: { width: 240, height: 180 },
  requirement: { width: 300, height: 200 },
  list: { width: 260, height: 0 },
  reference: { width: 300, height: 240 },
  brand: { width: 340, height: 320 },
};

export function defaultData(type: CanvasNodeType): CanvasNode["data"] {
  if (type === "note") return { text: "", color: "slate" };
  if (type === "list") return { title: "", items: [] };
  if (type === "reference") return { title: "", items: [] };
  if (type === "brand") return { colors: [], fonts: [newFont("Heading"), newFont("Body")] };
  return { source: "whatsapp", items: [newItem()] };
}

export function rowToNode(row: NodeRow): CanvasNode {
  // Old image cards become a reference holding that one image
  if (row.type === "image") {
    const url = String(row.data.url ?? "");
    return {
      id: row.id,
      type: "reference",
      position: { x: row.x, y: row.y },
      width: row.width ?? DEFAULT_SIZE.reference.width,
      height: row.height ?? DEFAULT_SIZE.reference.height,
      data: {
        title: "",
        items: url ? [{ id: crypto.randomUUID(), kind: "image", url, title: String(row.data.alt ?? "") }] : [],
      },
    };
  }

  const size = DEFAULT_SIZE[row.type];
  const list = (v: unknown) => (Array.isArray(v) ? v : []);
  return {
    id: row.id,
    type: row.type,
    position: { x: row.x, y: row.y },
    width: row.width ?? size.width,
    height: row.height ?? (size.height || undefined),
    data:
      row.type === "requirement"
        ? requirementData(row.data)
        : row.type === "list" || row.type === "reference"
          ? { title: String(row.data.title ?? ""), items: list(row.data.items) }
          : row.type === "brand"
            ? { colors: list(row.data.colors), fonts: list(row.data.fonts) }
            : { ...defaultData(row.type), ...row.data },
  } as CanvasNode;
}

/** Older requirement cards stored one text + done flag: turn each line into a checklist item. */
function requirementData(raw: Record<string, unknown>): RequirementData {
  const source = (raw.source as RequirementSource) ?? "whatsapp";
  if (Array.isArray(raw.items)) return { source, items: raw.items as RequirementItem[] };
  const lines = String(raw.text ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  const done = Boolean(raw.done);
  return { source, items: lines.length ? lines.map((t) => ({ ...newItem(t), done })) : [newItem()] };
}

/** Uploaded image URLs inside node rows (old image cards + reference images). */
export function imageUrlsFromRows(rows: { type: string; data: unknown }[]): string[] {
  return rows.flatMap((r) => {
    const d = (r.data ?? {}) as { url?: string; items?: ReferenceItem[] };
    if (r.type === "image") return d.url ? [d.url] : [];
    if (r.type === "reference") return (d.items ?? []).filter((i) => i.kind === "image" && i.url).map((i) => i.url);
    return [];
  });
}
