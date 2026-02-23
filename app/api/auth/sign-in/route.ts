import { NextRequest, NextResponse } from "next/server";
import { signIn, setAuthCookie } from "@/lib/services/auth.service";
import { apiGuard, parseBody } from "@/lib/security";

/* ================================================================
   POST /api/auth/sign-in
   ================================================================
   Public endpoint — authenticates a user (or admin) and sets
   an httpOnly auth cookie on success.
   ================================================================ */

export async function POST(req: NextRequest) {
  /* Security checks */
  const guardError = apiGuard(req, {
    rateLimit: { limit: 15, windowSec: 60 }, // 15 login attempts/min per IP
  });
  if (guardError) return guardError;

  /* Parse body */
  const parsed = await parseBody<{
    email: string;
    password: string;
  }>(req);

  if ("error" in parsed) return parsed.error;

  const result = await signIn(parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 401 },
    );
  }

  /* Set auth cookie and respond */
  const response = NextResponse.json(
    { message: "Connexion réussie.", user: result.data!.user },
    { status: 200 },
  );

  return setAuthCookie(response, result.data!.token);
}
