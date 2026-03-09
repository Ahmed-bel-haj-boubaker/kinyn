import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import { getWishlist, addToWishlist } from "@/lib/services/wishlist.service";

/* ================================================================
   /api/auth/me/wishlist
   ================================================================
   GET  — Get the authenticated user's wishlist (populated products)
   POST — Add a product to the wishlist
   ================================================================ */

/* ──────────── GET /api/auth/me/wishlist ──────────── */

export async function GET(req: NextRequest) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const payload = getAuthFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const result = await getWishlist(payload.userId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json({ products: result.data }, { status: 200 });
}

/* ──────────── POST /api/auth/me/wishlist ──────────── */

export async function POST(req: NextRequest) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const payload = getAuthFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const parsed = await parseBody<{ productId: string }>(req);
  if ("error" in parsed) return parsed.error;

  const { productId } = parsed.data;
  if (!productId?.trim()) {
    return NextResponse.json(
      { error: "L'ID du produit est requis." },
      { status: 400 },
    );
  }

  const result = await addToWishlist(payload.userId, productId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json(result.data, { status: 200 });
}
