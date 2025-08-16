import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "../../../../lib/auth";
import logger from "../../../../lib/logger";

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

    try {
      const payload = verifyAccessToken(token);

      // Only allow authenticated users to get the encryption key
      if (!payload.userId) {
        return NextResponse.json(
          {
            error: "Unauthorized",
            message: "Invalid user token",
          },
          { status: 401 }
        );
      }

      // Get encryption key from environment (server-side only)
      const encryptionKey = process.env.ENCRYPTION_KEY;

      if (!encryptionKey) {
        logger.error("Encryption key not configured in environment");
        return NextResponse.json(
          {
            error: "Internal Server Error",
            message: "Encryption key not configured",
          },
          { status: 500 }
        );
      }

      // Log successful access to encryption key
      logger.info("Encryption key accessed", {
        userId: payload.userId,
        userEmail: payload.email,
        purpose: "client_side_decryption",
      });

      // Return the encryption key (this is safe as it's only accessible to authenticated users)
      return NextResponse.json({
        success: true,
        key: encryptionKey,
        message: "Encryption key retrieved successfully",
      });
    } catch (tokenError) {
      logger.error("Token verification failed:", tokenError);
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Invalid or expired token",
        },
        { status: 401 }
      );
    }
  } catch (error) {
    logger.error("Get encryption key error:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
