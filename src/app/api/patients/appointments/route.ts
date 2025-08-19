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

    // Check if user is a patient
    if (payload.role !== "PATIENT") {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "patient-appointments",
        success: false,
        errorMessage: "Only patients can access their appointments",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only patients can access their appointments",
        },
        { status: 403 }
      );
    }

    // Get patient ID from the user ID
    const patient = await prisma.patient.findUnique({
      where: { userId: payload.userId },
      select: { id: true },
    });

    if (!patient) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "Patient record not found",
        },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const statuses = searchParams.getAll("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    // Build where clause
    const whereClause: {
      patientId: string;
      status?: { in: string[] };
      startTime?: { gte: Date; lte: Date };
    } = {
      patientId: patient.id,
    };

    if (statuses.length > 0) {
      whereClause.status = { in: statuses };
    }

    if (type) {
      whereClause.type = type;
    }

    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) {
        whereClause.startTime.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.startTime.lte = new Date(endDate);
      }
    }

    // Get total count for pagination
    const total = await prisma.appointment.count({ where: whereClause });

    // Get appointments with pagination
    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
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
        },
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            firstNameEncrypted: true,
            lastNameEncrypted: true,
            emailEncrypted: true,
            specialtyEncrypted: true,
            role: true,
            specialty: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Decrypt PII data for each appointment's patient and provider
    const appointmentsWithDecryptedData = await Promise.all(
      appointments.map(async (appointment) => {
        try {
          // Decrypt patient PII data if user data exists
          let decryptedPatientData = null;
          if (appointment.patient?.user) {
            decryptedPatientData = await PIIDecryptionService.decryptUserPII(appointment.patient.user);
          }

          // Decrypt provider (doctor) PII data
          let decryptedProviderData = null;
          if (appointment.provider) {
            decryptedProviderData = await PIIDecryptionService.decryptUserPII(appointment.provider);
          }

          return {
            ...appointment,
            patient: {
              ...appointment.patient,
              firstName: decryptedPatientData?.firstName || appointment.patient?.firstName || "Unknown",
              lastName: decryptedPatientData?.lastName || appointment.patient?.lastName || "Patient",
            },
            provider: {
              ...appointment.provider,
              firstName: decryptedProviderData?.firstName || appointment.provider?.firstName || "Unknown",
              lastName: decryptedProviderData?.lastName || appointment.provider?.lastName || "Provider",
              specialty: decryptedProviderData?.specialty || appointment.provider?.specialty || "General",
            },
          };
        } catch (error) {
          logger.warn(`Failed to decrypt PII for appointment ${appointment.id}:`, error);
          // Return appointment with fallback data
          return {
            ...appointment,
            patient: {
              ...appointment.patient,
              firstName: appointment.patient?.firstName || "[Encrypted]",
              lastName: appointment.patient?.lastName || "[Encrypted]",
            },
            provider: {
              ...appointment.provider,
              firstName: appointment.provider?.firstName || "[Encrypted]", 
              lastName: appointment.provider?.lastName || "[Encrypted]",
              specialty: appointment.provider?.specialty || "[Encrypted]",
            },
          };
        }
      })
    );

    // Log successful access
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_ACCESSED,
      resource: "patient-appointments",
      success: true,
      metadata: {
        filters: { statuses, startDate, endDate, type },
        pagination: { page, limit, total },
      },
      ...requestInfo,
    });

    return NextResponse.json({
      success: true,
      data: {
        appointments: appointmentsWithDecryptedData.map((appointment) => ({
          id: appointment.id,
          patientId: appointment.patientId,
          providerId: appointment.providerId,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          timezone: appointment.timezone,
          type: appointment.type,
          status: appointment.status,
          reason: appointment.reason,
          priority: appointment.priority,
          notes: appointment.notesEncrypted ? "***ENCRYPTED***" : null,
          reminderSent: appointment.reminderSent,
          confirmationSent: appointment.confirmationSent,
          locationType: appointment.locationType,
          roomNumber: appointment.roomNumber,
          virtualMeetingUrl: appointment.virtualMeetingUrl,
          patient: appointment.patient,
          provider: appointment.provider,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: requestInfo.requestId,
      },
    });
  } catch (error) {
    logger.error("Get patient appointments error:", error);

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
