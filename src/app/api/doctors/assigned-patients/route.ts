import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { AuditService, AuditAction } from "@/lib/audit";
import { extractRequestInfoFromRequest } from "@/utils/appRouterHelpers";
import logger from "@/lib/logger";
import { verifyAccessToken } from "@/lib/auth";

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
        resource: "assigned-patients",
        success: false,
        errorMessage: "Only doctors can access assigned patients",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only doctors can access assigned patients",
        },
        { status: 403 }
      );
    }

    // Get patients assigned to this doctor
    const assignedPatients = await prisma.patient.findMany({
      where: {
        assignedProviderId: payload.userId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        dateOfBirth: true,
        gender: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        firstName: "asc",
      },
    });

    // Log successful access
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_ACCESSED,
      resource: "assigned-patients",
      success: true,
      metadata: {
        patientCount: assignedPatients.length,
      },
      ...requestInfo,
    });

    return NextResponse.json({
      success: true,
      data: {
        patients: assignedPatients,
        count: assignedPatients.length,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: requestInfo.requestId,
      },
    });
  } catch (error) {
    logger.error("Get assigned patients error:", error);

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
