import { NextRequest, NextResponse } from "next/server";
import { AuditService, AuditAction } from "../../../../lib/audit";
import prisma from "../../../../lib/db";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Session ID is required",
        },
        { status: 400 }
      );
    }

    const requestInfo = extractRequestInfoFromRequest(request);

    // Revoke the session
    await prisma.userSession.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revocationReason: "User logout",
      },
    });

    // Log the logout
    await AuditService.log({
      action: AuditAction.LOGOUT,
      resource: "authentication",
      success: true,
      sessionId,
      ...requestInfo,
    });

    const response = NextResponse.json(
      {
        message: "Logout successful",
      },
      { status: 200 }
    );

    // Clear cookies
    response.cookies.set("accessToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
