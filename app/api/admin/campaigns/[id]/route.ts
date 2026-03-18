import { NextRequest, NextResponse } from "next/server";
import {
  getCampaignById,
  updateCampaign,
  deleteCampaign,
} from "@/lib/services/campaign.service";
import { requireAdminAccess, requireWriteAccess } from "@/lib/auth";
import { apiGuard, parseBody } from "@/lib/security";

/* ================================================================
   /api/admin/campaigns/[id]
   ================================================================
   GET    — Get single campaign
   PATCH  — Update a draft campaign
   DELETE — Delete a campaign
   ================================================================ */

/* ──────────── GET ──────────── */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guardError = apiGuard(req, { csrf: false });
  if (guardError) return guardError;

  const auth = requireAdminAccess(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const result = await getCampaignById(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json({ campaign: result.data }, { status: 200 });
}

/* ──────────── PATCH ──────────── */

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guardError = apiGuard(req);
  if (guardError) return guardError;

  const auth = requireWriteAccess(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const parsed = await parseBody<{
    subject?: string;
    type?: string;
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

  const result = await updateCampaign(id, {
    ...parsed.data,
    type: parsed.data.type as
      | "promotion"
      | "new_arrival"
      | "collection"
      | "announcement"
      | "custom"
      | undefined,
  });

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json({ campaign: result.data }, { status: 200 });
}

/* ──────────── DELETE ──────────── */

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guardError = apiGuard(req);
  if (guardError) return guardError;

  const auth = requireWriteAccess(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const result = await deleteCampaign(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json({ message: "Campagne supprimée." }, { status: 200 });
}
