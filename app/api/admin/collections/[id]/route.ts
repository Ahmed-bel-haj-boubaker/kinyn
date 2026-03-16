import { NextRequest, NextResponse } from "next/server";
import {
  updateCollection,
  deleteCollection,
} from "@/lib/services/collection.service";
import { requireWriteAccess } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import type { CollectionStatus } from "@/models/Collection";

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
    description?: string;
    image?: string;
    products?: string[];
    status?: CollectionStatus;
    order?: number;
  }>(req);

  if ("error" in parsed) return parsed.error;

  const result = await updateCollection(id, parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    { message: "Collection modifiée avec succès.", collection: result.data },
    { status: 200 },
  );
}

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

  const result = await deleteCollection(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    {
      message: "Collection supprimée avec succès.",
      deletedId: result.data!.deletedId,
    },
    { status: 200 },
  );
}
