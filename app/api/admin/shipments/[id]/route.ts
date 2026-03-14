import { NextRequest, NextResponse } from "next/server";
import {
  getShipmentById,
  updateShipment,
  deleteShipment,
} from "@/lib/services/shipment.service";
import { requireAdminAccess, requireWriteAccess } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import type { ShipmentStatus } from "@/models/Shipment";

/* ================================================================
   /api/admin/shipments/[id]
   ================================================================
   GET    — Get single shipment details — all admin roles
   PATCH  — Update shipment (status, tracking, etc.) — admin & super_admin only
   DELETE — Delete shipment — admin & super_admin only
   ================================================================ */

interface Params {
  params: Promise<{ id: string }>;
}

/* ──────────── GET /api/admin/shipments/[id] ──────────── */

export async function GET(req: NextRequest, { params }: Params) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const auth = requireAdminAccess(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const result = await getShipmentById(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json({ shipment: result.data }, { status: 200 });
}

/* ──────────── PATCH /api/admin/shipments/[id] ──────────── */

export async function PATCH(req: NextRequest, { params }: Params) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireWriteAccess(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const parsed = await parseBody<{
    deliveryCompany?: string;
    order?: string;
    status?: ShipmentStatus;
    trackingNumber?: string;
    notes?: string;
  }>(req);

  if ("error" in parsed) return parsed.error;

  const result = await updateShipment(id, parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    { message: "Expédition modifiée avec succès.", shipment: result.data },
    { status: 200 },
  );
}

/* ──────────── DELETE /api/admin/shipments/[id] ──────────── */

export async function DELETE(req: NextRequest, { params }: Params) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 10, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireWriteAccess(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const result = await deleteShipment(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
