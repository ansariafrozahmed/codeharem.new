import { ImageResponse } from "next/og";
import { BrandMark } from "@/components/brand-mark";

// Favicon (/icon), generated from the logo mark.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#131413", borderRadius: 14 }}>
        <BrandMark size={52} />
      </div>
    ),
    size,
  );
}
