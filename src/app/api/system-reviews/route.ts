import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/db";
import { AuditService, AuditAction } from "../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../utils/appRouterHelpers";
import logger from "../../../lib/logger";
import { verifyAccessToken } from "../../../lib/auth";
import { hasPermission } from "../../../lib/permissions";
import { Permission } from "../../../types/auth";
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
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid or expired token",
        },
        { status: 401 }
      );
    }
    const requestInfo = extractRequestInfoFromRequest(request);

    // Check permissions - only super admins can read all reviews
    const userPermissions = payload.permissions || [];

    if (!hasPermission(userPermissions, Permission.REVIEW_READ_ALL)) {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "system_reviews",
        success: false,
        errorMessage: "Insufficient permissions to read system reviews",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Insufficient permissions to access system reviews",
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    // Get total count for pagination
    const total = await prisma.systemReview.count();

    // Get reviews with pagination
    const reviews = await prisma.systemReview.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            email: true,
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
      resource: "system_reviews",
      success: true,
      metadata: {
        pagination: { page, limit, total },
      },
      ...requestInfo,
    });

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviews.map((review) => ({
          id: review.id,
          title: review.title,
          message: review.message,
          rating: review.rating,
          createdAt: review.createdAt,
          user: review.user,
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
    logger.error("Get system reviews error:", error);

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
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid or expired token",
        },
        { status: 401 }
      );
    }
    const requestInfo = extractRequestInfoFromRequest(request);

    // Check permissions - doctors and patients can create reviews
    const userPermissions = payload.permissions || [];

    if (!hasPermission(userPermissions, Permission.REVIEW_CREATE)) {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "system_reviews",
        success: false,
        errorMessage: "Insufficient permissions to create system reviews",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Insufficient permissions to create system reviews",
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const { title, message, rating } = body;

    // Basic validation
    if (!title || !message || !rating) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Title, message, and rating are required",
        },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Rating must be between 1 and 5",
        },
        { status: 400 }
      );
    }

    // Sanitize input data
    const sanitizedData = {
      title: SanitizationService.sanitizeMedicalData(title),
      message: SanitizationService.sanitizeMedicalData(message),
      rating: parseInt(rating),
    };

    // Create system review
    const systemReview = await prisma.systemReview.create({
      data: {
        userId: payload.userId,
        title: sanitizedData.title,
        message: sanitizedData.message,
        rating: sanitizedData.rating,
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
      resource: "system_reviews",
      resourceId: systemReview.id,
      success: true,
      changes: {
        title: sanitizedData.title,
        rating: sanitizedData.rating,
      },
      ...requestInfo,
    });

    return NextResponse.json(
      {
        success: true,
        message: "System review submitted successfully",
        data: {
          id: systemReview.id,
          title: systemReview.title,
          message: systemReview.message,
          rating: systemReview.rating,
          createdAt: systemReview.createdAt,
          user: systemReview.user,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Create system review error:", error);

    if (
      error instanceof Error &&
      (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError")
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid or expired token",
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
