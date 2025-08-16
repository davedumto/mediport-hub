import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "../../../../lib/auth";
import { AuditService, AuditAction } from "../../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";
import prisma from "../../../../lib/db";
import logger from "../../../../lib/logger";

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

    // Fetch user profile with roles and permissions
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "User not found",
          details: ["User profile does not exist"],
        },
        { status: 404 }
      );
    }

    // Extract permissions from roles
    const permissions =
      user.userRoles?.flatMap((ur) => ur.role.permissions as string[]) || [];

    // Log profile access
    await AuditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: AuditAction.PROFILE_ACCESSED,
      resource: "user_profile",
      resourceId: user.id,
      success: true,
      ipAddress: extractRequestInfoFromRequest(request).ipAddress,
      userAgent: extractRequestInfoFromRequest(request).userAgent,
      requestId: extractRequestInfoFromRequest(request).requestId,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Profile retrieved successfully",
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            permissions,
            isActive: user.isActive,
            mfaEnabled: user.mfaEnabled,
            lastLogin: user.lastLogin,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth,
            medicalLicenseNumber: user.medicalLicenseNumber,
            specialty: user.specialty,
            verificationStatus: user.verificationStatus,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Log profile access failure
    await AuditService.log({
      action: AuditAction.PROFILE_ACCESS_FAILED,
      resource: "user_profile",
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      ipAddress: extractRequestInfoFromRequest(request).ipAddress,
      userAgent: extractRequestInfoFromRequest(request).userAgent,
      requestId: extractRequestInfoFromRequest(request).requestId,
    });

    logger.error("Profile access error:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to retrieve profile",
        details: ["An unexpected error occurred"],
      },
      { status: 500 }
    );
  }
}
