import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess, requireWriteAccess } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import {
  listDeliveryMethods,
  createDeliveryMethod,
  getDeliveryMethodStats,
} from "@/lib/services/deliveryMethod.service";

/* ================================================================
   /api/admin/delivery-methods
   ================================================================
   GET  — List all delivery methods — all admin roles
   POST — Create a new delivery method — admin & super_admin only
   ================================================================ */

/* ──────────── GET ──────────── */

export async function GET(req: NextRequest) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const auth = requireAdminAccess(req);
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);

  const [methodsResult, statsResult] = await Promise.all([
    listDeliveryMethods({ status, page, limit }),
    getDeliveryMethodStats(),
  ]);

  if (!methodsResult.success) {
    return NextResponse.json(
      { error: methodsResult.error },
      { status: methodsResult.status ?? 500 },
    );
  }

  return NextResponse.json(
    {
      methods: methodsResult.data!.methods,
      total: methodsResult.data!.total,
      stats: statsResult.success ? statsResult.data : null,
    },
    { status: 200 },
  );
}

/* ──────────── POST ──────────── */

export async function POST(req: NextRequest) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireWriteAccess(req);
  if ("error" in auth) return auth.error;

  const parsed = await parseBody<{
    name: string;
    description?: string;
    price: number;
    estimatedDays?: string;
  }>(req);

  if ("error" in parsed) return parsed.error;

  const result = await createDeliveryMethod(parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    { message: "Méthode créée avec succès.", method: result.data },
    { status: 201 },
  );
}
