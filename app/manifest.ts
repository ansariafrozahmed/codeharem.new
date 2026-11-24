import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// /manifest.webmanifest: lets phones "Add to home screen" with the right name, colours and icon.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.shortName,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: SITE.colors.background,
    theme_color: SITE.colors.theme,
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
