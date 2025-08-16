import { NextRequest, NextResponse } from "next/server";
import { generateMFASecret, verifyMFACode } from "../../../../lib/auth";
import { AuditService, AuditAction } from "../../../../lib/audit";
import prisma from "../../../../lib/db";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";
import logger from "../../../../lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, mfaCode } = body;

    if (!userId || !action) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "User ID and action are required",
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
        action: AuditAction.MFA_ENABLED,
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

    if (action === "enable") {
      if (user.mfaEnabled) {
        return NextResponse.json(
          {
            error: "Bad Request",
            message: "MFA is already enabled",
          },
          { status: 400 }
        );
      }

      // Generate new MFA secret
      const mfaSecret = generateMFASecret();

      // Update user with MFA secret
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaSecret,
          mfaEnabled: false, // Will be enabled after verification
        },
      });

      // Log MFA setup
      await AuditService.log({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: AuditAction.MFA_ENABLED,
        resource: "authentication",
        success: true,
        metadata: { mfaSecretGenerated: true },
        ...requestInfo,
      });

      return NextResponse.json(
        {
          message:
            "MFA secret generated. Please verify with MFA code to enable.",
          mfaSecret,
          qrCode: `otpauth://totp/${user.email}?secret=${mfaSecret}&issuer=EHR System`,
        },
        { status: 200 }
      );
    }

    if (action === "verify") {
      if (!mfaCode) {
        return NextResponse.json(
          {
            error: "Bad Request",
            message: "MFA code is required for verification",
          },
          { status: 400 }
        );
      }

      if (!user.mfaSecret) {
        return NextResponse.json(
          {
            error: "Bad Request",
            message: "No MFA secret found. Please generate one first.",
          },
          { status: 400 }
        );
      }

      // Verify MFA code
      const isValid = verifyMFACode(user.mfaSecret, mfaCode);
      if (!isValid) {
        await AuditService.log({
          userId: user.id,
          userEmail: user.email,
          userRole: user.role,
          action: AuditAction.MFA_VERIFICATION_FAILED,
          resource: "authentication",
          success: false,
          errorMessage: "Invalid MFA code",
          ...requestInfo,
        });

        return NextResponse.json(
          {
            error: "Unauthorized",
            message: "Invalid MFA code",
          },
          { status: 401 }
        );
      }

      // Enable MFA
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: true,
        },
      });

      // Log successful MFA verification
      await AuditService.log({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: AuditAction.MFA_ENABLED,
        resource: "authentication",
        success: true,
        metadata: { mfaEnabled: true },
        ...requestInfo,
      });

      return NextResponse.json(
        {
          message: "MFA enabled successfully",
        },
        { status: 200 }
      );
    }

    if (action === "disable") {
      if (!user.mfaEnabled) {
        return NextResponse.json(
          {
            error: "Bad Request",
            message: "MFA is not enabled",
          },
          { status: 400 }
        );
      }

      // Disable MFA
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: false,
          mfaSecret: null,
        },
      });

      // Log MFA disable
      await AuditService.log({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: AuditAction.MFA_DISABLED,
        resource: "authentication",
        success: true,
        ...requestInfo,
      });

      return NextResponse.json(
        {
          message: "MFA disabled successfully",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        error: "Bad Request",
        message: "Invalid action. Use 'enable', 'verify', or 'disable'",
      },
      { status: 400 }
    );
  } catch (error) {
    logger.error("MFA setup error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
