import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess, requireWriteAccess } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import {
  listShipments,
  createShipment,
  getShipmentStats,
} from "@/lib/services/shipment.service";

/* ================================================================
   /api/admin/shipments
   ================================================================
   GET  — List all shipments (search / filter) — all admin roles
   POST — Create a new shipment — admin & super_admin only
   ================================================================ */

/* ──────────── GET /api/admin/shipments ──────────── */

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

  const [shipmentsResult, statsResult] = await Promise.all([
    listShipments({ search, status, page, limit }),
    getShipmentStats(),
  ]);

  if (!shipmentsResult.success) {
    return NextResponse.json(
      { error: shipmentsResult.error },
      { status: shipmentsResult.status ?? 500 },
    );
  }

  return NextResponse.json(
    {
      shipments: shipmentsResult.data!.shipments,
      total: shipmentsResult.data!.total,
      stats: statsResult.success ? statsResult.data : null,
    },
    { status: 200 },
  );
}

/* ──────────── POST /api/admin/shipments ──────────── */

export async function POST(req: NextRequest) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireWriteAccess(req);
  if ("error" in auth) return auth.error;

  const parsed = await parseBody<{
    deliveryCompany: string;
    order: string;
    trackingNumber?: string;
    notes?: string;
  }>(req);

  if ("error" in parsed) return parsed.error;

  const result = await createShipment(parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    { message: "Expédition créée avec succès.", shipment: result.data },
    { status: 201 },
  );
}
