import { NextRequest, NextResponse } from "next/server";
import {
  updateCategory,
  deleteCategory,
} from "@/lib/services/category.service";
import { getAuthFromRequest } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import type { CategoryLevel, CategoryStatus } from "@/models/Category";

/* ================================================================
   /api/admin/categories/[id]
   ================================================================
   PUT    — Update a category
   DELETE — Delete a category (cascade deletes children)
   Both endpoints are admin-only.
   ================================================================ */

/* ──────────── Auth helper ──────────── */

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

/* ──────────── PUT /api/admin/categories/[id] ──────────── */

export async function PUT(
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
    name?: string;
    level?: CategoryLevel;
    parent?: string | null;
    status?: CategoryStatus;
    order?: number;
  }>(req);

  if ("error" in parsed) return parsed.error;

  const result = await updateCategory(id, parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    { message: "Catégorie modifiée avec succès.", category: result.data },
    { status: 200 },
  );
}

/* ──────────── DELETE /api/admin/categories/[id] ──────────── */

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 10, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireAdmin(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  const result = await deleteCategory(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    {
      message: "Catégorie supprimée avec succès.",
      deletedId: result.data!.deletedId,
      childrenDeleted: result.data!.childrenDeleted,
    },
    { status: 200 },
  );
}
