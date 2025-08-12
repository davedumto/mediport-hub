import prisma from "../lib/db";
import { Role, Permission, RoleStatistics } from "../types/auth";
import { AppError, ErrorCodes } from "../utils/errors";
import { AuditService, AuditAction } from "../lib/audit";
import { ROLE_PERMISSIONS } from "../lib/permissions";
import { logger } from "../utils/logger";

export class RoleService {
  // Assign role to user
  static async assignRole(
    userId: string,
    roleName: Role,
    grantedBy: string,
    requestInfo: any
  ): Promise<any> {
    // Find the role
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new AppError(
        ErrorCodes.RESOURCE_NOT_FOUND,
        `Role ${roleName} not found`,
        404
      );
    }

    // Check if user already has this role
    const existingAssignment = await prisma.userRoleAssignment.findFirst({
      where: {
        userId,
        roleId: role.id,
        revokedAt: null,
      },
    });

    if (existingAssignment) {
      throw new AppError(
        ErrorCodes.RESOURCE_CONFLICT,
        "User already has this role",
        409
      );
    }

    // Assign role
    const userRole = await prisma.userRoleAssignment.create({
      data: {
        userId,
        roleId: role.id,
        grantedBy,
      },
    });

    // Update user's primary role if this is their first role
    const userRoleCount = await prisma.userRoleAssignment.count({
      where: { userId, revokedAt: null },
    });

    if (userRoleCount === 1) {
      await prisma.user.update({
        where: { id: userId },
        data: { role: roleName },
      });
    }

    // Log the role assignment
    await AuditService.log({
      userId: grantedBy,
      action: AuditAction.USER_CREATED, // Using USER_CREATED as closest match
      resource: "user_role",
      resourceId: userRole.id,
      success: true,
      newValues: {
        userId,
        roleName,
        roleId: role.id,
      },
      metadata: {
        operation: "assign_role",
        targetUserId: userId,
      },
      ...requestInfo,
    });

