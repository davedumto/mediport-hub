import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/db";
import { AuditService, AuditAction } from "../../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";
import logger from "../../../../lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const requestInfo = extractRequestInfoFromRequest(request);

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        assignedProvider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        medicalRecords: {
          orderBy: { recordDate: "desc" },
          take: 10,
        },
      },
    });

    if (!patient) {
      await AuditService.log({
        action: AuditAction.DATA_ACCESSED,
        resource: "patient",
        resourceId: patientId,
        success: false,
        errorMessage: "Patient not found",
        ...requestInfo,
      });

      return NextResponse.json(
        {
          error: "Not Found",
          message: "Patient not found",
        },
        { status: 404 }
      );
    }

    // Log successful access
    await AuditService.log({
      action: AuditAction.DATA_ACCESSED,
      resource: "patient",
      resourceId: patientId,
      success: true,
      ...requestInfo,
    });

    return NextResponse.json({ patient });
  } catch (error) {
    logger.error("Get patient error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const body = await request.json();
    const requestInfo = extractRequestInfoFromRequest(request);

    // Get current patient data for audit
    const currentPatient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!currentPatient) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "Patient not found",
        },
        { status: 404 }
      );
    }

    // Update patient
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: body,
    });

    // Log the update
    await AuditService.log({
      action: AuditAction.DATA_UPDATED,
      resource: "patient",
      resourceId: patientId,
      success: true,
      oldValues: currentPatient,
      newValues: updatedPatient,
      ...requestInfo,
    });

    return NextResponse.json({
      message: "Patient updated successfully",
      patient: updatedPatient,
    });
  } catch (error) {
    logger.error("Update patient error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const requestInfo = extractRequestInfoFromRequest(request);

    // Get current patient data for audit
    const currentPatient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!currentPatient) {
      return NextResponse.json(
        {
          error: "Not Found",
          message: "Patient not found",
        },
        { status: 404 }
      );
    }

    // Soft delete by setting status to ARCHIVED
    const deletedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: { status: "ARCHIVED" },
    });

    // Log the deletion
    await AuditService.log({
      action: AuditAction.DATA_DELETED,
      resource: "patient",
      resourceId: patientId,
      success: true,
      oldValues: currentPatient,
      newValues: deletedPatient,
      ...requestInfo,
    });

    return NextResponse.json({
      message: "Patient archived successfully",
    });
  } catch (error) {
    logger.error("Delete patient error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
