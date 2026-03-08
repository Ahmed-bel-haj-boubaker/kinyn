import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { apiGuard } from "@/lib/security";
import {
  listCustomers,
  getCustomerStats,
} from "@/lib/services/customer.service";

/* ================================================================
   /api/admin/customers
   ================================================================
   GET — List customers (role=user) with search/filter/pagination
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
  const hasOrders = url.searchParams.get("hasOrders") ?? undefined;
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);

  const [customersResult, statsResult] = await Promise.all([
    listCustomers({ search, status, hasOrders, page, limit }),
    getCustomerStats(),
  ]);

  if (!customersResult.success) {
    return NextResponse.json(
      { error: customersResult.error },
      { status: customersResult.status ?? 500 },
    );
  }

  return NextResponse.json(
    {
      customers: customersResult.data!.customers,
      total: customersResult.data!.total,
      stats: statsResult.success ? statsResult.data : null,
    },
    { status: 200 },
  );
}
