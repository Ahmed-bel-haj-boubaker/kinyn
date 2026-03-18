import { NextRequest, NextResponse } from "next/server";
import { subscribe, unsubscribe } from "@/lib/services/newsletter.service";
import { apiGuard, parseBody } from "@/lib/security";

/* ================================================================
   /api/newsletter  — public endpoint
   ================================================================
   POST   — Subscribe to the newsletter
   DELETE — Unsubscribe from the newsletter
   ================================================================ */

/* ──────────── POST /api/newsletter ──────────── */

export async function POST(req: NextRequest) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 10, windowSec: 60 },
  });
  if (guardError) return guardError;

  const parsed = await parseBody<{ email: string }>(req);
  if ("error" in parsed) return parsed.error;

  const result = await subscribe(parsed.data.email);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    { message: "Inscription réussie à la newsletter." },
    { status: 201 },
  );
}

/* ──────────── DELETE /api/newsletter ──────────── */

export async function DELETE(req: NextRequest) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 10, windowSec: 60 },
  });
  if (guardError) return guardError;

  const parsed = await parseBody<{ email: string }>(req);
  if ("error" in parsed) return parsed.error;

  const result = await unsubscribe(parsed.data.email);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    { message: "Désinscription réussie." },
    { status: 200 },
  );
}
