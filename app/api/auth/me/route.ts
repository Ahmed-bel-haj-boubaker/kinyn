import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, updateProfile } from "@/lib/services/auth.service";
import { apiGuard, parseBody } from "@/lib/security";

/* ================================================================
   GET /api/auth/me
   ================================================================
   Returns the currently authenticated user's profile.
   ================================================================ */

export async function GET(req: NextRequest) {
  /* Security checks */
  const guardError = apiGuard(req, { csrf: false }); // GET is safe
  if (guardError) return guardError;

  const result = await getCurrentUser(req);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 401 },
    );
  }

  return NextResponse.json({ user: result.data }, { status: 200 });
}

/* ================================================================
   PUT /api/auth/me
   ================================================================
   Update the currently authenticated user's profile.
   ================================================================ */

export async function PUT(req: NextRequest) {
  const guardError = apiGuard(req, {
    rateLimit: { limit: 10, windowSec: 60 },
  });
  if (guardError) return guardError;

  const parsed = await parseBody<{
    firstName?: string;
    lastName?: string;
    phone?: string;
  }>(req);

  if ("error" in parsed) return parsed.error;

  const result = await updateProfile(req, parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  return NextResponse.json(
    { message: "Profil mis à jour avec succès.", user: result.data },
    { status: 200 },
  );
}
