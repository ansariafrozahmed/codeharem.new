// One place for site-wide SEO details.
import { BASE_URL } from "@/lib/base-url";

/** Public URL of the site, from NEXT_PUBLIC_BASE_URL */
export const SITE_URL = BASE_URL;

export const SITE = {
  name: "CodeHarem",
  shortName: "CodeHarem",
  title: "CodeHarem: client project workspace for developers",
  description:
    "Keep every client project in one place: requirements from chats, research and references, brand colours and fonts, and a sitemap with section progress, all on one visual canvas.",
  keywords: [
    "client project management",
    "web developer workspace",
    "project requirements tracker",
    "website sitemap planner",
    "brand colour palette",
    "design references board",
    "freelance web developer tools",
    "visual project canvas",
  ],
  locale: "en_US",
  colors: { background: "#131413", theme: "#143f39", accent: "#429872" },
} as const;
