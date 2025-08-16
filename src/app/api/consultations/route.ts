import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "../../../lib/db";
import { AuditService, AuditAction } from "../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../utils/appRouterHelpers";
import logger from "../../../lib/logger";
import { verifyAccessToken } from "../../../lib/auth";
import { hasPermission } from "../../../lib/permissions";
import { Permission } from "../../../types/auth";
import { createConsultationSchema } from "../../../lib/validation";
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
    const userPermissions = (payload.permissions || []) as Permission[];
    const canReadAll = hasPermission(
      userPermissions,
      Permission.RECORD_READ_ALL
    );
    const canReadAssigned = hasPermission(
      userPermissions,
      Permission.RECORD_READ_ASSIGNED
    );
    const canReadOwn = hasPermission(
      userPermissions,
      Permission.RECORD_READ_OWN
    );

    if (!canReadAll && !canReadAssigned && !canReadOwn) {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "consultations",
        success: false,
        errorMessage: "Insufficient permissions to read consultations",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Insufficient permissions to access consultations",
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const providerId = searchParams.get("providerId");
    const type = searchParams.get("type");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const followUpRequired = searchParams.get("followUpRequired");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    // Build where clause based on permissions
    // eslint-disable-next-line prefer-const
    let whereClause: any = {};

    if (patientId) {
      whereClause.patientId = patientId;
    }

    if (providerId) {
      whereClause.providerId = providerId;
    }

    if (type) {
      whereClause.type = type;
    }

    if (followUpRequired !== null) {
      whereClause.followUpRequired = followUpRequired === "true";
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
      // Patients can only see their own consultations
      whereClause.patientId = {
        in: await getPatientIdsForUser(payload.userId),
      };
    } else if (canReadAssigned && !canReadAll) {
      // Nurses can only see consultations for assigned patients
      whereClause.patientId = {
        in: await getAssignedPatientIds(payload.userId),
      };
    }
    // canReadAll can see all consultations (no additional filtering)

    // Get total count for pagination
    const total = await prisma.consultation.count({ where: whereClause });

    // Get consultations with pagination
    const consultations = await prisma.consultation.findMany({
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
        appointment: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            type: true,
          },
        },
      },
      orderBy: { startTime: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Log successful access
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_ACCESSED,
      resource: "consultations",
      success: true,
      metadata: {
        filters: {
          patientId,
          providerId,
          type,
          startDate,
          endDate,
          followUpRequired,
        },
        pagination: { page, limit, total },
      },
      ...requestInfo,
    });

    return NextResponse.json({
      success: true,
      data: {
        consultations: consultations.map((consultation) => ({
          id: consultation.id,
          appointmentId: consultation.appointmentId,
          patientId: consultation.patientId,
          providerId: consultation.providerId,
          type: consultation.type,
          startTime: consultation.startTime,
          endTime: consultation.endTime,
          durationMinutes: consultation.durationMinutes,
          chiefComplaint: consultation.chiefComplaintEncrypted
            ? "***ENCRYPTED***"
            : null,
          symptoms: consultation.symptomsEncrypted ? "***ENCRYPTED***" : null,
          diagnosis: consultation.diagnosisEncrypted ? "***ENCRYPTED***" : null,
          treatmentPlan: consultation.treatmentPlanEncrypted
            ? "***ENCRYPTED***"
            : null,
          vitalSigns: consultation.vitalSigns,
          prescriptions: consultation.prescriptions,
          followUpRequired: consultation.followUpRequired,
          followUpDate: consultation.followUpDate,
          followUpInstructions: consultation.followUpInstructionsEncrypted
            ? "***ENCRYPTED***"
            : null,
          billingCodes: consultation.billingCodes,
          patient: consultation.patient,
          provider: consultation.provider,
          appointment: consultation.appointment,
          createdAt: consultation.createdAt,
          updatedAt: consultation.updatedAt,
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
    logger.error("Get consultations error:", error);

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
    const userPermissions = (payload.permissions || []) as Permission[];
    if (!hasPermission(userPermissions, Permission.RECORD_CREATE)) {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "consultations",
        success: false,
        errorMessage: "Insufficient permissions to create consultations",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Insufficient permissions to create consultations",
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createConsultationSchema.parse(body);

    // Sanitize input data
    const sanitizedData = {
      ...validatedData,
      chiefComplaint: validatedData.chiefComplaint
        ? SanitizationService.sanitizeMedicalData(validatedData.chiefComplaint)
        : null,
      symptoms: validatedData.symptoms
        ? SanitizationService.sanitizeMedicalData(validatedData.symptoms)
        : null,
      diagnosis: validatedData.diagnosis
        ? SanitizationService.sanitizeMedicalData(validatedData.diagnosis)
        : null,
      treatmentPlan: validatedData.treatmentPlan
        ? SanitizationService.sanitizeMedicalData(validatedData.treatmentPlan)
        : null,
      followUpInstructions: validatedData.followUpInstructions
        ? SanitizationService.sanitizeMedicalData(
            validatedData.followUpInstructions
          )
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
            message: "You can only create consultations for yourself",
          },
          { status: 403 }
        );
      }

      if (
        payload.role === "NURSE" &&
        patient.assignedProviderId !== payload.userId
      ) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "You can only create consultations for assigned patients",
          },
          { status: 403 }
        );
      }
    }

    // Get provider ID from appointment or use current user
    let providerId: string;
    if (validatedData.appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: validatedData.appointmentId },
        select: { id: true, patientId: true, providerId: true },
      });

      if (!appointment) {
        return NextResponse.json(
          {
            error: "Bad Request",
            message: "Invalid appointment ID",
          },
          { status: 400 }
        );
      }

      if (appointment.patientId !== validatedData.patientId) {
        return NextResponse.json(
          {
            error: "Bad Request",
            message: "Appointment does not match patient",
          },
          { status: 400 }
        );
      }

      providerId = appointment.providerId;
    } else {
      // If no appointment, use current user as provider
      providerId = payload.userId;
    }

    // Verify provider exists and is a healthcare provider
    const provider = await prisma.user.findUnique({
      where: { id: providerId },
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

    // Verify appointment exists if provided
    if (validatedData.appointmentId) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: validatedData.appointmentId },
        select: { id: true, patientId: true, providerId: true },
      });

      if (!appointment) {
        return NextResponse.json(
          {
            error: "Bad Request",
            message: "Invalid appointment ID",
          },
          { status: 400 }
        );
      }

      if (appointment.patientId !== validatedData.patientId) {
        return NextResponse.json(
          {
            error: "Bad Request",
            message: "Appointment does not match patient",
          },
          { status: 400 }
        );
      }
    }

    // Calculate duration if not provided
    let durationMinutes = validatedData.durationMinutes;
    if (!durationMinutes && validatedData.endTime) {
      durationMinutes = Math.round(
        (new Date(validatedData.endTime).getTime() -
          new Date(validatedData.startTime).getTime()) /
          (1000 * 60)
      );
    }

    // Encrypt sensitive fields
    const encryptedData = {
      ...sanitizedData,
      chiefComplaintEncrypted: sanitizedData.chiefComplaint
        ? await encryptField(sanitizedData.chiefComplaint)
        : null,
      symptomsEncrypted: sanitizedData.symptoms
        ? await encryptField(sanitizedData.symptoms)
        : null,
      diagnosisEncrypted: sanitizedData.diagnosis
        ? await encryptField(sanitizedData.diagnosis)
        : null,
      treatmentPlanEncrypted: sanitizedData.treatmentPlan
        ? await encryptField(sanitizedData.treatmentPlan)
        : null,
      followUpInstructionsEncrypted: sanitizedData.followUpInstructions
        ? await encryptField(sanitizedData.followUpInstructions)
        : null,
    };

    // Create consultation
    const consultation = await prisma.consultation.create({
      data: {
        appointmentId: validatedData.appointmentId,
        patientId: validatedData.patientId,
        providerId: providerId,
        type: validatedData.type,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        durationMinutes,
        chiefComplaintEncrypted: encryptedData.chiefComplaintEncrypted
          ? Buffer.from(encryptedData.chiefComplaintEncrypted, "utf-8")
          : null,
        symptomsEncrypted: encryptedData.symptomsEncrypted
          ? Buffer.from(encryptedData.symptomsEncrypted, "utf-8")
          : null,
        diagnosisEncrypted: encryptedData.diagnosisEncrypted
          ? Buffer.from(encryptedData.diagnosisEncrypted, "utf-8")
          : null,
        treatmentPlanEncrypted: encryptedData.treatmentPlanEncrypted
          ? Buffer.from(encryptedData.treatmentPlanEncrypted, "utf-8")
          : null,
        vitalSigns: validatedData.vitalSigns || {},
        prescriptions: validatedData.prescriptions || [],
        followUpRequired: validatedData.followUpRequired || false,
        followUpDate: validatedData.followUpDate,
        followUpInstructionsEncrypted:
          encryptedData.followUpInstructionsEncrypted
            ? Buffer.from(encryptedData.followUpInstructionsEncrypted, "utf-8")
            : null,
        billingCodes: validatedData.billingCodes || [],
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
        appointment: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            type: true,
          },
        },
      },
    });

    // Log successful creation
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_CREATED,
      resource: "consultations",
      resourceId: consultation.id,
      success: true,
      changes: {
        patientId: validatedData.patientId,
        providerId: providerId,
        type: validatedData.type,
        startTime: validatedData.startTime,
        followUpRequired: validatedData.followUpRequired || false,
      },
      ...requestInfo,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Consultation created successfully",
        data: {
          id: consultation.id,
          appointmentId: consultation.appointmentId,
          patientId: consultation.patientId,
          providerId: consultation.providerId,
          type: consultation.type,
          startTime: consultation.startTime,
          endTime: consultation.endTime,
          durationMinutes: consultation.durationMinutes,
          vitalSigns: consultation.vitalSigns,
          prescriptions: consultation.prescriptions,
          followUpRequired: consultation.followUpRequired,
          followUpDate: consultation.followUpDate,
          billingCodes: consultation.billingCodes,
          patient: consultation.patient,
          provider: consultation.provider,
          appointment: consultation.appointment,
          createdAt: consultation.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Create consultation error:", error);

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

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Validation error",
          details: ["Invalid request format"],
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
