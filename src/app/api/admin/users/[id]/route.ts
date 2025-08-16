import { NextRequest, NextResponse } from "next/server";
import { verifyAccessTokenFromRequest } from "../../../../../lib/auth";
import { hasPermission } from "../../../../../lib/permissions";
import { Permission } from "../../../../../types/auth";
import prisma from "../../../../../lib/db";
import logger from "../../../../../lib/logger";
import { AuditService, AuditAction } from "../../../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../../../utils/appRouterHelpers";

// GET specific user details (Super Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Check if user has permission to view users
    if (
      !hasPermission(user.permissions as Permission[], Permission.USER_READ_ALL)
    ) {
      return NextResponse.json(
        { error: "Forbidden", message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id: userId } = await params;

    // Get user with all related data
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        // Include related data
        patients: {
          select: {
            id: true,
            status: true,
            assignedProviderId: true,
            dateOfBirth: true,
            gender: true,
            // Note: Encrypted fields like phoneEncrypted, addressStreetEncrypted are handled by the existing encryption system
          },
        },
        // Include role assignments
        userRoles: {
          select: {
            id: true,
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
            grantedBy: true,
            grantedAt: true,
            revokedAt: true,
          },
        },
        // Include audit logs
        auditLogs: {
          select: {
            id: true,
            action: true,
            resource: true,
            resourceId: true,
            success: true,
            timestamp: true,
            changes: true,
          },
          orderBy: { timestamp: "desc" },
          take: 10,
        },
      },
    });

    if (!userData) {
      return NextResponse.json(
        { error: "Not Found", message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(userData);
  } catch (error) {
    logger.error("Get user error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to retrieve user",
      },
      { status: 500 }
    );
  }
}

// PUT update user (Super Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Check if user has permission to update users
    if (
      !hasPermission(
        user.permissions as Permission[],
        Permission.USER_UPDATE_ALL
      )
    ) {
      return NextResponse.json(
        { error: "Forbidden", message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id: userId } = await params;
    const body = await request.json();
    const {
      firstName,
      lastName,
      isActive,
      role,
      specialty,
      medicalLicenseNumber,
      department,
      licenseNumber,
      dateOfBirth,
      gender,
      phoneNumber,
      address,
      yearsOfExperience,
      education,
      certifications,
    } = body;

    const requestInfo = extractRequestInfoFromRequest(request);

    // Update user with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          firstName,
          lastName,
          isActive,
          role,
        },
      });

      // Update role-specific fields directly on user
      if (role === "DOCTOR" && specialty && medicalLicenseNumber) {
        await tx.user.update({
          where: { id: userId },
          data: {
            specialty,
            medicalLicenseNumber,
            verificationStatus: "VERIFIED" as const,
          },
        });
      } else if (role === "PATIENT") {
        await tx.patient.upsert({
          where: { userId },
          update: {
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            gender: gender || undefined,
            // Note: Encrypted fields like phoneEncrypted, addressStreetEncrypted are handled by the existing encryption system
          },
          create: {
            userId,
            firstName,
            lastName,
            email: updatedUser.email,
            status: "ACTIVE",
            gender: gender || "OTHER",
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
            // Note: Encrypted fields like phoneEncrypted, addressStreetEncrypted are handled by the existing encryption system
          },
        });
      }

      return updatedUser;
    });

    // Log user update
    await AuditService.log({
      userId: user.userId,
      action: AuditAction.USER_UPDATED,
      resource: "user",
      resourceId: result.id,
      success: true,
      changes: {
        firstName: result.firstName,
        lastName: result.lastName,
        isActive: result.isActive,
        role: result.role,
        updatedBy: user.userId,
      },
      ...requestInfo,
    });

    return NextResponse.json({
      message: "User updated successfully",
      user: {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
        role: result.role,
        isActive: result.isActive,
      },
    });
  } catch (error) {
    logger.error("Update user error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to update user",
      },
      { status: 500 }
    );
  }
}

// DELETE user (Super Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Check if user has permission to delete users
    if (
      !hasPermission(user.permissions as Permission[], Permission.USER_DELETE)
    ) {
      return NextResponse.json(
        { error: "Forbidden", message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { id: userId } = await params;
    const body = await request.json();
    const { reason } = body;

    const requestInfo = extractRequestInfoFromRequest(request);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "Not Found", message: "User not found" },
        { status: 404 }
      );
    }

    // Prevent super admin from deleting themselves
    if (userId === user.userId) {
      return NextResponse.json(
        { error: "Bad Request", message: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete user with transaction (cascade delete related records)
    await prisma.$transaction(async (tx) => {
      // Delete role-specific records first
      if (existingUser.role === "PATIENT") {
        await tx.patient.deleteMany({ where: { userId } });
      }

      // Delete user roles
      await tx.userRoleAssignment.deleteMany({ where: { userId } });

      // Delete audit logs
      await tx.auditLog.deleteMany({ where: { userId } });

      // Delete user sessions
      await tx.userSession.deleteMany({ where: { userId } });

      // Finally delete the user
      await tx.user.delete({ where: { id: userId } });
    });

    // Log user deletion
    await AuditService.log({
      userId: user.userId,
      action: AuditAction.DATA_DELETED,
      resource: "user",
      resourceId: userId,
      success: true,
      changes: {
        deletedUser: existingUser.email,
        deletedBy: user.userId,
        reason,
      },
      ...requestInfo,
    });

    return NextResponse.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    logger.error("Delete user error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to delete user",
      },
      { status: 500 }
    );
  }
}
