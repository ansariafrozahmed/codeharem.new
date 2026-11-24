import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// /robots.txt: public pages can be crawled; private workspaces and auth routes can't.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/profile/", "/auth/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
