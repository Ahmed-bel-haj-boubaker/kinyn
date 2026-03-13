import { NextRequest, NextResponse } from "next/server";
import { getUnreadCount } from "@/lib/services/notification.service";
import { requireAdminAccess } from "@/lib/auth";

/* ================================================================
   /api/admin/notifications/unread-count
   ================================================================
   GET — Get unread notification count — all admin roles
   ================================================================ */

export async function GET(req: NextRequest) {
  const auth = requireAdminAccess(req);
  if ("error" in auth) return auth.error;

  const result = await getUnreadCount(auth.payload.userId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json({ count: result.data }, { status: 200 });
}
