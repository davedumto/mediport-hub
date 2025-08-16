import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import logger from "@/lib/logger";
import { emailService } from "@/services/emailService";
import { AuditService, AuditAction } from "@/lib/audit";
import crypto from "crypto";

const sendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = sendVerificationSchema.parse(body);

    // Check if user exists and needs verification
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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store OTP in database
    await prisma.verificationCode.create({
      data: {
        userId: user.id,
        code: otp,
        type: "EMAIL_VERIFICATION",
        expiresAt,
        isUsed: false,
      },
    });

    // Send verification email
    const emailSent = await emailService.sendVerificationEmail({
      email: user.email,
      firstName: user.firstName,
      otp,
      expiresIn: "15 minutes",
    });

    if (!emailSent) {
      // Clean up OTP if email failed
      await prisma.verificationCode.deleteMany({
        where: {
          userId: user.id,
          code: otp,
          type: "EMAIL_VERIFICATION",
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: "Failed to send verification email. Please try again.",
        },
        { status: 500 }
      );
    }

    // Log the action
    await AuditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: AuditAction.DATA_CREATED,
      resource: "verification_code",
      resourceId: user.id,
      success: true,
      changes: {
        action: "verification_email_sent",
        email: user.email,
        otpGenerated: true,
        expiresAt,
      },
      ipAddress:
        request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
      requestId: crypto.randomUUID(),
    });

    logger.info(`Verification email sent to ${email}`);

    return NextResponse.json(
      {
        success: true,
        message: "Verification email sent successfully",
        data: {
          email: user.email,
          expiresIn: "15 minutes",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Send verification error:", error);

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
