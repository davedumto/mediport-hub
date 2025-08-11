import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "../../../../lib/auth";
import { AuditService, AuditAction } from "../../../../lib/audit";
import prisma from "../../../../lib/db";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resetToken, newPassword } = body;

    if (!resetToken || !newPassword) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Reset token and new password are required",
        },
        { status: 400 }
      );
    }

    const requestInfo = extractRequestInfoFromRequest(request);

    // Find password reset record
    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        token: resetToken,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!resetRecord) {
      await AuditService.log({
        action: AuditAction.PASSWORD_RESET_COMPLETED,
        resource: "authentication",
        success: false,
        errorMessage: "Invalid or expired reset token",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Invalid or expired reset token",
        },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user password
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: {
        passwordHash,
        passwordHistory: {
          push: resetRecord.user.passwordHash,
        },
      },
    });

    // Delete reset record
    await prisma.passwordReset.delete({
      where: { id: resetRecord.id },
    });

    // Log successful password reset
    await AuditService.log({
      userId: resetRecord.userId,
      userEmail: resetRecord.user.email,
      userRole: resetRecord.user.role,
      action: AuditAction.PASSWORD_RESET_COMPLETED,
      resource: "authentication",
      success: true,
      ...requestInfo,
    });

    return NextResponse.json(
      {
        message: "Password reset successful",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
