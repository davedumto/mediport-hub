import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import logger from "@/lib/logger";
import { emailService } from "@/services/emailService";
import { AuditService, AuditAction } from "@/lib/audit";
import crypto from "crypto";

const verifyOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = verifyOTPSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        verificationStatus: true,
        isActive: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 }
      );
    }

    if (user.verificationStatus === "VERIFIED") {
      return NextResponse.json(
        {
          success: false,
          message: "Account is already verified",
        },
        { status: 400 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Account is deactivated",
        },
        { status: 400 }
      );
    }

    // Find and validate OTP
    logger.info(`Looking for OTP: ${otp} for user: ${user.id}`);

    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        userId: user.id,
        code: otp,
        type: "EMAIL_VERIFICATION",
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    logger.info(`Verification code found:`, verificationCode);

    if (!verificationCode) {
      // Log what we found for debugging
      const allCodes = await prisma.verificationCode.findMany({
        where: { userId: user.id },
      });
      logger.warn(`No valid OTP found. All codes for user:`, allCodes);

      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired OTP code",
        },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await prisma.verificationCode.update({
      where: { id: verificationCode.id },
      data: { isUsed: true },
    });

    // Update user verification status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationStatus: "VERIFIED" as const,
        emailVerified: true,
      },
    });

    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.firstName || "User");

    // Log the action
    await AuditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: AuditAction.USER_ACTIVATED,
      resource: "user",
      resourceId: user.id,
      success: true,
      changes: {
        action: "email_verification_completed",
        verificationStatus: "VERIFIED" as const,
        emailVerified: true,
      },
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      requestId: crypto.randomUUID(),
    });

    logger.info(`User ${email} verified successfully`);

    return NextResponse.json(
      {
        success: true,
        message: "Account verified successfully! Welcome to MediPort Hub!",
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            verificationStatus: "VERIFIED" as const,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Verify OTP error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request data",
          details: ["Invalid request format"],
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
