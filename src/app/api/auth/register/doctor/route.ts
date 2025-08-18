import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, generateMFASecret } from "@/lib/auth";
import { ConsentService } from "@/services/consentService";
import { AuditService } from "@/lib/audit";
import { AuditAction } from "@/lib/audit";
import logger from "@/lib/logger";
import { emailService } from "@/services/emailService";
import { extractRequestInfoFromRequest } from "@/utils/appRouterHelpers";
import { AppError, ErrorCodes } from "@/utils/errors";
import { PIIProtectionService } from "@/services/piiProtectionService";
import crypto from "crypto";

const doctorRegisterSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  specialty: z.string().min(1, "Specialty is required"),
  medicalLicenseNumber: z.string().min(1, "Medical license number is required"),
  gdprConsent: z
    .boolean()
    .refine((val) => val === true, "GDPR consent is required"),
});

export async function POST(request: NextRequest) {
  try {
    // Initialize PII protection service with encryption key
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      logger.error("Encryption key not configured");
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "System configuration error",
        },
        { status: 500 }
      );
    }
    PIIProtectionService.initialize(encryptionKey);

    const body = await request.json();
    const {
      fullName,
      email,
      password,
      specialty,
      medicalLicenseNumber,
      gdprConsent,
    } = body;

    // Validate required fields
    if (
      !fullName ||
      !email ||
      !password ||
      !specialty ||
      !medicalLicenseNumber ||
      gdprConsent === undefined
    ) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        "All fields are required",
        400,
        [
          "Full name, email, password, specialty, medical license number, and GDPR consent are required",
        ]
      );
    }

    // Validate GDPR consent
    if (!gdprConsent) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        "GDPR consent is required to proceed",
        400,
        ["GDPR consent is required"]
      );
    }

    // Validate PII data before encryption
    const piiValidation = PIIProtectionService.validatePIIData({
      firstName: fullName.split(" ")[0],
      lastName:
        fullName.split(" ").slice(1).join(" ") || fullName.split(" ")[0],
      email,
      specialty,
      medicalLicenseNumber,
    });

    if (!piiValidation.isValid) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        "Invalid PII data",
        400,
        piiValidation.errors
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError(
        ErrorCodes.VALIDATION_ERROR,
        "User with this email already exists",
        400,
        ["Email is already registered"]
      );
    }

    // Extract request information for audit logging
    const requestInfo = extractRequestInfoFromRequest(request);

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate MFA secret
    const mfaSecret = generateMFASecret();

    // Prepare PII data for encryption
    const firstName = fullName.split(" ")[0];
    const lastName =
      fullName.split(" ").slice(1).join(" ") || fullName.split(" ")[0];

    const { encryptedFields, safeFields } =
      PIIProtectionService.prepareUserDataForStorage({
        firstName,
        lastName,
        email,
        specialty,
        medicalLicenseNumber,
      });

    // Create user with ONLY encrypted PII fields - no plain text PII stored!
    const user = await prisma.user.create({
      data: {
        // Email is required for unique constraint but we'll also store encrypted version
        email,  // This is needed for login lookup, but sensitive data is encrypted
        // DO NOT store plain text PII - only encrypted versions
        firstName: null,  // Explicitly null - use encrypted version only
        lastName: null,   // Explicitly null - use encrypted version only
        specialty: null,  // Explicitly null - use encrypted version only
        medicalLicenseNumber: null, // Explicitly null - use encrypted version only
        // Store encrypted PII fields - this is the ONLY place PII is stored
        firstNameEncrypted: Buffer.from(
          JSON.stringify(encryptedFields.firstName || {}),
          "utf8"
        ),
        lastNameEncrypted: Buffer.from(
          JSON.stringify(encryptedFields.lastName || {}),
          "utf8"
        ),
        emailEncrypted: Buffer.from(
          JSON.stringify(encryptedFields.email || {}),
          "utf8"
        ),
        specialtyEncrypted: Buffer.from(
          JSON.stringify(encryptedFields.specialty || {}),
          "utf8"
        ),
        medicalLicenseNumberEncrypted: Buffer.from(
          JSON.stringify(encryptedFields.medicalLicenseNumber || {}),
          "utf8"
        ),
        // Store safe fields
        ...safeFields,
        passwordHash: hashedPassword,
        role: "DOCTOR",
        verificationStatus: "PENDING_VERIFICATION",
        mfaSecret,
        mfaEnabled: false,
        isActive: true,
        failedLoginAttempts: 0,
        passwordHistory: [],
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

    // Send verification email
    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store OTP in database
      await prisma.verificationCode.create({
        data: {
          userId: user.id,
          code: otp,
          type: "EMAIL_VERIFICATION",
          expiresAt,
          isUsed: false,
        },
      });

      // Send verification email
      await emailService.sendVerificationEmail({
        email: user.email,
        firstName: user.firstName || "Doctor",
        otp,
        expiresIn: "15 minutes",
      });

      // Log the action
      await AuditService.log({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: AuditAction.DATA_CREATED,
        resource: "User",
        resourceId: user.id,
        success: true,
        changes: {
          action: "Doctor registration",
          email: PIIProtectionService.prepareUserDataForResponse(
            { email: user.email },
            true
          ).email,
          specialty: PIIProtectionService.prepareUserDataForResponse(
            { specialty: user.specialty },
            true
          ).specialty,
          medicalLicenseNumber: PIIProtectionService.prepareUserDataForResponse(
            { medicalLicenseNumber: user.medicalLicenseNumber },
            true
          ).medicalLicenseNumber,
          verificationEmailSent: true,
          otpGenerated: true,
          expiresAt,
        },
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        requestId: requestInfo.requestId || crypto.randomUUID(),
      });

      logger.info(
        `Doctor registration successful for ${
          PIIProtectionService.prepareUserDataForResponse(
            { email: user.email },
            true
          ).email
        }`
      );
    } catch (emailError) {
      // Log email failure but don't fail the registration
      logger.warn(
        `Failed to send verification email to ${
          PIIProtectionService.prepareUserDataForResponse(
            { email: user.email },
            true
          ).email
        }:`,
        emailError
      );
    }

    // Return success response with safe data
    const safeUserData = PIIProtectionService.prepareUserDataForResponse(
      user,
      false
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Doctor registration successful! Please check your email to verify your account.",
        data: {
          userId: safeUserData.id,
          role: safeUserData.role,
          verificationStatus: safeUserData.verificationStatus,
          // No PII data returned for security
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Doctor registration error:", error);

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
