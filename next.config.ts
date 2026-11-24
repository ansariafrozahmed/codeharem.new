import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["192.168.1.102"],
  images: {
    // Profile pictures from Google and GitHub sign-in
    remotePatterns: [
      new URL("https://lh3.googleusercontent.com/**"),
      new URL("https://avatars.githubusercontent.com/**"),
      // Uploaded avatars and covers (Cloudflare R2 public URL)
      ...(process.env.R2_PUBLIC_URL ? [new URL(`${process.env.R2_PUBLIC_URL.replace(/\/$/, "")}/**`)] : []),
    ],
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
