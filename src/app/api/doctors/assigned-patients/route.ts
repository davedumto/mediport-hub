import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { AuditService, AuditAction } from "@/lib/audit";
import { extractRequestInfoFromRequest } from "@/utils/appRouterHelpers";
import logger from "@/lib/logger";
import { verifyAccessToken } from "@/lib/auth";
import { PIIDecryptionService } from "@/services/piiDecryptionService";
import { PIIProtectionService } from "@/services/piiProtectionService";

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

    // Extract and verify JWT token
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

    // Check if user is a doctor
    if (payload.role !== "DOCTOR") {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "assigned-patients",
        success: false,
        errorMessage: "Only doctors can access assigned patients",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only doctors can access assigned patients",
        },
        { status: 403 }
      );
    }

    // Get patients assigned to this doctor
    const assignedPatients = await prisma.patient.findMany({
      where: {
        assignedProviderId: payload.userId,
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstNameEncrypted: true,
            lastNameEncrypted: true,
            emailEncrypted: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Order by creation date since names might be encrypted
      },
    });

    // Decrypt PII data for each patient
    const decryptedPatients = await Promise.all(
      assignedPatients.map(async (patient) => {
        try {
          // Decrypt patient PII data if user data exists
          let decryptedPatientData = null;
          if (patient.user) {
            decryptedPatientData = await PIIDecryptionService.decryptUserPII(patient.user);
          }

          return {
            id: patient.id,
            firstName: decryptedPatientData?.firstName || patient.firstName || "Unknown",
            lastName: decryptedPatientData?.lastName || patient.lastName || "Patient",
            email: decryptedPatientData?.email || patient.email || "No email",
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            status: patient.status,
            createdAt: patient.createdAt,
            updatedAt: patient.updatedAt,
          };
        } catch (error) {
          logger.warn(`Failed to decrypt patient PII for patient ${patient.id}:`, error);
          // Return patient with fallback data
          return {
            id: patient.id,
            firstName: patient.firstName || "[Encrypted]",
            lastName: patient.lastName || "[Encrypted]",
            email: patient.email || "[Encrypted]",
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            status: patient.status,
            createdAt: patient.createdAt,
            updatedAt: patient.updatedAt,
          };
        }
      })
    );

    // Log successful access
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_ACCESSED,
      resource: "assigned-patients",
      success: true,
      metadata: {
        patientCount: decryptedPatients.length,
      },
      ...requestInfo,
    });

    return NextResponse.json({
      success: true,
      data: {
        patients: decryptedPatients,
        count: decryptedPatients.length,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: requestInfo.requestId,
      },
    });
  } catch (error) {
    logger.error("Get assigned patients error:", error);

    if (
      error instanceof Error &&
      (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError")
    ) {
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
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
