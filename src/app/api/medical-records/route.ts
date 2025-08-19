import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "../../../lib/auth";
import { AuditService } from "../../../lib/audit";
import logger from "../../../lib/logger";
import { extractRequestInfoFromRequest } from "../../../utils/appRouterHelpers";
import { MedicalRecordService } from "../../../services/medicalRecordService";
import { PIIProtectionService } from "../../../services/piiProtectionService";

export async function GET(request: NextRequest) {
  try {
    // Initialize PII protection service
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "System configuration error",
        },
        { status: 500 }
      );
    }
    PIIProtectionService.initialize(encryptionKey);

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
    const patientId = searchParams.get("patientId");
    const type = searchParams.get("type"); // 'doctor' or 'patient'
    const category = searchParams.get("category"); // 'records' or 'reports'

    if (type === "doctor") {
      // Get medical records for doctor (their patients)
      const records = await MedicalRecordService.getDoctorMedicalRecords(payload.userId);
      
      return NextResponse.json({
        success: true,
        data: records,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: requestInfo.requestId,
        },
      });
    } else if (type === "patient" && patientId) {
      // Get medical records for a specific patient
      const records = await MedicalRecordService.getPatientMedicalRecords(
        patientId,
        payload.userId,
        payload.role,
        category
      );
      
      return NextResponse.json({
        success: true,
        data: records,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: requestInfo.requestId,
        },
      });
    } else {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Invalid request parameters",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.error("Get medical records error:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found") || error.message.includes("Not found")) {
        return NextResponse.json(
          {
            error: "Not Found",
            message: error.message,
          },
          { status: 404 }
        );
      }

      if (error.message.includes("Unauthorized")) {
        return NextResponse.json(
          {
            error: "Unauthorized",
            message: error.message,
          },
          { status: 401 }
        );
      }

      if (error.message.includes("permissions") || error.message.includes("access")) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: error.message,
          },
          { status: 403 }
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

export async function POST(request: NextRequest) {
  try {
    // Initialize PII protection service
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      return NextResponse.json(
        {
          error: "Internal Server Error",
          message: "System configuration error",
        },
        { status: 500 }
      );
    }
    PIIProtectionService.initialize(encryptionKey);

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

    // Only doctors can create medical records
    if (payload.role !== "DOCTOR" && payload.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only doctors can create medical records",
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    
    // Basic validation
    if (!body.patientId || !body.type || !body.title) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Missing required fields: patientId, type, title",
        },
        { status: 400 }
      );
    }

    // Create medical record using the service
    const medicalRecord = await MedicalRecordService.createMedicalRecord(
      {
        patientId: body.patientId,
        providerId: payload.userId,
        type: body.type,
        title: body.title,
        recordDate: body.recordDate || new Date().toISOString(),
        description: body.description,
        findings: body.findings,
        recommendations: body.recommendations,
        diagnosis: body.diagnosis,
        treatmentPlan: body.treatmentPlan,
        attachments: body.attachments,
        isPrivate: body.isPrivate,
        status: body.status || 'DRAFT',
      },
      payload.userId,
      requestInfo
    );

    return NextResponse.json(
      {
        success: true,
        message: "Medical record created successfully",
        data: medicalRecord,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Create medical record error:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found") || error.message.includes("Not found")) {
        return NextResponse.json(
          {
            error: "Not Found",
            message: error.message,
          },
          { status: 404 }
        );
      }

      if (error.message.includes("Unauthorized")) {
        return NextResponse.json(
          {
            error: "Unauthorized",
            message: error.message,
          },
          { status: 401 }
        );
      }

      if (error.message.includes("permissions") || error.message.includes("access")) {
        return NextResponse.json(
          {
            error: "Forbidden",
            message: error.message,
          },
          { status: 403 }
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