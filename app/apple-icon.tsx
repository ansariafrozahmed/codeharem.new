import { ImageResponse } from "next/og";
import { BrandMark } from "@/components/brand-mark";

// iPhone/iPad home-screen icon (/apple-icon).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #131413 0%, #143f39 100%)",
        }}
      >
        <BrandMark size={128} />
      </div>
    ),
    size,
  );
}
