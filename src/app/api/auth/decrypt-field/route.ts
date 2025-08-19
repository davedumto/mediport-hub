import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "../../../../lib/auth";
import { AuditService, AuditAction } from "../../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";
import prisma from "../../../../lib/db";
import logger from "../../../../lib/logger";
import { PIIProtectionService } from "../../../../services/piiProtectionService";

/**
 * Secure endpoint for decrypting specific PII fields
 * This should only be called client-side when displaying sensitive data
 */
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
        {
          error: "Unauthorized",
          message: "Missing or invalid authorization header",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    const requestInfo = extractRequestInfoFromRequest(request);

    // Parse request body
    const body = await request.json();
    const { entityType, entityId, fields } = body;

    // Validate request
    if (!entityType || !entityId || !Array.isArray(fields)) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Invalid request format",
          details: ["entityType, entityId, and fields array are required"],
        },
        { status: 400 }
      );
    }

    // Validate entity type
    const allowedEntityTypes = [
      "user",
      "patient",
      "appointment",
      "consultation",
      "medicalRecord",
    ];
    if (!allowedEntityTypes.includes(entityType)) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Invalid entity type",
        },
        { status: 400 }
      );
    }

    // Check permissions based on entity type and user role
    let hasAccess = false;
    let entity: { id: string; userId?: string | null; [key: string]: unknown } | null =
      null;

    switch (entityType) {
      case "user":
        // Users can decrypt their own data
        if (entityId === payload.userId) {
          hasAccess = true;
          entity = await prisma.user.findUnique({
            where: { id: entityId },
          });
        } else if (payload.role === "SUPER_ADMIN" || payload.role === "ADMIN") {
          hasAccess = true;
          entity = await prisma.user.findUnique({
            where: { id: entityId },
          });
        }
        break;

      case "patient":
        // Patients can decrypt their own data, doctors can decrypt assigned patients
        const patient = await prisma.patient.findUnique({
          where: { id: entityId },
        });

        if (patient) {
          if (patient.userId === payload.userId) {
            hasAccess = true;
          } else if (
            payload.role === "DOCTOR" &&
            patient.assignedProviderId === payload.userId
          ) {
            hasAccess = true;
          } else if (
            payload.role === "SUPER_ADMIN" ||
            payload.role === "ADMIN"
          ) {
            hasAccess = true;
          }
          entity = patient;
        }
        break;

      case "appointment":
        // Check if user is involved in the appointment
        const appointment = await prisma.appointment.findUnique({
          where: { id: entityId },
          include: {
            patient: true,
            provider: true,
          },
        });

        if (appointment) {
          if (
            appointment.providerId === payload.userId ||
            appointment.patient.userId === payload.userId ||
            payload.role === "SUPER_ADMIN" ||
            payload.role === "ADMIN"
          ) {
            hasAccess = true;
            entity = appointment;
          }
        }
        break;

      default:
        hasAccess = false;
    }

    if (!hasAccess || !entity) {
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: AuditAction.PERMISSION_DENIED,
        resource: `${entityType}_decryption`,
        resourceId: entityId,
        success: false,
        errorMessage: "Access denied for PII decryption",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Forbidden",
          message: "You do not have permission to decrypt this data",
        },
        { status: 403 }
      );
    }

    // Decrypt requested fields
    const decryptedData: Record<string, string | null> = {};
    const failedFields: string[] = [];

    for (const field of fields) {
      const encryptedFieldName = `${field}Encrypted`;

      if (entity[encryptedFieldName]) {
        try {
          const encryptedData = entity[encryptedFieldName];
          let decryptedValue: string;

          // Handle different storage formats
          if (Buffer.isBuffer(encryptedData)) {
            // If it's a buffer, parse it as JSON
            const parsed = JSON.parse(encryptedData.toString());
            decryptedValue = PIIProtectionService.decryptField(
              parsed.encryptedData,
              parsed.iv,
              parsed.tag
            );
          } else if (typeof encryptedData === "string") {
            // If it's a string, parse it as JSON
            const parsed = JSON.parse(encryptedData);
            decryptedValue = PIIProtectionService.decryptField(
              parsed.encryptedData,
              parsed.iv,
              parsed.tag
            );
          } else {
            // Direct object  
            decryptedValue = PIIProtectionService.decryptField(
              (encryptedData as any).encryptedData,
              (encryptedData as any).iv,
              (encryptedData as any).tag
            );
          }

          decryptedData[field] = decryptedValue;
        } catch (error) {
          logger.error(`Failed to decrypt field ${field}:`, error);
          failedFields.push(field);
          decryptedData[field] = "[Decryption Failed]";
        }
      } else {
        // Field not encrypted or doesn't exist
        decryptedData[field] = (entity[field] as string) || null;
      }
    }

    // Log successful decryption
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: AuditAction.DATA_DECRYPTED,
      resource: `${entityType}_pii`,
      resourceId: entityId,
      success: true,
      changes: {
        fieldsRequested: fields,
        fieldsDecrypted: Object.keys(decryptedData),
        failedFields,
      },
      ...requestInfo,
    });

    return NextResponse.json({
      success: true,
      data: decryptedData,
      failedFields: failedFields.length > 0 ? failedFields : undefined,
    });
  } catch (error) {
    logger.error("PII decryption error:", error);

    if (
      error instanceof Error &&
      (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError")
    ) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid or expired token",
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to decrypt PII data",
      },
      { status: 500 }
    );
  }
}
