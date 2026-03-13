import { NextRequest, NextResponse } from "next/server";
import { updateAdmin, deleteAdmin } from "@/lib/services/auth.service";
import { requireSuperAdmin } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import type { UserRole } from "@/models/User";

/* ================================================================
   /api/admin/admins/[id]
   ================================================================
   PUT    — Update an admin
   DELETE — Delete an admin
   Both endpoints require super_admin role.
   ================================================================ */

/* ──────────── PUT /api/admin/admins/[id] ──────────── */

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireSuperAdmin(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const parsed = await parseBody<{
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    password?: string;
    role?: UserRole;
    status?: "active" | "inactive";
    avatar?: string;
  }>(req);

  if ("error" in parsed) return parsed.error;

  const result = await updateAdmin(id, parsed.data, auth.payload);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    { message: "Administrateur modifié avec succès.", admin: result.data },
    { status: 200 },
  );
}

/* ──────────── DELETE /api/admin/admins/[id] ──────────── */

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 10, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireSuperAdmin(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const result = await deleteAdmin(id, auth.payload);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    { message: "Administrateur supprimé avec succès." },
    { status: 200 },
  );
}
