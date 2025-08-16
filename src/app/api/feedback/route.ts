import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "../../../lib/db";
import { AuditService, AuditAction } from "../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../utils/appRouterHelpers";
import logger from "../../../lib/logger";
import { verifyAccessToken } from "../../../lib/auth";
import { hasPermission } from "../../../lib/permissions";
import { Permission } from "../../../types/auth";
import { createFeedbackSchema } from "../../../lib/validation";
import { SanitizationService } from "../../../services/sanitizationService";

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

    // Check permissions - users can see their own feedback, admins can see all
    const userPermissions = (payload.permissions || []) as Permission[];
    const canReadAll = hasPermission(userPermissions, Permission.SYSTEM_CONFIG);
    const canReadOwn =
      payload.role === "PATIENT" ||
      payload.role === "DOCTOR" ||
      payload.role === "NURSE";

    if (!canReadAll && !canReadOwn) {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "feedback",
        success: false,
        errorMessage: "Insufficient permissions to read feedback",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Insufficient permissions to access feedback",
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    // Build where clause
    const whereClause: any = {};

    if (type) {
      whereClause.type = type;
    }

    if (category) {
      whereClause.category = category;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (status) {
      whereClause.status = status;
    }

    // Apply permission-based filtering
    if (!canReadAll) {
      // Users can only see their own feedback
      whereClause.userId = payload.userId;
    }

    // Get total count for pagination
    const total = await prisma.feedback.count({ where: whereClause });

    // Get feedback with pagination
    const feedback = await prisma.feedback.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Log successful access
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_ACCESSED,
      resource: "feedback",
      success: true,
      metadata: {
        filters: { type, category, priority, status },
        pagination: { page, limit, total },
      },
      ...requestInfo,
    });

    return NextResponse.json({
      success: true,
      data: {
        feedback: feedback.map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          description: item.description,
          priority: item.priority,
          category: item.category,
          status: item.status,
          user: item.user,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: requestInfo.requestId,
      },
    });
  } catch (error) {
    logger.error("Get feedback error:", error);

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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createFeedbackSchema.parse(body);

    // Sanitize input data
    const sanitizedData = {
      ...validatedData,
      title: SanitizationService.sanitizeMedicalData(validatedData.title),
      description: SanitizationService.sanitizeMedicalData(
        validatedData.description
      ),
    };

    // Create feedback record
    const feedback = await prisma.feedback.create({
      data: {
        userId: payload.userId,
        type: validatedData.type,
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority || "MEDIUM",
        category: validatedData.category || "GENERAL",
        status: "PENDING",
        createdBy: payload.userId,
        updatedBy: payload.userId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    // Log successful creation
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_CREATED,
      resource: "feedback",
      resourceId: feedback.id,
      success: true,
      changes: {
        type: validatedData.type,
        title: validatedData.title,
        priority: validatedData.priority || "MEDIUM",
        category: validatedData.category || "GENERAL",
      },
      ...requestInfo,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Feedback submitted successfully",
        data: {
          id: feedback.id,
          type: feedback.type,
          title: feedback.title,
          description: feedback.description,
          priority: feedback.priority,
          category: feedback.category,
          status: feedback.status,
          user: feedback.user,
          createdAt: feedback.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Create feedback error:", error);

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

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Validation error",
          details: ["Invalid request format"],
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
