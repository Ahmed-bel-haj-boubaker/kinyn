import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess, requireWriteAccess } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import {
  listDeliveryCompanies,
  createDeliveryCompany,
  getDeliveryCompanyStats,
} from "@/lib/services/delivery.service";

/* ================================================================
   /api/admin/deliveries
   ================================================================
   GET  — List all delivery companies (search / filter) — all admin roles
   POST — Create a new delivery company — admin & super_admin only
   ================================================================ */

/* ──────────── GET /api/admin/deliveries ──────────── */

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

  const [companiesResult, statsResult] = await Promise.all([
    listDeliveryCompanies({ search, status, page, limit }),
    getDeliveryCompanyStats(),
  ]);

  if (!companiesResult.success) {
    return NextResponse.json(
      { error: companiesResult.error },
      { status: companiesResult.status ?? 500 },
    );
  }

  return NextResponse.json(
    {
      companies: companiesResult.data!.companies,
      total: companiesResult.data!.total,
      stats: statsResult.success ? statsResult.data : null,
    },
    { status: 200 },
  );
}

/* ──────────── POST /api/admin/deliveries ──────────── */

export async function POST(req: NextRequest) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireWriteAccess(req);
  if ("error" in auth) return auth.error;

  const parsed = await parseBody<{
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    price: number;
    notes?: string;
  }>(req);

  if ("error" in parsed) return parsed.error;

  const result = await createDeliveryCompany(parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    { message: "Société créée avec succès.", company: result.data },
    { status: 201 },
  );
}
