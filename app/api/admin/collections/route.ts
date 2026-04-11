import { NextRequest, NextResponse } from "next/server";
import {
  listCollections,
  createCollection,
  getCollectionStats,
} from "@/lib/services/collection.service";
import { requireAdminAccess, requireWriteAccess } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";
import type { CollectionStatus } from "@/models/Collection";

export async function GET(req: NextRequest) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const auth = requireAdminAccess(req);
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? undefined;
  const status = url.searchParams.get("status") ?? undefined;

  const [collectionsResult, statsResult] = await Promise.all([
    listCollections({ search, status }),
    getCollectionStats(),
  ]);

  if (!collectionsResult.success) {
    return NextResponse.json(
      { error: collectionsResult.error },
      { status: collectionsResult.status ?? 500 },
    );
  }

  return NextResponse.json(
    {
      collections: collectionsResult.data!.collections,
      total: collectionsResult.data!.total,
      stats: statsResult.success ? statsResult.data : null,
    },
    { status: 200 },
  );
}

export async function POST(req: NextRequest) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 30, windowSec: 60 },
  });
  if (guardError) return guardError;

  const auth = requireWriteAccess(req);
  if ("error" in auth) return auth.error;

  const parsed = await parseBody<{
    name: string;
    description?: string;
    image?: string;
    products?: string[];
    category?: string | null;
    status?: CollectionStatus;
    order?: number;
  }>(req);

  if ("error" in parsed) return parsed.error;

  const result = await createCollection(parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    { message: "Collection créée avec succès.", collection: result.data },
    { status: 201 },
  );
}
