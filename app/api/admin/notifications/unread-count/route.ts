import { NextRequest, NextResponse } from "next/server";
import { getUnreadCount } from "@/lib/services/notification.service";
import { getAuthFromRequest } from "@/lib/auth";

/* ================================================================
   /api/admin/notifications/unread-count
   ================================================================
   GET — Get unread notification count for the current admin
   ================================================================ */

export async function GET(req: NextRequest) {
  const payload = getAuthFromRequest(req);
  if (!payload || !["admin", "super_admin"].includes(payload.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const result = await getUnreadCount(payload.userId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json({ count: result.data }, { status: 200 });
}
