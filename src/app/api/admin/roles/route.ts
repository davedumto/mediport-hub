import { NextRequest, NextResponse } from "next/server";
import { verifyAccessTokenFromRequest } from "../../../../lib/auth";
import { hasPermission } from "../../../../lib/permissions";
import { Permission } from "../../../../types/auth";
import prisma from "../../../../lib/db";
import logger from "../../../../lib/logger";
import { AuditService, AuditAction } from "../../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";

// GET all roles (Super Admin only)
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

    // Check if user has permission to view roles
    if (
      !hasPermission(user.permissions as Permission[], Permission.USER_READ_ALL)
    ) {
      return NextResponse.json(
        { error: "Forbidden", message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get all roles with user counts
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        isSystemRole: true,
        createdAt: true,
        updatedAt: true,
        permissions: true,
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Get role statistics
    const roleStats = await prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    });

    const response = {
      roles: roles.map((role) => ({
        ...role,
        userCount: role._count.userRoles,
        _count: undefined, // Remove the _count field
      })),
      statistics: {
        totalRoles: roles.length,
        systemRoles: roles.filter((r) => r.isSystemRole).length,
        customRoles: roles.filter((r) => !r.isSystemRole).length,
        roleDistribution: roleStats.reduce((acc, stat) => {
          acc[stat.role] = stat._count.role;
          return acc;
        }, {} as Record<string, number>),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Get roles error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to retrieve roles",
      },
      { status: 500 }
    );
  }
}

// POST create new role (Super Admin only)
export async function POST(request: NextRequest) {
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

    // Check if user has permission to create roles
    if (
      !hasPermission(user.permissions as Permission[], Permission.SYSTEM_CONFIG)
    ) {
      return NextResponse.json(
        { error: "Forbidden", message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, permissions } = body;

    // Validate required fields
    if (!name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Role name and permissions array are required",
        },
        { status: 400 }
      );
    }

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: { name },
    });

    if (existingRole) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Role with this name already exists",
        },
        { status: 400 }
      );
    }

    const requestInfo = extractRequestInfoFromRequest(request);

    // Create the role
    const newRole = await prisma.role.create({
      data: {
        name,
        description,
        permissions,
        isSystemRole: false, // Custom roles are not system roles
      },
    });

    // Log role creation
    await AuditService.log({
      userId: user.userId,
      action: AuditAction.DATA_CREATED,
      resource: "role",
      resourceId: newRole.id,
      success: true,
      changes: {
        roleName: newRole.name,
        permissions: newRole.permissions,
        createdBy: user.userId,
      },
      ...requestInfo,
    });

    return NextResponse.json(
      {
        message: "Role created successfully",
        role: {
          id: newRole.id,
          name: newRole.name,
          description: newRole.description,
          permissions: newRole.permissions,
          isSystemRole: newRole.isSystemRole,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Create role error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to create role",
      },
      { status: 500 }
    );
  }
}
