import { NextRequest, NextResponse } from "next/server";
import {
  getSubscriberById,
  toggleSubscriberStatus,
  deleteSubscriber,
} from "@/lib/services/newsletter.service";
import { requireAdminAccess, requireWriteAccess } from "@/lib/auth";
import { apiGuard } from "@/lib/security";

/* ================================================================
   /api/admin/newsletter/[id]
   ================================================================
   GET    — Get single subscriber — all admin roles
   PATCH  — Toggle subscriber status — admin & super_admin
   DELETE — Delete subscriber — admin & super_admin
   ================================================================ */

/* ──────────── GET /api/admin/newsletter/[id] ──────────── */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const auth = requireAdminAccess(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const result = await getSubscriberById(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 404 },
    );
  }

  return NextResponse.json({ subscriber: result.data }, { status: 200 });
}

/* ──────────── PATCH /api/admin/newsletter/[id] ──────────── */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireWriteAccess(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const result = await toggleSubscriberStatus(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    { message: "Statut mis à jour.", subscriber: result.data },
    { status: 200 },
  );
}

/* ──────────── DELETE /api/admin/newsletter/[id] ──────────── */

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 20, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireWriteAccess(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const result = await deleteSubscriber(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json({ message: "Abonné supprimé." }, { status: 200 });
}
