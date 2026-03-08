import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import { getOrderById, updateOrderStatus } from "@/lib/services/order.service";
import type { OrderStatus } from "@/models/Order";

/* ================================================================
   /api/admin/orders/[id]
   ================================================================
   GET   — Get single order details (admin)
   PATCH — Update order status (admin)
   ================================================================ */

function requireAdmin(req: NextRequest) {
  const payload = getAuthFromRequest(req);
  if (!payload) {
    return {
      error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }),
    };
  }
  if (payload.role !== "admin" && payload.role !== "super_admin") {
    return {
      error: NextResponse.json({ error: "Accès refusé." }, { status: 403 }),
    };
  }
  return { payload };
}

interface Params {
  params: Promise<{ id: string }>;
}

/* ──────────── GET /api/admin/orders/[id] ──────────── */

export async function GET(req: NextRequest, { params }: Params) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const auth = requireAdmin(req);
  if ("error" in auth && auth.error) return auth.error;

  const { id } = await params;
  const result = await getOrderById(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json({ order: result.data }, { status: 200 });
}

/* ──────────── PATCH /api/admin/orders/[id] ──────────── */

export async function PATCH(req: NextRequest, { params }: Params) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireAdmin(req);
  if ("error" in auth && auth.error) return auth.error;

  const { id } = await params;

  const parsed = await parseBody<{ status: OrderStatus }>(req);
  if ("error" in parsed) return parsed.error;

  const { status } = parsed.data;
  if (!status) {
    return NextResponse.json(
      { error: "Le statut est requis." },
      { status: 400 },
    );
  }

  const result = await updateOrderStatus(id, status);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json({ order: result.data }, { status: 200 });
}
