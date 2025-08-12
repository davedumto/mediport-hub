import { NextRequest, NextResponse } from "next/server";
import { GDPR_CONSENT_TEMPLATES } from "../../../../utils/constants";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type && type in GDPR_CONSENT_TEMPLATES) {
      return NextResponse.json({
        template:
          GDPR_CONSENT_TEMPLATES[type as keyof typeof GDPR_CONSENT_TEMPLATES],
      });
    }

    return NextResponse.json({
      templates: GDPR_CONSENT_TEMPLATES,
    });
  } catch (error) {
    logger.error("Consent templates error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
