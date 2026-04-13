import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    /* Prefer modern formats for smaller file sizes */
    formats: ["image/avif", "image/webp"],
    /* Cache optimized images for 30 days */
    minimumCacheTTL: 2592000,
  },

  /* ── Security: Disable x-powered-by header ── */
  poweredByHeader: false,

  /* ── Strict-mode for catching bugs early ── */
  reactStrictMode: true,

  /* ── Server external packages (mongoose uses native deps) ── */
  serverExternalPackages: ["mongoose"],

  /* ── Compress responses (gzip/brotli) ── */
  compress: true,

  /* ── Production caching headers ── */
  async headers() {
    return [
      {
        /* Static assets: cache for 1 year */
        source: "/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif|woff|woff2|ttf)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        /* Video assets: cache for 1 year */
        source: "/video/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        /* JS/CSS chunks: cache for 1 year (content-hashed) */
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
