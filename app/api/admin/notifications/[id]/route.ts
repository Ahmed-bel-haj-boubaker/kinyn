import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/auth";
import { apiGuard } from "@/lib/security";
import {
  markAsRead,
  deleteNotification,
} from "@/lib/services/notification.service";

/* ================================================================
   /api/admin/notifications/[id]
   ================================================================
   PATCH  — Mark a single notification as read — all admin roles
   DELETE — Delete a notification — all admin roles
   ================================================================ */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 60, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireAdminAccess(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const result = await markAsRead(id, auth.payload.userId);

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

  const auth = requireAdminAccess(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const result = await deleteNotification(id, auth.payload.userId);

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
