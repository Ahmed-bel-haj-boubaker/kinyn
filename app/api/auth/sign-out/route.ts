import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/services/auth.service";
import { apiGuard } from "@/lib/security";

/* ================================================================
   POST /api/auth/sign-out
   ================================================================
   Clears the auth cookie to log the user out.
   ================================================================ */

export async function POST(req: NextRequest) {
  /* Security checks */
  const guardError = apiGuard(req);
  if (guardError) return guardError;

  const response = NextResponse.json(
    { message: "Déconnexion réussie." },
    { status: 200 },
  );

  return clearAuthCookie(response);
}