    return userRole;
  }

  // Revoke role from user
  static async revokeRole(
    userId: string,
    roleName: Role,
    revokedBy: string,
    requestInfo: any
  ): Promise<void> {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new AppError(
        ErrorCodes.RESOURCE_NOT_FOUND,
        `Role ${roleName} not found`,
        404
      );
    }

    const userRole = await prisma.userRoleAssignment.findFirst({
      where: {
        userId,
        roleId: role.id,
        revokedAt: null,
      },
    });

    if (!userRole) {
      throw new AppError(
        ErrorCodes.RESOURCE_NOT_FOUND,
        "User does not have this role",
        404
      );
    }

    // Revoke the role
    await prisma.userRoleAssignment.update({
      where: { id: userRole.id },
      data: { revokedAt: new Date() },
    });

    // Update user's primary role to their next active role
    const remainingRoles = await prisma.userRoleAssignment.findMany({
      where: {
        userId,
        revokedAt: null,
        id: { not: userRole.id },
      },
      include: { role: true },
      orderBy: { grantedAt: "asc" },
    });

    const newPrimaryRole =
      (remainingRoles[0]?.role.name as Role) || Role.PATIENT;

    await prisma.user.update({
      where: { id: userId },
      data: { role: newPrimaryRole },
    });

    // Log the role revocation
    await AuditService.log({
      userId: revokedBy,
      action: AuditAction.USER_UPDATED, // Using USER_UPDATED as closest match
      resource: "user_role",
      resourceId: userRole.id,
      success: true,
      oldValues: {
        userId,
        roleName,
        roleId: role.id,
      },
      metadata: {
        operation: "revoke_role",
        targetUserId: userId,
        newPrimaryRole,
      },
      ...requestInfo,
    });
  }

  // Get user's effective permissions
  static async getUserPermissions(userId: string): Promise<Permission[]> {
    const userRoles = await prisma.userRoleAssignment.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      include: { role: true },
    });

    const allPermissions = new Set<Permission>();

    for (const userRole of userRoles) {
      const rolePermissions = userRole.role.permissions as Permission[];
      rolePermissions.forEach((permission) => allPermissions.add(permission));
    }

    return Array.from(allPermissions);
  }

  // Create custom role
  static async createRole(
    name: string,
    description: string,
    permissions: Permission[],
    createdBy: string,
    requestInfo: any
  ): Promise<void> {
    // Validate permissions
    const validPermissions = Object.values(Permission);
    const invalidPermissions = permissions.filter(
      (p) => !validPermissions.includes(p)
    );

    if (invalidPermissions.length > 0) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        `Invalid permissions: ${invalidPermissions.join(", ")}`,
        400
      );
    }

    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions,
        isSystemRole: false,
      },
    });

    await AuditService.log({
      userId: createdBy,
      action: AuditAction.USER_CREATED, // Using USER_CREATED as closest match
      resource: "role",
      resourceId: role.id,
      success: true,
      newValues: {
        name,
        description,
        permissions,
      },
      ...requestInfo,
    });
  }

  // Update role permissions
  static async updateRolePermissions(
    roleName: string,
    permissions: Permission[],
    updatedBy: string,
    requestInfo: any
  ): Promise<void> {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new AppError(
        ErrorCodes.RESOURCE_NOT_FOUND,
        `Role ${roleName} not found`,
        404
      );
    }

    if (role.isSystemRole) {
      throw new AppError(
        ErrorCodes.ACCESS_DENIED,
        "Cannot modify system roles",
        403
      );
    }

    const oldPermissions = role.permissions as Permission[];

    await prisma.role.update({
      where: { id: role.id },
      data: {
        permissions,
        updatedAt: new Date(),
      },
    });

    await AuditService.log({
      userId: updatedBy,
      action: AuditAction.USER_UPDATED, // Using USER_UPDATED as closest match
      resource: "role",
      resourceId: role.id,
      success: true,
      oldValues: { permissions: oldPermissions },
      newValues: { permissions },
      ...requestInfo,
    });
  }

  // Get all roles
  static async getAllRoles(): Promise<any[]> {
    return await prisma.role.findMany({
      orderBy: { name: "asc" },
    });
  }

  // Get role by name
  static async getRoleByName(name: string): Promise<any | null> {
    return await prisma.role.findUnique({
      where: { name },
    });
  }

  // Get user's roles
  static async getUserRoles(userId: string): Promise<any[]> {
    return await prisma.userRoleAssignment.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      include: {
        role: true,
      },
      orderBy: { grantedAt: "asc" },
    });
  }

  // Check if user has specific role
  static async userHasRole(userId: string, roleName: string): Promise<boolean> {
    const userRole = await prisma.userRoleAssignment.findFirst({
      where: {
        userId,
        revokedAt: null,
        role: {
          name: roleName,
        },
      },
    });

    return !!userRole;
  }

  // Get users with specific role
  static async getUsersWithRole(roleName: string): Promise<any[]> {
    return await prisma.userRoleAssignment.findMany({
      where: {
        revokedAt: null,
        role: {
          name: roleName,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
          },
        },
      },
    });
  }

  // Bulk assign roles to users
  static async bulkAssignRoles(
    assignments: Array<{ userId: string; roleName: Role }>,
    grantedBy: string,
    requestInfo: any
  ): Promise<void> {
    for (const assignment of assignments) {
      try {
        await this.assignRole(
          assignment.userId,
          assignment.roleName,
          grantedBy,
          requestInfo
        );
      } catch (error) {
        logger.error(
          `Failed to assign role ${assignment.roleName} to user ${assignment.userId}:`,
          error
        );
      }
    }
  }

  // Get role statistics
  static async getRoleStatistics(): Promise<RoleStatistics[]> {
    try {
      const roleStats = await prisma.role.findMany({
        include: {
          _count: {
            select: {
              userRoles: {
                where: {
                  revokedAt: null,
                },
              },
            },
          },
        },
      });

      return roleStats.map((role) => ({
        name: role.name,
        description: role.description,
        isSystemRole: role.isSystemRole,
        userCount: role._count.userRoles,
        permissions: role.permissions,
      }));
    } catch (error) {
      logger.error("Failed to get role statistics:", error);
      throw new AppError(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        "Failed to retrieve role statistics",
        500
      );
    }
  }

  // Validate role permissions
  static validateRolePermissions(permissions: Permission[]): {
    valid: boolean;
    errors: string[];
  } {
    const validPermissions = Object.values(Permission);
    const errors: string[] = [];

    for (const permission of permissions) {
      if (!validPermissions.includes(permission)) {
        errors.push(`Invalid permission: ${permission}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Get recommended permissions for role type
  static getRecommendedPermissions(
    roleType: "healthcare" | "administrative" | "patient"
  ): Permission[] {
    switch (roleType) {
      case "healthcare":
        return [
          Permission.PATIENT_READ_ALL,
          Permission.PATIENT_READ_ASSIGNED,
          Permission.RECORD_CREATE,
          Permission.RECORD_READ_ALL,
          Permission.RECORD_READ_ASSIGNED,
          Permission.RECORD_UPDATE,
          Permission.APPOINTMENT_CREATE,
          Permission.APPOINTMENT_READ_ALL,
          Permission.APPOINTMENT_READ_ASSIGNED,
          Permission.APPOINTMENT_UPDATE,
        ];
      case "administrative":
        return [
          Permission.USER_READ_ALL,
          Permission.USER_UPDATE_ALL,
          Permission.PATIENT_READ_ALL,
          Permission.PATIENT_UPDATE_ALL,
          Permission.AUDIT_READ,
          Permission.SYSTEM_CONFIG,
        ];
      case "patient":
        return [
          Permission.USER_READ_OWN,
          Permission.USER_UPDATE_OWN,
          Permission.PATIENT_READ_OWN,
          Permission.RECORD_READ_OWN,
          Permission.APPOINTMENT_READ_OWN,
          Permission.GDPR_EXPORT,
          Permission.GDPR_DELETE,
        ];
      default:
        return [];
    }
  }
}
