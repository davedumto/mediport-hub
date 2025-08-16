import { NextRequest, NextResponse } from "next/server";
import { AuditService, AuditAction } from "../../../../lib/audit";
import prisma from "../../../../lib/db";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";
import crypto from "crypto";
import logger from "../../../../lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Email is required",
        },
        { status: 400 }
      );
    }

    const requestInfo = extractRequestInfoFromRequest(request);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not
      await AuditService.log({
        userEmail: email,
        action: AuditAction.PASSWORD_RESET_REQUESTED,
        resource: "authentication",
        success: false,
        errorMessage: "User not found",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          message:
            "If an account with that email exists, a password reset link has been sent",
        },
        { status: 200 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      await AuditService.log({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: AuditAction.PASSWORD_RESET_REQUESTED,
        resource: "authentication",
        success: false,
        errorMessage: "Account inactive",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          message:
            "If an account with that email exists, a password reset link has been sent",
        },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing password reset records for this user
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id },
    });

    // Create new password reset record
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt: resetExpiry,
      },
    });

    // Log successful reset request
    await AuditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: AuditAction.PASSWORD_RESET_REQUESTED,
      resource: "authentication",
      success: true,
      ...requestInfo,
    });

    // TODO: Send email with reset link
    // For now, just return success message
    return NextResponse.json(
      {
        message:
          "If an account with that email exists, a password reset link has been sent",
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Forgot password error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
