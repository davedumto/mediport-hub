import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";
import { PIIDecryptionService } from "@/services/piiDecryptionService";
import { PIIProtectionService } from "@/services/piiProtectionService";
import { AuditService, AuditAction } from "@/lib/audit";
import { extractRequestInfoFromRequest } from "@/utils/appRouterHelpers";
import prisma from "@/lib/db";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
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
        },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyAccessToken(accessToken);

    // Verify user exists and is SUPER_ADMIN
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.role !== "SUPER_ADMIN") {
      const requestInfo = extractRequestInfoFromRequest(request);
      
      // Log unauthorized access attempt
      await AuditService.log({
        userId: payload.userId,
        userEmail: user?.email || "unknown",
        userRole: user?.role || "unknown",
        action: AuditAction.ACCESS_DENIED,
        resource: "super_admin_patients",
        resourceId: null,
        success: false,
        errorMessage: "Insufficient permissions for super admin endpoint",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Super admin access required",
        },
        { status: 403 }
      );
    }

    // Fetch all patients with their associated user data and encrypted fields
    const patientsWithUsers = await prisma.patient.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            verificationStatus: true,
            isActive: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            lastLogin: true,
            // Encrypted PII fields from user table
            firstNameEncrypted: true,
            lastNameEncrypted: true,
            emailEncrypted: true,
            // Don't select plaintext PII fields
          },
        },
      },
    });

    // Decrypt PII data for each patient (server-side only)
    const decryptedPatients = await Promise.all(
      patientsWithUsers.map(async (patient) => {
        try {
          // Decrypt user PII data (firstName, lastName from user table)
          const decryptedUserPII = patient.user 
            ? await PIIDecryptionService.decryptUserPII(patient.user)
            : { firstName: null, lastName: null, email: null };

          // Decrypt patient-specific PII data (address, phone, emergency contacts)
          const decryptedPatientPII = await PIIDecryptionService.decryptPatientPII(patient);
          
          // Prepare PII data for secure masking (like profile endpoint)
          const userData = {
            email: patient.user?.email || patient.email,
            firstName: decryptedUserPII.firstName || "Unknown",
            lastName: decryptedUserPII.lastName || "Unknown",
            phone: decryptedPatientPII.phone || "Not provided",
          };

          // Mask PII data for secure transport (like profile endpoint does)
          const maskedUserData = PIIProtectionService.prepareUserDataForResponse(userData, true);

          return {
            id: patient.id,
            userId: patient.userId,
            // Masked PII fields for security
            email: maskedUserData.email,
            firstName: maskedUserData.firstName,
            lastName: maskedUserData.lastName,
            phone: maskedUserData.phone,
            // Non-PII patient data (safe to expose)
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            bloodType: patient.bloodType,
            // Safe metadata
            allergies: patient.allergies,
            chronicConditions: patient.chronicConditions,
            currentMedications: patient.currentMedications,
            status: patient.status,
            gdprConsent: patient.gdprConsent,
            gdprConsentDate: patient.gdprConsentDate,
            createdAt: patient.createdAt,
            updatedAt: patient.updatedAt,
            // User metadata if available
            role: patient.user?.role || "PATIENT",
            verificationStatus: patient.user?.verificationStatus || "PENDING_VERIFICATION",
            isActive: patient.user?.isActive ?? true,
            emailVerified: patient.user?.emailVerified ?? false,
            lastLogin: patient.user?.lastLogin,
          };
        } catch (decryptError) {
          logger.warn(`Failed to decrypt patient PII for ${patient.id}:`, decryptError);
          
          // Mask even the fallback data for security
          const fallbackUserData = {
            email: patient.user?.email || patient.email,
            firstName: "[Encrypted]",
            lastName: "[Encrypted]",
            phone: "[Encrypted]",
          };
          const maskedFallbackData = PIIProtectionService.prepareUserDataForResponse(fallbackUserData, true);
          
          return {
            id: patient.id,
            userId: patient.userId,
            // Masked PII fields for security (even fallbacks)
            email: maskedFallbackData.email,
            firstName: maskedFallbackData.firstName,
            lastName: maskedFallbackData.lastName,
            phone: maskedFallbackData.phone,
            // Non-PII patient data (safe to expose)
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            bloodType: patient.bloodType,
            // Safe metadata
            allergies: patient.allergies,
            chronicConditions: patient.chronicConditions,
            currentMedications: patient.currentMedications,
            status: patient.status,
            gdprConsent: patient.gdprConsent,
            gdprConsentDate: patient.gdprConsentDate,
            createdAt: patient.createdAt,
            updatedAt: patient.updatedAt,
            // User metadata if available
            role: patient.user?.role || "PATIENT",
            verificationStatus: patient.user?.verificationStatus || "PENDING_VERIFICATION",
            isActive: patient.user?.isActive ?? true,
            emailVerified: patient.user?.emailVerified ?? false,
            lastLogin: patient.user?.lastLogin,
          };
        }
      })
    );

    const requestInfo = extractRequestInfoFromRequest(request);

    // Log super admin access to patient data
    await AuditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: AuditAction.DATA_ACCESSED,
      resource: "super_admin_patients",
      resourceId: null,
      success: true,
      changes: {
        patientsAccessed: decryptedPatients.length,
        action: "Super admin viewed patient list with decrypted PII",
      },
      ...requestInfo,
    });

    logger.info(`Super admin ${user.email} accessed ${decryptedPatients.length} patient records`);

    return NextResponse.json(
      {
        success: true,
        data: {
          patients: decryptedPatients,
          total: decryptedPatients.length,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    logger.error("Super admin patients endpoint error:", error);

    // Log error for audit
    try {
      const requestInfo = extractRequestInfoFromRequest(request);
      await AuditService.log({
        action: AuditAction.ACCESS_FAILED,
        resource: "super_admin_patients",
        success: false,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        ...requestInfo,
      });
    } catch (auditError) {
      logger.error("Failed to log audit event:", auditError);
    }

    return NextResponse.json(
      {
        error: "Internal Server Error", 
        message: "Failed to retrieve patient data",
      },
      { status: 500 }
    );
  }
}