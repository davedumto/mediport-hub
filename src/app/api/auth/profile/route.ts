import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "../../../../lib/auth";
import { AuditService, AuditAction } from "../../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";
import prisma from "../../../../lib/db";
import logger from "../../../../lib/logger";
import { PIIProtectionService } from "../../../../services/piiProtectionService";
import { withEncryptionMiddleware } from "../../../../middleware/encryption";

async function profileHandler(request: NextRequest) {
  try {
    // Initialize PII protection service
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      logger.error("Encryption key not configured");
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "System configuration error",
        },
        { status: 500 }
      );
    }
    PIIProtectionService.initialize(encryptionKey);

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

    const requestInfo = extractRequestInfoFromRequest(request);

    // Log profile access with masked email
    await AuditService.log({
      userId: user.id,
      userEmail: PIIProtectionService.prepareUserDataForResponse({ email: user.email }, true).email,
      userRole: user.role,
      action: AuditAction.PROFILE_ACCESSED,
      resource: "user_profile",
      resourceId: user.id,
      success: true,
      ...requestInfo,
    });

    // Check if the request wants decrypted data
    const { searchParams } = new URL(request.url);
    const includeDecrypted = searchParams.get("includeDecrypted") === "true";

    // For patients and users without encryption, show plaintext data
    // For users with encryption, mask the plaintext and require decryption
    const hasAnyEncryptedData = !!(user.firstNameEncrypted || user.lastNameEncrypted || 
                                   user.emailEncrypted || user.phoneEncrypted ||
                                   user.specialtyEncrypted || user.medicalLicenseNumberEncrypted);
    
    let safeUserData;
    if (!hasAnyEncryptedData) {
      // User has no encryption - show plaintext data directly (for legacy users or patients)
      safeUserData = {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        specialty: user.specialty,
        medicalLicenseNumber: user.medicalLicenseNumber,
      };
    } else {
      // User has encryption - mask plaintext data and require decryption
      const userDataForMasking = {
        ...user,
        firstName: user.firstName || "[Encrypted]",
        lastName: user.lastName || "[Encrypted]",
        phone: user.phone || "[Encrypted]",
        specialty: user.specialty || "[Encrypted]",
        medicalLicenseNumber: user.medicalLicenseNumber || "[Encrypted]",
      };
      safeUserData = PIIProtectionService.prepareUserDataForResponse(userDataForMasking, true);
    }

    // Build response with only necessary fields
    const responseData = {
      id: user.id,
      role: user.role,
      permissions,
      isActive: user.isActive,
      mfaEnabled: user.mfaEnabled,
      emailVerified: user.emailVerified,
      lastLogin: user.lastLogin,
      verificationStatus: user.verificationStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Masked PII fields - frontend can request decryption separately
      email: safeUserData.email || "[Protected]",
      firstName: safeUserData.firstName || "[Protected]",
      lastName: safeUserData.lastName || "[Protected]",
      dateOfBirth: user.dateOfBirth, // Not PII
      // Professional fields (masked if present)
      medicalLicenseNumber: safeUserData.medicalLicenseNumber || null,
      specialty: safeUserData.specialty || null,
      // Encrypted field indicators
      hasEncryptedData: {
        firstName: !!user.firstNameEncrypted,
        lastName: !!user.lastNameEncrypted,
        email: !!user.emailEncrypted,
        medicalLicenseNumber: !!user.medicalLicenseNumberEncrypted,
        specialty: !!user.specialtyEncrypted,
      },
    };

    return NextResponse.json(
      {
        success: true,
        message: "Profile retrieved successfully",
        data: {
          user: responseData,
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

// Export the handler with encryption middleware
export const GET = withEncryptionMiddleware(profileHandler, {
  enablePIIProtection: true,
  maskingLevel: "partial",
  includeAuditLog: true,
});
