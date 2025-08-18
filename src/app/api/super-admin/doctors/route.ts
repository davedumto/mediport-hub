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
        resource: "super_admin_doctors",
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

    // Fetch all doctors with encrypted data
    const doctors = await prisma.user.findMany({
      where: { 
        role: "DOCTOR" 
      },
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
        // Encrypted PII fields
        firstNameEncrypted: true,
        lastNameEncrypted: true,
        emailEncrypted: true,
        specialtyEncrypted: true,
        medicalLicenseNumberEncrypted: true,
        // Don't select plaintext PII fields
      },
    });

    // Decrypt PII data for each doctor (server-side only)
    const decryptedDoctors = await Promise.all(
      doctors.map(async (doctor) => {
        try {
          const decryptedPII = await PIIDecryptionService.decryptUserPII(doctor);
          
          // Prepare PII data for secure masking (like profile endpoint)
          const userData = {
            email: doctor.email,
            firstName: decryptedPII.firstName || "Unknown",
            lastName: decryptedPII.lastName || "Unknown", 
            specialty: decryptedPII.specialty || "Not specified",
            medicalLicenseNumber: decryptedPII.medicalLicenseNumber || "Not provided",
          };

          // Mask PII data for secure transport (like profile endpoint does)
          const maskedUserData = PIIProtectionService.prepareUserDataForResponse(userData, true);

          return {
            id: doctor.id,
            // Masked PII fields for security
            email: maskedUserData.email,
            firstName: maskedUserData.firstName,
            lastName: maskedUserData.lastName, 
            specialty: maskedUserData.specialty,
            medicalLicenseNumber: maskedUserData.medicalLicenseNumber,
            // Safe metadata
            role: doctor.role,
            verificationStatus: doctor.verificationStatus,
            isActive: doctor.isActive,
            emailVerified: doctor.emailVerified,
            createdAt: doctor.createdAt,
            updatedAt: doctor.updatedAt,
            lastLogin: doctor.lastLogin,
          };
        } catch (decryptError) {
          logger.warn(`Failed to decrypt doctor PII for ${doctor.id}:`, decryptError);
          
          // Mask even the fallback data for security
          const fallbackUserData = {
            email: doctor.email,
            firstName: "[Encrypted]",
            lastName: "[Encrypted]",
            specialty: "[Encrypted]",
            medicalLicenseNumber: "[Encrypted]",
          };
          const maskedFallbackData = PIIProtectionService.prepareUserDataForResponse(fallbackUserData, true);
          
          return {
            id: doctor.id,
            // Masked PII fields for security (even fallbacks)
            email: maskedFallbackData.email,
            firstName: maskedFallbackData.firstName,
            lastName: maskedFallbackData.lastName,
            specialty: maskedFallbackData.specialty,
            medicalLicenseNumber: maskedFallbackData.medicalLicenseNumber,
            // Safe metadata
            role: doctor.role,
            verificationStatus: doctor.verificationStatus,
            isActive: doctor.isActive,
            emailVerified: doctor.emailVerified,
            createdAt: doctor.createdAt,
            updatedAt: doctor.updatedAt,
            lastLogin: doctor.lastLogin,
          };
        }
      })
    );

    const requestInfo = extractRequestInfoFromRequest(request);

    // Log super admin access to doctor data
    await AuditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: AuditAction.DATA_ACCESSED,
      resource: "super_admin_doctors",
      resourceId: null,
      success: true,
      changes: {
        doctorsAccessed: decryptedDoctors.length,
        action: "Super admin viewed doctor list with decrypted PII",
      },
      ...requestInfo,
    });

    logger.info(`Super admin ${user.email} accessed ${decryptedDoctors.length} doctor records`);

    return NextResponse.json(
      {
        success: true,
        data: {
          doctors: decryptedDoctors,
          total: decryptedDoctors.length,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    logger.error("Super admin doctors endpoint error:", error);

    // Log error for audit
    try {
      const requestInfo = extractRequestInfoFromRequest(request);
      await AuditService.log({
        action: AuditAction.ACCESS_FAILED,
        resource: "super_admin_doctors",
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
        message: "Failed to retrieve doctor data",
      },
      { status: 500 }
    );
  }
}