import type { MetadataRoute } from "next";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import Product from "@/models/Product";
import Collection from "@/models/Collection";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kinyn.tn";

interface LeanSlug {
  slug: string;
  updatedAt: Date;
}

interface LeanProductSlug extends LeanSlug {
  categoryMere: { slug: string } | null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectDB();

  /* ── Static pages ── */
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  /* ── Categories (mere + sous + finale) ── */
  const categories = await Category.find({ status: "active" })
    .select("slug level parent updatedAt")
    .populate("parent", "slug")
    .lean<(LeanSlug & { level: string; parent: { slug: string } | null })[]>();

  const mereMap = new Map<string, string>();
  const categoryPages: MetadataRoute.Sitemap = [];

  for (const cat of categories) {
    if (cat.level === "mere") {
      mereMap.set(
        (cat as unknown as { _id: { toString(): string } })._id.toString(),
        cat.slug,
      );
      categoryPages.push({
        url: `${SITE_URL}/${cat.slug}`,
        lastModified: cat.updatedAt,
        changeFrequency: "weekly",
        priority: 0.9,
      });
    }
  }

  for (const cat of categories) {
    if (cat.level === "sous" && cat.parent) {
      categoryPages.push({
        url: `${SITE_URL}/${cat.parent.slug}/${cat.slug}`,
        lastModified: cat.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    if (cat.level === "finale" && cat.parent) {
      categoryPages.push({
        url: `${SITE_URL}/${cat.parent.slug}/${cat.slug}`,
        lastModified: cat.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  /* ── Products ── */
  const products = await Product.find({
    status: { $in: ["active", "outofstock"] },
  })
    .select("slug categoryMere updatedAt")
    .populate("categoryMere", "slug")
    .lean<LeanProductSlug[]>();

  const productPages: MetadataRoute.Sitemap = products
    .filter((p) => p.categoryMere?.slug)
    .map((p) => ({
      url: `${SITE_URL}/${p.categoryMere!.slug}/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  /* ── Collections ── */
  const collections = await Collection.find({ status: "active" })
    .select("slug updatedAt")
    .lean<LeanSlug[]>();

  const collectionPages: MetadataRoute.Sitemap = collections.map((c) => ({
    url: `${SITE_URL}/collections/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...categoryPages,
    ...productPages,
    ...collectionPages,
  ];
}
