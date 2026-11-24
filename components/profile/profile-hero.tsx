"use client";

import Image from "next/image";
import { useRef } from "react";
import { Camera, ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { BannerArt } from "./banner-art";
import { useImageUpload } from "@/hooks/use-image-upload";

type Props = {
  username: string;
  name: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
};

const ACCEPT = "image/jpeg,image/png,image/webp";

/** Cover + overlapping profile photo, both editable in place. */
export function ProfileHero({ username, name, avatarUrl, bannerUrl }: Props) {
  const cover = useImageUpload("banner");
  const photo = useImageUpload("avatar");
  const coverInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  const banner = cover.preview ?? bannerUrl;
  const avatar = photo.preview ?? avatarUrl;
  const busy = cover.busy !== null || photo.busy !== null;
  const error = cover.error ?? photo.error;

  return (
    <section className="overflow-hidden rounded-card ">
      {/* Cover */}
      <div className="relative h-52 md:h-64 lg:h-80">
        {banner ? (
          <>
            <Image
              src={banner}
              alt=""
              fill
              priority
              unoptimized={banner.startsWith("blob:")}
              sizes="100vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-linear-to-t from-background via-background/30 to-transparent"
            />
          </>
        ) : (
          <BannerArt />
        )}
        {cover.busy === "upload" && <Uploading />}

        <div className="absolute top-3 right-3 flex gap-2 md:top-4 md:right-4">
          <CoverButton
            onClick={() => coverInput.current?.click()}
            disabled={busy}
          >
            <ImagePlus aria-hidden strokeWidth={1.75} className="size-3.5" />
            {bannerUrl ? "Change cover" : "Add cover"}
          </CoverButton>
          {bannerUrl && (
            <CoverButton
              onClick={cover.remove}
              disabled={busy}
              label="Remove cover"
            >
              {cover.busy === "remove" ? (
                <LoaderCircle aria-hidden className="size-3.5 animate-spin" />
              ) : (
                <Trash2 aria-hidden strokeWidth={1.75} className="size-3.5" />
              )}
            </CoverButton>
          )}
        </div>
        <input
          ref={coverInput}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            cover.upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      {/* Photo + name */}
      <div className="flex flex-col gap-4 px-5 pb-6 md:flex-row md:items-end md:gap-6 md:px-8 md:pb-8">
        <button
          type="button"
          onClick={() => photoInput.current?.click()}
          disabled={busy}
          aria-label="Change profile photo"
          className="group/avatar relative -mt-14 size-28 shrink-0 overflow-hidden rounded-card bg-background ring-4 ring-background transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-leaf disabled:cursor-wait md:-mt-16 md:size-32"
        >
          {avatar ? (
            <Image
              src={avatar}
              alt=""
              fill
              unoptimized={avatar.startsWith("blob:")}
              sizes="128px"
              className="object-cover"
            />
          ) : (
            <span className="grid size-full place-items-center bg-pine text-4xl font-semibold text-leaf">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 text-[11px] text-white opacity-0 transition-opacity group-hover/avatar:opacity-100 group-focus-visible/avatar:opacity-100">
            <Camera aria-hidden strokeWidth={1.75} className="size-5" />
            Change
          </span>
          {photo.busy === "upload" && <Uploading />}
        </button>
        <input
          ref={photoInput}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            photo.upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />

        <div className="min-w-0 md:pb-1">
          <p className="truncate text-2xl font-semibold tracking-tight md:text-[2rem]">
            {name}
          </p>
          <p className="mt-1 truncate text-sm text-leaf">@{username}</p>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mx-5 mb-5 rounded-action border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200 md:mx-8"
        >
          {error}
        </p>
      )}
    </section>
  );
}

function CoverButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex h-8 items-center gap-1.5 rounded-action bg-black/40 px-3 text-[12px] text-white ring-1 ring-white/15 backdrop-blur-md transition hover:-translate-y-px hover:bg-black/55 hover:ring-white/30 active:translate-y-0 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-leaf"
    >
      {children}
    </button>
  );
}

function Uploading() {
  return (
    <span className="absolute inset-0 grid place-items-center bg-black/45 backdrop-blur-[2px]">
      <LoaderCircle
        aria-label="Uploading"
        className="size-6 animate-spin text-white"
      />
    </span>
  );
}
