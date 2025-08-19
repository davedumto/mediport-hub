import { NextRequest, NextResponse } from "next/server";
import { verifyAccessTokenFromRequest } from "../../../../lib/auth";
import prisma from "../../../../lib/db";
import logger from "../../../../lib/logger";
import { AuditService, AuditAction } from "../../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";

// GET all users (Super Admin only)
export async function GET(request: NextRequest) {
  try {
    console.log("Debug - Superadmin users API called");
    console.log("Debug - Request URL:", request.url);
    console.log(
      "Debug - Request headers:",
      Object.fromEntries(request.headers.entries())
    );

    // Verify authentication and get user info
    const authResult = await verifyAccessTokenFromRequest(request);
    console.log("Debug - Auth result:", JSON.stringify(authResult, null, 2));

    if (!authResult.success) {
      console.log("Debug - Auth failed:", authResult.message);
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid or missing token" },
        { status: 401 }
      );
    }

    const { user } = authResult;
    console.log("Debug - User object received:", JSON.stringify(user, null, 2));

    // Check if user has SUPER_ADMIN role
    const isSuperAdmin = user.role === "SUPER_ADMIN";

    console.log("Debug - User role:", user.role);
    console.log("Debug - Is Super Admin:", isSuperAdmin);

    // Allow super admin access
    if (!isSuperAdmin) {
      console.log("Debug - Access denied, user is not super admin");

      await AuditService.log({
        userId: user.userId,
        userEmail: user.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "superadmin_users",
        success: false,
        errorMessage: "Super admin access required",
        ...extractRequestInfoFromRequest(request),
      });

      return NextResponse.json(
        { error: "Forbidden", message: "Super admin access required" },
        { status: 403 }
      );
    }

    console.log("Debug - Access granted, proceeding with user fetch");

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: {
      role?: string;
      isActive?: boolean;
      email?: { contains: string };
    } = {};

    if (role) where.role = role;
    if (status) where.isActive = status === "active";

    // Add search functionality
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    console.log("Debug - Building database query with filters:", {
      role,
      status,
      search,
      page,
      limit,
    });

    // Get users with pagination and role information
    let users, totalUsers;
    try {
      // If requesting patients, fetch from patients table instead of users table
      if (role === "PATIENT") {
        console.log("Debug - Fetching patients from patients table");

        [users, totalUsers] = await Promise.all([
          prisma.patient.findMany({
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              dateOfBirth: true,
              gender: true,
              bloodType: true,
              status: true,
              createdAt: true,
              updatedAt: true,
              assignedProviderId: true,
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          }),
          prisma.patient.count(),
        ]);

        // Transform patient data to match user format
        users = users.map((patient) => ({
          id: patient.id,
          email: patient.email,
          firstName: patient.firstName,
          lastName: patient.lastName,
          role: "PATIENT", // Add role field for consistency
          isActive: patient.status === "ACTIVE",
          emailVerified: true, // Patients are verified by default
          mfaEnabled: false, // Patients don't have MFA
          createdAt: patient.createdAt,
          updatedAt: patient.updatedAt,
          lastLogin: null, // Patients don't have login tracking
          // Add patient-specific fields
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          bloodType: patient.bloodType,
          status: patient.status,
          assignedProviderId: patient.assignedProviderId,
        }));
      } else {
        // For non-patient roles, fetch from users table as before
        const whereClause = role ? { role } : {};

        console.log("Debug - Using where clause:", whereClause);

        [users, totalUsers] = await Promise.all([
          prisma.user.findMany({
            where: whereClause,
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              specialty: true,
              isActive: true,
              emailVerified: true,
              mfaEnabled: true,
              createdAt: true,
              updatedAt: true,
              lastLogin: true,
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
          }),
          prisma.user.count({ where: whereClause }),
        ]);
      }

      console.log(
        "Debug - Database query successful, found",
        users.length,
        "users/patients"
      );
    } catch (dbError) {
      console.error("Debug - Database query failed:", dbError);
      return NextResponse.json(
        {
          error: "Database Error",
          message: "Failed to fetch users from database",
          details: dbError instanceof Error ? dbError.message : "Unknown error",
        },
        { status: 500 }
      );
    }

    // Simplified statistics - just count total users
    console.log("Debug - Skipping complex statistics queries for now");

    // Simplified response to isolate the issue
    const response = {
      success: true,
      data: {
        users: users.map((user) => ({
          id: user.id,
          email: user.email.replace(/(.{2}).*@/, "$1***@"),
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          specialty: user.specialty,
          isActive: user.isActive,
          emailVerified: user.emailVerified,
          mfaEnabled: user.mfaEnabled,
          fullName: `${user.firstName} ${user.lastName}`,
        })),
        pagination: {
          page,
          limit,
          total: totalUsers,
          totalPages: Math.ceil(totalUsers / limit),
        },
        statistics: {
          totalUsers,
        },
      },
    };

    // Log successful access
    await AuditService.log({
      userId: user.userId,
      userEmail: user.email,
      action: AuditAction.DATA_ACCESSED,
      resource: "superadmin_users",
      success: true,
      metadata: {
        filters: { role, status, search, page, limit },
        resultCount: users.length,
        totalCount: totalUsers,
      },
      ...extractRequestInfoFromRequest(request),
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Super admin get users error:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to retrieve users",
        details:
          error instanceof Error ? [error.message] : ["Unknown error occurred"],
      },
      { status: 500 }
    );
  }
}
