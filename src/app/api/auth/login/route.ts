import { NextRequest, NextResponse } from "next/server";
import {
  verifyPassword,
  generateTokens,
  verifyMFACode,
  checkAccountLockout,
} from "../../../../lib/auth";
import { AuditService, AuditAction } from "../../../../lib/audit";
import { AppError, ErrorCodes } from "../../../../utils/errors";
import prisma from "../../../../lib/db";
import logger from "../../../../lib/logger";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email, password, mfaCode, rememberMe } = body;

    // Simple validation
    if (!email || !password) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Email and password are required",
          details: ["Missing required fields"],
        },
        { status: 400 }
      );
    }

    // Extract request info for audit
    const requestInfo = extractRequestInfoFromRequest(request);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: { include: { role: true } },
      },
    });

    if (!user) {
      await AuditService.logLoginFailed(email, requestInfo, "User not found");

      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // Check account status
    if (!user.isActive) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Account is inactive",
        },
        { status: 401 }
      );
    }

    // Check account lockout
    try {
      await checkAccountLockout(user.id);
    } catch (error) {
      if (
        error instanceof AppError &&
        error.code === ErrorCodes.ACCOUNT_LOCKED
      ) {
        return NextResponse.json(
          {
            error: "Account Locked",
            message: error.message,
          },
          { status: 423 }
        );
      }
      throw error;
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.passwordHash);

    if (!passwordValid) {
      // Increment failed attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const shouldLock = failedAttempts >= 5;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
          lockedUntil: shouldLock
            ? new Date(Date.now() + 30 * 60 * 1000)
            : null,
        },
      });

      if (shouldLock) {
        await AuditService.logAccountLocked(user.id, user.email, requestInfo, {
          failedAttempts,
          accountLocked: true,
        });
      } else {
        await AuditService.logLoginFailed(
          user.email,
          requestInfo,
          "Invalid password",
          {
            failedAttempts,
            accountLocked: false,
          }
        );
      }

      return NextResponse.json(
        {
          error: "Unauthorized",
          message: shouldLock
            ? "Account locked due to multiple failed attempts"
            : "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    // Check MFA if enabled
    if (user.mfaEnabled) {
      if (!mfaCode) {
        return NextResponse.json(
          {
            requiresMFA: true,
            message: "MFA code required",
          },
          { status: 200 }
        );
      }

      const mfaValid = verifyMFACode(user.mfaSecret!, mfaCode);
      if (!mfaValid) {
        await AuditService.log({
          userId: user.id,
          userEmail: user.email,
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
    }

    // Reset failed attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLogin: new Date(),
      },
    });

    // Generate tokens
    const permissions = user.userRoles.flatMap(
      (ur) => ur.role.permissions as string[]
    );
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions,
    });

    // Create session
    const expiresAt = rememberMe
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        deviceInfo: {
          userAgent: requestInfo.userAgent,
          platform: request.headers.get("sec-ch-ua-platform") || "unknown",
        },
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        expiresAt,
      },
    });

    // Log successful login
    await AuditService.logLoginSuccess(
      user.id,
      user.email,
      user.role,
      session.id,
      requestInfo,
      {
        mfaUsed: user.mfaEnabled,
        rememberMe,
        sessionDuration: rememberMe ? "30 days" : "7 days",
      }
    );

    // Set secure cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
    };

    const response = NextResponse.json(
      {
        message: "Login successful.",
        accessToken: tokens.accessToken,
        user: {
          id: user.id,
          role: user.role.toLowerCase(),
          status: user.isActive ? "active" : "inactive",
        },
      },
      { status: 200 }
    );

    // Set cookies
    response.cookies.set("accessToken", tokens.accessToken, {
      ...cookieOptions,
      maxAge: 86400, // 24 hours
    });

    response.cookies.set("refreshToken", tokens.refreshToken, {
      ...cookieOptions,
      maxAge: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    });

    return response;
  } catch (error) {
    logger.error("Login error:", error);

    if (error instanceof AppError) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: error.message,
          details: error.details || [],
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
        details: ["Please try again later"],
      },
      { status: 500 }
    );
  }
}
