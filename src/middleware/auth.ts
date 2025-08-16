import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "../lib/auth";
import { AuditService, AuditAction } from "../lib/audit";
import { extractRequestInfoFromRequest } from "../utils/appRouterHelpers";
import logger from "../lib/logger";

export interface AuthenticatedRequest extends NextRequest {
  user: {
    userId: string;
    email: string;
    role: string;
    permissions: string[];
    sessionId: string;
  };
}

// Authentication middleware
export function authenticateUser(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const authHeader = request.headers.get("authorization");
      const accessToken = authHeader?.replace("Bearer ", "");

      if (!accessToken) {
        return NextResponse.json(
          {
            error: "Unauthorized",
            message: "Access token required",
            details: ["Authorization header missing or invalid"],
          },
          { status: 401 }
        );
      }

      // Verify token
      const payload = verifyAccessToken(accessToken);

      // Add user to request
      (request as any).user = payload;

      // Log successful authentication
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.AUTHENTICATION_SUCCESS,
        resource: "middleware",
        success: true,
        ...extractRequestInfoFromRequest(request),
      });

      return handler(request);
    } catch (error) {
      logger.error("Authentication middleware error:", error);

      // Log failed authentication
      try {
        await AuditService.log({
          action: AuditAction.AUTHENTICATION_FAILED,
          resource: "middleware",
          success: false,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          ...extractRequestInfoFromRequest(request),
        });
      } catch (auditError) {
        logger.error("Failed to log authentication failure:", auditError);
      }

      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid or expired access token",
          details: ["Please log in again"],
        },
        { status: 401 }
      );
    }
  };
}

// Role-based access control middleware
export function requireRole(allowedRoles: string[]) {
  return (handler: (request: NextRequest) => Promise<NextResponse>) => {
    return authenticateUser(async (request: NextRequest) => {
      const user = (request as any).user;

      if (!allowedRoles.includes(user.role)) {
        await AuditService.log({
          userId: user.userId,
          userEmail: user.email,
          action: AuditAction.PERMISSION_DENIED,
          resource: "middleware",
          success: false,
          errorMessage: `Role ${user.role} not authorized for this endpoint`,
          ...extractRequestInfoFromRequest(request),
        });

        return NextResponse.json(
          {
            error: "Forbidden",
            message: "Insufficient permissions",
            details: [`Role ${user.role} not authorized`],
          },
          { status: 403 }
        );
      }

      return handler(request);
    });
  };
}

// Permission-based access control middleware
export function requirePermission(requiredPermission: string) {
  return (handler: (request: NextRequest) => Promise<NextResponse>) => {
    return authenticateUser(async (request: NextRequest) => {
      const user = (request as any).user;

      if (!user.permissions.includes(requiredPermission)) {
        await AuditService.log({
          userId: user.userId,
          userEmail: user.email,
          action: AuditAction.PERMISSION_DENIED,
          resource: "middleware",
          success: false,
          errorMessage: `Permission ${requiredPermission} not granted`,
          ...extractRequestInfoFromRequest(request),
        });

        return NextResponse.json(
          {
            error: "Forbidden",
            message: "Insufficient permissions",
            details: [`Permission ${requiredPermission} required`],
          },
          { status: 403 }
        );
      }

      return handler(request);
    });
  };
}

// Resource ownership validation middleware
export function requireOwnership(
  resourceType: string,
  resourceIdParam: string = "id"
) {
  return (handler: (request: NextRequest) => Promise<NextResponse>) => {
    return authenticateUser(async (request: NextRequest) => {
      const user = (request as any).user;
      const resourceId =
        request.nextUrl.searchParams.get(resourceIdParam) ||
        (request as any).params?.[resourceIdParam];

      if (!resourceId) {
        return NextResponse.json(
          {
            error: "Bad Request",
            message: "Resource ID required",
            details: ["Missing resource identifier"],
          },
          { status: 400 }
        );
      }

      // Check if user owns the resource or has admin access
      if (user.role === "SUPER_ADMIN" || user.role === "ADMIN") {
        return handler(request);
      }

      // For patients, they can only access their own data
      if (user.role === "PATIENT") {
        // This will be validated in the specific endpoint handlers
        return handler(request);
      }

      // For doctors, they can access assigned patients' data
      if (user.role === "DOCTOR") {
        // This will be validated in the specific endpoint handlers
        return handler(request);
      }

      return handler(request);
    });
  };
}

// Combined middleware for complex access control
export function requireAccess(options: {
  roles?: string[];
  permissions?: string[];
  ownership?: {
    resourceType: string;
    resourceIdParam?: string;
  };
}) {
  let middleware = authenticateUser;

  if (options.roles) {
    middleware = requireRole(options.roles);
  }

  if (options.permissions) {
    const permissionMiddleware = requirePermission(options.permissions[0]);
    middleware = (handler: (request: NextRequest) => Promise<NextResponse>) =>
      permissionMiddleware(middleware(handler));
  }

  if (options.ownership) {
    const ownershipMiddleware = requireOwnership(
      options.ownership.resourceType,
      options.ownership.resourceIdParam
    );
    middleware = (handler: (request: NextRequest) => Promise<NextResponse>) =>
      ownershipMiddleware(middleware(handler));
  }

  return middleware;
}
