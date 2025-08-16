import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";
import { AuditService, AuditAction } from "../../../../lib/audit";
import { AppError, ErrorCodes } from "../../../../utils/errors";
import logger from "../../../../lib/logger";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";
import { hasPermission } from "../../../../lib/permissions";
import { Permission } from "../../../../types/auth";
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
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

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
            firstNameEncrypted: true,
            lastNameEncrypted: true,
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

    const confirmed = appointments.filter((apt) => apt.status === "CONFIRMED").length;
    const pending = appointments.filter((apt) => apt.status === "PENDING").length;
    const cancelled = appointments.filter((apt) => apt.status === "CANCELLED").length;

    // Decrypt patient and doctor names for display
    const decryptedAppointments = await Promise.all(
      appointments.map(async (appointment) => {
        // Decrypt patient name
        let patientName = "Unknown Patient";
        if (appointment.patient.firstNameEncrypted && appointment.patient.lastNameEncrypted) {
          try {
            const firstNameData = JSON.parse(appointment.patient.firstNameEncrypted.toString());
            const lastNameData = JSON.parse(appointment.patient.lastNameEncrypted.toString());
            
            const firstName = PIIProtectionService.decryptField(
              firstNameData.encryptedData,
              firstNameData.iv,
              firstNameData.tag
            );
            const lastName = PIIProtectionService.decryptField(
              lastNameData.encryptedData,
              lastNameData.iv,
              lastNameData.tag
            );
            
            patientName = `${firstName} ${lastName}`;
          } catch (error) {
            logger.warn("Failed to decrypt patient name:", error);
            patientName = "Unknown Patient";
          }
        }

        // Decrypt doctor name
        let doctorName = "Unknown Doctor";
        if (appointment.provider.firstNameEncrypted && appointment.provider.lastNameEncrypted) {
          try {
            const firstNameData = JSON.parse(appointment.provider.firstNameEncrypted.toString());
            const lastNameData = JSON.parse(appointment.provider.lastNameEncrypted.toString());
            
            const firstName = PIIProtectionService.decryptField(
              firstNameData.encryptedData,
              firstNameData.iv,
              firstNameData.tag
            );
            const lastName = PIIProtectionService.decryptField(
              lastNameData.encryptedData,
              lastNameData.iv,
              lastNameData.tag
            );
            
            doctorName = `Dr. ${firstName} ${lastName}`;
          } catch (error) {
            logger.warn("Failed to decrypt doctor name:", error);
            doctorName = "Unknown Doctor";
          }
        }

        return {
          appointmentId: appointment.id,
          dateTime: appointment.startTime.toISOString(),
          purpose: appointment.type || "General Consultation",
          status: appointment.status,
          notes: appointment.notes || "",
          patient: {
            id: appointment.patient.id,
            name: patientName,
          },
          doctor: {
            id: appointment.provider.id,
            name: doctorName,
          },
        };
      })
    );

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
