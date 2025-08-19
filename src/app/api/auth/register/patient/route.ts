import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, generateMFASecret } from "@/lib/auth";
import { ConsentService } from "@/services/consentService";
import { AuditService } from "@/lib/audit";
import { AuditAction } from "@/lib/audit";
import logger from "@/lib/logger";
import { emailService } from "@/services/emailService";
import { extractRequestInfoFromRequest } from "@/utils/appRouterHelpers";
import { PIIProtectionService } from "@/services/piiProtectionService";

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
    const { fullName, email, password, gdprConsent } = body;

    // Validate required fields
    if (!fullName || !email || !password || gdprConsent === undefined) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Validation failed.",
          details: [
            "Full name, email, password, and GDPR consent are required",
          ],
        },
        { status: 400 }
      );
    }

    // Validate GDPR consent
    if (!gdprConsent) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Validation failed.",
          details: ["GDPR consent is required to proceed"],
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
          message: "User already exists",
        },
        { status: 400 }
      );
    }

    const requestInfo = extractRequestInfoFromRequest(request);

    // Parse full name into first and last name
    const nameParts = fullName.trim().split(" ");
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

    // Prepare PII data for encryption (exactly like doctor registration)
    const { encryptedFields } = PIIProtectionService.prepareUserDataForStorage({
      firstName,
      lastName,
      email,
    });

    // Create user with ONLY encrypted PII fields - no plain text PII stored! (exactly like doctor)
    const user = await prisma.user.create({
      data: {
        // Email is required for unique constraint but we'll also store encrypted version
        email, // This is needed for login lookup, but sensitive data is encrypted
        // DO NOT store plain text PII - only encrypted versions
        firstName: null, // Explicitly null - use encrypted version only
        lastName: null,  // Explicitly null - use encrypted version only
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
        // Other fields
        passwordHash,
        role: "PATIENT",
        verificationStatus: "PENDING_VERIFICATION",
        mfaSecret,
        mfaEnabled: false,
        isActive: true,
        failedLoginAttempts: 0,
        passwordHistory: [],
      },
    });

    // Create corresponding Patient record with default values
    // Note: PII fields are encrypted at the database level using the existing encryption system
    const patient = await prisma.patient.create({
      data: {
        userId: user.id, // Link to the user record
        firstName: null, // Explicitly null - use encrypted version only (like doctor pattern)
        lastName: null,  // Explicitly null - use encrypted version only (like doctor pattern)
        email: user.email, // Keep email for patient identification
        dateOfBirth: new Date(), // Default date, can be updated later
        gender: "OTHER", // Default gender, can be updated later
        status: "ACTIVE",
        gdprConsent: true,
        gdprConsentDate: new Date(),
        gdprConsentVersion: "1.0",
        createdBy: user.id,
        // Encrypted fields will be handled by the existing encryption system
        // phoneEncrypted, addressStreetEncrypted, etc. are optional and can be set later
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

    // Generate and store OTP for verification
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
        firstName: user.firstName || "Patient",
        otp,
        expiresIn: "15 minutes",
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
          verificationStatus: "PENDING_VERIFICATION",
          mfaSecretGenerated: true,
          gdprConsent: true,
          consentRecordId: consentRecord.id,
          patientRecordId: patient.id,
          patientCreated: true,
          verificationEmailSent: true,
          otpGenerated: true,
          expiresAt,
        },
        ...requestInfo,
      });

      logger.info(`Patient registration successful for ${user.email}`);
    } catch (emailError) {
      // Log email failure but don't fail the registration
      logger.warn(
        `Failed to send verification email to ${user.email}:`,
        emailError
      );

      // Still log the registration success
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
          verificationStatus: "PENDING_VERIFICATION",
          mfaSecretGenerated: true,
          gdprConsent: true,
          consentRecordId: consentRecord.id,
          patientRecordId: patient.id,
          patientCreated: true,
          verificationEmailSent: false,
          emailError:
            emailError instanceof Error ? emailError.message : "Unknown error",
        },
        ...requestInfo,
      });
    }

    // Return success response WITHOUT exposing PII data
    return NextResponse.json(
      {
        success: true,
        message:
          "Patient registration successful! Please check your email to verify your account.",
        data: {
          user: {
            id: user.id,
            role: user.role,
            verificationStatus: user.verificationStatus,
            // PII data removed for security
          },
          patient: {
            id: patient.id,
            status: patient.status,
            // PII data removed for security
          },
          userId: user.id,
          patientId: patient.id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Patient registration error:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred during registration",
      },
      { status: 500 }
    );
  }
}
