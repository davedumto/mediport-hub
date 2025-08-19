import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";
import { AuditService, AuditAction } from "../../../../lib/audit";
import { AppError } from "../../../../utils/errors";
import logger from "../../../../lib/logger";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";
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

    // Verify access token
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

    // Check if user has doctor role
    if (payload.role !== "DOCTOR") {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "doctor_dashboard",
        success: false,
        errorMessage: "Access denied: User is not a doctor",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Access denied: Only doctors can access this endpoint",
        },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    // Validate query parameters
    if (!year || !month) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Year and month parameters are required",
          details: ["Query parameters 'year' and 'month' must be provided"],
        },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Invalid year or month parameters",
          details: ["Year must be a valid number, month must be 1-12"],
        },
        { status: 400 }
      );
    }

    // Calculate date range for the specified month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

    // Get today's date for today's appointments calculation
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const todayEnd = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    );

    // Get appointments for the specified month
    const appointments = await prisma.appointment.findMany({
      where: {
        providerId: payload.userId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        patient: {
          select: {
            id: true,
          },
        },
        provider: {
          select: {
            id: true,
            firstNameEncrypted: true,
            lastNameEncrypted: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Calculate statistics
    const todaysAppointments = appointments.filter(
      (apt) => apt.startTime >= todayStart && apt.startTime <= todayEnd
    ).length;

    const confirmed = appointments.filter(
      (apt) => (apt.status as any) === "CONFIRMED"
    ).length;
    const pending = appointments.filter(
      (apt) => (apt.status as any) === "PENDING"
    ).length;
    const cancelled = appointments.filter(
      (apt) => (apt.status as any) === "CANCELLED"
    ).length;

    // Process appointment data without decryption for now
    const decryptedAppointments = appointments.map((appointment) => ({
      appointmentId: appointment.id,
      dateTime: appointment.startTime.toISOString(),
      purpose: appointment.type || "General Consultation",
      status: appointment.status,
      notes: "",
      patient: {
        id: appointment.patient.id,
        name: "Patient",
      },
      doctor: {
        id: appointment.provider.id,
        name: "Doctor",
      },
    }));

    // Log successful access
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_ACCESSED,
      resource: "doctor_dashboard",
      success: true,
      changes: {
        year,
        month,
        appointmentsCount: appointments.length,
        stats: {
          todaysAppointments,
          confirmed,
          pending,
          cancelled,
        },
      },
      ...requestInfo,
    });

    // Return dashboard data
    return NextResponse.json({
      stats: {
        todaysAppointments,
        confirmed,
        pending,
        cancelled,
      },
      appointments: decryptedAppointments,
    });
  } catch (error) {
    logger.error("Doctor dashboard error:", error);

    if (error instanceof AppError) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: error.message,
          details: error.details || [],
        },
        { status: error.statusCode }
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
