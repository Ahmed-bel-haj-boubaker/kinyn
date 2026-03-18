import { NextRequest, NextResponse } from "next/server";
import { listCampaigns, createCampaign } from "@/lib/services/campaign.service";
import { requireAdminAccess, requireWriteAccess } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";

/* ================================================================
   /api/admin/campaigns
   ================================================================
   GET  — List campaigns (filter by status, pagination)
   POST — Create a new campaign (admin/super_admin only)
   ================================================================ */

/* ──────────── GET ──────────── */

export async function GET(req: NextRequest) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const auth = requireAdminAccess(req);
  if ("error" in auth) return auth.error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const page = parseInt(url.searchParams.get("page") ?? "1", 10);
  const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);

  const result = await listCampaigns({ status, page, limit });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json(
    { campaigns: result.data!.campaigns, total: result.data!.total },
    { status: 200 },
  );
}

/* ──────────── POST ──────────── */

export async function POST(req: NextRequest) {
  const guardError = apiGuard(req);
  if (guardError) return guardError;

  const auth = requireWriteAccess(req);
  if ("error" in auth) return auth.error;

  const parsed = await parseBody<{
    subject: string;
    type: string;
    heading?: string;
    body?: string;
    ctaText?: string;
    ctaUrl?: string;
    products?: {
      name: string;
      slug: string;
      image: string;
      price: number;
      promoPrice?: number;
    }[];
    collections?: {
      name: string;
      slug: string;
      image: string;
    }[];
  }>(req);
  if ("error" in parsed) return parsed.error;

  const result = await createCampaign({
    ...parsed.data,
    type: parsed.data.type as
      | "promotion"
      | "new_arrival"
      | "collection"
      | "announcement"
      | "custom",
    createdBy: auth.payload.userId,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json({ campaign: result.data }, { status: 201 });
}
