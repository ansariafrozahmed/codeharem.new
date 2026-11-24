import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// /sitemap.xml: only public pages. Profiles and project workspaces are private.
// Add new public pages (e.g. /products, /resources, /pricing) here when they exist.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/login`, lastModified, changeFrequency: "yearly", priority: 0.5 },
  ];
}
