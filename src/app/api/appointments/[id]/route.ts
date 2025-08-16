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
import { encryptField, decryptField } from "../../../../lib/encryption";

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
        decryptedNotes = await decryptField(notesString);
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
    if (
      !hasPermission(
        userPermissions as Permission[],
        Permission.APPOINTMENT_UPDATE
      )
    ) {
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
          message: "Insufficient permissions to update appointment",
        },
        { status: 403 }
      );
    }

    // Get current appointment for audit
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
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

    if (!currentAppointment) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "Appointment not found",
        },
        { status: 404 }
      );
    }

    // Check if user has access to update this appointment
    if (payload.role !== "SUPER_ADMIN" && payload.role !== "ADMIN") {
      if (
        payload.role === "PATIENT" &&
        currentAppointment.patient.userId !== payload.userId
      ) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "You can only update your own appointments",
          },
          { status: 403 }
        );
      }

      if (
        payload.role === "NURSE" &&
        currentAppointment.patient.assignedProviderId !== payload.userId &&
        currentAppointment.providerId !== payload.userId
      ) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message:
              "You can only update appointments for assigned patients or where you are the provider",
          },
          { status: 403 }
        );
      }

      if (
        payload.role === "DOCTOR" &&
        currentAppointment.providerId !== payload.userId
      ) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message:
              "You can only update appointments where you are the provider",
          },
          { status: 403 }
        );
      }
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateAppointmentSchema.parse(body);

    // Sanitize input data
    const sanitizedData = {
      ...validatedData,
      reason: validatedData.reason
        ? SanitizationService.sanitizeMedicalData(validatedData.reason)
        : undefined,
      notes: validatedData.notes
        ? SanitizationService.sanitizeMedicalData(validatedData.notes)
        : undefined,
    };

    // Prepare update data
    const updateData: any = {
      updatedBy: payload.userId,
    };

    if (sanitizedData.startTime !== undefined)
      updateData.startTime = sanitizedData.startTime;
    if (sanitizedData.endTime !== undefined)
      updateData.endTime = sanitizedData.endTime;

    if (sanitizedData.type !== undefined) updateData.type = sanitizedData.type;

    if (sanitizedData.reason !== undefined)
      updateData.reason = sanitizedData.reason;
    if (sanitizedData.priority !== undefined)
      updateData.priority = sanitizedData.priority;
    if (sanitizedData.locationType !== undefined)
      updateData.locationType = sanitizedData.locationType;

    // Encrypt sensitive fields if provided
    if (sanitizedData.notes !== undefined) {
      updateData.notesEncrypted = sanitizedData.notes
        ? await encryptField(sanitizedData.notes)
        : null;
    }

    // Check for scheduling conflicts if time is being changed
    if (sanitizedData.startTime || sanitizedData.endTime) {
      const startTime = sanitizedData.startTime || currentAppointment.startTime;
      const endTime = sanitizedData.endTime || currentAppointment.endTime;

      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          id: { not: appointmentId },
          providerId: currentAppointment.providerId,
          status: { in: ["SCHEDULED", "CONFIRMED"] },
          OR: [
            {
              startTime: { lt: endTime },
              endTime: { gt: startTime },
            },
          ],
        },
      });

      if (conflictingAppointment) {
        return NextResponse.json(
          {
            error: "Conflict",
            message: "Provider has a conflicting appointment at this time",
            details: ["Please choose a different time"],
          },
          { status: 409 }
        );
      }
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
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
      resource: "appointments",
      resourceId: appointmentId,
      success: true,
      oldValues: currentAppointment,
      newValues: updatedAppointment,
      changes: sanitizedData,
      ...requestInfo,
    });

    return NextResponse.json({
      success: true,
      message: "Appointment updated successfully",
      data: {
        id: updatedAppointment.id,
        patientId: updatedAppointment.patientId,
        providerId: updatedAppointment.providerId,
        startTime: updatedAppointment.startTime,
        endTime: updatedAppointment.endTime,
        timezone: updatedAppointment.timezone,
        type: updatedAppointment.type,
        status: updatedAppointment.status,
        reason: updatedAppointment.reason,
        priority: updatedAppointment.priority,
        locationType: updatedAppointment.locationType,
        roomNumber: updatedAppointment.roomNumber,
        virtualMeetingUrl: updatedAppointment.virtualMeetingUrl,
        patient: updatedAppointment.patient,
        provider: updatedAppointment.provider,
        updatedAt: updatedAppointment.updatedAt,
      },
    });
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

    // Check permissions
    const userPermissions = payload.permissions || [];
    if (
      !hasPermission(
        userPermissions as Permission[],
        Permission.APPOINTMENT_DELETE
      )
    ) {
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
          message: "Insufficient permissions to delete appointment",
        },
        { status: 403 }
      );
    }

    // Get current appointment for audit
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
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

    if (!currentAppointment) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "Appointment not found",
        },
        { status: 404 }
      );
    }

    // Check if user has access to delete this appointment
    if (payload.role !== "SUPER_ADMIN" && payload.role !== "ADMIN") {
      if (
        payload.role === "PATIENT" &&
        currentAppointment.patient.userId !== payload.userId
      ) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: "You can only delete your own appointments",
          },
          { status: 403 }
        );
      }

      if (
        payload.role === "NURSE" &&
        currentAppointment.patient.assignedProviderId !== payload.userId &&
        currentAppointment.providerId !== payload.userId
      ) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message:
              "You can only delete appointments for assigned patients or where you are the provider",
          },
          { status: 403 }
        );
      }

      if (
        payload.role === "DOCTOR" &&
        currentAppointment.providerId !== payload.userId
      ) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message:
              "You can only delete appointments where you are the provider",
          },
          { status: 403 }
        );
      }
    }

    // Check if appointment can be cancelled (not completed or already cancelled)
    if (["COMPLETED", "CANCELLED"].includes(currentAppointment.status)) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message:
            "Cannot delete appointment with status: " +
            currentAppointment.status,
        },
        { status: 400 }
      );
    }

    // Soft delete by changing status to CANCELLED
    const deletedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "CANCELLED",
        updatedBy: payload.userId,
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
      oldValues: currentAppointment,
      newValues: deletedAppointment,
      changes: {
        status: "CANCELLED",
        deletedAt: new Date(),
      },
      ...requestInfo,
    });

    return NextResponse.json({
      success: true,
      message: "Appointment cancelled successfully",
      data: {
        id: deletedAppointment.id,
        status: deletedAppointment.status,
        cancelledAt: new Date().toISOString(),
      },
    });
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
      },
      { status: 500 }
    );
  }
}
