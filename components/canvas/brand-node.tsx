"use client";

import { memo, useEffect, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import { Check, Copy, Palette, Plus, X } from "lucide-react";
import { newFont, type BrandColor, type BrandFont, type BrandNode as BrandNodeType } from "@/lib/canvas-types";
import { useCanvasActions } from "./canvas-context";
import { CardShell } from "./card-shell";

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Brand card: colour palette + brand fonts. */
function BrandNodeComponent({ id, data, selected }: NodeProps<BrandNodeType>) {
  const { patchData } = useCanvasActions();
  const { colors, fonts } = data;

  const setColors = (next: BrandColor[]) => patchData(id, { colors: next });
  const setFonts = (next: BrandFont[]) => patchData(id, { fonts: next });
  const updateColor = (cid: string, patch: Partial<BrandColor>) => setColors(colors.map((c) => (c.id === cid ? { ...c, ...patch } : c)));
  const updateFont = (fid: string, patch: Partial<BrandFont>) => setFonts(fonts.map((f) => (f.id === fid ? { ...f, ...patch } : f)));

  return (
    <CardShell
      id={id}
      selected={!!selected}
      minWidth={260}
      minHeight={200}
      className="bg-surface ring-white/10"
      header={
        <>
          <Palette aria-hidden strokeWidth={1.75} className="size-3.5 text-rose-200" />
          <span className="text-[11px] font-medium tracking-wide text-white/55 uppercase">Brand</span>
        </>
      }
    >
      <div className="nodrag nowheel h-full space-y-4 overflow-y-auto px-3 pb-3">
        {/* Colours */}
        <section>
          <SectionLabel>Colours</SectionLabel>
          <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(60px,1fr))] gap-2">
            {colors.map((c) => (
              <Swatch
                key={c.id}
                color={c}
                onChange={(patch) => updateColor(c.id, patch)}
                onRemove={() => setColors(colors.filter((x) => x.id !== c.id))}
              />
            ))}
            <button
              type="button"
              onClick={() => setColors([...colors, { id: crypto.randomUUID(), hex: nextColor(colors.length), name: "" }])}
              aria-label="Add colour"
              className="grid h-12 place-items-center rounded-action text-white/35 ring-1 ring-white/15 ring-dashed transition hover:bg-white/[0.04] hover:text-white"
            >
              <Plus aria-hidden strokeWidth={1.75} className="size-4" />
            </button>
          </div>
        </section>

        {/* Fonts */}
        <section>
          <SectionLabel>Fonts</SectionLabel>
          <ul className="mt-2 space-y-2">
            {fonts.map((f) => (
              <FontRow
                key={f.id}
                font={f}
                onChange={(patch) => updateFont(f.id, patch)}
                onRemove={() => setFonts(fonts.filter((x) => x.id !== f.id))}
              />
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setFonts([...fonts, newFont(fonts.length === 0 ? "Heading" : fonts.length === 1 ? "Body" : "Accent")])}
            className="mt-1.5 flex h-7 items-center gap-2 rounded-action px-1 text-[12px] text-white/40 transition hover:bg-white/[0.04] hover:text-white"
          >
            <Plus aria-hidden strokeWidth={2} className="size-3.5" />
            Add font
          </button>
        </section>
      </div>
    </CardShell>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h4 className="text-[10.5px] font-medium tracking-[0.12em] text-white/40 uppercase">{children}</h4>;
}

function Swatch({ color, onChange, onRemove }: { color: BrandColor; onChange: (p: Partial<BrandColor>) => void; onRemove: () => void }) {
  // While typing, the text is a draft; otherwise it always shows the saved colour
  const [draft, setDraft] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function commitHex() {
    const m = HEX_RE.exec((draft ?? "").trim());
    setDraft(null);
    if (!m) return;
    const v = m[1].length === 3 ? m[1].split("").map((ch) => ch + ch).join("") : m[1];
    onChange({ hex: `#${v.toUpperCase()}` });
  }

  return (
    <div className="group/sw min-w-0">
      <div className="relative h-12 overflow-hidden rounded-action ring-1 ring-white/15" style={{ background: color.hex }}>
        {/* invisible native picker covering the swatch */}
        <input
          type="color"
          value={toSixDigit(color.hex)}
          onChange={(e) => onChange({ hex: e.target.value.toUpperCase() })}
          aria-label={`Pick colour ${color.name || color.hex}`}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard?.writeText(color.hex);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          aria-label="Copy hex"
          className="absolute bottom-1 left-1 grid size-5 place-items-center rounded-xs bg-black/45 text-white opacity-0 transition group-hover/sw:opacity-100 max-md:opacity-100"
        >
          {copied ? <Check aria-hidden strokeWidth={2.5} className="size-3" /> : <Copy aria-hidden strokeWidth={2} className="size-3" />}
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove colour"
          className="absolute top-1 right-1 grid size-5 place-items-center rounded-xs bg-black/45 text-white opacity-0 transition group-hover/sw:opacity-100 hover:bg-red-500/80 max-md:opacity-100"
        >
          <X aria-hidden strokeWidth={2.5} className="size-3" />
        </button>
      </div>
      <input
        value={draft ?? color.hex}
        onFocus={() => setDraft(color.hex)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitHex}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        spellCheck={false}
        maxLength={7}
        aria-label="Hex value"
        className="mt-1 w-full bg-transparent text-[11px] text-white/80 tabular-nums uppercase outline-none focus:text-white"
      />
      <input
        value={color.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="Name"
        maxLength={30}
        aria-label="Colour name"
        className="w-full bg-transparent text-[10.5px] text-white/45 outline-none placeholder:text-white/25 focus:text-white/80"
      />
    </div>
  );
}

function FontRow({ font, onChange, onRemove }: { font: BrandFont; onChange: (p: Partial<BrandFont>) => void; onRemove: () => void }) {
  const loaded = useGoogleFont(font.family);

  return (
    <li className="group/font rounded-action bg-white/[0.03] p-2 ring-1 ring-white/[0.06]">
      <div className="flex items-center gap-2">
        <input
          value={font.role}
          onChange={(e) => onChange({ role: e.target.value })}
          placeholder="Role"
          maxLength={20}
          aria-label="Font role"
          className="w-16 shrink-0 bg-transparent text-[10.5px] font-medium tracking-wide text-white/45 uppercase outline-none placeholder:text-white/25 focus:text-white/80"
        />
        <input
          value={font.family}
          onChange={(e) => onChange({ family: e.target.value })}
          placeholder="e.g. Inter"
          maxLength={60}
          aria-label="Font family"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-white/90 outline-none placeholder:text-white/30"
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove font"
          className="grid size-5 shrink-0 place-items-center rounded-xs text-white/30 opacity-0 transition group-hover/font:opacity-100 hover:bg-white/[0.06] hover:text-white focus-visible:opacity-100 max-md:opacity-100"
        >
          <X aria-hidden strokeWidth={2} className="size-3" />
        </button>
      </div>
      {font.family.trim() && (
        <p
          className={`mt-1.5 truncate text-[22px] leading-tight text-white transition-opacity ${loaded ? "opacity-100" : "opacity-50"}`}
          style={{ fontFamily: `"${font.family.trim()}", system-ui, sans-serif` }}
        >
          Aa Bb Cc 123
        </p>
      )}
    </li>
  );
}

/** Loads a Google Font for the preview (once per family, after you stop typing). */
const requested = new Set<string>();
function useGoogleFont(family: string) {
  const name = family.trim();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!name || !/^[\w\s-]+$/.test(name)) return;
    const t = setTimeout(() => {
      if (!requested.has(name)) {
        requested.add(name);
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g, "+")}:wght@400;600&display=swap`;
        document.head.appendChild(link);
      }
      document.fonts
        ?.load(`16px "${name}"`)
        .then((faces) => setLoaded(faces.length > 0))
        .catch(() => setLoaded(false));
    }, 500);
    return () => clearTimeout(t);
  }, [name]);

  return loaded;
}

function toSixDigit(hex: string) {
  const m = HEX_RE.exec(hex);
  if (!m) return "#000000";
  return `#${m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1]}`.toLowerCase();
}

/** Starting colours for new swatches: the CodeHarem palette, then neutrals */
function nextColor(i: number) {
  const seed = ["#143F39", "#429872", "#1A1A1A", "#FFFFFF", "#E8DCC4", "#D9653B"];
  return seed[i % seed.length];
}

export const BrandNode = memo(BrandNodeComponent);
