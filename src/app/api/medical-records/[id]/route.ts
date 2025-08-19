import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "../../../../lib/auth";
import logger from "../../../../lib/logger";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";
import { MedicalRecordService } from "../../../../services/medicalRecordService";
import { PIIProtectionService } from "../../../../services/piiProtectionService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Initialize PII protection service
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "System configuration error",
        },
        { status: 500 }
      );
    }
    PIIProtectionService.initialize(encryptionKey);

    const { id: recordId } = await params;

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

    // Get the medical record with decrypted data
    const record = await MedicalRecordService.getMedicalRecord(
      recordId,
      payload.userId,
      payload.role
    );

    return NextResponse.json({
      success: true,
      data: record,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: requestInfo.requestId,
      },
    });
  } catch (error) {
    logger.error("Get medical record error:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found") || error.message.includes("Not found")) {
        return NextResponse.json(
          {
            error: "Not Found",
            message: error.message,
          },
          { status: 404 }
        );
      }

      if (error.message.includes("Unauthorized")) {
        return NextResponse.json(
          {
            error: "Unauthorized",
            message: error.message,
          },
          { status: 401 }
        );
      }

      if (error.message.includes("permissions") || error.message.includes("access")) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: error.message,
          },
          { status: 403 }
        );
      }
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: recordId } = await params;

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
    if (!hasPermission(userPermissions, Permission.RECORD_UPDATE)) {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "medical_records",
        resourceId: recordId,
        success: false,
        errorMessage: "Insufficient permissions to update medical record",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Insufficient permissions to update medical record",
        },
        { status: 403 }
      );
    }

    // Get current medical record for audit
    const currentRecord = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
      include: {
        patient: {
          select: {
            id: true,
            userId: true,
            assignedProviderId: true,
          },
        },
      },
    });

    if (!currentRecord) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "Medical record not found",
        },
        { status: 404 }
      );
    }

    // Check if user has access to update this record
    if (payload.role !== "SUPER_ADMIN" && payload.role !== "ADMIN") {
      if (
        payload.role === "PATIENT" &&
        currentRecord.patient.userId !== payload.userId
      ) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "You can only update your own medical records",
          },
          { status: 403 }
        );
      }

      if (
        payload.role === "NURSE" &&
        currentRecord.patient.assignedProviderId !== payload.userId
      ) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "You can only update records for assigned patients",
          },
          { status: 403 }
        );
      }

      if (
        payload.role === "DOCTOR" &&
        currentRecord.providerId !== payload.userId
      ) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "You can only update records you created",
          },
          { status: 403 }
        );
      }
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateMedicalRecordSchema.parse(body);

    // Sanitize input data
    const sanitizedData = {
      ...validatedData,
      title: validatedData.title
        ? SanitizationService.sanitizeMedicalData(validatedData.title)
        : undefined,
      description: validatedData.description
        ? SanitizationService.sanitizeMedicalData(validatedData.description)
        : undefined,
      findings: validatedData.findings
        ? SanitizationService.sanitizeMedicalData(validatedData.findings)
        : undefined,
      recommendations: validatedData.recommendations
        ? SanitizationService.sanitizeMedicalData(validatedData.recommendations)
        : undefined,
    };

    // Prepare update data
    const updateData: {
      updatedBy: string;
      recordType?: string;
      visitDate?: Date;
      diagnosisEncrypted?: Buffer;
      treatmentEncrypted?: Buffer;
      medicationsEncrypted?: Buffer;
      notesEncrypted?: Buffer;
      vitalSigns?: Record<string, string | number>;
      labResults?: Array<Record<string, string | number | boolean>>;
      imagingResults?: Array<Record<string, string | number | boolean>>;
      followUpRequired?: boolean;
      followUpDate?: Date;
    } = {
      updatedBy: payload.userId,
    };

    if (sanitizedData.title !== undefined)
      updateData.title = sanitizedData.title;
    // recordDate is not in the schema, so we'll skip it
    if (sanitizedData.type !== undefined) updateData.type = sanitizedData.type;
    if (sanitizedData.isPrivate !== undefined)
      updateData.isPrivate = sanitizedData.isPrivate;
    // These properties are not in the schema, so we'll skip them
    if (sanitizedData.attachments !== undefined)
      updateData.attachments = sanitizedData.attachments;

    // Encrypt sensitive fields if provided
    if (sanitizedData.description !== undefined) {
      updateData.descriptionEncrypted = sanitizedData.description
        ? await PIIProtectionService.encryptField(sanitizedData.description)
        : null;
    }

    if (sanitizedData.findings !== undefined) {
      updateData.findingsEncrypted = sanitizedData.findings
        ? await PIIProtectionService.encryptField(sanitizedData.findings)
        : null;
    }

    if (sanitizedData.recommendations !== undefined) {
      updateData.recommendationsEncrypted = sanitizedData.recommendations
        ? await PIIProtectionService.encryptField(sanitizedData.recommendations)
        : null;
    }

    // Update medical record
    const updatedRecord = await prisma.medicalRecord.update({
      where: { id: recordId },
      data: updateData,
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

    // Log successful update
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_UPDATED,
      resource: "medical_records",
      resourceId: recordId,
      success: true,
      oldValues: currentRecord,
      newValues: updatedRecord,
      changes: sanitizedData,
      ...requestInfo,
    });

    return NextResponse.json({
      success: true,
      message: "Medical record updated successfully",
      data: {
        id: updatedRecord.id,
        patientId: updatedRecord.patientId,
        providerId: updatedRecord.providerId,
        type: updatedRecord.type,
        title: updatedRecord.title,
        recordDate: updatedRecord.recordDate,
        isPrivate: updatedRecord.isPrivate,
        restrictedAccess: updatedRecord.restrictedAccess,
        patient: updatedRecord.patient,
        provider: updatedRecord.provider,
        updatedAt: updatedRecord.updatedAt,
      },
    });
  } catch (error) {
    logger.error("Update medical record error:", error);

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

    if (error instanceof Error && error.name === "ZodError") {
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: recordId } = await params;

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
    if (!hasPermission(userPermissions, Permission.RECORD_DELETE)) {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "medical_records",
        resourceId: recordId,
        success: false,
        errorMessage: "Insufficient permissions to delete medical record",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Insufficient permissions to delete medical record",
        },
        { status: 403 }
      );
    }

    // Get current medical record for audit
    const currentRecord = await prisma.medicalRecord.findUnique({
      where: { id: recordId },
      include: {
        patient: {
          select: {
            id: true,
            userId: true,
            assignedProviderId: true,
          },
        },
      },
    });

    if (!currentRecord) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "Medical record not found",
        },
        { status: 404 }
      );
    }

    // Check if user has access to delete this record
    if (payload.role !== "SUPER_ADMIN" && payload.role !== "ADMIN") {
      if (
        payload.role === "PATIENT" &&
        currentRecord.patient.userId !== payload.userId
      ) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "You can only delete your own medical records",
          },
          { status: 403 }
        );
      }

      if (
        payload.role === "NURSE" &&
        currentRecord.patient.assignedProviderId !== payload.userId
      ) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "You can only delete records for assigned patients",
          },
          { status: 403 }
        );
      }

      if (
        payload.role === "DOCTOR" &&
        currentRecord.providerId !== payload.userId
      ) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "You can only delete records you created",
          },
          { status: 403 }
        );
      }
    }

    // Soft delete by setting restricted access and marking as private
    const deletedRecord = await prisma.medicalRecord.update({
      where: { id: recordId },
      data: {
        restrictedAccess: true,
        isPrivate: true,
        updatedBy: payload.userId,
      },
    });

    // Log successful deletion
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_DELETED,
      resource: "medical_records",
      resourceId: recordId,
      success: true,
      oldValues: currentRecord,
      newValues: deletedRecord,
      changes: {
        restrictedAccess: true,
        isPrivate: true,
        deletedAt: new Date(),
      },
      ...requestInfo,
    });

    return NextResponse.json({
      success: true,
      message: "Medical record deleted successfully",
      data: {
        id: deletedRecord.id,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Delete medical record error:", error);

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
