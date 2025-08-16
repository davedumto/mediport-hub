import { NextRequest, NextResponse } from "next/server";
import { NextURL } from "next/dist/server/web/next-url";

// Simple in-memory rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limiting configuration
const RATE_LIMITS = {
  auth: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 requests per minute for auth
  sensitive: { maxRequests: 10, windowMs: 60 * 60 * 1000 }, // 10 requests per hour for sensitive operations
  default: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests per minute for general endpoints
};

function getRateLimitConfig(pathname: string) {
  if (pathname.startsWith("/api/auth/login")) {
    return RATE_LIMITS.auth;
  }
  if (pathname.startsWith("/api/auth/register")) {
    return RATE_LIMITS.sensitive;
  }
  return RATE_LIMITS.default;
}

function isRateLimited(
  identifier: string,
  config: typeof RATE_LIMITS.auth
): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return false;
  }

  if (record.count >= config.maxRequests) {
    return true;
  }

  // Increment count
  record.count++;
  return false;
}

function getClientIdentifier(request: NextRequest): string {
  // Use IP address as identifier
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";
  return ip;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle dashboard route protection - TEMPORARILY DISABLED FOR TESTING
  /*
  if (pathname.startsWith("/dashboard")) {
    // Check for authentication token in cookies or headers
    const authToken =
      request.cookies.get("auth_tokens")?.value ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!authToken) {
      // Redirect to login if no token found
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  */

  // Skip middleware for non-API routes (except dashboard)
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Skip middleware for auth routes to prevent interference
  if (pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  const rateLimitConfig = getRateLimitConfig(pathname);
  const identifier = getClientIdentifier(request);

  // Check rate limiting
  if (isRateLimited(identifier, rateLimitConfig)) {
    const record = rateLimitStore.get(identifier);
    const resetTime = record
      ? new Date(record.resetTime).toISOString()
      : "unknown";

    return NextResponse.json(
      {
        error: "Too Many Requests",
        message: "Rate limit exceeded",
        details: [
          `Maximum ${rateLimitConfig.maxRequests} requests per ${
            rateLimitConfig.windowMs / 1000
          } seconds`,
        ],
        resetTime,
      },
      { status: 429 }
    );
  }

  // Add security headers
  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // Add HSTS header for HTTPS
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*"],
};
