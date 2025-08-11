import { NextRequest } from "next/server";
import crypto from "crypto";

export function extractRequestInfoFromRequest(request: NextRequest): {
  ipAddress: string;
  userAgent: string;
  requestId: string;
} {
  // Get IP address
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";

  // Get user agent
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Generate request ID
  const requestId = crypto.randomUUID();

  return {
    ipAddress: ip,
    userAgent,
    requestId,
  };
}

export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0] : "unknown";
}
