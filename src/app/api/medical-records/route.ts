import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "../../../lib/auth";
import { prisma } from "../../../lib/db";
import { AuditService, AuditAction } from "../../../lib/audit";
import logger from "../../../lib/logger";
import { extractRequestInfoFromRequest } from "../../../utils/appRouterHelpers";
import { hasPermission } from "../../../lib/permissions";
import { Permission } from "../../../types/auth";
import { createMedicalRecordSchema } from "../../../lib/validation";
import { SanitizationService } from "../../../services/sanitizationService";
import { PIIProtectionService } from "../../../services/piiProtectionService";

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
        resource: "medical_records",
        success: false,
        errorMessage: "Insufficient permissions to read medical records",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Insufficient permissions to access medical records",
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

    if (type) {
      whereClause.type = type;
    }

    if (startDate || endDate) {
      whereClause.recordDate = {};
      if (startDate) {
        whereClause.recordDate.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.recordDate.lte = new Date(endDate);
      }
    }

    // Apply permission-based filtering
    if (canReadOwn) {
      // Patients can only see their own records
      whereClause.patientId = {
        in: await getPatientIdsForUser(payload.userId),
      };
    } else if (canReadAssigned && !canReadAll) {
      // Nurses can only see records for assigned patients
      whereClause.patientId = {
        in: await getAssignedPatientIds(payload.userId),
      };
    }
    // canReadAll can see all records (no additional filtering)

    // Get total count for pagination
    const total = await prisma.medicalRecord.count({ where: whereClause });

    // Get records with pagination
    const records = await prisma.medicalRecord.findMany({
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
      orderBy: { recordDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Log successful access
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_ACCESSED,
      resource: "medical_records",
      success: true,
      metadata: {
        filters: { patientId, providerId, type, startDate, endDate },
        pagination: { page, limit, total },
      },
      ...requestInfo,
    });

    return NextResponse.json({
      success: true,
      data: {
        records: records.map((record) => ({
          id: record.id,
          patientId: record.patientId,
          providerId: record.providerId,
          type: record.type,
          title: record.title,
          recordDate: record.recordDate,
          description: record.descriptionEncrypted ? "***ENCRYPTED***" : null,
          findings: record.findingsEncrypted ? "***ENCRYPTED***" : null,
          recommendations: record.recommendationsEncrypted
            ? "***ENCRYPTED***"
            : null,
          isPrivate: record.isPrivate,
          restrictedAccess: record.restrictedAccess,
          patient: record.patient,
          provider: record.provider,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
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
    logger.error("Get medical records error:", error);

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
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
    if (!hasPermission(userPermissions, Permission.RECORD_CREATE)) {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "medical_records",
        success: false,
        errorMessage: "Insufficient permissions to create medical records",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Insufficient permissions to create medical records",
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createMedicalRecordSchema.parse(body);

    // Sanitize input data
    const sanitizedData = {
      ...validatedData,
      title: SanitizationService.sanitizeMedicalData(validatedData.title),
      description: validatedData.description
        ? SanitizationService.sanitizeMedicalData(validatedData.description)
        : null,
      findings: validatedData.findings
        ? SanitizationService.sanitizeMedicalData(validatedData.findings)
        : null,
      recommendations: validatedData.recommendations
        ? SanitizationService.sanitizeMedicalData(validatedData.recommendations)
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
            message: "You can only create records for yourself",
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
            message: "You can only create records for assigned patients",
          },
          { status: 403 }
        );
      }
    }

    // Encrypt sensitive fields
    const encryptedData = {
      ...sanitizedData,
      descriptionEncrypted: sanitizedData.description
        ? await PIIProtectionService.encryptField(sanitizedData.description)
        : null,
      findingsEncrypted: sanitizedData.findings
        ? await PIIProtectionService.encryptField(sanitizedData.findings)
        : null,
      recommendationsEncrypted: sanitizedData.recommendations
        ? await PIIProtectionService.encryptField(sanitizedData.recommendations)
        : null,
    };

    // Create medical record
    const medicalRecord = await prisma.medicalRecord.create({
      data: {
        patientId: validatedData.patientId,
        providerId: payload.userId,
        type: validatedData.type,
        title: validatedData.title,
        recordDate: validatedData.recordDate,
        descriptionEncrypted: encryptedData.descriptionEncrypted,
        findingsEncrypted: encryptedData.findingsEncrypted,
        recommendationsEncrypted: encryptedData.recommendationsEncrypted,
        attachments: validatedData.attachments || [],
        isPrivate: validatedData.isPrivate || false,
        restrictedAccess: validatedData.restrictedAccess || false,
        accessRestrictions: validatedData.accessRestrictions || null,
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
      resource: "medical_records",
      resourceId: medicalRecord.id,
      success: true,
      changes: {
        patientId: validatedData.patientId,
        type: validatedData.type,
        title: validatedData.title,
        recordDate: validatedData.recordDate,
      },
      ...requestInfo,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Medical record created successfully",
        data: {
          id: medicalRecord.id,
          patientId: medicalRecord.patientId,
          providerId: medicalRecord.providerId,
          type: medicalRecord.type,
          title: medicalRecord.title,
          recordDate: medicalRecord.recordDate,
          isPrivate: medicalRecord.isPrivate,
          restrictedAccess: medicalRecord.restrictedAccess,
          patient: medicalRecord.patient,
          provider: medicalRecord.provider,
          createdAt: medicalRecord.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Create medical record error:", error);

    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid or expired token",
        },
        { status: 401 }
      );
    }

    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Validation error",
          details: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
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
