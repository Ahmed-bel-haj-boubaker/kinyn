import { NextRequest, NextResponse } from "next/server";
import { listFAQs, createFAQ, listFAQCategories } from "@/lib/services/faq.service";
import { getAuthFromRequest } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import type { FAQStatus } from "@/models/FAQ";

/* ================================================================
   /api/admin/faq
   ================================================================
   GET  — List FAQs (search / filter / pagination)
   POST — Create a new FAQ
   ================================================================ */

function requireAdmin(req: NextRequest) {
  const payload = getAuthFromRequest(req);
  if (!payload) {
    return {
      error: NextResponse.json({ error: "Non authentifié." }, { status: 401 }),
    };
  }
  if (payload.role !== "admin" && payload.role !== "super_admin") {
    return {
      error: NextResponse.json(
        { error: "Accès refusé. Droits insuffisants." },
        { status: 403 },
      ),
    };
  }
  return { payload };
}

/* ──────────── GET /api/admin/faq ──────────── */

export async function GET(req: NextRequest) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const auth = requireAdmin(req);
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? undefined;
  const category = url.searchParams.get("category") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "50", 10);

  const [faqsResult, categoriesResult] = await Promise.all([
    listFAQs({ search, category, status, page, limit }),
    listFAQCategories(),
  ]);

  if (!faqsResult.success) {
    return NextResponse.json(
      { error: faqsResult.error },
      { status: faqsResult.status ?? 500 },
    );
  }

  return NextResponse.json(
    {
      faqs: faqsResult.data!.faqs,
      total: faqsResult.data!.total,
      categories: categoriesResult.success ? categoriesResult.data : [],
    },
    { status: 200 },
  );
}

/* ──────────── POST /api/admin/faq ──────────── */

export async function POST(req: NextRequest) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireAdmin(req);
  if ("error" in auth) return auth.error;

  const parsed = await parseBody<{
    question: string;
    answer: string;
    category?: string;
    status?: FAQStatus;
    order?: number;
  }>(req);

  if ("error" in parsed) return parsed.error;

  const result = await createFAQ(parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    { message: "FAQ créée avec succès.", faq: result.data },
    { status: 201 },
  );
}
