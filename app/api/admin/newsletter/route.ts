import { NextRequest, NextResponse } from "next/server";
import {
  listCustomersNewsletter,
  getNewsletterStats,
  exportActiveEmails,
} from "@/lib/services/newsletter.service";
import { requireAdminAccess } from "@/lib/auth";
import { apiGuard } from "@/lib/security";

/* ================================================================
   /api/admin/newsletter
   ================================================================
   GET — List subscribers (search / filter / pagination) + stats
   ================================================================ */

export async function GET(req: NextRequest) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const auth = requireAdminAccess(req);
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);

  /* Export mode */
  if (url.searchParams.get("export") === "emails") {
    const result = await exportActiveEmails();
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status ?? 500 },
      );
    }
    return NextResponse.json({ emails: result.data }, { status: 200 });
  }

  const search = url.searchParams.get("search") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);

  const [listResult, statsResult] = await Promise.all([
    listCustomersNewsletter({ search, newsletterFilter: status, page, limit }),
    getNewsletterStats(),
  ]);

  if (!listResult.success) {
    return NextResponse.json(
      { error: listResult.error },
      { status: listResult.status ?? 500 },
    );
  }

  return NextResponse.json(
    {
      entries: listResult.data!.entries,
      total: listResult.data!.total,
      stats: statsResult.success ? statsResult.data : null,
    },
    { status: 200 },
  );
}
