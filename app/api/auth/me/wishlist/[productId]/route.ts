import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { apiGuard } from "@/lib/security";
import { removeFromWishlist } from "@/lib/services/wishlist.service";

/* ================================================================
   /api/auth/me/wishlist/[productId]
   ================================================================
   DELETE — Remove a product from the wishlist
   ================================================================ */

interface Params {
  params: Promise<{ productId: string }>;
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const payload = getAuthFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { productId } = await params;

  const result = await removeFromWishlist(payload.userId, productId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json(result.data, { status: 200 });
}
