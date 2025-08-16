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
    const { id: userId } = await params;

    // Verify authentication and get user info
    const authResult = await verifyAccessTokenFromRequest(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid or missing token" },
        { status: 401 }
      );
    }

    const { user } = authResult;

    // Check if user has SUPER_ADMIN role or USER_READ_ALL permission
    if (
      user.role !== "SUPER_ADMIN" &&
      !hasPermission(user.permissions, Permission.USER_READ_ALL)
    ) {
      await AuditService.log({
        userId: user.userId,
        userEmail: user.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: "superadmin_user_details",
        resourceId: userId,
        success: false,
        errorMessage: "Insufficient permissions to access user details",
        ...extractRequestInfoFromRequest(request),
      });

      return NextResponse.json(
        { error: "Forbidden", message: "Super admin access required" },
        { status: 403 }
      );
    }

    // Get user details with comprehensive information
    let userDetails;

    // First try to find in users table
    userDetails = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        dateOfBirth: true,
        isActive: true,
        emailVerified: true,
        mfaEnabled: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        // Include role assignments
        userRoles: {
          where: { revokedAt: null },
          select: {
            id: true,
            grantedAt: true,
            grantedBy: true,
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                permissions: true,
                isSystemRole: true,
              },
            },
          },
        },
        // Include related data based on role
        patients: {
          select: {
            id: true,
            status: true,
            assignedProviderId: true,
            dateOfBirth: true,
            gender: true,
            bloodType: true,
            allergies: true,
            chronicConditions: true,
            currentMedications: true,
            gdprConsent: true,
            gdprConsentDate: true,
            gdprConsentVersion: true,
          },
        },
        consentRecords: {
          where: { granted: true },
          select: {
            id: true,
            consentType: true,
            purpose: true,
            grantedAt: true,
            expiresAt: true,
            consentVersion: true,
          },
          orderBy: { grantedAt: "desc" },
        },
        auditLogs: {
          select: {
            id: true,
            action: true,
            resource: true,
            timestamp: true,
            success: true,
            ipAddress: true,
          },
          orderBy: { timestamp: "desc" },
          take: 10,
        },
      },
    });

    // If not found in users table, try patients table
    if (!userDetails) {
      console.log("Debug - User not found, checking patients table");

      const patientDetails = await prisma.patient.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          bloodType: true,
          status: true,
          phoneEncrypted: true,
          addressStreetEncrypted: true,
          addressCityEncrypted: true,
          addressStateEncrypted: true,
          addressZipEncrypted: true,
          addressCountryEncrypted: true,
          emergencyNameEncrypted: true,
          emergencyRelationshipEncrypted: true,
          emergencyPhoneEncrypted: true,
          allergies: true,
          chronicConditions: true,
          currentMedications: true,
          assignedProviderId: true,
          gdprConsent: true,
          gdprConsentDate: true,
          gdprConsentVersion: true,
          createdAt: true,
          updatedAt: true,
          createdBy: true,
          updatedBy: true,
        },
      });

      if (patientDetails) {
        // Transform patient data to match user format
        userDetails = {
          ...patientDetails,
          role: "PATIENT",
          isActive: patientDetails.status === "ACTIVE",
          emailVerified: true,
          mfaEnabled: false,
          lastLogin: null,
          failedLoginAttempts: 0,
          lockedUntil: null,
          userRoles: [], // Patients don't have role assignments
          patients: null, // Patients don't have nested patients
          consentRecords: [], // Will be populated separately if needed
          auditLogs: [], // Will be populated separately if needed
        };
      }
    }

    if (!userDetails) {
      return NextResponse.json(
        { error: "Not Found", message: "User or patient not found" },
        { status: 404 }
      );
    }

    // Mask sensitive PII data for display
    const maskedUserDetails = {
      ...userDetails,
      // Mask email for display (show first 2 characters)
      email: userDetails.email.replace(/(.{2}).*@/, "$1***@"),
      // Mask phone if exists
      phone: userDetails.phone
        ? userDetails.phone.replace(
            /(\+\d{1,3})(\d{3})(\d{3})(\d{4})/,
            "$1-$2-***-$4"
          )
        : null,
      // Format date of birth
      dateOfBirth: userDetails.dateOfBirth
        ? new Date(userDetails.dateOfBirth).toLocaleDateString()
        : null,
      // Add computed fields
      fullName: `${userDetails.firstName} ${userDetails.lastName}`,
      isVerified: userDetails.emailVerified,
      hasMFA: userDetails.mfaEnabled,
      isLocked: userDetails.lockedUntil && userDetails.lockedUntil > new Date(),
      lastLoginFormatted: userDetails.lastLogin
        ? new Date(userDetails.lastLogin).toLocaleDateString()
        : "Never",
      createdAtFormatted: new Date(userDetails.createdAt).toLocaleDateString(),
      updatedAtFormatted: new Date(userDetails.updatedAt).toLocaleDateString(),
      // Add role summary
      primaryRole: userDetails.role,
      assignedRoles: userDetails.userRoles.map((ur) => ur.role.name),
      totalRoles: userDetails.userRoles.length,
      // Add patient summary if applicable
      patientSummary: userDetails.patients
        ? {
            status: userDetails.patients.status,
            hasConsent: userDetails.patients.gdprConsent,
            consentDate: userDetails.patients.gdprConsentDate
              ? new Date(
                  userDetails.patients.gdprConsentDate
                ).toLocaleDateString()
              : null,
            medicalConditions:
              userDetails.patients.chronicConditions?.length || 0,
            allergies: userDetails.patients.allergies?.length || 0,
            medications: userDetails.patients.currentMedications?.length || 0,
          }
        : null,
      // Add consent summary
      consentSummary: {
        totalConsents: userDetails.consentRecords.length,
        activeConsents: userDetails.consentRecords.filter(
          (c) => !c.expiresAt || c.expiresAt > new Date()
        ).length,
        latestConsent: userDetails.consentRecords[0]
          ? new Date(
              userDetails.consentRecords[0].grantedAt
            ).toLocaleDateString()
          : null,
      },
      // Add activity summary
      activitySummary: {
        totalActions: userDetails.auditLogs.length,
        successfulActions: userDetails.auditLogs.filter((a) => a.success)
          .length,
        lastAction: userDetails.auditLogs[0]
          ? new Date(userDetails.auditLogs[0].timestamp).toLocaleDateString()
          : null,
      },
    };

    const response = {
      success: true,
      data: maskedUserDetails,
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
      resource: "superadmin_user_details",
      resourceId: userId,
      success: true,
      metadata: {
        targetUserId: userId,
        targetUserRole: userDetails.role,
      },
      ...extractRequestInfoFromRequest(request),
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Super admin get user details error:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to retrieve user details",
        details:
          error instanceof Error ? [error.message] : ["Unknown error occurred"],
      },
      { status: 500 }
    );
  }
}
