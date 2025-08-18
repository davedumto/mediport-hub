import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/db";
import { AuditService, AuditAction } from "../../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";
import logger from "../../../../lib/logger";
import { verifyAccessToken } from "../../../../lib/auth";

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

    // Check if user is super admin
    if (payload.role !== "SUPER_ADMIN") {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "doctor-assignments",
        success: false,
        errorMessage: "Only super admins can access doctor assignments",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only super admins can access doctor assignments",
        },
        { status: 403 }
      );
    }

    // Get all doctor-patient assignments
    const assignments = await prisma.patient.findMany({
      where: {
        assignedProviderId: { not: null },
      },
      include: {
        assignedProvider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            specialty: true,
            medicalLicenseNumber: true,
          },
        },
      },
      orderBy: {
        assignedProvider: {
          firstName: "asc",
        },
      },
    });

    // Transform data to match the expected format
    const transformedAssignments = assignments.map((patient) => ({
      id: `${patient.id}-${patient.assignedProviderId}`,
      doctorId: patient.assignedProviderId!,
      patientId: patient.id,
      doctor: patient.assignedProvider!,
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
      },
      assignedAt: patient.createdAt.toISOString(),
      isActive: true,
    }));

    // Log successful access
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_ACCESSED,
      resource: "doctor-assignments",
      success: true,
      ...requestInfo,
    });

    return NextResponse.json({
      success: true,
      data: {
        assignments: transformedAssignments,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: requestInfo.requestId,
      },
    });
  } catch (error) {
    logger.error("Get doctor assignments error:", error);

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

    // Check if user is super admin
    if (payload.role !== "SUPER_ADMIN") {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "doctor-assignments",
        success: false,
        errorMessage: "Only super admins can create doctor assignments",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only super admins can create doctor assignments",
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { doctorId, patientId } = body;
    
    console.log("Debug - Assignment request body:", { doctorId, patientId });

    if (!doctorId || !patientId) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Doctor ID and Patient ID are required",
        },
        { status: 400 }
      );
    }

    // Verify doctor exists and is a doctor
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId },
      select: { id: true, role: true, isActive: true },
    });

    if (!doctor || !doctor.isActive) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Doctor not found or inactive",
        },
        { status: 400 }
      );
    }

    if (doctor.role !== "DOCTOR") {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "User must be a doctor",
        },
        { status: 400 }
      );
    }

    // Verify patient exists
    console.log("Debug - Looking for patient with ID:", patientId);
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, assignedProviderId: true, email: true, firstName: true, lastName: true },
    });
    
    console.log("Debug - Patient lookup result:", patient);

    if (!patient) {
      // Let's also check if there are any patients in the database
      const allPatients = await prisma.patient.findMany({
        select: { id: true, email: true, firstName: true, lastName: true },
        take: 5
      });
      console.log("Debug - Sample of all patients in database:", allPatients);
      
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Patient not found",
        },
        { status: 400 }
      );
    }

    // Check if patient is already assigned to this doctor
    if (patient.assignedProviderId === doctorId) {
      return NextResponse.json(
        {
          error: "Conflict",
          message: "Patient is already assigned to this doctor",
        },
        { status: 409 }
      );
    }

    // Update patient's assigned provider
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        assignedProviderId: doctorId,
        updatedBy: payload.userId,
      },
      include: {
        assignedProvider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            specialty: true,
            medicalLicenseNumber: true,
          },
        },
      },
    });

    // Log successful assignment
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_CREATED,
      resource: "doctor-assignments",
      resourceId: `${patientId}-${doctorId}`,
      success: true,
      changes: {
        patientId,
        doctorId,
        action: "assigned",
      },
      ...requestInfo,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Doctor assigned to patient successfully",
        data: {
          id: `${patientId}-${doctorId}`,
          doctorId,
          patientId,
          doctor: updatedPatient.assignedProvider!,
          patient: {
            id: updatedPatient.id,
            firstName: updatedPatient.firstName,
            lastName: updatedPatient.lastName,
            email: updatedPatient.email,
          },
          assignedAt: updatedPatient.updatedAt.toISOString(),
          isActive: true,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Create doctor assignment error:", error);

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
