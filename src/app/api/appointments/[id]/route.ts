import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/db";
import { AuditService, AuditAction } from "../../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";
import logger from "../../../../lib/logger";
import { verifyAccessToken } from "../../../../lib/auth";
import { hasPermission } from "../../../../lib/permissions";
import { Permission } from "../../../../types/auth";
import { updateAppointmentSchema } from "../../../../lib/validation";
import { SanitizationService } from "../../../../services/sanitizationService";
import { PIIProtectionService } from "../../../../services/piiProtectionService";
import crypto from "crypto";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: appointmentId } = await params;

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
        resourceId: appointmentId,
        success: false,
        errorMessage: "Insufficient permissions to read appointment",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Insufficient permissions to access appointment",
        },
        { status: 403 }
      );
    }

    // Get appointment with patient and provider info
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            userId: true,
            assignedProviderId: true,
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

    if (!appointment) {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.DATA_ACCESSED,
        resource: "appointments",
        resourceId: appointmentId,
        success: false,
        errorMessage: "Appointment not found",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Not Found",
          message: "Appointment not found",
        },
        { status: 404 }
      );
    }

    // Check access permissions based on user role and patient relationship
    if (!canReadAll) {
      if (canReadOwn && appointment.patient.userId !== payload.userId) {
        await AuditService.log({
          userId: payload.userId,
          userEmail: payload.email,
          action: AuditAction.PERMISSION_DENIED,
          resource: "appointments",
          resourceId: appointmentId,
          success: false,
          errorMessage: "Access denied to appointment",
          ...requestInfo,
        });

        return NextResponse.json(
          {
            error: "Forbidden",
            message: "Access denied to appointment",
          },
          { status: 403 }
        );
      }

      if (
        canReadAssigned &&
        appointment.patient.assignedProviderId !== payload.userId &&
        appointment.providerId !== payload.userId
      ) {
        await AuditService.log({
          userId: payload.userId,
          userEmail: payload.email,
          action: AuditAction.PERMISSION_DENIED,
          resource: "appointments",
          resourceId: appointmentId,
          success: false,
          errorMessage: "Access denied to appointment",
          ...requestInfo,
        });

        return NextResponse.json(
          {
            error: "Forbidden",
            message: "Access denied to appointment",
          },
          { status: 403 }
        );
      }
    }

    // Decrypt sensitive fields for authorized users
    let decryptedNotes = null;

    if (appointment.notesEncrypted) {
      try {
        // Convert Uint8Array to string before decryption
        const notesString = Buffer.from(appointment.notesEncrypted).toString(
          "utf-8"
        );
        decryptedNotes = await PIIProtectionService.decryptField(notesString);
      } catch (error) {
        logger.error("Failed to decrypt notes:", error);
        decryptedNotes = "***DECRYPTION_ERROR***";
      }
    }

    // Log successful access
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_ACCESSED,
      resource: "appointments",
      resourceId: appointmentId,
      success: true,
      ...requestInfo,
    });

    return NextResponse.json({
      success: true,
      data: {
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
        notes: decryptedNotes,
        reminderSent: appointment.reminderSent,
        confirmationSent: appointment.confirmationSent,
        locationType: appointment.locationType,
        roomNumber: appointment.roomNumber,
        virtualMeetingUrl: appointment.virtualMeetingUrl,
        patient: appointment.patient,
        provider: appointment.provider,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
      },
    });
  } catch (error) {
    logger.error("Get appointment error:", error);

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: appointmentId } = await params;

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

    // Check permissions - only doctors associated with the appointment or admins can update
    const userPermissions = payload.permissions || [];
    const canUpdateAll = hasPermission(
      userPermissions as Permission[],
      Permission.APPOINTMENT_UPDATE_ALL
    );

    // Get appointment to check ownership
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { providerId: true, patientId: true },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "Appointment not found",
        },
        { status: 404 }
      );
    }

    // Check if user has permission to update this appointment
    const canUpdateOwn = payload.userId === existingAppointment.providerId;
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(payload.role);

    if (!canUpdateAll && !canUpdateOwn && !isAdmin) {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "appointments",
        resourceId: appointmentId,
        success: false,
        errorMessage: "Insufficient permissions to update appointment",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Insufficient permissions to update this appointment",
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { patientId, doctorId, dateTime, purpose, notes, status } = body;

    // Validate required fields
    if (!patientId || !doctorId || !dateTime || !purpose) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Missing required fields",
          details: ["patientId, doctorId, dateTime, and purpose are required"],
        },
        { status: 400 }
      );
    }

    // Validate date format
    const appointmentDateTime = new Date(dateTime);
    if (isNaN(appointmentDateTime.getTime())) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Invalid date format",
          details: ["dateTime must be a valid ISO date string"],
        },
        { status: 400 }
      );
    }

    // Sanitize input data
    const sanitizedData = {
      patientId,
      providerId: doctorId,
      startTime: appointmentDateTime,
      endTime: new Date(appointmentDateTime.getTime() + 30 * 60 * 1000), // Default 30 min duration
      type: purpose,
      notes: notes ? SanitizationService.sanitizeMedicalData(notes) : null,
      status: status || "PENDING",
    };

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: sanitizedData.patientId },
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

    // Verify provider exists and is a healthcare provider
    const provider = await prisma.user.findUnique({
      where: { id: sanitizedData.providerId },
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

    // Check for scheduling conflicts (excluding current appointment)
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        id: { not: appointmentId },
        providerId: sanitizedData.providerId,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
        OR: [
          {
            startTime: { lt: sanitizedData.endTime },
            endTime: { gt: sanitizedData.startTime },
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
    const encryptedNotes = sanitizedData.notes
      ? PIIProtectionService.encryptField(sanitizedData.notes)
      : null;

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        patientId: sanitizedData.patientId,
        providerId: sanitizedData.providerId,
        startTime: sanitizedData.startTime,
        endTime: sanitizedData.endTime,
        type: sanitizedData.type,
        status: sanitizedData.status,
        notesEncrypted: encryptedNotes
          ? Buffer.from(JSON.stringify(encryptedNotes), 'utf8')
          : null,
        updatedBy: payload.userId,
        updatedAt: new Date(),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstNameEncrypted: true,
            lastNameEncrypted: true,
          },
        },
        provider: {
          select: {
            id: true,
            firstNameEncrypted: true,
            lastNameEncrypted: true,
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
      resource: "appointments",
      resourceId: appointmentId,
      success: true,
      changes: {
        patientId: sanitizedData.patientId,
        providerId: sanitizedData.providerId,
        startTime: sanitizedData.startTime,
        endTime: sanitizedData.endTime,
        type: sanitizedData.type,
        status: sanitizedData.status,
      },
      ...requestInfo,
    });

    // Return response according to the new convention
    return NextResponse.json(
      {
        success: true,
        message: "Appointment updated successfully",
        data: {
          appointmentId: updatedAppointment.id,
          patientId: updatedAppointment.patientId,
          doctorId: updatedAppointment.providerId,
          dateTime: updatedAppointment.startTime.toISOString(),
          purpose: updatedAppointment.type,
          notes: sanitizedData.notes || "",
          status: updatedAppointment.status,
          updatedAt: updatedAppointment.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Update appointment error:", error);

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
        details: ["Please try again later"],
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
    const { id: appointmentId } = await params;

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

    // Check permissions - only doctors associated with the appointment or admins can delete
    const userPermissions = payload.permissions || [];
    const canDeleteAll = hasPermission(
      userPermissions as Permission[],
      Permission.APPOINTMENT_DELETE_ALL
    );

    // Get appointment to check ownership
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { providerId: true, status: true },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "Appointment not found",
        },
        { status: 404 }
      );
    }

    // Check if user has permission to delete this appointment
    const canDeleteOwn = payload.userId === existingAppointment.providerId;
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(payload.role);

    if (!canDeleteAll && !canDeleteOwn && !isAdmin) {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "appointments",
        resourceId: appointmentId,
        success: false,
        errorMessage: "Insufficient permissions to delete appointment",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Insufficient permissions to delete this appointment",
        },
        { status: 403 }
      );
    }

    // Check if appointment can be deleted (not already cancelled/completed)
    if (["CANCELLED", "COMPLETED"].includes(existingAppointment.status)) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Cannot delete appointment with current status",
          details: [`Appointment status is ${existingAppointment.status}`],
        },
        { status: 400 }
      );
    }

    // Soft delete the appointment by updating status and adding deletion metadata
    const deletedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "CANCELLED",
        updatedBy: payload.userId,
        updatedAt: new Date(),
        // Add deletion metadata for audit trail
        notesEncrypted: Buffer.from(
          JSON.stringify({
            deletedAt: new Date().toISOString(),
            deletedBy: payload.userId,
            originalStatus: existingAppointment.status,
            deletionReason: "Soft deleted by user",
          }),
          'utf8'
        ),
      },
    });

    // Log successful deletion
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_DELETED,
      resource: "appointments",
      resourceId: appointmentId,
      success: true,
      changes: {
        status: "CANCELLED",
        deletedAt: new Date().toISOString(),
        deletionReason: "Soft deleted by user",
      },
      ...requestInfo,
    });

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Appointment deleted successfully",
        data: {
          appointmentId: deletedAppointment.id,
          status: deletedAppointment.status,
          deletedAt: deletedAppointment.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Delete appointment error:", error);

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
        details: ["Please try again later"],
      },
      { status: 500 }
    );
  }
}
