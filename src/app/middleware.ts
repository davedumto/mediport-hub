import { NextRequest, NextResponse } from "next/server";
import { NextURL } from "next/dist/server/web/next-url";

// TEMPORARILY DISABLED FOR TESTING
export function middleware(request: NextRequest) {
  // Skip all middleware for now to test API routes
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
