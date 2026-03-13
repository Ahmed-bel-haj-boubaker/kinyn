import { NextRequest, NextResponse } from "next/server";
import {
  listAdmins,
  createAdmin,
  getAdminStats,
  setAuthCookie,
} from "@/lib/services/auth.service";
import { requireSuperAdmin } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import type { UserRole } from "@/models/User";

/* ================================================================
   /api/admin/admins
   ================================================================
   GET  — List all admins (with search / filter / pagination)
   POST — Create a new admin account
   Both endpoints require super_admin role.
   ================================================================ */

/* ──────────── GET /api/admin/admins ──────────── */

export async function GET(req: NextRequest) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const auth = requireSuperAdmin(req);
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? undefined;
  const role = url.searchParams.get("role") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);

  /* Fetch admins + stats in parallel */
  const [adminsResult, statsResult] = await Promise.all([
    listAdmins({ search, role, status, page, limit }),
    getAdminStats(),
  ]);

  if (!adminsResult.success) {
    return NextResponse.json(
      { error: adminsResult.error },
      { status: adminsResult.status ?? 500 },
    );
  }

  return NextResponse.json(
    {
      admins: adminsResult.data!.admins,
      total: adminsResult.data!.total,
      stats: statsResult.success ? statsResult.data : null,
    },
    { status: 200 },
  );
}

/* ──────────── POST /api/admin/admins ──────────── */

export async function POST(req: NextRequest) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 20, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireSuperAdmin(req);
  if ("error" in auth) return auth.error;

  const parsed = await parseBody<{
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    role: UserRole;
    status?: "active" | "inactive";
    avatar?: string;
  }>(req);

  if ("error" in parsed) return parsed.error;

  const result = await createAdmin(parsed.data, auth.payload);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  /* If the new admin was created during the request, we also want to
     keep the requester's auth cookie valid. Just return the data. */
  const response = NextResponse.json(
    { message: "Administrateur créé avec succès.", admin: result.data },
    { status: 201 },
  );

  /* Re-set the cookie so it doesn't get lost */
  const token = req.cookies.get("token")?.value;
  if (token) {
    setAuthCookie(response, token);
  }

  return response;
}
