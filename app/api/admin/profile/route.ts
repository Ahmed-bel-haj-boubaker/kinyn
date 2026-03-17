import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentUser,
  updateBusinessProfile,
} from "@/lib/services/auth.service";
import { requireAdminAccess } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";

/* ================================================================
   /api/admin/profile
   ================================================================
   GET  — Get current admin + business profile
   PUT  — Update business profile (store info + social links)
   ================================================================ */

/* ──────────── GET /api/admin/profile ──────────── */

export async function GET(req: NextRequest) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const auth = requireAdminAccess(req);
  if ("error" in auth) return auth.error;

  const result = await getCurrentUser(req);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 401 },
    );
  }

  return NextResponse.json({ user: result.data }, { status: 200 });
}

/* ──────────── PUT /api/admin/profile ──────────── */

export async function PUT(req: NextRequest) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 10, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireAdminAccess(req);
  if ("error" in auth) return auth.error;

  const parsed = await parseBody<{
    logo?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    socialLinks?: {
      instagram?: string;
      facebook?: string;
    };
  }>(req);

  if ("error" in parsed) return parsed.error;

  const result = await updateBusinessProfile(req, parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    { message: "Profil business mis à jour avec succès.", user: result.data },
    { status: 200 },
  );
}
