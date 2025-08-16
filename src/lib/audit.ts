import prisma from "./db";
import logger from "./logger";
import { NextApiRequest } from "next";
import crypto from "crypto";

export enum AuditAction {
  // Authentication events
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGOUT = "LOGOUT",
  REGISTRATION_SUCCESS = "REGISTRATION_SUCCESS",
  REGISTRATION_FAILED = "REGISTRATION_FAILED",
  PASSWORD_RESET_REQUESTED = "PASSWORD_RESET_REQUESTED",
  PASSWORD_RESET_COMPLETED = "PASSWORD_RESET_COMPLETED",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  ACCOUNT_UNLOCKED = "ACCOUNT_UNLOCKED",
  MFA_ENABLED = "MFA_ENABLED",
  MFA_DISABLED = "MFA_DISABLED",
  MFA_VERIFICATION_FAILED = "MFA_VERIFICATION_FAILED",
  SESSION_CREATED = "SESSION_CREATED",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  SESSION_REVOKED = "SESSION_REVOKED",
  TOKEN_REFRESHED = "TOKEN_REFRESHED",
  TOKEN_VALIDATED = "TOKEN_VALIDATED",
  TOKEN_VALIDATION_FAILED = "TOKEN_VALIDATION_FAILED",
  AUTHENTICATION_SUCCESS = "AUTHENTICATION_SUCCESS",
  AUTHENTICATION_FAILED = "AUTHENTICATION_FAILED",

  // Security events
  UNAUTHORIZED_ACCESS_ATTEMPT = "UNAUTHORIZED_ACCESS_ATTEMPT",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // User management events
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DEACTIVATED = "USER_DEACTIVATED",
  USER_ACTIVATED = "USER_ACTIVATED",
  ROLE_CHANGED = "ROLE_CHANGED",
  PROFILE_ACCESSED = "PROFILE_ACCESSED",
  PROFILE_ACCESS_FAILED = "PROFILE_ACCESS_FAILED",

  // Data access events
  DATA_ACCESSED = "DATA_ACCESSED",
  DATA_CREATED = "DATA_CREATED",
  DATA_UPDATED = "DATA_UPDATED",
  DATA_DELETED = "DATA_DELETED",
  DATA_EXPORTED = "DATA_EXPORTED",
  DATA_IMPORTED = "DATA_IMPORTED",

  // GDPR Consent events
  CONSENT_GRANTED = "CONSENT_GRANTED",
  CONSENT_WITHDRAWN = "CONSENT_WITHDRAWN",
  CONSENT_RENEWED = "CONSENT_RENEWED",
  CONSENT_EXPIRED = "CONSENT_EXPIRED",
  CONSENT_ACCESSED = "CONSENT_ACCESSED",
}

interface AuditLogEntry {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  sessionId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  changes?: Record<string, any>;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  static async log(entry: Omit<AuditLogEntry, "timestamp">): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          ...entry,
          timestamp: new Date(),
        },
      });

      // Also log to structured logger
      logger.info("Audit Event", {
        auditAction: entry.action,
        userId: entry.userId,
        resource: entry.resource,
        success: entry.success,
        ipAddress: entry.ipAddress,
        requestId: entry.requestId,
      });
    } catch (error) {
      logger.error("CRITICAL: Audit logging failed", {
        error: error instanceof Error ? error.message : "Unknown error",
        auditEntry: entry,
        timestamp: new Date().toISOString(),
      });

      // This is critical - audit logging failure must be handled
      throw new Error("System audit logging failed");
    }
  }

  static extractRequestInfo(req: NextApiRequest): {
    ipAddress: string;
    userAgent: string;
    requestId: string;
  } {
    // Get IP address from various possible sources
    const ipAddress =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      (req.headers["x-real-ip"] as string) ||
      req.socket?.remoteAddress ||
      "unknown";

    return {
      ipAddress,
      userAgent: req.headers["user-agent"] || "unknown",
      requestId: (req.headers["x-request-id"] as string) || crypto.randomUUID(),
    };
  }

  // Convenience methods for common audit events
  static async logLoginSuccess(
    userId: string,
    userEmail: string,
    userRole: string,
    sessionId: string,
    requestInfo: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userRole,
      sessionId,
      action: AuditAction.LOGIN_SUCCESS,
      resource: "authentication",
      success: true,
      metadata,
      ...requestInfo,
    });
  }

  static async logLoginFailed(
    userEmail: string,
    requestInfo: any,
    errorMessage?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userEmail,
      action: AuditAction.LOGIN_FAILED,
      resource: "authentication",
      success: false,
      errorMessage,
      metadata,
      ...requestInfo,
    });
  }

  static async logAccountLocked(
    userId: string,
    userEmail: string,
    requestInfo: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action: AuditAction.ACCOUNT_LOCKED,
      resource: "authentication",
      success: false,
      metadata,
      ...requestInfo,
    });
  }

  static async logUnauthorizedAccess(
    resource: string,
    requestInfo: any,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      action: AuditAction.UNAUTHORIZED_ACCESS_ATTEMPT,
      resource,
      success: false,
      errorMessage,
      ...requestInfo,
    });
  }

  static async logDataAccess(
    userId: string,
    userEmail: string,
    userRole: string,
    resource: string,
    resourceId: string,
    requestInfo: any,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      userRole,
      action: AuditAction.DATA_ACCESSED,
      resource,
      resourceId,
      success: true,
      metadata,
      ...requestInfo,
    });
  }
}
