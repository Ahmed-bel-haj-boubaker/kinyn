import { NextRequest, NextResponse } from "next/server";
import {
  updateCategory,
  deleteCategory,
} from "@/lib/services/category.service";
import { requireWriteAccess } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import type { CategoryLevel, CategoryStatus } from "@/models/Category";

/* ================================================================
   /api/admin/categories/[id]
   ================================================================
   PUT    — Update a category — admin & super_admin only
   DELETE — Delete a category (cascade) — admin & super_admin only
   ================================================================ */

/* ──────────── PUT /api/admin/categories/[id] ──────────── */

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireWriteAccess(req);
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

  const auth = requireWriteAccess(req);
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
