import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { NextRequest } from "next/server";

/* ================================================================
   Authentication Utilities
   ================================================================
   • Password hashing with bcrypt (cost factor 12)
   • JWT token creation & verification
   • Request authentication helper
   ================================================================ */

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";

if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("❌  JWT_SECRET is not defined. Add it to your .env file.");
}

const SECRET = JWT_SECRET ?? "dev-fallback-secret-change-me-in-production";

/* ────────────────── Password Hashing ────────────────── */

const SALT_ROUNDS = 12;

/**
 * Hash a plain-text password with bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain-text password with a bcrypt hash.
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/* ──────────────────── JWT Tokens ──────────────────── */

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Create a signed JWT token.
 */
export function createToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as "7d",
    issuer: "kinyn",
    audience: "kinyn-app",
  };
  return jwt.sign(payload, SECRET, options);
}

/**
 * Verify and decode a JWT token.
 * Returns the payload or `null` if invalid/expired.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET, {
      issuer: "kinyn",
      audience: "kinyn-app",
    }) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

/* ──────────────── Request Auth Helper ──────────────── */

/**
 * Extract and verify the JWT from the `Authorization: Bearer <token>` header
 * or from a cookie named `token`.
 *
 * Returns the decoded payload or `null`.
 */
export function getAuthFromRequest(req: NextRequest): TokenPayload | null {
  /* Try Authorization header first */
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    return verifyToken(token);
  }

  /* Fall back to cookie */
  const cookieToken = req.cookies.get("token")?.value;
  if (cookieToken) {
    return verifyToken(cookieToken);
  }

  return null;
}

/* ──────────────── Password Strength ──────────────── */

/**
 * Validate password strength.
 * Returns an error message or `null` if strong enough.
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8)
    return "Le mot de passe doit contenir au moins 8 caractères.";
  if (!/[A-Z]/.test(password))
    return "Le mot de passe doit contenir au moins une majuscule.";
  if (!/[a-z]/.test(password))
    return "Le mot de passe doit contenir au moins une minuscule.";
  if (!/[0-9]/.test(password))
    return "Le mot de passe doit contenir au moins un chiffre.";
  if (!/[^A-Za-z0-9]/.test(password))
    return "Le mot de passe doit contenir au moins un caractère spécial.";
  return null;
}
