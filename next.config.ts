import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  /* ── Security: Disable x-powered-by header ── */
  poweredByHeader: false,

  /* ── Strict-mode for catching bugs early ── */
  reactStrictMode: true,

  /* ── Server external packages (mongoose uses native deps) ── */
  serverExternalPackages: ["mongoose"],
};

export default nextConfig;
