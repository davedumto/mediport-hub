import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../lib/db";
import { AuditService, AuditAction } from "../../../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../../../utils/appRouterHelpers";
import logger from "../../../../../lib/logger";
import { verifyAccessToken } from "../../../../../lib/auth";

// PUT - Update appointment (Doctor only)
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

    // Check if user is a doctor
    if (payload.role !== "DOCTOR") {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "doctor-appointment-update",
        success: false,
        errorMessage: "Only doctors can update appointments",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only doctors can update appointments",
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const updates = body;

    // Verify the appointment exists and belongs to this doctor
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true },
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

    if (existingAppointment.providerId !== payload.userId) {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "doctor-appointment-update",
        success: false,
        errorMessage: "Cannot update appointment that doesn't belong to you",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "You can only update your own appointments",
        },
        { status: 403 }
      );
    }

    // Update the appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        ...updates,
        updatedBy: payload.userId,
        updatedAt: new Date(),
      },
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
    });

    // Log successful update
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_UPDATED,
      resource: "doctor-appointments",
      resourceId: appointmentId,
      success: true,
      metadata: {
        updates,
        previousStatus: existingAppointment.status,
        newStatus: updatedAppointment.status,
      },
      ...requestInfo,
    });

    return NextResponse.json({
      success: true,
      data: {
        appointment: {
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
          notes: updatedAppointment.notesEncrypted ? "***ENCRYPTED***" : null,
          locationType: updatedAppointment.locationType,
          patient: updatedAppointment.patient,
          provider: updatedAppointment.provider,
          createdAt: updatedAppointment.createdAt,
          updatedAt: updatedAppointment.updatedAt,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: requestInfo.requestId,
      },
    });
  } catch (error) {
    logger.error("Update doctor appointment error:", error);

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

// DELETE - Delete appointment (Doctor only)
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

    // Check if user is a doctor
    if (payload.role !== "DOCTOR") {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "doctor-appointment-delete",
        success: false,
        errorMessage: "Only doctors can delete appointments",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only doctors can delete appointments",
        },
        { status: 403 }
      );
    }

    // Verify the appointment exists and belongs to this doctor
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
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

    if (existingAppointment.providerId !== payload.userId) {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "doctor-appointment-delete",
        success: false,
        errorMessage: "Cannot delete appointment that doesn't belong to you",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "You can only delete your own appointments",
        },
        { status: 403 }
      );
    }

    // Delete the appointment
    await prisma.appointment.delete({
      where: { id: appointmentId },
    });

    // Log successful deletion
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_DELETED,
      resource: "doctor-appointments",
      resourceId: appointmentId,
      success: true,
      metadata: {
        deletedAppointment: {
          id: existingAppointment.id,
          patientId: existingAppointment.patientId,
          startTime: existingAppointment.startTime,
          status: existingAppointment.status,
        },
      },
      ...requestInfo,
    });

    return NextResponse.json({
      success: true,
      message: "Appointment deleted successfully",
      meta: {
        timestamp: new Date().toISOString(),
        requestId: requestInfo.requestId,
      },
    });
  } catch (error) {
    logger.error("Delete doctor appointment error:", error);

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
