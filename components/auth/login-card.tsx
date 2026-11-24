"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { signInWithProvider, type OAuthProvider } from "@/actions/auth";
import Image from "next/image";
import {
  Check,
  LoaderCircle,
  MessagesSquare,
  Network,
  Palette,
} from "lucide-react";

const BUTTONS: {
  provider: OAuthProvider;
  label: string;
  Icon: () => ReactNode;
  primary: boolean;
}[] = [
  {
    provider: "google",
    label: "Continue with Google",
    Icon: GoogleIcon,
    primary: true,
  },
  {
    provider: "github",
    label: "Continue with GitHub",
    Icon: GitHubIcon,
    primary: false,
  },
];

const FEATURES = [
  {
    Icon: MessagesSquare,
    text: "Client requirements and chats saved per project",
  },
  {
    Icon: Network,
    text: "Sitemap pages and sections marked done, working or pending",
  },
  { Icon: Palette, text: "Palettes, research and references next to the work" },
];

export function LoginCard({ error }: { error?: ReactNode }) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState<OAuthProvider | null>(null);

  return (
    <div className="enter w-full max-w-[520px]">
      <div className="relative overflow-hidden rounded-card bg-background px-6 py-10 ring-1 ring-white/10 backdrop-blur-xl sm:px-9 sm:py-12">
        {/* top light inside the card */}
        {/* <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-radial-[60%_100%_at_50%_0%] from-pine to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-linear-to-r from-transparent via-leaf/70 to-transparent"
        /> */}

        <div className="relative">
          <Link href="/" className="inline-block">
            <Image
              src="/weblogo.webp"
              alt="CodeHarem Logo"
              width={200}
              className="h-7 w-auto object-contain"
              height={100}
            />
          </Link>

          <p className="mt-6 md:mt-8 text-[10px] md:text-[11px] tracking-[0.12em] text-leaf uppercase">
            Welcome to CodeHarem
          </p>
          <h1 className="mt-3 text-[2rem] md:text-[2.15rem] leading-[1.05] font-semibold tracking-[-0.02em] text-balance sm:text-[2.5rem]">
            Every client project,{" "}
            <span className="text-[#bfe3cf]">in one place.</span>
          </h1>
          <p className="mt-4 text-[11px] md:text-[14px] md:tracking-wide leading-relaxed font-normal text-white/60">
            Stop digging through chats for what the client asked. Plan, research
            and track each build from one workspace.
          </p>

          <ul className="mt-5 lg:mt-7 space-y-3 border-t border-white/[0.07] pt-6">
            {FEATURES.map(({ Icon, text }) => (
              <li
                key={text}
                className="flex items-start gap-2 md:gap-3 text-[10px] md:text-[12px] font-normal md:tracking-wide leading-snug text-white/80"
              >
                <Icon
                  aria-hidden
                  strokeWidth={1.75}
                  className="mt-px size-3.5 shrink-0 text-leaf md:size-4"
                />
                {text}
              </li>
            ))}
          </ul>

          <label
            htmlFor="terms-consent"
            className="mt-8 flex cursor-pointer items-start gap-3 text-[12px] md:text-[13px] leading-snug text-white/60"
          >
            <input
              id="terms-consent"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className="mt-px grid size-[18px] shrink-0 place-items-center rounded-action ring-1 ring-white/25 transition peer-checked:bg-leaf peer-checked:ring-leaf peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-leaf"
            >
              {agreed && (
                <Check
                  aria-hidden
                  strokeWidth={3}
                  className="size-3 text-white"
                />
              )}
            </span>
            <span>
              I agree to the{" "}
              <Link
                href="/"
                className="text-white underline decoration-leaf/60 underline-offset-[3px] transition hover:decoration-leaf"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="/"
                className="text-white underline decoration-leaf/60 underline-offset-[3px] transition hover:decoration-leaf"
              >
                Privacy Policy
              </Link>
            </span>
          </label>

          <div className="mt-5 space-y-3">
            {BUTTONS.map(({ provider, label, Icon, primary }) => {
              const disabled = !agreed || loading !== null;
              return (
                <form
                  key={provider}
                  action={signInWithProvider.bind(null, provider)}
                  onSubmit={() => setLoading(provider)}
                >
                  <button
                    type="submit"
                    disabled={disabled}
                    className={`group flex h-12 w-full items-center justify-center gap-3 rounded-action text-[13px] md:text-[15px] font-medium transition duration-150 enabled:hover:-translate-y-px enabled:active:translate-y-0 enabled:active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf disabled:cursor-not-allowed ${
                      primary
                        ? "bg-white text-background enabled:hover:bg-[#eef6f1] disabled:bg-white/50"
                        : "bg-white/[0.05] text-white ring-1 ring-white/15 enabled:hover:bg-white/[0.09] enabled:hover:ring-white/25 disabled:text-white/50"
                    }`}
                  >
                    {loading === provider ? <Spinner /> : <Icon />}
                    {label}
                  </button>
                </form>
              );
            })}
            {loading === null && error}
          </div>

          <p className="mt-6 text-center text-[11px] md:text-[13px] text-white/40">
            {agreed
              ? "New here? Signing in creates your account."
              : "Tick the box above to continue."}
          </p>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return <LoaderCircle aria-hidden className="size-5 animate-spin" />;
}

function GoogleIcon() {
  return (
    <svg className="size-5" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      className="size-5"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
