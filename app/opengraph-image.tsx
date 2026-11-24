import { ImageResponse } from "next/og";
import { BrandMark } from "@/components/brand-mark";
import { SITE } from "@/lib/site";

// Share image for links on WhatsApp, LinkedIn, X, Slack… (/opengraph-image)
export const alt = SITE.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          color: "white",
          background:
            "radial-gradient(60% 80% at 85% 15%, rgba(66,152,114,0.55) 0%, transparent 60%), linear-gradient(135deg, #131413 0%, #143f39 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <BrandMark size={72} />
          <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>codeharem</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            Every client project, in one place.
          </span>
          <span style={{ fontSize: 30, color: "rgba(255,255,255,0.65)", lineHeight: 1.3 }}>
            Requirements, references, brand and sitemap progress on one canvas.
          </span>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {["Requirements", "References", "Brand", "Sitemap"].map((t) => (
            <span
              key={t}
              style={{
                fontSize: 24,
                padding: "10px 20px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
