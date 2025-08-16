import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../lib/db";
import { AuditService, AuditAction } from "../../../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../../../utils/appRouterHelpers";
import logger from "../../../../../lib/logger";
import { verifyAccessToken } from "../../../../../lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        errorMessage: "Only super admins can remove doctor assignments",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only super admins can remove doctor assignments",
        },
        { status: 403 }
      );
    }

    const { id: assignmentId } = await params;

    console.log("DELETE endpoint called with assignmentId:", assignmentId);

    // Parse the assignment ID to extract patient and doctor IDs
    // Format: patientId-doctorId (both are UUIDs with dashes)
    // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (36 characters)
    // We need to find the dash that separates the two UUIDs
    // Since each UUID has 4 dashes, the separator is the 5th dash

    let dashCount = 0;
    let separatorIndex = -1;

    for (let i = 0; i < assignmentId.length; i++) {
      if (assignmentId[i] === "-") {
        dashCount++;
        if (dashCount === 5) {
          separatorIndex = i;
          break;
        }
      }
    }

    if (separatorIndex === -1) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message:
            "Invalid assignment ID format - expected 5 dashes to separate two UUIDs",
        },
        { status: 400 }
      );
    }

    // Split at the separator dash to get the two UUIDs
    const patientId = assignmentId.substring(0, separatorIndex);
    const doctorId = assignmentId.substring(separatorIndex + 1);

    console.log("Split result - patientId:", patientId, "doctorId:", doctorId);
    console.log(
      "patientId length:",
      patientId.length,
      "doctorId length:",
      doctorId.length
    );

    // Validate UUID format (basic check)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const patientIdValid = uuidRegex.test(patientId);
    const doctorIdValid = uuidRegex.test(doctorId);

    console.log(
      "UUID validation - patientId valid:",
      patientIdValid,
      "doctorId valid:",
      doctorIdValid
    );

    if (!patientIdValid || !doctorIdValid) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Invalid UUID format in assignment ID",
          details: {
            patientId: {
              value: patientId,
              valid: patientIdValid,
              length: patientId.length,
            },
            doctorId: {
              value: doctorId,
              valid: doctorIdValid,
              length: doctorId.length,
            },
          },
        },
        { status: 400 }
      );
    }

    console.log("Parsed IDs - patientId:", patientId, "doctorId:", doctorId);

    // Verify the assignment exists
    const patient = await prisma.patient.findUnique({
      where: {
        id: patientId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        assignedProviderId: true,
        assignedProvider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Check if the patient actually has this doctor assigned
    if (!patient || patient.assignedProviderId !== doctorId) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "Assignment not found",
        },
        { status: 404 }
      );
    }

    // Remove the assignment by setting assignedProviderId to null
    await prisma.patient.update({
      where: { id: patientId },
      data: {
        assignedProviderId: null,
        updatedBy: payload.userId,
      },
    });

    // Log successful removal
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_DELETED,
      resource: "doctor-assignments",
      resourceId: assignmentId,
      success: true,
      changes: {
        patientId,
        doctorId,
        action: "removed",
        patientName: `${patient.firstName} ${patient.lastName}`,
        doctorName: `Dr. ${patient.assignedProvider?.firstName} ${patient.assignedProvider?.lastName}`,
      },
      ...requestInfo,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Doctor assignment removed successfully",
        data: {
          id: assignmentId,
          patientId,
          doctorId,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Remove doctor assignment error:", error);

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
