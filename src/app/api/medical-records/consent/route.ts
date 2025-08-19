import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "../../../../lib/auth";
import logger from "../../../../lib/logger";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";
import { AuditService } from "../../../../lib/audit";
import prisma from "../../../../lib/db";

export async function POST(request: NextRequest) {
  try {
    // Extract and verify JWT token
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
    const { medicalRecordId, consentType, granted, consentMethod } = body;

    // Basic validation
    if (!medicalRecordId || !consentType || typeof granted !== "boolean") {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Missing required fields: medicalRecordId, consentType, granted",
        },
        { status: 400 }
      );
    }

    // Get the medical record to verify access
    const medicalRecord = await prisma.medicalRecord.findUnique({
      where: { id: medicalRecordId },
      include: {
        patient: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!medicalRecord) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "Medical record not found",
        },
        { status: 404 }
      );
    }

    // Only the patient themselves can give consent
    if (payload.role === "PATIENT" && medicalRecord.patient.userId !== payload.userId) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "You can only manage consent for your own medical records",
        },
        { status: 403 }
      );
    }

    // Doctors can request consent but not grant it
    if (payload.role === "DOCTOR" && granted) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only patients can grant consent",
        },
        { status: 403 }
      );
    }

    // Check if consent record already exists
    const existingConsent = await prisma.medicalRecordConsent.findFirst({
      where: {
        medicalRecordId,
        patientId: medicalRecord.patient.id,
        consentType,
      },
    });

    if (existingConsent) {
      // Update existing consent
      const updatedConsent = await prisma.medicalRecordConsent.update({
        where: { id: existingConsent.id },
        data: {
          granted,
          grantedAt: granted ? new Date() : null,
          withdrawnAt: granted ? null : new Date(),
          consentMethod: consentMethod || "PORTAL",
          ipAddress: requestInfo.ipAddress,
          userAgent: requestInfo.userAgent,
        },
      });

      // Log the consent action
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: granted ? "CONSENT_GRANTED" : "CONSENT_WITHDRAWN",
        resource: "medical_record_consent",
        resourceId: updatedConsent.id,
        success: true,
        metadata: {
          medicalRecordId,
          consentType,
          method: consentMethod || "PORTAL",
        },
        ...requestInfo,
      });

      return NextResponse.json({
        success: true,
        message: `Consent ${granted ? "granted" : "withdrawn"} successfully`,
        data: {
          id: updatedConsent.id,
          consentType: updatedConsent.consentType,
          granted: updatedConsent.granted,
          grantedAt: updatedConsent.grantedAt,
          withdrawnAt: updatedConsent.withdrawnAt,
        },
      });
    } else {
      // Create new consent record
      const newConsent = await prisma.medicalRecordConsent.create({
        data: {
          medicalRecordId,
          patientId: medicalRecord.patient.id,
          providerId: medicalRecord.providerId,
          consentType,
          granted,
          grantedAt: granted ? new Date() : null,
          withdrawnAt: granted ? null : new Date(),
          consentMethod: consentMethod || "PORTAL",
          ipAddress: requestInfo.ipAddress,
          userAgent: requestInfo.userAgent,
        },
      });

      // Log the consent action
      await AuditService.log({
        userId: payload.userId,
        userEmail: payload.email,
        action: granted ? "CONSENT_GRANTED" : "CONSENT_WITHDRAWN",
        resource: "medical_record_consent",
        resourceId: newConsent.id,
        success: true,
        metadata: {
          medicalRecordId,
          consentType,
          method: consentMethod || "PORTAL",
        },
        ...requestInfo,
      });

      return NextResponse.json(
        {
          success: true,
          message: `Consent ${granted ? "granted" : "withdrawn"} successfully`,
          data: {
            id: newConsent.id,
            consentType: newConsent.consentType,
            granted: newConsent.granted,
            grantedAt: newConsent.grantedAt,
            withdrawnAt: newConsent.withdrawnAt,
          },
        },
        { status: 201 }
      );
    }
  } catch (error) {
    logger.error("Consent management error:", error);

    if (error instanceof Error) {
      if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
        return NextResponse.json(
          {
            error: "Unauthorized",
            message: "Invalid or expired token",
          },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Extract and verify JWT token
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const medicalRecordId = searchParams.get("medicalRecordId");

    if (!medicalRecordId) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Missing required parameter: medicalRecordId",
        },
        { status: 400 }
      );
    }

    // Get the medical record to verify access
    const medicalRecord = await prisma.medicalRecord.findUnique({
      where: { id: medicalRecordId },
      include: {
        patient: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!medicalRecord) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "Medical record not found",
        },
        { status: 404 }
      );
    }

    // Check access permissions
    const canAccess = 
      medicalRecord.providerId === payload.userId || // Provider who created it
      medicalRecord.patient.userId === payload.userId || // Patient themselves
      payload.role === "SUPER_ADMIN"; // Super admin

    if (!canAccess) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Unauthorized to access consent records for this medical record",
        },
        { status: 403 }
      );
    }

    // Get consent records for the medical record
    const consentRecords = await prisma.medicalRecordConsent.findMany({
      where: {
        medicalRecordId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Log the access
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: "CONSENT_RECORDS_ACCESSED",
      resource: "medical_record_consent",
      success: true,
      metadata: {
        medicalRecordId,
        recordsCount: consentRecords.length,
      },
      ...requestInfo,
    });

    return NextResponse.json({
      success: true,
      data: consentRecords.map(record => ({
        id: record.id,
        consentType: record.consentType,
        granted: record.granted,
        grantedAt: record.grantedAt,
        withdrawnAt: record.withdrawnAt,
        consentMethod: record.consentMethod,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      })),
      meta: {
        total: consentRecords.length,
        timestamp: new Date().toISOString(),
        requestId: requestInfo.requestId,
      },
    });
  } catch (error) {
    logger.error("Get consent records error:", error);

    if (error instanceof Error) {
      if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
        return NextResponse.json(
          {
            error: "Unauthorized",
            message: "Invalid or expired token",
          },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}