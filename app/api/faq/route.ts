import { NextRequest, NextResponse } from "next/server";
import { getPublishedFAQs } from "@/lib/services/faq.service";
import { apiGuard } from "@/lib/security";

/* ================================================================
   /api/faq  — public endpoint, no auth required
   GET — Returns all published FAQs
   ================================================================ */

export async function GET(req: NextRequest) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const result = await getPublishedFAQs();

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json(
    { faqs: result.data },
    {
      status: 200,
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
    },
  );
}
