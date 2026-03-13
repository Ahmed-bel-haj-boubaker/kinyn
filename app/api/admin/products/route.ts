import { NextRequest, NextResponse } from "next/server";
import {
  listProducts,
  createProduct,
  getProductStats,
} from "@/lib/services/product.service";
import { requireAdminAccess, requireWriteAccess } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import type { ProductStatus } from "@/models/Product";

/* ================================================================
   /api/admin/products
   ================================================================
   GET  — List products (search / filter / pagination) — all admin roles
   POST — Create a new product — admin & super_admin only
   ================================================================ */

/* ──────────── GET /api/admin/products ──────────── */

export async function GET(req: NextRequest) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const auth = requireAdminAccess(req);
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? undefined;
  const categoryMere = url.searchParams.get("categoryMere") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);

  const [productsResult, statsResult] = await Promise.all([
    listProducts({ search, categoryMere, status, page, limit }),
    getProductStats(),
  ]);

  if (!productsResult.success) {
    return NextResponse.json(
      { error: productsResult.error },
      { status: productsResult.status ?? 500 },
    );
  }

  return NextResponse.json(
    {
      products: productsResult.data!.products,
      total: productsResult.data!.total,
      stats: statsResult.success ? statsResult.data : null,
    },
    { status: 200 },
  );
}

/* ──────────── POST /api/admin/products ──────────── */

export async function POST(req: NextRequest) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireWriteAccess(req);
  if ("error" in auth) return auth.error;

  const parsed = await parseBody<{
    name: string;
    description?: string;
    sku: string;
    categoryMere: string;
    categorySous?: string;
    categoryFinale?: string;
    price: number;
    promoPrice?: number | null;
    stock: number;
    status?: ProductStatus;
    images?: { url: string; color?: string; colorHex?: string }[];
    sizes?: string[];
    colors?: string[];
  }>(req);

  if ("error" in parsed) return parsed.error;

  const result = await createProduct(parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    { message: "Produit créé avec succès.", product: result.data },
    { status: 201 },
  );
}
