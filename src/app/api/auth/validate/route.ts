import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "../../../../lib/auth";
import { AuditService, AuditAction } from "../../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const accessToken = authHeader?.replace("Bearer ", "");

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Access token required",
          details: ["Authorization header missing or invalid"],
        },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyAccessToken(accessToken);

    // Log successful validation
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.TOKEN_VALIDATED,
      resource: "authentication",
      success: true,
      ...extractRequestInfoFromRequest(request),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Token is valid",
        data: {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          permissions: payload.permissions,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Log failed validation
    await AuditService.log({
      action: AuditAction.TOKEN_VALIDATION_FAILED,
      resource: "authentication",
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      ...extractRequestInfoFromRequest(request),
    });

    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Invalid or expired access token",
        details: ["Please log in again"],
      },
      { status: 401 }
    );
  }
}
