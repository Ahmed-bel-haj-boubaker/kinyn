import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/services/auth.service";
import { apiGuard } from "@/lib/security";

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
