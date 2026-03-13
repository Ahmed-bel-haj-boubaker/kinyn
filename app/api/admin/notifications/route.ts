import { NextRequest, NextResponse } from "next/server";
import { requireAdminAccess } from "@/lib/auth";
import { apiGuard } from "@/lib/security";
import {
  getNotifications,
  markAllAsRead,
} from "@/lib/services/notification.service";

/* ================================================================
   /api/admin/notifications
   ================================================================
   GET  — Get admin notifications (paginated) — all admin roles
   PATCH — Mark all notifications as read — all admin roles
   ================================================================ */

export async function GET(req: NextRequest) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const auth = requireAdminAccess(req);
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);

  const result = await getNotifications(auth.payload.userId, page, limit);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json(result.data, { status: 200 });
}

export async function PATCH(req: NextRequest) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireAdminAccess(req);
  if ("error" in auth) return auth.error;

  const result = await markAllAsRead(auth.payload.userId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json(result.data, { status: 200 });
}
