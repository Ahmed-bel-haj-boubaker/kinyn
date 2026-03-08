import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { apiGuard } from "@/lib/security";
import { listOrders, getOrderStats } from "@/lib/services/order.service";

/* ================================================================
   /api/admin/orders
   ================================================================
   GET — List all orders (admin only) with search/filter/pagination
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

export async function GET(req: NextRequest) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const auth = requireAdmin(req);
  if ("error" in auth && auth.error) return auth.error;

  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);

  const [ordersResult, statsResult] = await Promise.all([
    listOrders({ search, status, page, limit }),
    getOrderStats(),
  ]);

  if (!ordersResult.success) {
    return NextResponse.json(
      { error: ordersResult.error },
      { status: ordersResult.status ?? 500 },
    );
  }

  return NextResponse.json(
    {
      orders: ordersResult.data!.orders,
      total: ordersResult.data!.total,
      stats: statsResult.success ? statsResult.data : null,
    },
    { status: 200 },
  );
}
