"use client";

import { memo, useRef, useState } from "react";
import Image from "next/image";
import type { NodeProps } from "@xyflow/react";
import { ArrowUpRight, Bookmark, Globe, ImagePlus, Link2, LoaderCircle, X } from "lucide-react";
import type { ReferenceItem, ReferenceNode as ReferenceNodeType } from "@/lib/canvas-types";
import { useCanvasActions } from "./canvas-context";
import { CardShell } from "./card-shell";

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

/** Reference card (same frame as Requirement): images and links. */
function ReferenceNodeComponent({ id, data, selected }: NodeProps<ReferenceNodeType>) {
  const { patchData, uploadReferenceImages, deleteFilesAfterSave, notify } = useCanvasActions();
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const images = data.items.filter((i) => i.kind === "image");
  const links = data.items.filter((i) => i.kind === "link");

  function removeItem(item: ReferenceItem) {
    patchData(id, { items: data.items.filter((i) => i.id !== item.id) });
    if (item.kind === "image" && !item.url.startsWith("blob:")) deleteFilesAfterSave([item.url]);
  }

  function addLink() {
    const url = normalizeUrl(link);
    if (!url) return notify("That doesn't look like a link.");
    patchData(id, { items: [...data.items, { id: crypto.randomUUID(), kind: "link", url }] });
    setLink("");
    setLinkOpen(false);
  }

  return (
    <CardShell
      id={id}
      selected={!!selected}
      minWidth={240}
      minHeight={140}
      className="bg-surface ring-white/10"
      header={
        <>
          <Bookmark aria-hidden strokeWidth={1.75} className="size-3.5 text-amber-200" />
          <span className="text-[11px] font-medium tracking-wide text-white/55 uppercase">Reference</span>
          {data.items.length > 0 && <span className="text-[11px] text-white/35 tabular-nums">{data.items.length}</span>}
        </>
      }
    >
      <div className="flex h-full flex-col">
        <div className="nodrag nowheel min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-2">
          {data.items.length === 0 && !linkOpen && (
            <p className="pt-1 text-[12.5px] text-white/35">Add screenshots, mood images or links.</p>
          )}

          {images.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {images.map((img) => (
                <div key={img.id} className="group/thumb relative aspect-[4/3] overflow-hidden rounded-action bg-black/30 ring-1 ring-white/10">
                  <a
                    href={img.uploading ? undefined : img.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block size-full"
                    aria-label={img.title || "Open image"}
                    onClick={(e) => img.uploading && e.preventDefault()}
                  >
                    <Image
                      src={img.url}
                      alt={img.title ?? ""}
                      fill
                      draggable={false}
                      unoptimized={img.url.startsWith("blob:")}
                      sizes="200px"
                      className="object-cover transition duration-300 group-hover/thumb:scale-[1.03]"
                    />
                  </a>
                  {img.uploading ? (
                    <span className="absolute inset-0 grid place-items-center bg-black/50">
                      <LoaderCircle aria-label="Uploading" className="size-5 animate-spin text-white" />
                    </span>
                  ) : (
                    <RemoveButton onClick={() => removeItem(img)} className="absolute top-1 right-1 bg-black/60" />
                  )}
                </div>
              ))}
            </div>
          )}

          {links.length > 0 && (
            <ul className="space-y-1">
              {links.map((l) => {
                const { host, path } = splitUrl(l.url);
                return (
                  <li key={l.id} className="group/link flex items-center gap-2 rounded-action bg-white/[0.03] py-1.5 pr-1 pl-2 ring-1 ring-white/[0.06]">
                    <Globe aria-hidden strokeWidth={1.75} className="size-3.5 shrink-0 text-leaf" />
                    <a href={l.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 text-[12.5px] leading-tight hover:underline">
                      <span className="block truncate text-white/90">{host}</span>
                      {path && <span className="block truncate text-[11px] text-white/40">{path}</span>}
                    </a>
                    <ArrowUpRight aria-hidden strokeWidth={1.75} className="size-3.5 shrink-0 text-white/30" />
                    <RemoveButton onClick={() => removeItem(l)} />
                  </li>
                );
              })}
            </ul>
          )}

          {linkOpen && (
            <form
              className="flex gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                addLink();
              }}
            >
              <input
                autoFocus
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setLinkOpen(false)}
                onBlur={() => !link && setLinkOpen(false)}
                placeholder="Paste a link…"
                inputMode="url"
                aria-label="Link"
                className="h-8 min-w-0 flex-1 rounded-action border border-white/10 bg-background px-2.5 text-[12.5px] outline-none focus:border-leaf/70"
              />
              <button type="submit" className="h-8 rounded-action bg-leaf/80 px-2.5 text-[12px] font-medium text-white transition hover:bg-leaf">
                Add
              </button>
            </form>
          )}
        </div>

        {/* Add buttons, like "Add item" on requirements */}
        <div className="nodrag flex shrink-0 gap-1 px-2 pb-2">
          <AddButton onClick={() => fileInput.current?.click()}>
            <ImagePlus aria-hidden strokeWidth={1.75} className="size-3.5" />
            Image
          </AddButton>
          <AddButton onClick={() => setLinkOpen(true)}>
            <Link2 aria-hidden strokeWidth={1.75} className="size-3.5" />
            Link
          </AddButton>
        </div>

        <input
          ref={fileInput}
          type="file"
          accept={ACCEPT}
          multiple
          hidden
          onChange={(e) => {
            uploadReferenceImages(id, Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>
    </CardShell>
  );
}

function AddButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-7 items-center gap-2 rounded-action px-2 text-[12px] text-white/40 transition hover:bg-white/[0.04] hover:text-white"
    >
      {children}
    </button>
  );
}

function RemoveButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Remove"
      className={`grid size-6 shrink-0 place-items-center rounded-xs text-white/60 opacity-0 transition group-hover/link:opacity-100 group-hover/thumb:opacity-100 hover:bg-red-500/70 hover:text-white focus-visible:opacity-100 max-md:opacity-100 ${className}`}
    >
      <X aria-hidden strokeWidth={2} className="size-3.5" />
    </button>
  );
}

/** "example.com/page" → "https://example.com/page"; null when it isn't a URL */
export function normalizeUrl(input: string) {
  const raw = input.trim();
  if (!raw || /\s/.test(raw)) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.hostname.includes(".") ? url.toString() : null;
  } catch {
    return null;
  }
}

function splitUrl(url: string) {
  try {
    const u = new URL(url);
    const path = (u.pathname + u.search).replace(/\/$/, "");
    return { host: u.hostname.replace(/^www\./, ""), path };
  } catch {
    return { host: url, path: "" };
  }
}

export const ReferenceNode = memo(ReferenceNodeComponent);
