import type { CSSProperties, ReactNode } from "react";

/**
 * "Project desk" background: real pieces of a client project
 * (palette, client chat, sitemap, statuses, progress, research)
 * floating at different depths around the login card.
 * Decorative only.
 */
export function DeskBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none">
      {/* Light: pine pool behind the card, leaf glow in a corner */}
      <div className="absolute inset-0 bg-[radial-gradient(55%_50%_at_50%_42%,rgba(20,63,57,0.95)_0%,rgba(20,63,57,0.35)_45%,transparent_75%),radial-gradient(40%_35%_at_100%_100%,rgba(66,152,114,0.18)_0%,transparent_70%),radial-gradient(35%_30%_at_0%_0%,rgba(66,152,114,0.10)_0%,transparent_70%)]" />
      {/* Film grain so the dark never looks flat */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.07] mix-blend-overlay">
        <filter id="desk-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#desk-grain)" />
      </svg>

      {/* Far layer: soft, small */}
      <Piece className="top-[9%] left-[6%] hidden md:block" depth="far" delay="-2s">
        <Palette />
      </Piece>
      <Piece className="top-[12%] right-[7%] hidden lg:block" depth="far" delay="-6s">
        <FontSample />
      </Piece>
      <Piece className="bottom-[10%] left-[9%] hidden lg:block" depth="far" delay="-4s">
        <ResearchNote />
      </Piece>

      {/* Near layer: sharper, larger */}
      <Piece className="top-[34%] left-[4%] hidden md:block xl:left-[10%]" depth="near" delay="-1s">
        <SitemapTree />
      </Piece>
      <Piece className="top-[26%] right-[4%] hidden md:block xl:right-[10%]" depth="near" delay="-5s">
        <ClientMessage />
      </Piece>
      <Piece className="right-[6%] bottom-[14%] hidden md:block xl:right-[13%]" depth="near" delay="-3s">
        <ProgressCard />
      </Piece>

      {/* Phone: two pieces peek in at the edges */}
      <Piece className="-top-3 -left-10 md:hidden" depth="far" delay="-2s">
        <Palette />
      </Piece>
      <Piece className="-right-12 -bottom-2 md:hidden" depth="far" delay="-4s">
        <ProgressCard />
      </Piece>
    </div>
  );
}

function Piece({
  children,
  className,
  depth,
  delay,
}: {
  children: ReactNode;
  className: string;
  depth: "near" | "far";
  delay: string;
}) {
  const look =
    depth === "near"
      ? "opacity-[0.55] [--drift:10px]"
      : "opacity-[0.28] blur-[1.5px] scale-90 [--drift:6px]";
  return (
    <div className={`absolute ${className}`}>
      <div className={`drift ${look}`} style={{ animationDelay: delay } as CSSProperties}>
        {children}
      </div>
    </div>
  );
}

const card = "rounded-lg bg-[#202423]/90 ring-1 ring-white/10 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)]";
const label = " text-[10px] tracking-[0.14em] text-white/45 uppercase";

function Palette() {
  const colors = ["#143F39", "#429872", "#E8DCC4", "#D9653B"];
  return (
    <div className={`${card} w-56 p-3`}>
      <div className={label}>Palette</div>
      <div className="mt-2 flex h-9 overflow-hidden rounded">
        {colors.map((c) => (
          <div key={c} className="flex-1" style={{ background: c }} />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[9px] text-white/40">
        {colors.map((c) => (
          <span key={c}>{c.slice(1)}</span>
        ))}
      </div>
    </div>
  );
}

function ClientMessage() {
  return (
    <div className="w-64">
      <div className="mb-1.5 flex items-center gap-2 text-[10px] text-white/45">
        <span className="size-1.5 rounded-full bg-leaf" />
        Client · WhatsApp · 10:42
      </div>
      <div className="rounded-lg rounded-tl-none bg-[#1f3a33] px-3.5 py-2.5 text-[13px] leading-snug text-white/90 ring-1 ring-leaf/25">
        Can the booking form send a copy to reception too?
      </div>
      <div className="mt-2 flex justify-end">
        <span className="rounded bg-leaf/15 px-1.5 py-0.5 text-[10px] text-leaf">
          saved → Booking form
        </span>
      </div>
    </div>
  );
}

function SitemapTree() {
  const rows: [string, "done" | "working" | "pending"][] = [
    ["hero", "done"],
    ["services", "done"],
    ["pricing", "working"],
    ["faq", "pending"],
  ];
  const dot = {
    done: "bg-leaf",
    working: "bg-white pulse-dot",
    pending: "ring-1 ring-white/40",
  };
  return (
    <div className={`${card} w-52 p-3.5`}>
      <div className={label}>Sitemap</div>
      <div className="mt-2.5 text-[12px] text-white/85">/ home</div>
      <ul className="mt-1.5 ml-1 space-y-1.5 border-l border-white/15 pl-3">
        {rows.map(([name, s]) => (
          <li key={name} className="flex items-center justify-between text-[11.5px] text-white/65">
            {name}
            <span className={`size-2 rounded-full ${dot[s]}`} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProgressCard() {
  return (
    <div className={`${card} w-56 p-3.5`}>
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-medium text-white/90">Homepage</span>
        <span className=" text-[11px] text-white/50">6 / 9</span>
      </div>
      <div className="mt-2.5 flex gap-1">
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i < 6 ? "bg-leaf" : i === 6 ? "bg-white/60" : "bg-white/10"}`} />
        ))}
      </div>
      <div className="mt-2 text-[10px] text-white/40">sections done</div>
    </div>
  );
}

function ResearchNote() {
  return (
    <div className={`${card} w-60 p-3.5`}>
      <div className={label}>Research</div>
      <p className="mt-2 text-[12.5px] leading-snug text-white/75">
        Top 3 competitors all book in two steps. Keep ours to one screen.
      </p>
    </div>
  );
}

function FontSample() {
  return (
    <div className={`${card} flex w-44 items-end justify-between p-3.5`}>
      <span className=" text-4xl leading-none text-white/90 italic">Aa</span>
      <span className="text-right text-[10px] leading-tight text-white/45">
        Headings
        <br />
        Serif italic
      </span>
    </div>
  );
}
