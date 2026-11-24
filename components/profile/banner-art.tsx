/** Default cover when no banner is uploaded: gradient only. */
export function BannerArt() {
  return (
    <div
      aria-hidden
      className="absolute inset-0 bg-[radial-gradient(60%_90%_at_78%_20%,rgba(66,152,114,0.55)_0%,transparent_60%),linear-gradient(135deg,#0c2420_0%,#143f39_45%,#1b4d43_100%)]"
    />
  );
}
