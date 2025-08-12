import { NextRequest, NextResponse } from "next/server";
import { RoleService } from "../../../../../services/roleService";
import { AuditService, AuditAction } from "../../../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../../../utils/appRouterHelpers";
import { logger } from "../../../../../lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, roleId, grantedBy } = body;

    if (!userId || !roleId || !grantedBy) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "User ID, role ID, and granted by are required",
        },
        { status: 400 }
      );
    }

    const requestInfo = extractRequestInfoFromRequest(request);

    // Assign role
    const userRole = await RoleService.assignRole(
      userId,
      roleId,
      grantedBy,
      requestInfo
    );

    // Log role assignment
    await AuditService.log({
      userId,
      action: AuditAction.ROLE_CHANGED,
      resource: "user_role",
      resourceId: userRole.id,
      success: true,
      changes: {
        roleId,
        grantedBy,
        grantedAt: userRole.grantedAt,
      },
      ...requestInfo,
    });

    return NextResponse.json({
      message: "Role assigned successfully",
      userRole,
    });
  } catch (error) {
    logger.error("Role assignment error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: error.message,
        },
        { status: 400 }
      );
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

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, roleId, revokedBy, reason } = body;

    if (!userId || !roleId || !revokedBy) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "User ID, role ID, and revoked by are required",
        },
        { status: 400 }
      );
    }

    const requestInfo = extractRequestInfoFromRequest(request);

    // Revoke role
    await RoleService.revokeRole(userId, roleId, revokedBy, requestInfo);

    // Log role revocation
    await AuditService.log({
      userId,
      action: AuditAction.ROLE_CHANGED,
      resource: "user_role",
      success: true,
      changes: {
        roleId,
        revokedBy,
        revokedAt: new Date(),
        reason,
      },
      ...requestInfo,
    });

    return NextResponse.json({
      message: "Role revoked successfully",
    });
  } catch (error) {
    logger.error("Role revocation error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: error.message,
        },
        { status: 400 }
      );
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
