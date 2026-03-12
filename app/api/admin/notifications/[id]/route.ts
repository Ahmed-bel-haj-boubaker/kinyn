import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { apiGuard } from "@/lib/security";
import {
  markAsRead,
  deleteNotification,
} from "@/lib/services/notification.service";

/* ================================================================
   /api/admin/notifications/[id]
   ================================================================
   PATCH  — Mark a single notification as read
   DELETE — Delete a notification
   ================================================================ */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 60, windowSec: 60 },
  });
  if (guardError) return guardError;

  const payload = getAuthFromRequest(req);
  if (!payload || !["admin", "super_admin"].includes(payload.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const { id } = await params;
  const result = await markAsRead(id, payload.userId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json({ notification: result.data }, { status: 200 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const payload = getAuthFromRequest(req);
  if (!payload || !["admin", "super_admin"].includes(payload.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const { id } = await params;
  const result = await deleteNotification(id, payload.userId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json(
    { message: "Notification supprimée." },
    { status: 200 },
  );
}
