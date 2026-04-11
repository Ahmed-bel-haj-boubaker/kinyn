import { NextRequest, NextResponse } from "next/server";
import { signUp, setAuthCookie } from "@/lib/services/auth.service";
import { apiGuard, parseBody } from "@/lib/security";
import { notifyAdminsNewUser } from "@/lib/services/notification.service";

/* ================================================================
   POST /api/auth/sign-up
   ================================================================
   Public endpoint — creates a new user account with role "user".
   Sets an httpOnly auth cookie on success.
   ================================================================ */

export async function POST(req: NextRequest) {
  /* Security checks */
  const guardError = apiGuard(req, {
    rateLimit: { limit: 10, windowSec: 60 }, // Strict: 10 sign-ups/min per IP
  });
  if (guardError) return guardError;

  /* Parse body */
  const parsed = await parseBody<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }>(req);

  if ("error" in parsed) return parsed.error;

  const result = await signUp(parsed.data);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status ?? 400 },
    );
  }

  /* Set auth cookie and respond */
  const response = NextResponse.json(
    { message: "Compte créé avec succès.", user: result.data!.user },
    { status: 201 },
  );

  /* Notify admins of the new user (fire-and-forget) */
  notifyAdminsNewUser({
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    email: parsed.data.email,
  }).catch(() => {});

  return setAuthCookie(response, result.data!.token);
}
