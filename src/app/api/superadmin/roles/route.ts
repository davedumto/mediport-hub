import { NextRequest, NextResponse } from "next/server";
import { verifyAccessTokenFromRequest } from "../../../../lib/auth";
import { hasPermission } from "../../../../lib/permissions";
import { Permission } from "../../../../types/auth";
import prisma from "../../../../lib/db";
import logger from "../../../../lib/logger";
import { AuditService, AuditAction } from "../../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";
import { ROLE_PERMISSIONS } from "../../../../lib/permissions";
import { Role } from "../../../../types/auth";

// GET available roles and permissions (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and get user info
    const authResult = await verifyAccessTokenFromRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid or missing token" },
        { status: 401 }
      );
    }

    const { user } = authResult;

    // Check if user has SUPER_ADMIN role or SYSTEM_CONFIG permission
    if (
      user.role !== "SUPER_ADMIN" &&
      !hasPermission(user.permissions, Permission.SYSTEM_CONFIG)
    ) {
      await AuditService.log({
        userId: user.userId,
        userEmail: user.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "superadmin_roles",
        success: false,
        errorMessage:
          "Insufficient permissions to access roles and permissions",
        ...extractRequestInfoFromRequest(request),
      });

      return NextResponse.json(
        { error: "Forbidden", message: "Super admin access required" },
        { status: 403 }
      );
    }

    // Get all roles from database
    const dbRoles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        permissions: true,
        isSystemRole: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            userRoles: {
              where: { revokedAt: null },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Get user count per role
    const userCounts = await prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    });

    // Build comprehensive role information
    const roles = Object.values(Role).map((roleName) => {
      const dbRole = dbRoles.find((r) => r.name === roleName);
      const userCount =
        userCounts.find((uc) => uc.role === roleName)?._count.role || 0;

      return {
        name: roleName,
        description: dbRole?.description || `${roleName} role`,
        isSystemRole: dbRole?.isSystemRole || false,
        permissions: ROLE_PERMISSIONS[roleName] || [],
        userCount,
        totalPermissions: ROLE_PERMISSIONS[roleName]?.length || 0,
        createdAt: dbRole?.createdAt || null,
        updatedAt: dbRole?.updatedAt || null,
        // Add permission categories for better organization
        permissionCategories: {
          userManagement:
            ROLE_PERMISSIONS[roleName]?.filter((p) => p.startsWith("user:"))
              ?.length || 0,
          patientManagement:
            ROLE_PERMISSIONS[roleName]?.filter((p) => p.startsWith("patient:"))
              ?.length || 0,
          medicalRecords:
            ROLE_PERMISSIONS[roleName]?.filter((p) => p.startsWith("record:"))
              ?.length || 0,
          appointments:
            ROLE_PERMISSIONS[roleName]?.filter((p) =>
              p.startsWith("appointment:")
            )?.length || 0,
          systemAdmin:
            ROLE_PERMISSIONS[roleName]?.filter(
              (p) =>
                p.startsWith("audit:") ||
                p.startsWith("system:") ||
                p.startsWith("backup:")
            )?.length || 0,
          gdpr:
            ROLE_PERMISSIONS[roleName]?.filter((p) => p.startsWith("gdpr:"))
              ?.length || 0,
        },
      };
    });

    // Get permission statistics
    const allPermissions = Object.values(Permission);
    const permissionStats = {
      total: allPermissions.length,
      byCategory: {
        userManagement: allPermissions.filter((p) => p.startsWith("user:"))
          .length,
        patientManagement: allPermissions.filter((p) =>
          p.startsWith("patient:")
        ).length,
        medicalRecords: allPermissions.filter((p) => p.startsWith("record:"))
          .length,
        appointments: allPermissions.filter((p) => p.startsWith("appointment:"))
          .length,
        systemAdmin: allPermissions.filter(
          (p) =>
            p.startsWith("audit:") ||
            p.startsWith("system:") ||
            p.startsWith("backup:")
        ).length,
        gdpr: allPermissions.filter((p) => p.startsWith("gdpr:")).length,
      },
    };


    const response = {
      success: true,
      data: {
        roles,
        permissions: {
          all: allPermissions,
          categories: {
            userManagement: allPermissions.filter((p) => p.startsWith("user:")),
            patientManagement: allPermissions.filter((p) =>
              p.startsWith("patient:")
            ),
            medicalRecords: allPermissions.filter((p) =>
              p.startsWith("record:")
            ),
            appointments: allPermissions.filter((p) =>
              p.startsWith("appointment:")
            ),
            systemAdmin: allPermissions.filter(
              (p) =>
                p.startsWith("audit:") ||
                p.startsWith("system:") ||
                p.startsWith("backup:")
            ),
            gdpr: allPermissions.filter((p) => p.startsWith("gdpr:")),
          },
        },
        statistics: {
          totalRoles: roles.length,
          totalPermissions: allPermissions.length,
          systemRoles: roles.filter((r) => r.isSystemRole).length,
          customRoles: roles.filter((r) => !r.isSystemRole).length,
          totalUsers: userCounts.reduce((sum, uc) => sum + uc._count.role, 0),
          roleDistribution: userCounts.reduce((acc, uc) => {
            acc[uc.role] = uc._count.role;
            return acc;
          }, {} as Record<string, number>),
          permissionDistribution: permissionStats.byCategory,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    };

    // Log successful access
    await AuditService.log({
      userId: user.userId,
      userEmail: user.email,
      action: AuditAction.DATA_ACCESSED,
      resource: "superadmin_roles",
      success: true,
      metadata: {
        rolesAccessed: roles.length,
        permissionsAccessed: allPermissions.length,
      },
      ...extractRequestInfoFromRequest(request),
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Super admin get roles error:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to retrieve roles and permissions",
        details:
          error instanceof Error ? [error.message] : ["Unknown error occurred"],
      },
      { status: 500 }
    );
  }
}
