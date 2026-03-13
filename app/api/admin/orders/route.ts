import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/auth";
import { apiGuard } from "@/lib/security";
import { listOrders, getOrderStats } from "@/lib/services/order.service";

/* ================================================================
   /api/admin/orders
   ================================================================
   GET — List all orders (all admin roles) with search/filter/pagination
   ================================================================ */

export async function GET(req: NextRequest) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const auth = requireAdminAccess(req);
  if ("error" in auth) return auth.error;

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
