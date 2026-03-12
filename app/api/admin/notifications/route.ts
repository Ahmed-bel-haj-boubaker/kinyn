import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { apiGuard } from "@/lib/security";
import {
  getNotifications,
  markAllAsRead,
} from "@/lib/services/notification.service";

/* ================================================================
   /api/admin/notifications
   ================================================================
   GET  — Get admin notifications (paginated)
   PATCH — Mark all notifications as read
   ================================================================ */

export async function GET(req: NextRequest) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const payload = getAuthFromRequest(req);
  if (!payload || !["admin", "super_admin"].includes(payload.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);

  const result = await getNotifications(payload.userId, page, limit);

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

  const payload = getAuthFromRequest(req);
  if (!payload || !["admin", "super_admin"].includes(payload.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const result = await markAllAsRead(payload.userId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json(result.data, { status: 200 });
}
