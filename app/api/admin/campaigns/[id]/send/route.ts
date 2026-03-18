import { NextRequest, NextResponse } from "next/server";
import { sendCampaign } from "@/lib/services/campaign.service";
import { requireWriteAccess } from "@/lib/auth";
import { apiGuard } from "@/lib/security";

/* ================================================================
   /api/admin/campaigns/[id]/send
   ================================================================
   POST — Send campaign to all active newsletter subscribers
   ================================================================ */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guardError = apiGuard(req);
  if (guardError) return guardError;

  const auth = requireWriteAccess(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;
  const result = await sendCampaign(id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 500 },
    );
  }

  return NextResponse.json(
    {
      message: `Campagne envoyée à ${result.data!.sentCount} abonné(s).`,
      sentCount: result.data!.sentCount,
    },
    { status: 200 },
  );
}
