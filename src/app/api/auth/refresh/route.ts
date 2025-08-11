import { NextRequest, NextResponse } from "next/server";
import { generateTokens, verifyRefreshToken } from "../../../../lib/auth";
import { AuditService, AuditAction } from "../../../../lib/audit";
import prisma from "../../../../lib/db";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Refresh token is required",
        },
        { status: 400 }
      );
    }

    const requestInfo = extractRequestInfoFromRequest(request);

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      await AuditService.log({
        action: AuditAction.TOKEN_REFRESHED,
        resource: "authentication",
        success: false,
        errorMessage: "Invalid refresh token",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid refresh token",
        },
        { status: 401 }
      );
    }

    // Find the session
    const session = await prisma.userSession.findFirst({
      where: {
        refreshToken,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          include: {
            userRoles: { include: { role: true } },
          },
        },
      },
    });

    if (!session) {
      await AuditService.log({
        action: AuditAction.TOKEN_REFRESHED,
        resource: "authentication",
        success: false,
        errorMessage: "Session not found or expired",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Session expired",
        },
        { status: 401 }
      );
    }

    // Generate new tokens
    const permissions = session.user.userRoles.flatMap(
      (ur) => ur.role.permissions as string[]
    );
    const tokens = generateTokens({
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
      permissions,
    });

    // Update session with new tokens
    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        sessionToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        lastAccessed: new Date(),
      },
    });

    // Log successful refresh
    await AuditService.log({
      userId: session.user.id,
      userEmail: session.user.email,
      userRole: session.user.role,
      action: AuditAction.TOKEN_REFRESHED,
      resource: "authentication",
      sessionId: session.id,
      success: true,
      ...requestInfo,
    });

    const response = NextResponse.json(
      {
        message: "Token refreshed successfully",
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      { status: 200 }
    );

    // Set new cookies
    response.cookies.set("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 86400, // 24 hours
    });

    response.cookies.set("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
