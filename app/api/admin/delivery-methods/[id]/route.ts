import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess, requireWriteAccess } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import {
  getDeliveryMethodById,
  updateDeliveryMethod,
  deleteDeliveryMethod,
} from "@/lib/services/deliveryMethod.service";
import type { DeliveryMethodStatus } from "@/models/DeliveryMethod";

/* ================================================================
   /api/admin/delivery-methods/[id]
   ================================================================
   GET    — Get a single delivery method
   PATCH  — Update a delivery method
   DELETE — Delete a delivery method
   ================================================================ */

interface RouteContext {
  params: Promise<{ id: string }>;
}

/* ──────────── GET ──────────── */

export async function GET(req: NextRequest, ctx: RouteContext) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const auth = requireAdminAccess(req);
  if ("error" in auth) return auth.error;

  const { id } = await ctx.params;
  const result = await getDeliveryMethodById(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json({ method: result.data }, { status: 200 });
}

/* ──────────── PATCH ──────────── */

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireWriteAccess(req);
  if ("error" in auth) return auth.error;

  const { id } = await ctx.params;
  const parsed = await parseBody<{
    name?: string;
    description?: string;
    price?: number;
    estimatedDays?: string;
    status?: DeliveryMethodStatus;
  }>(req);

  if ("error" in parsed) return parsed.error;

  const result = await updateDeliveryMethod(id, parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    { message: "Méthode modifiée avec succès.", method: result.data },
    { status: 200 },
  );
}

/* ──────────── DELETE ──────────── */

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 20, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireWriteAccess(req);
  if ("error" in auth) return auth.error;

  const { id } = await ctx.params;
  const result = await deleteDeliveryMethod(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    { message: "Méthode supprimée avec succès." },
    { status: 200 },
  );
}
