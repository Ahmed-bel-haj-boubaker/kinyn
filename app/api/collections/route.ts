import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Collection from "@/models/Collection";
import type { CollectionStatus } from "@/models/Collection";

interface LeanCollection {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  products: string[];
  status: CollectionStatus;
  order: number;
}

export async function GET() {
  try {
    await connectDB();

    const collections = await Collection.find({ status: "active" })
      .select("name slug description image products order")
      .sort({ order: 1, createdAt: -1 })
      .populate("products", "name slug price promoPrice images status")
      .lean<LeanCollection[]>();

    const result = collections.map((col) => ({
      id: String(col._id),
      name: col.name,
      slug: col.slug,
      description: col.description,
      image: col.image,
      products: col.products,
      productCount: col.products.length,
    }));

    return NextResponse.json(
      { collections: result },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (err) {
    console.error("[GET /api/collections]", err);
    return NextResponse.json(
      { error: "Erreur lors du chargement des collections." },
      { status: 500 },
    );
  }
}
