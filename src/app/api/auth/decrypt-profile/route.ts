import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "../../../../lib/auth";
import { AuditService, AuditAction } from "../../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";
import prisma from "../../../../lib/db";
import logger from "../../../../lib/logger";
import { PIIDecryptionService } from "../../../../services/piiDecryptionService";
import { PIIProtectionService } from "../../../../services/piiProtectionService";

/**
 * Endpoint for decrypting user profile PII data
 * This should be called client-side when the user needs to see their full profile
 */
export async function GET(request: NextRequest) {
  try {
    // Initialize decryption service
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

    // Initialize the PII protection service with the encryption key
    PIIProtectionService.initialize(encryptionKey);

    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Missing or invalid authorization header",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    const requestInfo = extractRequestInfoFromRequest(request);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId") || payload.userId;

    // Check permissions
    let hasAccess = false;
    
    // Users can decrypt their own profile
    if (targetUserId === payload.userId) {
      hasAccess = true;
    }
    // Admins can decrypt any profile
    else if (payload.role === "SUPER_ADMIN" || payload.role === "ADMIN") {
      hasAccess = true;
    }
    // Doctors can decrypt their patients' profiles
    else if (payload.role === "DOCTOR") {
      const patient = await prisma.patient.findFirst({
        where: {
          userId: targetUserId,
          assignedProviderId: payload.userId,
        },
      });
      hasAccess = !!patient;
    }

    if (!hasAccess) {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "profile_decryption",
        resourceId: targetUserId,
        success: false,
        errorMessage: "Access denied for profile decryption",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "You do not have permission to decrypt this profile",
        },
        { status: 403 }
      );
    }

    // Fetch user with encrypted fields
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        patients: true,
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
        },
        { status: 404 }
      );
    }

    // Decrypt user PII
    const decryptedUser = await PIIDecryptionService.decryptUserPII(user);

    // If user has patient record, decrypt that too
    let decryptedPatient = null;
    if (user.patients) {
      decryptedPatient = await PIIDecryptionService.decryptPatientPII(user.patients);
    }

    // Extract permissions from roles
    const permissions =
      user.userRoles?.flatMap((ur) => ur.role.permissions as string[]) || [];

    // Log successful decryption
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      userRole: payload.role,
      action: AuditAction.DATA_DECRYPTED,
      resource: "user_profile",
      resourceId: targetUserId,
      success: true,
      changes: {
        fieldsDecrypted: [
          "firstName",
          "lastName",
          "email",
          "specialty",
          "medicalLicenseNumber",
        ],
      },
      ...requestInfo,
    });

    // SECURITY NOTE: This endpoint returns decrypted PII over HTTPS
    // Additional security measures:
    // 1. Requires valid JWT authentication
    // 2. Role-based access control
    // 3. Comprehensive audit logging
    // 4. Rate limiting (via middleware)
    // 5. Should only be used over HTTPS in production
    
    // Return decrypted profile for authenticated users
    return NextResponse.json({
      success: true,
      data: {
        user: {
          email: decryptedUser.email,
          firstName: decryptedUser.firstName,
          lastName: decryptedUser.lastName,
          dateOfBirth: user.dateOfBirth,
          role: user.role,
          permissions,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          mfaEnabled: user.mfaEnabled,
          lastLogin: user.lastLogin,
          verificationStatus: user.verificationStatus,
          // Professional fields (if applicable)
          specialty: decryptedUser.specialty,
          medicalLicenseNumber: decryptedUser.medicalLicenseNumber,
          // Timestamps
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        patient: decryptedPatient && user.patients ? {
          id: user.patients.id,
          gender: user.patients.gender,
          bloodType: user.patients.bloodType,
          allergies: user.patients.allergies,
          chronicConditions: user.patients.chronicConditions,
          currentMedications: user.patients.currentMedications,
          addressStreet: decryptedPatient.addressStreet,
          addressCity: decryptedPatient.addressCity,
          addressState: decryptedPatient.addressState,
          addressZip: decryptedPatient.addressZip,
          addressCountry: decryptedPatient.addressCountry,
          emergencyName: decryptedPatient.emergencyName,
          emergencyRelationship: decryptedPatient.emergencyRelationship,
          emergencyPhone: decryptedPatient.emergencyPhone,
          gdprConsent: user.patients.gdprConsent,
          gdprConsentDate: user.patients.gdprConsentDate,
        } : null,
      },
    });
  } catch (error) {
    logger.error("Profile decryption error:", error);

    if (error instanceof Error && 
        (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError")) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid or expired token",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to decrypt profile data",
      },
      { status: 500 }
    );
  }
}