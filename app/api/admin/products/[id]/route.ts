import { NextRequest, NextResponse } from "next/server";
import { updateProduct, deleteProduct } from "@/lib/services/product.service";
import { checkAndNotifyLowStock } from "@/lib/services/notification.service";
import { requireWriteAccess } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import type { ProductStatus } from "@/models/Product";

/* ================================================================
   /api/admin/products/[id]
   ================================================================
   PUT    — Update a product — admin & super_admin only
   DELETE — Delete a product — admin & super_admin only
   ================================================================ */

/* ──────────── PUT /api/admin/products/[id] ──────────── */

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireWriteAccess(req);
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
    sizeStock?: { size: string; stock: number }[];
    status?: ProductStatus;
    images?: { url: string; color?: string; colorHex?: string }[];
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

  if (parsed.data.sizeStock !== undefined) {
    checkAndNotifyLowStock([id]).catch(() => {});
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

  const auth = requireWriteAccess(req);
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
