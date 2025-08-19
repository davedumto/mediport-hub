import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "../../../../lib/auth";
import logger from "../../../../lib/logger";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";
import { CloudinaryService } from "../../../../services/cloudinaryService";
import { AuditService } from "../../../../lib/audit";

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

    // Only doctors can upload medical documents
    if (payload.role !== "DOCTOR" && payload.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only doctors can upload medical documents",
        },
        { status: 403 }
      );
    }

    // Check if Cloudinary is configured
    if (!CloudinaryService.isConfigured()) {
      return NextResponse.json(
        {
          error: "Service Unavailable",
          message: "File upload service is not configured",
        },
        { status: 503 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const patientId = formData.get("patientId") as string;
    const recordId = formData.get("recordId") as string;

    if (!file || !patientId) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Missing required fields: file, patientId",
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate file
    const validation = CloudinaryService.validateMedicalDocument(buffer, file.name);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Invalid file",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    const uploadResult = await CloudinaryService.uploadMedicalDocument(
      buffer,
      file.name,
      payload.userId,
      patientId,
      recordId || `temp_${Date.now()}`,
      {
        tags: ['medical-upload', 'doctor-uploaded'],
      }
    );

    if (!uploadResult.success) {
      logger.error("File upload failed", {
        userId: payload.userId,
        filename: file.name,
        error: uploadResult.error,
      });

      return NextResponse.json(
        {
          error: "Upload Failed",
          message: uploadResult.error || "Failed to upload file",
        },
        { status: 500 }
      );
    }

    // Log the upload
    await AuditService.log({
      userId: payload.userId,
      userEmail: payload.email,
      action: "MEDICAL_DOCUMENT_UPLOAD",
      resource: "medical_document",
      resourceId: uploadResult.publicId!,
      success: true,
      metadata: {
        filename: file.name,
        fileSize: buffer.length,
        patientId,
        recordId,
        cloudinaryPublicId: uploadResult.publicId,
      },
      ...requestInfo,
    });

    return NextResponse.json(
      {
        success: true,
        message: "File uploaded successfully",
        data: {
          id: uploadResult.publicId,
          url: uploadResult.secureUrl,
          filename: file.name,
          size: buffer.length,
          format: uploadResult.format,
          uploadedAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Medical document upload error:", error);

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