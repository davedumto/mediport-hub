import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "../../../../lib/auth";
import { AuditService } from "../../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";
import { PIIProtectionService } from "../../../../services/piiProtectionService";
import { ClientEncryptionService } from "../../../../services/clientEncryptionService";
import prisma from "../../../../lib/db";
import logger from "../../../../lib/logger";
import { CloudinaryService } from "../../../../services/cloudinaryService";
import { z } from "zod";

// Validation schema for profile update
const profileUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().regex(/^[\+]?[\d\s\-\(\)]{10,15}$/, "Invalid phone number").optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Initialize PII protection service
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

    // Verify authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Extract request info for audit
    const requestInfo = extractRequestInfoFromRequest(request);

    // Parse form data for potential file upload
    const formData = await request.formData();
    
    // Extract profile data
    const profileDataString = formData.get('profileData') as string;
    if (!profileDataString) {
      return NextResponse.json(
        { error: "Bad Request", message: "Profile data is required" },
        { status: 400 }
      );
    }

    let profileData;
    try {
      const parsedData = JSON.parse(profileDataString);
      
      // Check if the data contains encrypted payload
      if (parsedData.encryptedPayload && ClientEncryptionService.isEncryptedPayload(parsedData)) {
        console.log("🔓 Decrypting profile update payload...");
        try {
          const userAgent = request.headers.get('user-agent') || undefined;
          profileData = ClientEncryptionService.decryptPayload(
            parsedData.encryptedPayload,
            userAgent
          );
          console.log("✅ Successfully decrypted profile data");
        } catch (decryptError) {
          console.error("❌ Failed to decrypt profile payload:", decryptError);
          return NextResponse.json(
            {
              error: "Bad Request",
              message: "Invalid encrypted payload",
              details: ["Failed to decrypt profile data"],
            },
            { status: 400 }
          );
        }
      } else {
        // Legacy unencrypted data
        console.log("⚠️ Received unencrypted profile data (legacy mode)");
        profileData = parsedData;
      }
    } catch {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid profile data format" },
        { status: 400 }
      );
    }

    // Validate profile data
    const validationResult = profileUpdateSchema.safeParse(profileData);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation Error",
          message: "Invalid profile data",
          details: validationResult.error.errors.map(e => e.message),
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    // Handle avatar upload if present
    const avatarFile = formData.get('avatar') as File | null;
    let avatarUrl: string | null = null;
    let cloudinaryPublicId: string | null = null;

    if (avatarFile && avatarFile.size > 0) {
      // Validate file with Cloudinary service
      const bytes = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const validation = CloudinaryService.validateImageFile(buffer, avatarFile.name);
      if (!validation.valid) {
        return NextResponse.json(
          { 
            error: "Validation Error", 
            message: "Invalid image file",
            details: validation.errors
          },
          { status: 400 }
        );
      }

      // Check Cloudinary configuration
      if (!CloudinaryService.isConfigured()) {
        logger.error("Cloudinary not configured");
        return NextResponse.json(
          { error: "Internal Server Error", message: "Image upload service not configured" },
          { status: 500 }
        );
      }

      // Upload to Cloudinary
      try {
        const uploadResult = await CloudinaryService.uploadAvatar(buffer, payload.userId);
        
        if (!uploadResult.success) {
          logger.error("Cloudinary upload failed", { 
            error: uploadResult.error, 
            userId: payload.userId 
          });
          return NextResponse.json(
            { error: "Internal Server Error", message: "Failed to upload avatar" },
            { status: 500 }
          );
        }

        avatarUrl = uploadResult.secureUrl;
        cloudinaryPublicId = uploadResult.publicId;
        
        logger.info("Avatar uploaded to Cloudinary successfully", {
          userId: payload.userId,
          publicId: cloudinaryPublicId,
          secureUrl: avatarUrl,
          fileSize: avatarFile.size,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
        });
      } catch (error) {
        logger.error("Failed to upload avatar to Cloudinary", { error, userId: payload.userId });
        return NextResponse.json(
          { error: "Internal Server Error", message: "Failed to upload avatar" },
          { status: 500 }
        );
      }
    }

    // Get current user data for comparison and validation
    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        patients: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Not Found", message: "User not found" },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's already taken
    if (validatedData.email && validatedData.email !== currentUser.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (existingUser && existingUser.id !== payload.userId) {
        return NextResponse.json(
          { error: "Conflict", message: "Email address is already in use" },
          { status: 409 }
        );
      }
    }

    // Prepare encrypted data
    const encryptedUpdates: Record<string, Buffer | null> = {};
    const patientUpdates: Record<string, string | Date | boolean | Buffer | null> = {};

    // Encrypt PII fields
    if (validatedData.firstName) {
      const encryptedFirstName = PIIProtectionService.encryptField(validatedData.firstName);
      encryptedUpdates.firstNameEncrypted = Buffer.from(JSON.stringify(encryptedFirstName));
      encryptedUpdates.firstName = null; // Clear plaintext
    }

    if (validatedData.lastName) {
      const encryptedLastName = PIIProtectionService.encryptField(validatedData.lastName);
      encryptedUpdates.lastNameEncrypted = Buffer.from(JSON.stringify(encryptedLastName));
      encryptedUpdates.lastName = null; // Clear plaintext
    }

    if (validatedData.email) {
      const encryptedEmail = PIIProtectionService.encryptField(validatedData.email);
      encryptedUpdates.emailEncrypted = Buffer.from(JSON.stringify(encryptedEmail));
      encryptedUpdates.email = validatedData.email; // Keep email in plaintext for login
    }

    if (validatedData.phone) {
      const encryptedPhone = PIIProtectionService.encryptField(validatedData.phone);
      encryptedUpdates.phoneEncrypted = Buffer.from(JSON.stringify(encryptedPhone));
      encryptedUpdates.phone = null; // Clear plaintext
    }

    // Add avatar data if uploaded
    if (avatarUrl) {
      encryptedUpdates.avatarUrl = avatarUrl;
      encryptedUpdates.cloudinaryPublicId = cloudinaryPublicId;
    }

    // Update gender in patient record if user is a patient
    if (currentUser.patients && validatedData.gender) {
      patientUpdates.gender = validatedData.gender;
    }

    // Perform database updates in a transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update user record
      const user = await tx.user.update({
        where: { id: payload.userId },
        data: {
          ...encryptedUpdates,
          updatedAt: new Date(),
          updatedBy: payload.userId,
        },
      });

      // Update patient record if applicable
      if (currentUser.patients && Object.keys(patientUpdates).length > 0) {
        await tx.patient.update({
          where: { userId: payload.userId },
          data: {
            ...patientUpdates,
            updatedAt: new Date(),
            updatedBy: payload.userId,
          },
        });
      }

      return user;
    });

    // Prepare safe response data - return MASKED data, not decrypted
    // The client should fetch decrypted data separately if needed
    const responseData = {
      id: updatedUser.id,
      email: updatedUser.email, // Email can be shown as it's used for login
      firstName: "***", // Mask PII
      lastName: "***", // Mask PII  
      phone: updatedUser.phone ? "***" : null, // Mask if exists
      avatarUrl: updatedUser.avatarUrl, // Safe to return
      role: updatedUser.role,
      updatedAt: updatedUser.updatedAt,
      // Indicate that data is encrypted
      hasEncryptedData: {
        firstName: !!updatedUser.firstNameEncrypted,
        lastName: !!updatedUser.lastNameEncrypted,
        phone: !!updatedUser.phoneEncrypted,
      }
    };

    // Log successful update
    await AuditService.log({
      userId: payload.userId,
      userEmail: updatedUser.email || "unknown",
      userRole: updatedUser.role,
      action: "PROFILE_UPDATED",
      resource: "user_profile",
      resourceId: updatedUser.id,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      requestId: requestInfo.requestId,
      success: true,
      changes: {
        updatedFields: Object.keys(validatedData),
        avatarUploaded: !!avatarUrl,
      },
      timestamp: new Date(),
    });

    logger.info("Profile updated successfully", {
      userId: payload.userId,
      updatedFields: Object.keys(validatedData),
      avatarUploaded: !!avatarUrl,
    });

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        data: {
          user: responseData,
        },
      },
      { status: 200 }
    );

  } catch (error: unknown) {
    logger.error("Profile update failed", {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: error instanceof Error && 'userId' in error ? (error as { userId?: string }).userId : undefined,
    });

    // Log failed attempt
    try {
      const requestInfo = extractRequestInfoFromRequest(request);
      await AuditService.log({
        userId: error instanceof Error && 'userId' in error ? (error as { userId?: string }).userId : "unknown",
        action: "PROFILE_UPDATE_FAILED",
        resource: "user_profile",
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        requestId: requestInfo.requestId,
        success: false,
        errorMessage: error.message,
        timestamp: new Date(),
      });
    } catch (auditError) {
      logger.error("Failed to log audit event", { auditError });
    }

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred while updating profile",
      },
      { status: 500 }
    );
  }
}