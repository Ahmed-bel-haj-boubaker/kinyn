import { NextRequest, NextResponse } from "next/server";
import {
  listCategories,
  createCategory,
  getCategoryStats,
} from "@/lib/services/category.service";
import { getAuthFromRequest } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import type { CategoryLevel, CategoryStatus } from "@/models/Category";

/* ================================================================
   /api/admin/categories
   ================================================================
   GET  — List all categories (with search / filter)
   POST — Create a new category
   Both endpoints are admin-only.
   ================================================================ */

/* ──────────── Middleware: require admin role ──────────── */

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

/* ──────────── GET /api/admin/categories ──────────── */

export async function GET(req: NextRequest) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const auth = requireAdmin(req);
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? undefined;
  const level = url.searchParams.get("level") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;

  const [categoriesResult, statsResult] = await Promise.all([
    listCategories({ search, level, status }),
    getCategoryStats(),
  ]);

  if (!categoriesResult.success) {
    return NextResponse.json(
      { error: categoriesResult.error },
      { status: categoriesResult.status ?? 500 },
    );
  }

  return NextResponse.json(
    {
      categories: categoriesResult.data!.categories,
      total: categoriesResult.data!.total,
      stats: statsResult.success ? statsResult.data : null,
    },
    { status: 200 },
  );
}

/* ──────────── POST /api/admin/categories ──────────── */

export async function POST(req: NextRequest) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireAdmin(req);
  if ("error" in auth) return auth.error;

  const parsed = await parseBody<{
    name: string;
    level: CategoryLevel;
    parent?: string;
    status?: CategoryStatus;
    order?: number;
  }>(req);

  if ("error" in parsed) return parsed.error;

  const result = await createCategory(parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    { message: "Catégorie créée avec succès.", category: result.data },
    { status: 201 },
  );
}
