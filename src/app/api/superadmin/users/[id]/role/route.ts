import { NextRequest, NextResponse } from "next/server";
import { verifyAccessTokenFromRequest } from "../../../../../../lib/auth";
import { hasPermission } from "../../../../../../lib/permissions";
import { Permission } from "../../../../../../types/auth";
import prisma from "../../../../../../lib/db";
import logger from "../../../../../../lib/logger";
import { AuditService, AuditAction } from "../../../../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../../../../utils/appRouterHelpers";
import { Role } from "../../../../../../types/auth";

// PUT update user role (Super Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    console.log("Debug - Role change API called for user:", userId);

    const body = await request.json();
    const { newRole, reason } = body;

    // Extract request info once for use throughout the function
    const requestInfo = extractRequestInfoFromRequest(request);

    // Helper function to map display role names to UserRole enum values
    const mapDisplayRoleToEnum = (displayRole: string): string => {
      const roleMap: Record<string, string> = {
        "Super Admin": "SUPER_ADMIN",
        Admin: "ADMIN",
        Doctor: "DOCTOR",
        Nurse: "NURSE",
        Patient: "PATIENT",
      };
      return roleMap[displayRole] || displayRole;
    };

    console.log("Debug - Request body:", { newRole, reason });

    // Validate required fields
    if (!newRole) {
      return NextResponse.json(
        { error: "Bad Request", message: "New role is required" },
        { status: 400 }
      );
    }

    // Validate role is valid
    console.log("Debug - Available roles:", Object.values(Role));
    console.log("Debug - New role:", newRole);
    console.log(
      "Debug - Role validation:",
      Object.values(Role).includes(newRole)
    );

    if (!Object.values(Role).includes(newRole)) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid role specified" },
        { status: 400 }
      );
    }

    // Verify authentication and get user info
    const authResult = await verifyAccessTokenFromRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid or missing token" },
        { status: 401 }
      );
    }

    const { user } = authResult;

    console.log("Debug - Authenticated user:", {
      userId: user.userId,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    });

    // Check if user has Super Admin role or USER_UPDATE_ALL permission
    if (
      user.role !== "SUPER_ADMIN" &&
      user.role !== "Super Admin" &&
      !hasPermission(user.permissions, Permission.USER_UPDATE_ALL)
    ) {
      console.log("Debug - Permission check failed:", {
        userRole: user.role,
        requiredRoles: ["SUPER_ADMIN", "Super Admin"],
        hasPermission: hasPermission(
          user.permissions,
          Permission.USER_UPDATE_ALL
        ),
      });

      await AuditService.log({
        userId: user.userId,
        userEmail: user.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "superadmin_role_update",
        resourceId: userId,
        success: false,
        errorMessage: "Insufficient permissions to update user roles",
        ...requestInfo,
      });

      return NextResponse.json(
        { error: "Forbidden", message: "Super admin access required" },
        { status: 403 }
      );
    }

    console.log("Debug - Permission check passed");

    // Prevent super admin from changing their own role
    if (userId === user.userId) {
      return NextResponse.json(
        { error: "Bad Request", message: "Cannot change your own role" },
        { status: 400 }
      );
    }

    // Get current user details
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        userRoles: {
          where: { revokedAt: null },
          select: {
            id: true,
            roleId: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Check what roles exist in the database
    const availableRoles = await prisma.role.findMany({
      select: { id: true, name: true, description: true },
    });
    console.log("Debug - Available roles in database:", availableRoles);

    // If not found in users table, check if it's a patient
    if (!currentUser) {
      const patient = await prisma.patient.findUnique({
        where: { id: userId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (patient) {
        return NextResponse.json(
          {
            error: "Bad Request",
            message:
              "Cannot change role for patients. Patients are managed separately from user accounts.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: "Not Found", message: "User not found" },
        { status: 404 }
      );
    }

    console.log("Debug - Current user found:", {
      id: currentUser.id,
      email: currentUser.email,
      currentRole: currentUser.role,
      userRoles: currentUser.userRoles,
    });

    // Check if trying to change to the same role
    const mappedNewRole = mapDisplayRoleToEnum(newRole);
    if (currentUser.role === mappedNewRole) {
      return NextResponse.json(
        { error: "Bad Request", message: "User already has this role" },
        { status: 400 }
      );
    }

    console.log("Debug - Role change validation:", {
      currentRole: currentUser.role,
      newRole: newRole,
      mappedNewRole: mappedNewRole,
      willChange: currentUser.role !== mappedNewRole,
    });

    // Prevent changing system roles
    if (
      (currentUser.role === "SUPER_ADMIN" ||
        currentUser.role === "Super Admin") &&
      newRole !== "Super Admin"
    ) {
      return NextResponse.json(
        { error: "Bad Request", message: "Cannot change super admin role" },
        { status: 400 }
      );
    }

    // Update user role using transaction
    console.log("Debug - Starting database transaction for role update");
    console.log("Debug - Current user role:", currentUser.role);
    console.log("Debug - New role requested:", newRole);
    console.log("Debug - Mapped new role:", mappedNewRole);

    // Test database connectivity
    try {
      const testRole = await prisma.role.findFirst({
        where: { name: newRole },
        select: { id: true, name: true },
      });
      console.log(
        "Debug - Database connectivity test passed, found role:",
        testRole
      );
    } catch (dbTestError) {
      console.error("Debug - Database connectivity test failed:", dbTestError);
      throw new Error(
        `Database connectivity issue: ${
          dbTestError instanceof Error ? dbTestError.message : "Unknown error"
        }`
      );
    }

    let result;
    try {
      result = await prisma.$transaction(async (tx) => {
        console.log("Debug - Revoking existing roles for user:", userId);

        // Revoke all existing roles
        await tx.userRoleAssignment.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });

        console.log("Debug - Existing roles revoked");

        console.log("Debug - Finding new role:", newRole);

        // Find the new role
        const role = await tx.role.findUnique({
          where: { name: newRole },
        });

        if (!role) {
          console.log("Debug - Role not found:", newRole);
          throw new Error(`Role ${newRole} not found`);
        }

        console.log("Debug - Role found:", role);

        // Assign new role
        const userRole = await tx.userRoleAssignment.create({
          data: {
            userId,
            roleId: role.id,
            grantedBy: user.userId,
          },
        });

        console.log("Debug - New role assigned:", userRole);

        // Update user's primary role
        console.log("Debug - Updating user primary role to:", mappedNewRole);
        await tx.user.update({
          where: { id: userId },
          data: { role: mappedNewRole },
        });

        console.log("Debug - User primary role updated");

        return userRole;
      });

      console.log("Debug - Transaction completed successfully:", result);
    } catch (transactionError) {
      console.error("Debug - Transaction failed:", transactionError);
      throw transactionError;
    }

    // Log successful role update
    try {
      await AuditService.log({
        userId: user.userId,
        userEmail: user.email,
        action: AuditAction.ROLE_CHANGED,
        resource: "user_role",
        resourceId: userId,
        success: true,
        changes: {
          oldRole: currentUser.role,
          newRole,
          reason: reason || "Role updated by super admin",
          updatedBy: user.userId,
        },
        metadata: {
          operation: "role_update",
          targetUserId: userId,
          targetUserEmail: currentUser.email,
          targetUserName: `${currentUser.firstName} ${currentUser.lastName}`,
        },
        ...requestInfo,
      });
      console.log("Debug - Audit log created successfully");
    } catch (auditError) {
      console.error(
        "Debug - Audit log failed, but role update succeeded:",
        auditError
      );
      // Don't fail the entire operation if audit logging fails
    }

    const response = {
      success: true,
      message: "User role updated successfully",
      data: {
        userId,
        oldRole: currentUser.role,
        newRole,
        updatedAt: new Date().toISOString(),
        updatedBy: user.userId,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Debug - Role change error details:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      targetUserId: params ? (await params).id : "unknown",
      newRole: body?.newRole,
      errorType: error?.constructor?.name,
      errorDetails: error,
    });

    logger.error("Super admin role update error:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to update user role",
        details:
          error instanceof Error ? [error.message] : ["Unknown error occurred"],
      },
      { status: 500 }
    );
  }
}
