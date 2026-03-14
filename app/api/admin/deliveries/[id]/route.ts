import { NextRequest, NextResponse } from "next/server";
import {
  getDeliveryCompanyById,
  updateDeliveryCompany,
  deleteDeliveryCompany,
} from "@/lib/services/delivery.service";
import { requireAdminAccess, requireWriteAccess } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import type { DeliveryCompanyStatus } from "@/models/Delivery";

/* ================================================================
   /api/admin/deliveries/[id]
   ================================================================
   GET    — Get single delivery company details — all admin roles
   PATCH  — Update delivery company — admin & super_admin only
   DELETE — Delete delivery company — admin & super_admin only
   ================================================================ */

interface Params {
  params: Promise<{ id: string }>;
}

/* ──────────── GET /api/admin/deliveries/[id] ──────────── */

export async function GET(req: NextRequest, { params }: Params) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const auth = requireAdminAccess(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const result = await getDeliveryCompanyById(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json({ company: result.data }, { status: 200 });
}

/* ──────────── PATCH /api/admin/deliveries/[id] ──────────── */

export async function PATCH(req: NextRequest, { params }: Params) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireWriteAccess(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const parsed = await parseBody<{
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    price?: number;
    status?: DeliveryCompanyStatus;
    notes?: string;
  }>(req);

  if ("error" in parsed) return parsed.error;

  const result = await updateDeliveryCompany(id, parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    { message: "Société modifiée avec succès.", company: result.data },
    { status: 200 },
  );
}

/* ──────────── DELETE /api/admin/deliveries/[id] ──────────── */

export async function DELETE(req: NextRequest, { params }: Params) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 10, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireWriteAccess(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const result = await deleteDeliveryCompany(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
