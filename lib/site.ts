// One place for site-wide SEO details.

/** Public URL of the site, e.g. https://codeharem.com (set NEXT_PUBLIC_SITE_URL in production). */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

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
