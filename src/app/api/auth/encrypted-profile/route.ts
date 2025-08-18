import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "../../../../lib/auth";
import { AuditService, AuditAction } from "../../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";
import prisma from "../../../../lib/db";
import logger from "../../../../lib/logger";

/**
 * Secure endpoint that returns encrypted PII data for client-side decryption
 * This ensures PII is never transmitted in plain text over the network
 */
export async function GET(request: NextRequest) {
  try {
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
    
    // Users can access their own encrypted data
    if (targetUserId === payload.userId) {
      hasAccess = true;
    }
    // Admins can access any encrypted data
    else if (payload.role === "SUPER_ADMIN" || payload.role === "ADMIN") {
      hasAccess = true;
    }
    // Doctors can access their patients' encrypted data
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
        resource: "encrypted_profile_access",
        resourceId: targetUserId,
        success: false,
        errorMessage: "Access denied for encrypted profile data",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "You do not have permission to access this encrypted profile",
        },
        { status: 403 }
      );
    }

    // Fetch user with encrypted fields only
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        role: true,
        dateOfBirth: true,
        isActive: true,
        emailVerified: true,
        mfaEnabled: true,
        lastLogin: true,
        verificationStatus: true,
        createdAt: true,
        updatedAt: true,
        // Encrypted fields only - never plain text
        firstNameEncrypted: true,
        lastNameEncrypted: true,
        emailEncrypted: true,
        phoneEncrypted: true,
        specialtyEncrypted: true,
        medicalLicenseNumberEncrypted: true,
        userRoles: {
          include: {
            role: true,
          },
        },
        patients: {
          select: {
            id: true,
            gender: true,
            bloodType: true,
            allergies: true,
            chronicConditions: true,
            currentMedications: true,
            gdprConsent: true,
            gdprConsentDate: true,
            // Encrypted patient fields
            phoneEncrypted: true,
            addressStreetEncrypted: true,
            addressCityEncrypted: true,
            addressStateEncrypted: true,
            addressZipEncrypted: true,
            addressCountryEncrypted: true,
            emergencyNameEncrypted: true,
            emergencyRelationshipEncrypted: true,
            emergencyPhoneEncrypted: true,
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

    // Extract permissions from roles
    const permissions =
      user.userRoles?.flatMap((ur) => ur.role.permissions as string[]) || [];

    // Log encrypted data access
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      userRole: payload.role,
      action: AuditAction.DATA_ACCESSED,
      resource: "encrypted_user_profile",
      resourceId: targetUserId,
      success: true,
      metadata: {
        accessType: "encrypted_data_only",
        fieldsRequested: [
          "firstName",
          "lastName", 
          "email",
          "phone",
          "specialty",
          "medicalLicenseNumber",
        ],
      },
      ...requestInfo,
    });

    // Helper function to safely convert encrypted fields
    const safeEncryptedField = (field: any) => {
      if (!field) return null;
      if (Buffer.isBuffer(field)) {
        return Buffer.from(field).toString('utf8');
      }
      if (field instanceof Uint8Array) {
        return Buffer.from(field).toString('utf8');
      }
      return field;
    };

    // Return encrypted data only - client will decrypt
    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          dateOfBirth: user.dateOfBirth,
          role: user.role,
          permissions,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          mfaEnabled: user.mfaEnabled,
          lastLogin: user.lastLogin,
          verificationStatus: user.verificationStatus,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          // Encrypted fields for client-side decryption
          encrypted: {
            firstName: safeEncryptedField(user.firstNameEncrypted),
            lastName: safeEncryptedField(user.lastNameEncrypted),
            email: safeEncryptedField(user.emailEncrypted),
            phone: safeEncryptedField(user.phoneEncrypted),
            specialty: safeEncryptedField(user.specialtyEncrypted),
            medicalLicenseNumber: safeEncryptedField(user.medicalLicenseNumberEncrypted),
          },
        },
        patient: user.patients ? {
          id: user.patients.id,
          gender: user.patients.gender,
          bloodType: user.patients.bloodType,
          allergies: user.patients.allergies,
          chronicConditions: user.patients.chronicConditions,
          currentMedications: user.patients.currentMedications,
          gdprConsent: user.patients.gdprConsent,
          gdprConsentDate: user.patients.gdprConsentDate,
          // Encrypted patient fields for client-side decryption
          encrypted: {
            phone: safeEncryptedField(user.patients.phoneEncrypted),
            addressStreet: safeEncryptedField(user.patients.addressStreetEncrypted),
            addressCity: safeEncryptedField(user.patients.addressCityEncrypted),
            addressState: safeEncryptedField(user.patients.addressStateEncrypted),
            addressZip: safeEncryptedField(user.patients.addressZipEncrypted),
            addressCountry: safeEncryptedField(user.patients.addressCountryEncrypted),
            emergencyName: safeEncryptedField(user.patients.emergencyNameEncrypted),
            emergencyRelationship: safeEncryptedField(user.patients.emergencyRelationshipEncrypted),
            emergencyPhone: safeEncryptedField(user.patients.emergencyPhoneEncrypted),
          },
        } : null,
      },
    });
  } catch (error) {
    logger.error("Encrypted profile access error:", error);

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
        message: "Failed to access encrypted profile data",
      },
      { status: 500 }
    );
  }
}