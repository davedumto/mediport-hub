import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/db";
import { AuditService, AuditAction } from "../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../utils/appRouterHelpers";
import logger from "../../../lib/logger";
import { verifyAccessToken } from "../../../lib/auth";
import { hasPermission } from "../../../lib/permissions";
import { Permission } from "../../../types/auth";
import { createAppointmentSchema } from "../../../lib/validation";
import { SanitizationService } from "../../../services/sanitizationService";
import { encryptField } from "../../../lib/encryption";

export async function GET(request: NextRequest) {
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

    // Check permissions
    const userPermissions = payload.permissions || [];
    const canReadAll = hasPermission(
      userPermissions as Permission[],
      Permission.APPOINTMENT_READ_ALL
    );
    const canReadAssigned = hasPermission(
      userPermissions as Permission[],
      Permission.APPOINTMENT_READ_ASSIGNED
    );
    const canReadOwn = hasPermission(
      userPermissions as Permission[],
      Permission.APPOINTMENT_READ_OWN
    );

    if (!canReadAll && !canReadAssigned && !canReadOwn) {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "appointments",
        success: false,
        errorMessage: "Insufficient permissions to read appointments",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Insufficient permissions to access appointments",
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const providerId = searchParams.get("providerId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    // Build where clause based on permissions
    const whereClause: any = {};

    if (patientId) {
      whereClause.patientId = patientId;
    }

    if (providerId) {
      whereClause.providerId = providerId;
    }

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

    // Apply permission-based filtering
    if (canReadOwn) {
      // Patients can only see their own appointments
      whereClause.patientId = {
        in: await getPatientIdsForUser(payload.userId),
      };
    } else if (canReadAssigned && !canReadAll) {
      // Nurses and Doctors can only see appointments for assigned patients or where they are the provider
      const assignedPatientIds = await getAssignedPatientIds(payload.userId);
      whereClause.OR = [
        { patientId: { in: assignedPatientIds } },
        { providerId: payload.userId },
      ];
    }
    // canReadAll can see all appointments (no additional filtering)

    // Get total count for pagination
    const total = await prisma.appointment.count({ where: whereClause });

    // Get appointments with pagination
    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
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

    // Log successful access
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_ACCESSED,
      resource: "appointments",
      success: true,
      metadata: {
        filters: { patientId, providerId, status, startDate, endDate, type },
        pagination: { page, limit, total },
      },
      ...requestInfo,
    });

    return NextResponse.json({
      success: true,
      data: {
        appointments: appointments.map((appointment) => ({
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
    logger.error("Get appointments error:", error);

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

    // Check permissions
    const userPermissions = payload.permissions || [];
    if (
      !hasPermission(
        userPermissions as Permission[],
        Permission.APPOINTMENT_CREATE
      )
    ) {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "appointments",
        success: false,
        errorMessage: "Insufficient permissions to create appointments",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Insufficient permissions to create appointments",
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createAppointmentSchema.parse(body);

    // Sanitize input data
    const sanitizedData = {
      ...validatedData,
      reason: validatedData.reason
        ? SanitizationService.sanitizeMedicalData(validatedData.reason)
        : null,
      notes: validatedData.notes
        ? SanitizationService.sanitizeMedicalData(validatedData.notes)
        : null,
    };

    // Verify patient exists and user has access
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId },
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

    // Check if user has access to this patient
    if (payload.role !== "SUPER_ADMIN" && payload.role !== "ADMIN") {
      if (payload.role === "PATIENT" && patient.userId !== payload.userId) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "You can only create appointments for yourself",
          },
          { status: 403 }
        );
      }

      if (
        (payload.role === "DOCTOR" || payload.role === "NURSE") &&
        patient.assignedProviderId !== payload.userId
      ) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "You can only create appointments for assigned patients",
          },
          { status: 403 }
        );
      }
    }

    // Verify provider exists and is a healthcare provider
    const provider = await prisma.user.findUnique({
      where: { id: validatedData.providerId },
      select: { id: true, role: true, isActive: true },
    });

    if (!provider || !provider.isActive) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Invalid or inactive provider",
        },
        { status: 400 }
      );
    }

    if (!["DOCTOR", "NURSE"].includes(provider.role)) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Provider must be a healthcare professional",
        },
        { status: 400 }
      );
    }

    // Check for scheduling conflicts
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        providerId: validatedData.providerId,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        OR: [
          {
            startTime: { lt: validatedData.endTime },
            endTime: { gt: validatedData.startTime },
          },
        ],
      },
    });

    if (conflictingAppointment) {
      return NextResponse.json(
        {
          error: "Conflict",
          message: "Provider has a conflicting appointment at this time",
          details: ["Please choose a different time or provider"],
        },
        { status: 409 }
      );
    }

    // Encrypt sensitive fields
    const encryptedData = {
      ...sanitizedData,
      notesEncrypted: sanitizedData.notes
        ? await encryptField(sanitizedData.notes)
        : null,
    };

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId: validatedData.patientId,
        providerId: validatedData.providerId,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,

        type: validatedData.type,
        reason: validatedData.reason,
        priority: validatedData.priority || "NORMAL",
        notesEncrypted: encryptedData.notesEncrypted
          ? Buffer.from(encryptedData.notesEncrypted, "utf-8")
          : null,
        reminderSent: false,
        confirmationSent: false,
        locationType: validatedData.locationType || "IN_PERSON",

        createdBy: payload.userId,
        updatedBy: payload.userId,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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

    // Log successful creation
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_CREATED,
      resource: "appointments",
      resourceId: appointment.id,
      success: true,
      changes: {
        patientId: validatedData.patientId,
        providerId: validatedData.providerId,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        type: validatedData.type,
      },
      ...requestInfo,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Appointment created successfully",
        data: {
          id: appointment.id,
          patientId: appointment.patientId,
          providerId: appointment.providerId,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          type: appointment.type,
          reason: appointment.reason,
          priority: appointment.priority,
          locationType: appointment.locationType,
          patient: appointment.patient,
          provider: appointment.provider,
          createdAt: appointment.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Create appointment error:", error);

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

    if (
      error instanceof Error &&
      error.name === "ZodError" &&
      "errors" in error
    ) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Validation error",
          details: (error as any).errors.map(
            (e: any) => `${e.path.join(".")}: ${e.message}`
          ),
        },
        { status: 400 }
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

// Helper functions
async function getPatientIdsForUser(userId: string): Promise<string[]> {
  const patient = await prisma.patient.findUnique({
    where: { userId },
    select: { id: true },
  });
  return patient ? [patient.id] : [];
}

async function getAssignedPatientIds(userId: string): Promise<string[]> {
  const patients = await prisma.patient.findMany({
    where: { assignedProviderId: userId },
    select: { id: true },
  });
  return patients.map((p) => p.id);
}
