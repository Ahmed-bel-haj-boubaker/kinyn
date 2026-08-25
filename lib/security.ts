import { NextRequest, NextResponse } from "next/server";

/* ================================================================
   API Security Utilities for Next.js Route Handlers
   ================================================================
   Provides reusable helpers to protect API routes against:
   • Rate limiting       — brute-force & DDoS
   • Input sanitization  — NoSQL injection & XSS
   • CORS enforcement    — cross-origin abuse
   • CSRF protection     — state-changing request forgery
   • Security headers    — clickjacking, MIME sniffing, etc.
   ================================================================ */

/* ──────────────────── 1. Rate Limiter ──────────────────── */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60 s
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
      if (now > entry.resetAt) rateLimitStore.delete(key);
    }
  }, 60_000);
}

interface RateLimitOptions {
  /** Max requests per window (default: 60) */
  limit?: number;
  /** Window duration in seconds (default: 60) */
  windowSec?: number;
}

/**
 * Returns `null` if allowed, or a 429 NextResponse if rate-limited.
 */
export function rateLimit(
  req: NextRequest,
  opts: RateLimitOptions = {},
): NextResponse | null {
  const { limit = 60, windowSec = 60 } = opts;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const key = `${ip}:${req.nextUrl.pathname}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return null;
  }

  entry.count++;
  if (entry.count > limit) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez plus tard." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)),
        },
      },
    );
  }

  return null;
}

/* ──────────────── 2. Input Sanitization ──────────────── */

/**
 * Recursively sanitizes an object to prevent NoSQL injection & XSS.
 * - Strips keys starting with `$` (MongoDB operators)
 * - Removes `<script>` tags and event handlers from strings
 * - Escapes HTML entities in strings
 */
export function sanitize<T>(input: T): T {
  if (input === null || input === undefined) return input;

  if (typeof input === "string") {
    return sanitizeString(input) as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitize(item)) as T;
  }

  if (typeof input === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(
      input as Record<string, unknown>,
    )) {
      // Block MongoDB operators like $gt, $ne, $regex, etc.
      if (key.startsWith("$")) continue;
      // Block prototype pollution
      if (key === "__proto__" || key === "constructor" || key === "prototype")
        continue;
      cleaned[key] = sanitize(value);
    }
    return cleaned as T;
  }

  return input;
}

function sanitizeString(str: string): string {
  return (
    str
      // Remove script tags
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      // Remove event handlers  (onerror, onclick, etc.)
      .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, "")
      // Escape HTML entities
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
  );
}

/* ──────────────── 3. Security Headers ──────────────── */

/**
 * Applies standard security headers to a response.
 */
export function withSecurityHeaders(res: NextResponse): NextResponse {
  // Prevent clickjacking
  res.headers.set("X-Frame-Options", "DENY");
  // Prevent MIME type sniffing
  res.headers.set("X-Content-Type-Options", "nosniff");
  // XSS protection (legacy browsers)
  res.headers.set("X-XSS-Protection", "1; mode=block");
  // Referrer policy
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Permissions policy
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  // Strict Transport Security (HTTPS only)
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }
  return res;
}

/* ──────────────── 4. CORS Helper ──────────────── */

/** `https://Kinyn.Online/` → `https://kinyn.online` (empty string if unparseable) */
function normalizeOrigin(value: string): string {
  try {
    const url = new URL(value.trim());
    return `${url.protocol}//${url.host}`.toLowerCase();
  } catch {
    return "";
  }
}

/** An origin and its apex ⇄ www twin — the site answers on both hostnames. */
function withHostVariants(origin: string): string[] {
  if (!origin) return [];
  const { protocol, host } = new URL(origin);
  const twin = host.startsWith("www.") ? host.slice(4) : `www.${host}`;
  return [origin, `${protocol}//${twin}`];
}

/* Read at call time, not module load: NEXT_PUBLIC_* is inlined at build time,
   so a value changed in .env after `npm run build` would otherwise be ignored.
   APP_ORIGINS (comma-separated) is a plain runtime var for extra origins. */
function allowedOrigins(): string[] {
  const configured = [
    process.env.APP_ORIGINS,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ]
    .filter(Boolean)
    .join(",")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean)
    .flatMap(withHostVariants);

  if (process.env.NODE_ENV !== "production") {
    configured.push("http://localhost:3000", "http://localhost:3001");
  }

  return [...new Set(configured)];
}

/* The origin the browser actually reached us on, taken from the proxy headers
   Nginx sets. This is what makes a request same-origin regardless of which
   hostname (apex or www) the visitor used. */
function selfOrigin(req: NextRequest): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return "";
  const proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    req.nextUrl.protocol.replace(":", "");
  return normalizeOrigin(`${proto}://${host}`);
}

/** True if `value` (an Origin or Referer header) may call this API. */
function isAllowedOrigin(req: NextRequest, value: string): boolean {
  const origin = normalizeOrigin(value);
  if (!origin) return false;

  const self = selfOrigin(req);
  if (self && withHostVariants(self).includes(origin)) return true;

  return allowedOrigins().includes(origin);
}

export function validateCORS(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin
  return isAllowedOrigin(req, origin);
}

export function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowed = origin && isAllowedOrigin(req, origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "true",
  };
}

/* ──────────────── 5. CSRF Protection ──────────────── */

/**
 * Returns a 403 response if a state-changing request (POST/PUT/DELETE/PATCH)
 * has no valid Origin or Referer header matching the allowed origins.
 */
export function csrfProtection(req: NextRequest): NextResponse | null {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) return null;

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  const check = origin ?? referer;
  if (!check) {
    return NextResponse.json(
      { error: "Requête refusée : origine manquante." },
      { status: 403 },
    );
  }

  if (!isAllowedOrigin(req, check)) {
    return NextResponse.json(
      { error: "Requête refusée : origine non autorisée." },
      { status: 403 },
    );
  }

  return null;
}

/* ──────────────── 6. Secure JSON Parser ──────────────── */

/**
 * Safely parses and sanitizes request body JSON.
 * Returns the sanitized body or a 400 error response.
 */
export async function parseBody<T = Record<string, unknown>>(
  req: NextRequest,
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const raw = await req.json();
    const data = sanitize(raw) as T;
    return { data };
  } catch {
    return {
      error: NextResponse.json(
        { error: "Corps de requête invalide." },
        { status: 400 },
      ),
    };
  }
}

/* ──────────────── 7. Compose API Guard ──────────────── */

interface GuardOptions {
  rateLimit?: RateLimitOptions;
  csrf?: boolean;
  cors?: boolean;
}

/**
 * Composable guard — apply rate-limit, CSRF, CORS checks in one call.
 * Returns `null` if all checks pass, or the first error response.
 */
export function apiGuard(
  req: NextRequest,
  opts: GuardOptions = {},
): NextResponse | null {
  /* Rate limit */
  const rl = rateLimit(req, opts.rateLimit);
  if (rl) return rl;

  /* CORS */
  if (opts.cors !== false && !validateCORS(req)) {
    return NextResponse.json(
      { error: "Origine non autorisée." },
      { status: 403 },
    );
  }

  /* CSRF */
  if (opts.csrf !== false) {
    const csrf = csrfProtection(req);
    if (csrf) return csrf;
  }

  return null;
}
