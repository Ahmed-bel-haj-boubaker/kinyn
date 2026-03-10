import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import mongoose from "mongoose";

/* ================================================================
   /api/products/[slug]  (PUBLIC)
   ================================================================
   Returns a single active product by its slug.
   Used by the storefront product detail page.
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await connectDB();

    const { slug } = await params;

    const product = await Product.findOne({ slug, status: "active" })
      .populate([
        { path: "categoryMere", select: "name slug" },
        { path: "categorySous", select: "name slug" },
        { path: "categoryFinale", select: "name slug" },
      ])
      .lean<LeanProduct>();

    if (!product) {
      return NextResponse.json(
        { error: "Produit introuvable." },
        { status: 404 },
      );
    }

    const mere = resolveCat(product.categoryMere);
    const sous = resolveCat(product.categorySous);
    const finale = resolveCat(product.categoryFinale);

    const imgs = product.images ?? [];
    const imageUrls = imgs.map((img) =>
      typeof img === "string" ? img : img.url,
    );
    const imageColors = imgs
      .filter((img) => typeof img !== "string" && img.color)
      .map((img) => (typeof img === "string" ? "" : img.color));
    const allColors = Array.from(
      new Set([...(product.colors ?? []), ...imageColors]),
    );

    return NextResponse.json(
      {
        product: {
          id: String(product._id),
          name: product.name,
          slug: product.slug,
          description: product.description,
          price: product.price,
          promoPrice: product.promoPrice,
          stock: product.stock,
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
          sizes: product.sizes ?? [],
          colors: allColors,
          categoryMere: mere.name,
          categoryMereSlug: mere.slug,
          categorySous: sous.name,
          categorySousSlug: sous.slug,
          categoryFinale: finale.name,
          categoryFinaleSlug: finale.slug,
          createdAt: product.createdAt,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (err) {
    console.error("[GET /api/products/[slug]]", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
