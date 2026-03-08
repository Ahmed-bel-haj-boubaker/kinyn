import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { apiGuard } from "@/lib/security";
import { getOrderById, cancelOrder } from "@/lib/services/order.service";

/* ================================================================
   /api/orders/[id]
   ================================================================
   GET    — Get a single order (owner only)
   PATCH  — Cancel an order (owner, pending/confirmed only)
   ================================================================ */

interface Params {
  params: Promise<{ id: string }>;
}

/* ──────────── GET /api/orders/[id] ──────────── */

export async function GET(req: NextRequest, { params }: Params) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const payload = getAuthFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;
  const result = await getOrderById(id, payload.userId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json({ order: result.data }, { status: 200 });
}

/* ──────────── PATCH /api/orders/[id] — Cancel ──────────── */

export async function PATCH(req: NextRequest, { params }: Params) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 10, windowSec: 60 },
  });
  if (guardError) return guardError;

  const payload = getAuthFromRequest(req);
  if (!payload) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;
  const result = await cancelOrder(id, payload.userId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json({ order: result.data }, { status: 200 });
}
