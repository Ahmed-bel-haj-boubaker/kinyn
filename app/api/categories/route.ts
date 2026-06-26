import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import type { CategoryLevel, CategoryStatus } from "@/models/Category";

export const dynamic = "force-dynamic";

/* ================================================================
   /api/categories  (PUBLIC)
   ================================================================
   Returns the full active category tree structured as:
     mere → sous[] → finale[]
   No authentication required — used by the storefront navbar.
   Response is cached for 60 seconds via Cache-Control.
   ================================================================ */

interface LeanCat {
  _id: string;
  name: string;
  slug: string;
  level: CategoryLevel;
  parent: string | null;
  status: CategoryStatus;
  order: number;
}

export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find({ status: "active" })
      .select("name slug level parent order")
      .sort({ order: 1, createdAt: 1 })
      .lean<LeanCat[]>();

    /* ── Build lookup maps ── */
    const meres: LeanCat[] = [];
    const sousMap = new Map<string, LeanCat[]>(); // parentId → sous[]
    const finaleMap = new Map<string, LeanCat[]>(); // parentId → finale[]

    for (const cat of categories) {
      if (cat.level === "mere") {
        meres.push(cat);
      } else if (cat.level === "sous") {
        const pid = String(cat.parent);
        if (!sousMap.has(pid)) sousMap.set(pid, []);
        sousMap.get(pid)!.push(cat);
      } else if (cat.level === "finale") {
        const pid = String(cat.parent);
        if (!finaleMap.has(pid)) finaleMap.set(pid, []);
        finaleMap.get(pid)!.push(cat);
      }
    }

    /* ── Assemble tree ── */
    const tree = meres.map((mere) => {
      const subs = sousMap.get(String(mere._id)) ?? [];
      return {
        id: String(mere._id),
        name: mere.name,
        slug: mere.slug,
        subcategories: subs.map((sous) => {
          const items = finaleMap.get(String(sous._id)) ?? [];
          return {
            id: String(sous._id),
            name: sous.name,
            slug: sous.slug,
            items: items.map((fin) => ({
              id: String(fin._id),
              name: fin.name,
              slug: fin.slug,
            })),
          };
        }),
      };
    });

    return NextResponse.json(
      { categories: tree },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache",
        },
      },
    );
  } catch (err) {
    console.error("[GET /api/categories]", err);
    return NextResponse.json(
      { error: "Erreur lors du chargement des catégories." },
      { status: 500 },
    );
  }
}
