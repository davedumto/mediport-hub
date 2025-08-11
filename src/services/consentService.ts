import { prisma } from "../lib/db";
import {
  GDPR_CONSENT_TEMPLATES,
  CONSENT_EXPIRY_DAYS,
} from "../utils/constants";
import { AuditService, AuditAction } from "../lib/audit";
import { AppError, ErrorCodes } from "../utils/errors";
import logger from "../lib/logger";
import crypto from "crypto";

export interface ConsentValidationResult {
  isValid: boolean;
  reason?: string;
  expiresAt?: Date;
}

export interface ConsentWithdrawalRequest {
  userId: string;
  consentType: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class ConsentService {
  /**
   * Get the default GDPR consent template for data processing
   */
  static getDefaultDataProcessingConsent() {
    return GDPR_CONSENT_TEMPLATES.DATA_PROCESSING;
  }

  /**
   * Get the default GDPR consent template for medical treatment
   */
  static getDefaultMedicalTreatmentConsent() {
    return GDPR_CONSENT_TEMPLATES.MEDICAL_TREATMENT;
  }

  /**
   * Validate if a user's consent is still valid
   */
  static async validateConsent(
    userId: string,
    consentType: string = "DATA_PROCESSING"
  ): Promise<ConsentValidationResult> {
    try {
      const consent = await prisma.consentRecord.findFirst({
        where: {
          userId,
          consentType: consentType as any,
          granted: true,
          expiresAt: {
            gte: new Date(),
          },
        },
        orderBy: {
          grantedAt: "desc",
        },
      });

      if (!consent) {
        return {
          isValid: false,
          reason: "No valid consent found",
        };
      }

      if (consent.expiresAt && consent.expiresAt < new Date()) {
        return {
          isValid: false,
          reason: "Consent has expired",
          expiresAt: consent.expiresAt,
        };
      }

      return {
        isValid: true,
        expiresAt: consent.expiresAt || undefined,
      };
    } catch (error) {
      logger.error("Error validating consent:", error);
      return {
        isValid: false,
        reason: "Error validating consent",
      };
    }
  }

  /**
   * Check if user has valid GDPR consent for registration
   */
  static async hasValidGDPRConsent(userId: string): Promise<boolean> {
    const result = await this.validateConsent(userId, "DATA_PROCESSING");
    return result.isValid;
  }

  /**
   * Withdraw user consent
   */
  static async withdrawConsent(
    request: ConsentWithdrawalRequest
  ): Promise<void> {
    try {
      const consent = await prisma.consentRecord.findFirst({
        where: {
          userId: request.userId,
          consentType: request.consentType as any,
          granted: true,
        },
        orderBy: {
          grantedAt: "desc",
        },
      });

      if (!consent) {
        throw new AppError(
          ErrorCodes.RESOURCE_NOT_FOUND,
          "No active consent found to withdraw",
          404
        );
      }

      // Mark consent as withdrawn
      await prisma.consentRecord.update({
        where: { id: consent.id },
        data: {
          granted: false,
          withdrawnAt: new Date(),
        },
      });

      // Log consent withdrawal
      await AuditService.log({
        userId: request.userId,
        action: AuditAction.CONSENT_WITHDRAWN,
        resource: "consent",
        resourceId: consent.id,
        success: true,
        changes: {
          consentType: request.consentType,
          reason: request.reason,
          withdrawnAt: new Date(),
        },
        ipAddress: request.ipAddress || "unknown",
        userAgent: request.userAgent || "unknown",
        requestId: crypto.randomUUID(),
      });

      logger.info(`Consent withdrawn for user ${request.userId}`, {
        consentType: request.consentType,
        reason: request.reason,
      });
    } catch (error) {
      logger.error("Error withdrawing consent:", error);
      throw error;
    }
  }

  /**
   * Renew expired consent
   */
  static async renewConsent(
    userId: string,
    consentType: string = "DATA_PROCESSING",
    newConsentText?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      // Withdraw old consent
      await this.withdrawConsent({
        userId,
        consentType,
        reason: "Renewed with new consent",
        ipAddress,
        userAgent,
      });

      // Create new consent record
      const template =
        consentType === "DATA_PROCESSING"
          ? this.getDefaultDataProcessingConsent()
          : this.getDefaultMedicalTreatmentConsent();

      const newConsent = await prisma.consentRecord.create({
        data: {
          userId,
          consentType: consentType as any,
          purpose: "Consent renewal",
          granted: true,
          consentText: newConsentText || template.text,
          consentVersion: template.version,
          legalBasis: template.legalBasis,
          ipAddress: ipAddress || "unknown",
          userAgent: userAgent || "unknown",
          grantedAt: new Date(),
          expiresAt: new Date(
            Date.now() + CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000
          ),
        },
      });

      // Log consent renewal
      await AuditService.log({
        userId,
        action: AuditAction.CONSENT_RENEWED,
        resource: "consent",
        resourceId: newConsent.id,
        success: true,
        changes: {
          consentType,
          renewedAt: new Date(),
          expiresAt: newConsent.expiresAt,
        },
        ipAddress: ipAddress || "unknown",
        userAgent: userAgent || "unknown",
        requestId: crypto.randomUUID(),
      });

      logger.info(`Consent renewed for user ${userId}`, {
        consentType,
        expiresAt: newConsent.expiresAt,
      });
    } catch (error) {
      logger.error("Error renewing consent:", error);
      throw error;
    }
  }

  /**
   * Get user's consent history
   */
  static async getConsentHistory(userId: string) {
    try {
      return await prisma.consentRecord.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          consentType: true,
          purpose: true,
          granted: true,
          consentText: true,
          consentVersion: true,
          legalBasis: true,
          grantedAt: true,
          withdrawnAt: true,
          expiresAt: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
        },
      });
    } catch (error) {
      logger.error("Error getting consent history:", error);
      throw error;
    }
  }

  /**
   * Check if consent is expiring soon (within 30 days)
   */
  static async getExpiringConsents(daysThreshold: number = 30) {
    try {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);

      return await prisma.consentRecord.findMany({
        where: {
          granted: true,
          expiresAt: {
            lte: thresholdDate,
            gte: new Date(),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    } catch (error) {
      logger.error("Error getting expiring consents:", error);
      throw error;
    }
  }
}
