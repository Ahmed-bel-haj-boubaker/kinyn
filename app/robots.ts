import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kinyn.tn";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/", "/profile/", "/checkout/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
