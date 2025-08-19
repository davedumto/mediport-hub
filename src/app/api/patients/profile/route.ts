import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "../../../../lib/auth";
import logger from "../../../../lib/logger";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";
import { AuditService } from "../../../../lib/audit";
import prisma from "../../../../lib/db";

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

    // Only patients can access this endpoint
    if (payload.role !== "PATIENT" && payload.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only patients can access patient profile",
        },
        { status: 403 }
      );
    }

    // Get patient profile based on user ID
    const patient = await prisma.patient.findUnique({
      where: {
        userId: payload.userId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        dateOfBirth: true,
        gender: true,
        status: true,
        assignedProviderId: true,
        createdAt: true,
        updatedAt: true,
        assignedProvider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "Patient profile not found",
        },
        { status: 404 }
      );
    }

    // Log the access
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: "PATIENT_PROFILE_ACCESSED",
      resource: "patient_profile",
      resourceId: patient.id,
      success: true,
      ...requestInfo,
    });

    return NextResponse.json({
      success: true,
      data: patient,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: requestInfo.requestId,
      },
    });
  } catch (error) {
    logger.error("Get patient profile error:", error);

    if (error instanceof Error) {
      if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
        return NextResponse.json(
          {
            error: "Unauthorized",
            message: "Invalid or expired token",
          },
          { status: 401 }
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