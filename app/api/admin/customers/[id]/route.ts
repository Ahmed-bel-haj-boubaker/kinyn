import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import {
  getCustomerById,
  updateCustomerStatus,
  deleteCustomer,
} from "@/lib/services/customer.service";
import type { UserStatus } from "@/models/User";

/* ================================================================
   /api/admin/customers/[id]
   ================================================================
   GET    — Get single customer detail + orders
   PATCH  — Update customer status
   DELETE — Delete customer (only if no active orders)
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

/* ──────────── GET /api/admin/customers/[id] ──────────── */

export async function GET(req: NextRequest, { params }: Params) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const auth = requireAdmin(req);
  if ("error" in auth && auth.error) return auth.error;

  const { id } = await params;
  const result = await getCustomerById(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json({ customer: result.data }, { status: 200 });
}

/* ──────────── PATCH /api/admin/customers/[id] ──────────── */

export async function PATCH(req: NextRequest, { params }: Params) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireAdmin(req);
  if ("error" in auth && auth.error) return auth.error;

  const { id } = await params;

  const parsed = await parseBody<{ status: UserStatus }>(req);
  if ("error" in parsed) return parsed.error;

  const { status } = parsed.data;
  if (!status) {
    return NextResponse.json(
      { error: "Le statut est requis." },
      { status: 400 },
    );
  }

  const result = await updateCustomerStatus(id, status);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json(
    { message: "Statut mis à jour.", customer: result.data },
    { status: 200 },
  );
}

/* ──────────── DELETE /api/admin/customers/[id] ──────────── */

export async function DELETE(req: NextRequest, { params }: Params) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 10, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireAdmin(req);
  if ("error" in auth && auth.error) return auth.error;

  const { id } = await params;
  const result = await deleteCustomer(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json(
    { message: "Client supprimé avec succès." },
    { status: 200 },
  );
}
