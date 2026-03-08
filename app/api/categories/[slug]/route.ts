import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Category from "@/models/Category";
import type { CategoryLevel, CategoryStatus } from "@/models/Category";
import mongoose from "mongoose";

/* ================================================================
   /api/categories/[slug]  (PUBLIC)
   ================================================================
   Returns a single "mere" category with its full sub-tree:
     { id, name, slug, subcategories: [{ id, name, slug, items: [...] }] }
   Used by the storefront category listing page.
   ================================================================ */

interface LeanCat {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  level: CategoryLevel;
  parent: mongoose.Types.ObjectId | null;
  status: CategoryStatus;
  order: number;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await connectDB();

    const { slug } = await params;

    /* Find the "mere" category by slug */
    const mere = await Category.findOne({
      slug,
      level: "mere",
      status: "active",
    }).lean<LeanCat>();

    if (!mere) {
      return NextResponse.json(
        { error: "Catégorie introuvable." },
        { status: 404 },
      );
    }

    /* Fetch all active children (sous + finale) in one query */
    const children = await Category.find({
      status: "active",
      $or: [
        { level: "sous", parent: mere._id },
        { level: "finale", parent: { $exists: true } },
      ],
    })
      .sort({ order: 1, createdAt: 1 })
      .lean<LeanCat[]>();

    /* Separate sous and finale */
    const sousList = children.filter(
      (c) => c.level === "sous" && String(c.parent) === String(mere._id),
    );

    const finaleMap = new Map<string, LeanCat[]>();
    for (const c of children) {
      if (c.level === "finale") {
        const pid = String(c.parent);
        if (!finaleMap.has(pid)) finaleMap.set(pid, []);
        finaleMap.get(pid)!.push(c);
      }
    }

    /* Build tree — only include sous that belong to this mere */
    const subcategories = sousList.map((sous) => {
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
    });

    return NextResponse.json(
      {
        category: {
          id: String(mere._id),
          name: mere.name,
          slug: mere.slug,
          subcategories,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (err) {
    console.error("[GET /api/categories/[slug]]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
