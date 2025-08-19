import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/db";
import { AuditService, AuditAction } from "../../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";
import logger from "../../../../lib/logger";
import { verifyAccessToken } from "../../../../lib/auth";
import { PIIDecryptionService } from "../../../../services/piiDecryptionService";
import { PIIProtectionService } from "../../../../services/piiProtectionService";

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
        resource: "doctor-appointments",
        success: false,
        errorMessage: "Only doctors can access doctor appointments",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only doctors can access doctor appointments",
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    // Build where clause - doctors can see appointments where they are the provider
    const whereClause: any = {
      providerId: payload.userId,
    };

    if (status) {
      whereClause.status = status;
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
            role: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Decrypt PII data for each appointment's patient
    const appointmentsWithDecryptedPatients = await Promise.all(
      appointments.map(async (appointment) => {
        try {
          // Decrypt patient PII data if user data exists
          let decryptedPatientData = null;
          if (appointment.patient?.user) {
            decryptedPatientData = await PIIDecryptionService.decryptUserPII(
              appointment.patient.user
            );
          }

          return {
            ...appointment,
            patient: {
              ...appointment.patient,
              // Override with decrypted data if available
              firstName:
                decryptedPatientData?.firstName ||
                appointment.patient?.firstName ||
                "Unknown",
              lastName:
                decryptedPatientData?.lastName ||
                appointment.patient?.lastName ||
                "Patient",
              email:
                decryptedPatientData?.email ||
                appointment.patient?.email ||
                "No email",
            },
          };
        } catch (error) {
          logger.warn(
            `Failed to decrypt patient PII for appointment ${appointment.id}:`,
            error
          );
          // Return appointment with fallback patient data
          return {
            ...appointment,
            patient: {
              ...appointment.patient,
              firstName: appointment.patient?.firstName || "[Encrypted]",
              lastName: appointment.patient?.lastName || "[Encrypted]",
              email: appointment.patient?.email || "[Encrypted]",
            },
          };
        }
      })
    );

    // Transform appointments to match the expected format
    const transformedAppointments = appointmentsWithDecryptedPatients.map(
      (appointment) => ({
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
      })
    );

    // Log successful access
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_ACCESSED,
      resource: "doctor-appointments",
      success: true,
      metadata: {
        filters: { startDate, endDate, status, type },
        pagination: { page, limit, total },
      },
      ...requestInfo,
    });

    return NextResponse.json({
      success: true,
      data: {
        appointments: transformedAppointments,
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
    logger.error("Get doctor appointments error:", error);

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

export async function POST(request: NextRequest) {
  try {
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
        resource: "doctor-appointments-create",
        success: false,
        errorMessage: "Only doctors can create appointments",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only doctors can create appointments",
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      patientId,
      startTime,
      endTime,
      timezone,
      type,
      status,
      reason,
      priority,
      locationType,
      notesEncrypted,
    } = body;

    // Validate required fields
    if (!patientId || !startTime || !endTime || !type || !status) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message:
            "Missing required fields: patientId, startTime, endTime, type, status",
        },
        { status: 400 }
      );
    }

    // Verify patient exists and is assigned to this doctor
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { assignedProvider: true },
    });

    if (!patient) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "Patient not found",
        },
        { status: 404 }
      );
    }

    // Check if patient is assigned to this doctor
    if (patient.assignedProviderId !== payload.userId) {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "doctor-appointments-create",
        success: false,
        errorMessage: "Patient not assigned to this doctor",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "You can only create appointments for assigned patients",
        },
        { status: 403 }
      );
    }

    // Create the appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        providerId: payload.userId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        type,
        status,
        reason: reason || null,
        priority: priority || "NORMAL",
        locationType: locationType || "IN_PERSON",
        notesEncrypted: notesEncrypted
          ? Buffer.from(notesEncrypted, "base64")
          : null,
        createdBy: payload.userId,
        updatedBy: payload.userId,
      },
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
            role: true,
          },
        },
      },
    });

    // Decrypt patient PII data for the response
    let decryptedPatientData = null;
    try {
      if (appointment.patient?.user) {
        decryptedPatientData = await PIIDecryptionService.decryptUserPII(
          appointment.patient.user
        );
      }
    } catch (error) {
      logger.warn(
        `Failed to decrypt patient PII for new appointment ${appointment.id}:`,
        error
      );
    }

    // Prepare patient data with decryption
    const patientData = {
      ...appointment.patient,
      firstName:
        decryptedPatientData?.firstName ||
        appointment.patient?.firstName ||
        "Unknown",
      lastName:
        decryptedPatientData?.lastName ||
        appointment.patient?.lastName ||
        "Patient",
      email:
        decryptedPatientData?.email || appointment.patient?.email || "No email",
    };

    // Log successful creation
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_CREATED,
      resource: "doctor-appointments",
      resourceId: appointment.id,
      success: true,
      metadata: {
        patientId,
        startTime,
        endTime,
        type,
        status,
      },
      ...requestInfo,
    });

    return NextResponse.json({
      success: true,
      data: {
        appointment: {
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
          locationType: appointment.locationType,
          patient: patientData,
          provider: appointment.provider,
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: requestInfo.requestId,
      },
    });
  } catch (error) {
    logger.error("Create doctor appointment error:", error);
    console.error("Create doctor appointment error details:", error);

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

    // Return more specific error information for debugging
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        details: process.env.NODE_ENV === "development" ? error : undefined,
      },
      { status: 500 }
    );
  }
}
