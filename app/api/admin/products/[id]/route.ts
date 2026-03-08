import { NextRequest, NextResponse } from "next/server";
import { updateProduct, deleteProduct } from "@/lib/services/product.service";
import { getAuthFromRequest } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import type { ProductStatus } from "@/models/Product";

/* ================================================================
   /api/admin/products/[id]
   ================================================================
   PUT    — Update a product
   DELETE — Delete a product
   Both endpoints are admin-only.
   ================================================================ */

/* ──────────── Auth helper ──────────── */

function requireAdmin(req: NextRequest) {
  const payload = getAuthFromRequest(req);
  if (!payload) {
    return {
      error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }),
    };
  }
  if (payload.role !== "admin" && payload.role !== "super_admin") {
    return {
      error: NextResponse.json(
        { error: "Accès refusé. Droits insuffisants." },
        { status: 403 },
      ),
    };
  }
  return { payload };
}

/* ──────────── PUT /api/admin/products/[id] ──────────── */

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireAdmin(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const parsed = await parseBody<{
    name?: string;
    description?: string;
    sku?: string;
    categoryMere?: string;
    categorySous?: string | null;
    categoryFinale?: string | null;
    price?: number;
    promoPrice?: number | null;
    stock?: number;
    status?: ProductStatus;
    images?: string[];
    sizes?: string[];
    colors?: string[];
  }>(req);

  if ("error" in parsed) return parsed.error;

  const result = await updateProduct(id, parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    { message: "Produit modifié avec succès.", product: result.data },
    { status: 200 },
  );
}

/* ──────────── DELETE /api/admin/products/[id] ──────────── */

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 10, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireAdmin(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const result = await deleteProduct(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    {
      message: "Produit supprimé avec succès.",
      deletedId: result.data!.deletedId,
    },
    { status: 200 },
  );
}
