import { NextRequest, NextResponse } from "next/server";
import { ConsentService } from "../../../../services/consentService";
import { AuditService, AuditAction } from "../../../../lib/audit";
import { extractRequestInfoFromRequest } from "../../../../utils/appRouterHelpers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "User ID is required",
        },
        { status: 400 }
      );
    }

    const consentHistory = await ConsentService.getConsentHistory(userId);
    return NextResponse.json({ consentHistory });
  } catch (error) {
    console.error("Get consent history error:", error);
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
    const body = await request.json();
    const { userId, consentType, reason } = body;

    if (!userId || !consentType) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "User ID and consent type are required",
        },
        { status: 400 }
      );
    }

    const requestInfo = extractRequestInfoFromRequest(request);

    await ConsentService.withdrawConsent({
      userId,
      consentType,
      reason,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
    });

    // Log consent withdrawal
    await AuditService.log({
      userId,
      action: AuditAction.CONSENT_WITHDRAWN,
      resource: "consent",
      success: true,
      metadata: { consentType, reason },
      ...requestInfo,
    });

    return NextResponse.json({
      message: "Consent withdrawn successfully",
    });
  } catch (error) {
    console.error("Withdraw consent error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, consentType, newConsentText } = body;

    if (!userId || !consentType) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "User ID and consent type are required",
        },
        { status: 400 }
      );
    }

    const requestInfo = extractRequestInfoFromRequest(request);

    await ConsentService.renewConsent(
      userId,
      consentType,
      newConsentText,
      requestInfo.ipAddress,
      requestInfo.userAgent
    );

    // Log consent renewal
    await AuditService.log({
      userId,
      action: AuditAction.CONSENT_RENEWED,
      resource: "consent",
      success: true,
      metadata: { consentType },
      ...requestInfo,
    });

    return NextResponse.json({
      message: "Consent renewed successfully",
    });
  } catch (error) {
    console.error("Renew consent error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
