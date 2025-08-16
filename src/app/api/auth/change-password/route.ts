import { NextRequest, NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "../../../../lib/auth";
import { AuditService, AuditAction } from "../../../../lib/audit";
import prisma from "../../../../lib/db";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";
import logger from "../../../../lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, currentPassword, newPassword } = body;

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "User ID, current password, and new password are required",
        },
        { status: 400 }
      );
    }

    const requestInfo = extractRequestInfoFromRequest(request);

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      await AuditService.log({
        action: AuditAction.PASSWORD_CHANGED,
        resource: "authentication",
        success: false,
        errorMessage: "User not found",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Not Found",
          message: "User not found",
        },
        { status: 404 }
      );
    }

    // Verify current password
    const currentPasswordValid = await verifyPassword(
      currentPassword,
      user.passwordHash
    );
    if (!currentPasswordValid) {
      await AuditService.log({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: AuditAction.PASSWORD_CHANGED,
        resource: "authentication",
        success: false,
        errorMessage: "Current password incorrect",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Current password is incorrect",
        },
        { status: 401 }
      );
    }

    // Check if new password is same as current
    const newPasswordValid = await verifyPassword(
      newPassword,
      user.passwordHash
    );
    if (newPasswordValid) {
      await AuditService.log({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: AuditAction.PASSWORD_CHANGED,
        resource: "authentication",
        success: false,
        errorMessage: "New password must be different from current",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Bad Request",
          message: "New password must be different from current password",
        },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        passwordHistory: {
          push: user.passwordHash,
        },
      },
    });

    // Log successful password change
    await AuditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: AuditAction.PASSWORD_CHANGED,
      resource: "authentication",
      success: true,
      ...requestInfo,
    });

    return NextResponse.json(
      {
        message: "Password changed successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Change password error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
