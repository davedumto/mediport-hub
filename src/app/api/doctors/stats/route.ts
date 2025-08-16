import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/db";
import { verifyAccessToken } from "../../../../lib/auth";
import { AuditService, AuditAction } from "../../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";

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

    // Check if user is a doctor
    if (payload.role !== "DOCTOR") {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "doctor-stats",
        success: false,
        errorMessage: "Only doctors can access doctor stats",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only doctors can access doctor stats",
        },
        { status: 403 }
      );
    }

    // Get today's date range (start of day to end of day in local timezone)
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    );

    // Calculate statistics
    const [
      totalPatients,
      todayAppointments,
      pendingConsultations,
      completedToday,
    ] = await Promise.all([
      // Total assigned patients
      prisma.patient.count({
        where: {
          assignedProviderId: payload.userId,
          status: "ACTIVE",
        },
      }),

      // Today's appointments
      prisma.appointment.count({
        where: {
          providerId: payload.userId,
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),

      // Pending consultations (appointments with SCHEDULED status)
      prisma.appointment.count({
        where: {
          providerId: payload.userId,
          status: "SCHEDULED",
        },
      }),

      // Completed appointments today
      prisma.appointment.count({
        where: {
          providerId: payload.userId,
          status: "COMPLETED",
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
    ]);

    // Log successful access
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_ACCESSED,
      resource: "doctor-stats",
      success: true,
      metadata: {
        totalPatients,
        todayAppointments,
        pendingConsultations,
        completedToday,
      },
      ...requestInfo,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Doctor statistics retrieved successfully",
        data: {
          totalPatients,
          todayAppointments,
          pendingConsultations,
          completedToday,
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Doctor stats error:", error);

    // Create basic request info for error logging
    const errorRequestInfo = {
      requestId: crypto.randomUUID(),
      ipAddress: "unknown",
      userAgent: "unknown",
      sessionId: "unknown",
    };

    await AuditService.log({
      userId: payload?.userId || "unknown",
      userEmail: payload?.email || "unknown",
      action: AuditAction.DATA_ACCESSED,
      resource: "doctor-stats",
      success: false,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      ...errorRequestInfo,
    });

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to retrieve doctor statistics",
      },
      { status: 500 }
    );
  }
}
