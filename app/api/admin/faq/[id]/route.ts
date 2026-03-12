import { NextRequest, NextResponse } from "next/server";
import { getFAQById, updateFAQ, deleteFAQ } from "@/lib/services/faq.service";
import { getAuthFromRequest } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import type { FAQStatus } from "@/models/FAQ";

/* ================================================================
   /api/admin/faq/[id]
   ================================================================
   GET    — Get single FAQ
   PATCH  — Update FAQ
   DELETE — Delete FAQ
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

/* ──────────── GET /api/admin/faq/[id] ──────────── */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const auth = requireAdmin(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const result = await getFAQById(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 404 },
    );
  }

  return NextResponse.json({ faq: result.data }, { status: 200 });
}

/* ──────────── PATCH /api/admin/faq/[id] ──────────── */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireAdmin(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const parsed = await parseBody<{
    question?: string;
    answer?: string;
    category?: string;
    status?: FAQStatus;
    order?: number;
  }>(req);

  if ("error" in parsed) return parsed.error;

  const result = await updateFAQ(id, parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    { message: "FAQ mise à jour.", faq: result.data },
    { status: 200 },
  );
}

/* ──────────── DELETE /api/admin/faq/[id] ──────────── */

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 20, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireAdmin(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const result = await deleteFAQ(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json({ message: "FAQ supprimée." }, { status: 200 });
}
