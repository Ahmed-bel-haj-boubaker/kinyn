import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Category from "@/models/Category";
import mongoose from "mongoose";

/* ================================================================
   /api/products  (PUBLIC)
   ================================================================
   Returns active products with filtering by category slug, search,
   sort and pagination. Used by the storefront listing pages.

   Query params:
     mere      — mere category slug  (e.g. "femme")
     sous      — sous category slug   (e.g. "hauts")
     finale    — finale category slug (e.g. "t-shirt")
     search    — free text search on name
     sort      — newest | price-asc | price-desc | popular
     page      — page number (default 1)
     limit     — items per page (default 50, max 100)
   ================================================================ */

interface LeanCat {
  _id: mongoose.Types.ObjectId;
  slug: string;
  name: string;
}

interface LeanProduct {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  price: number;
  promoPrice: number | null;
  stock: number;
  images: { url: string; color: string }[];
  sizes: string[];
  colors: string[];
  categoryMere: LeanCat | mongoose.Types.ObjectId;
  categorySous: LeanCat | mongoose.Types.ObjectId | null;
  categoryFinale: LeanCat | mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

function resolveCat(ref: LeanCat | mongoose.Types.ObjectId | null): {
  id: string;
  name: string;
  slug: string;
} {
  if (!ref) return { id: "", name: "", slug: "" };
  if (typeof ref === "object" && "name" in ref) {
    return { id: String(ref._id), name: ref.name, slug: ref.slug };
  }
  return { id: String(ref), name: "", slug: "" };
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const url = new URL(req.url);
    const mereSlug = url.searchParams.get("mere") ?? undefined;
    const sousSlug = url.searchParams.get("sous") ?? undefined;
    const finaleSlug = url.searchParams.get("finale") ?? undefined;
    const search = url.searchParams.get("search") ?? undefined;
    const sort = url.searchParams.get("sort") ?? "newest";
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("limit") ?? "50", 10)),
    );
    const skip = (page - 1) * limit;

    /* ── Build filter ── */
    const filter: Record<string, unknown> = { status: "active" };

    // Resolve category slugs to IDs
    if (mereSlug) {
      const mereCat = await Category.findOne({
        slug: mereSlug,
        level: "mere",
        status: "active",
      }).lean<LeanCat>();
      if (!mereCat) {
        return NextResponse.json({ products: [], total: 0 }, { status: 200 });
      }
      filter.categoryMere = mereCat._id;

      if (sousSlug) {
        const sousCat = await Category.findOne({
          slug: sousSlug,
          level: "sous",
          parent: mereCat._id,
          status: "active",
        }).lean<LeanCat>();
        if (!sousCat) {
          return NextResponse.json({ products: [], total: 0 }, { status: 200 });
        }
        filter.categorySous = sousCat._id;

        if (finaleSlug) {
          const finaleCat = await Category.findOne({
            slug: finaleSlug,
            level: "finale",
            parent: sousCat._id,
            status: "active",
          }).lean<LeanCat>();
          if (!finaleCat) {
            return NextResponse.json(
              { products: [], total: 0 },
              { status: 200 },
            );
          }
          filter.categoryFinale = finaleCat._id;
        }
      } else if (finaleSlug) {
        // finale slug without sous — search across all sous under this mere
        const sousCats = await Category.find({
          level: "sous",
          parent: mereCat._id,
          status: "active",
        }).lean<LeanCat[]>();
        const sousIds = sousCats.map((s) => s._id);
        const finaleCat = await Category.findOne({
          slug: finaleSlug,
          level: "finale",
          parent: { $in: sousIds },
          status: "active",
        }).lean<LeanCat>();
        if (!finaleCat) {
          return NextResponse.json({ products: [], total: 0 }, { status: 200 });
        }
        filter.categoryFinale = finaleCat._id;
      }
    }

    if (search?.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    /* ── Sort ── */
    let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
    switch (sort) {
      case "price-asc":
        sortObj = { price: 1 };
        break;
      case "price-desc":
        sortObj = { price: -1 };
        break;
      case "popular":
        sortObj = { stock: -1 }; // proxy for popularity
        break;
      case "newest":
      default:
        sortObj = { createdAt: -1 };
    }

    /* ── Query ── */
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate([
          { path: "categoryMere", select: "name slug" },
          { path: "categorySous", select: "name slug" },
          { path: "categoryFinale", select: "name slug" },
        ])
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean<LeanProduct[]>(),
      Product.countDocuments(filter),
    ]);

    /* ── Map to client shape ── */
    const items = products.map((p) => {
      const mere = resolveCat(p.categoryMere);
      const sous = resolveCat(p.categorySous);
      const finale = resolveCat(p.categoryFinale);

      const imgs = p.images ?? [];
      const imageUrls = imgs.map((img) =>
        typeof img === "string" ? img : img.url,
      );
      const imageColors = imgs
        .filter((img) => typeof img !== "string" && img.color)
        .map((img) => (typeof img === "string" ? "" : img.color));
      const allColors = Array.from(
        new Set([...(p.colors ?? []), ...imageColors]),
      );

      return {
        id: String(p._id),
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        promoPrice: p.promoPrice,
        stock: p.stock,
        image: imageUrls[0] ?? "",
        images: imgs.map((img) =>
          typeof img === "string"
            ? { url: img, color: "", colorHex: "" }
            : {
                url: img.url,
                color: img.color ?? "",
                colorHex:
                  ((img as Record<string, unknown>).colorHex as string) ?? "",
              },
        ),
        sizes: p.sizes ?? [],
        colors: allColors,
        categoryMere: mere.name,
        categoryMereSlug: mere.slug,
        categorySous: sous.name,
        categorySousSlug: sous.slug,
        categoryFinale: finale.name,
        categoryFinaleSlug: finale.slug,
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json(
      { products: items, total, page, limit },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (err) {
    console.error("[GET /api/products]", err);
    return NextResponse.json(
      { error: "Erreur lors du chargement des produits." },
      { status: 500 },
    );
  }
}
