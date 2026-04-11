import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Collection from "@/models/Collection";
import Product from "@/models/Product";
import mongoose from "mongoose";

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
  sizeStock: { size: string; stock: number }[];
  images: { url: string; color?: string; colorHex?: string }[];
  colors: string[];
  status: string;
  categoryMere: LeanCat | mongoose.Types.ObjectId;
  categorySous: LeanCat | mongoose.Types.ObjectId | null;
  categoryFinale: LeanCat | mongoose.Types.ObjectId | null;
  createdAt: Date;
}

function resolveCat(ref: LeanCat | mongoose.Types.ObjectId | null) {
  if (!ref) return { id: "", name: "", slug: "" };
  if (typeof ref === "object" && "name" in ref) {
    return { id: String(ref._id), name: ref.name, slug: ref.slug };
  }
  return { id: String(ref), name: "", slug: "" };
}

interface LeanCollection {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  image: string;
  products: mongoose.Types.ObjectId[];
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    await connectDB();

    const col = await Collection.findOne({ slug, status: "active" })
      .select("name slug description image products")
      .lean<LeanCollection>();

    if (!col) {
      return NextResponse.json(
        { error: "Collection introuvable." },
        { status: 404 },
      );
    }

    const productIds = col.products ?? [];

    const products = await Product.find({
      _id: { $in: productIds },
      status: { $in: ["active", "outofstock"] },
    })
      .populate([
        { path: "categoryMere", select: "name slug" },
        { path: "categorySous", select: "name slug" },
        { path: "categoryFinale", select: "name slug" },
      ])
      .sort({ createdAt: -1 })
      .lean<LeanProduct[]>();

    const mappedProducts = products.map((p) => {
      const mere = resolveCat(p.categoryMere);
      const sous = resolveCat(p.categorySous);
      const finale = resolveCat(p.categoryFinale);

      const imgs = p.images ?? [];
      const sizeStock = p.sizeStock ?? [];
      const totalStock = sizeStock.reduce((sum, s) => sum + s.stock, 0);

      return {
        id: String(p._id),
        name: p.name,
        slug: p.slug,
        description: p.description ?? "",
        price: p.price,
        promoPrice: p.promoPrice ?? null,
        stock: totalStock,
        sizeStock,
        image: imgs[0]?.url ?? "",
        images: imgs.map((img) => ({
          url: img.url,
          color: img.color ?? "",
          colorHex: img.colorHex ?? "",
        })),
        sizes: sizeStock.map((s) => s.size),
        colors: Array.from(
          new Set([
            ...(p.colors ?? []),
            ...imgs.map((i) => i.color ?? "").filter(Boolean),
          ]),
        ),
        categoryMere: mere.name,
        categoryMereSlug: mere.slug,
        categorySous: sous.name,
        categorySousSlug: sous.slug,
        categoryFinale: finale.name,
        categoryFinaleSlug: finale.slug,
        createdAt: p.createdAt,
      };
    });

    const result = {
      id: String(col._id),
      name: col.name,
      slug: col.slug,
      description: col.description,
      image: col.image,
      products: mappedProducts,
    };

    return NextResponse.json(
      { collection: result },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (err) {
    console.error("[GET /api/collections/[slug]]", err);
    return NextResponse.json(
      { error: "Erreur lors du chargement de la collection." },
      { status: 500 },
    );
  }
}
