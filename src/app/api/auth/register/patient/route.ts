import { NextRequest, NextResponse } from "next/server";
import { hashPassword, generateMFASecret } from "../../../../../lib/auth";
import { ConsentService } from "../../../../../services/consentService";
import { AuditService, AuditAction } from "../../../../../lib/audit";
import prisma from "../../../../../lib/db";
import logger from "../../../../../lib/logger";
import { AppError } from "../../../../../utils/errors";
import { extractRequestInfoFromRequest } from "../../../../../utils/appRouterHelpers";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { fullName, email, password, gdprConsent } = body;

    // Simple validation
    if (!fullName || !email || !password || gdprConsent !== true) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Validation failed.",
          details: ["Missing required fields"],
        },
        { status: 400 }
      );
    }

    // Extract request info for audit
    const requestInfo = extractRequestInfoFromRequest(request);

    // Verify GDPR consent is explicitly given
    if (!gdprConsent) {
      await AuditService.log({
        userEmail: email,
        action: AuditAction.REGISTRATION_FAILED,
        resource: "user",
        success: false,
        errorMessage: "GDPR consent not provided",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Validation failed.",
          details: ["GDPR consent is required to register"],
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      await AuditService.log({
        userEmail: email,
        action: AuditAction.REGISTRATION_FAILED,
        resource: "user",
        success: false,
        errorMessage: "User already exists",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Validation failed.",
          details: ["User with this email already exists"],
        },
        { status: 400 }
      );
    }

    // Parse full name into first and last name
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    if (!firstName || !lastName) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Validation failed.",
          details: ["Full name must include both first and last name"],
        },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate MFA secret
    const mfaSecret = generateMFASecret();

    // Create user with PATIENT role
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: "PATIENT",
        verificationStatus: "VERIFIED",
        mfaSecret,
        mfaEnabled: false,
        isActive: true,
        failedLoginAttempts: 0,
        passwordHistory: [],
      },
    });

    // Create corresponding Patient record
    const patient = await prisma.patient.create({
      data: {
        userId: user.id, // Link to the user record
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        dateOfBirth: new Date(), // Default date, can be updated later
        gender: "OTHER", // Default gender, can be updated later
        status: "ACTIVE",
        gdprConsent: true,
        gdprConsentDate: new Date(),
        gdprConsentVersion: "1.0",
        createdBy: user.id,
      },
    });

    // Create GDPR consent record
    const consentRecord = await prisma.consentRecord.create({
      data: {
        userId: user.id,
        consentType: "DATA_PROCESSING",
        purpose: "User registration and account management",
        granted: true,
        consentText: ConsentService.getDefaultDataProcessingConsent().text,
        consentVersion:
          ConsentService.getDefaultDataProcessingConsent().version,
        legalBasis: ConsentService.getDefaultDataProcessingConsent().legalBasis,
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        grantedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      },
    });

    // Log successful registration
    await AuditService.log({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: AuditAction.REGISTRATION_SUCCESS,
      resource: "user",
      resourceId: user.id,
      success: true,
      changes: {
        email,
        firstName,
        lastName,
        role: "PATIENT",
        verificationStatus: "VERIFIED",
        mfaSecretGenerated: true,
        gdprConsent: true,
        consentRecordId: consentRecord.id,
        patientRecordId: patient.id,
        patientCreated: true,
      },
      ...requestInfo,
    });

    // Return success response matching the API specification
    return NextResponse.json(
      {
        success: true,
        message:
          "Patient registration successful. Please check your email to verify your account.",
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          },
          patient: {
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            email: patient.email,
            status: patient.status,
          },
          userId: user.id,
          patientId: patient.id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Patient registration error:", error);

    if (error instanceof AppError) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: error.message,
          details: error.details || [],
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
        details: ["Please try again later"],
      },
      { status: 500 }
    );
  }
}
