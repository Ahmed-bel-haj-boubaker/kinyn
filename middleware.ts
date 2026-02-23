import { NextRequest, NextResponse } from "next/server";

/* ================================================================
   Next.js Edge Middleware — Global Security Layer
   ================================================================
   Runs on EVERY request (pages + API). Applies:
   1. Security headers (XSS, clickjacking, MIME sniffing)
   2. Rate limiting on API routes
   3. Block suspicious payloads (NoSQL injection patterns in URL)
   ================================================================ */

/* ──────────────── Simple in-memory rate limiter ──────────────── */

const apiRateMap = new Map<string, { count: number; resetAt: number }>();
const API_RATE_LIMIT = 100; // requests per window
const API_RATE_WINDOW = 60_000; // 60 seconds

function checkApiRate(ip: string, pathname: string): boolean {
  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const entry = apiRateMap.get(key);

  if (!entry || now > entry.resetAt) {
    apiRateMap.set(key, { count: 1, resetAt: now + API_RATE_WINDOW });
    return true;
  }

  entry.count++;
  return entry.count <= API_RATE_LIMIT;
}

/* ──────────────── Suspicious pattern detection ──────────────── */

const SUSPICIOUS_PATTERNS = [
  /\$(?:gt|gte|lt|lte|ne|in|nin|regex|where|exists)/i, // NoSQL operators
  /<script/i, // XSS via URL
  /javascript:/i, // JS protocol
  /\.\.\//, // Directory traversal
  /%00/, // Null byte injection
];

function isSuspicious(url: string): boolean {
  return SUSPICIOUS_PATTERNS.some((p) => p.test(url));
}

/* ================================================================ */

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* ── Block suspicious URLs ── */
  if (isSuspicious(req.url)) {
    return NextResponse.json({ error: "Requête bloquée." }, { status: 400 });
  }

  /* ── Rate-limit API routes ── */
  if (pathname.startsWith("/api")) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    if (!checkApiRate(ip, pathname)) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez plus tard." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }
  }

  /* ── Proceed & add security headers ── */
  const res = NextResponse.next();

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

  // HSTS in production
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  // Content Security Policy
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://images.unsplash.com",
      "font-src 'self' data:",
      process.env.NODE_ENV === "development"
        ? "connect-src 'self' ws://127.0.0.1:* ws://localhost:*"
        : "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  );

  return res;
}

/* ── Run middleware on these paths ── */
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image  (image optimization)
     * - favicon.ico  (favicon)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|images/|fonts/|video/).*)",
  ],
};
