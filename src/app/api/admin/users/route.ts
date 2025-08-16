import { NextRequest, NextResponse } from "next/server";
import { verifyAccessTokenFromRequest } from "../../../../lib/auth";
import { hasPermission } from "../../../../lib/permissions";
import { Permission } from "../../../../types/auth";
import prisma from "../../../../lib/db";
import logger from "../../../../lib/logger";
import { AuditService, AuditAction } from "../../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";
import bcrypt from "bcrypt";

// GET all users (Super Admin only)
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

    // Check if user has permission to view all users
    if (
      !hasPermission(user.permissions as Permission[], Permission.USER_READ_ALL)
    ) {
      return NextResponse.json(
        { error: "Forbidden", message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (role) where.role = role;
    if (status) where.isActive = status === "active";

    // Get users with pagination
    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where,
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
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Get role statistics
    const roleStats = await prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    });

    const response = {
      users,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
      statistics: {
        totalUsers,
        roleDistribution: roleStats.reduce((acc, stat) => {
          acc[stat.role] = stat._count.role;
          return acc;
        }, {} as Record<string, number>),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Get users error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to retrieve users",
      },
      { status: 500 }
    );
  }
}

// POST create new user (Super Admin only)
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

    // Check if user has permission to create users
    if (
      !hasPermission(user.permissions as Permission[], Permission.USER_CREATE)
    ) {
      return NextResponse.json(
        { error: "Forbidden", message: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      email,
      firstName,
      lastName,
      role,
      password,
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

    // Validate required fields
    if (!email || !firstName || !lastName || !role || !password) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message:
            "Email, first name, last name, role, and password are required",
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "User with this email already exists",
        },
        { status: 400 }
      );
    }

    const requestInfo = extractRequestInfoFromRequest(request);

    // Create user with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the user
      const newUser = await tx.user.create({
        data: {
          email,
          firstName,
          lastName,
          role,
          passwordHash: await bcrypt.hash(password, 12),
          isActive: true,
        },
      });

      // Update user with role-specific fields
      if (role === "DOCTOR" && specialty && medicalLicenseNumber) {
        await tx.user.update({
          where: { id: newUser.id },
          data: {
            specialty,
            medicalLicenseNumber,
          },
        });
      } else if (role === "PATIENT") {
        await tx.patient.create({
          data: {
            userId: newUser.id,
            firstName,
            lastName,
            email,
            status: "ACTIVE",
            gender: gender || "OTHER",
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : new Date(),
            // Note: Encrypted fields like phoneEncrypted, addressStreetEncrypted are handled by the existing encryption system
          },
        });
      }

      return newUser;
    });

    // Log user creation
    await AuditService.log({
      userId: user.userId,
      action: AuditAction.USER_CREATED,
      resource: "user",
      resourceId: result.id,
      success: true,
      changes: {
        email: result.email,
        role: result.role,
        createdBy: user.userId,
      },
      ...requestInfo,
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: result.id,
          email: result.email,
          firstName: result.firstName,
          lastName: result.lastName,
          role: result.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Create user error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to create user",
      },
      { status: 500 }
    );
  }
}
