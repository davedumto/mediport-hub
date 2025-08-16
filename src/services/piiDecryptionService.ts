import { PIIProtectionService } from "./piiProtectionService";
import logger from "../lib/logger";
import { AppError, ErrorCodes } from "../utils/errors";

export interface DecryptedUserData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  specialty?: string;
  medicalLicenseNumber?: string;
}

export class PIIDecryptionService {
  /**
   * Decrypt user PII data from encrypted database fields
   */
  static async decryptUserPII(user: any): Promise<DecryptedUserData> {
    try {
      const decryptedData: DecryptedUserData = {};

      // Decrypt firstName if available
      if (user.firstNameEncrypted) {
        try {
          const encryptedData = JSON.parse(user.firstNameEncrypted.toString());
          decryptedData.firstName = PIIProtectionService.decryptField(
            encryptedData.encryptedData,
            encryptedData.iv,
            encryptedData.tag
          );
        } catch (error) {
          logger.warn("Failed to decrypt firstName:", error);
          decryptedData.firstName = "[Encrypted]";
        }
      }

      // Decrypt lastName if available
      if (user.lastNameEncrypted) {
        try {
          const encryptedData = JSON.parse(user.lastNameEncrypted.toString());
          decryptedData.lastName = PIIProtectionService.decryptField(
            encryptedData.encryptedData,
            encryptedData.iv,
            encryptedData.tag
          );
        } catch (error) {
          logger.warn("Failed to decrypt lastName:", error);
          decryptedData.lastName = "[Encrypted]";
        }
      }

      // Decrypt email if available
      if (user.emailEncrypted) {
        try {
          const encryptedData = JSON.parse(user.emailEncrypted.toString());
          decryptedData.email = PIIProtectionService.decryptField(
            encryptedData.encryptedData,
            encryptedData.iv,
            encryptedData.tag
          );
        } catch (error) {
          logger.warn("Failed to decrypt email:", error);
          decryptedData.email = "[Encrypted]";
        }
      }

      // Decrypt phone if available
      if (user.phoneEncrypted) {
        try {
          const encryptedData = JSON.parse(user.phoneEncrypted.toString());
          decryptedData.phone = PIIProtectionService.decryptField(
            encryptedData.encryptedData,
            encryptedData.iv,
            encryptedData.tag
          );
        } catch (error) {
          logger.warn("Failed to decrypt phone:", error);
          decryptedData.phone = "[Encrypted]";
        }
      }

      // Decrypt specialty if available
      if (user.specialtyEncrypted) {
        try {
          const encryptedData = JSON.parse(user.specialtyEncrypted.toString());
          decryptedData.specialty = PIIProtectionService.decryptField(
            encryptedData.encryptedData,
            encryptedData.iv,
            encryptedData.tag
          );
        } catch (error) {
          logger.warn("Failed to decrypt specialty:", error);
          decryptedData.specialty = "[Encrypted]";
        }
      }

      // Decrypt medicalLicenseNumber if available
      if (user.medicalLicenseNumberEncrypted) {
        try {
          const encryptedData = JSON.parse(user.medicalLicenseNumberEncrypted.toString());
          decryptedData.medicalLicenseNumber = PIIProtectionService.decryptField(
            encryptedData.encryptedData,
            encryptedData.iv,
            encryptedData.tag
          );
        } catch (error) {
          logger.warn("Failed to decrypt medicalLicenseNumber:", error);
          decryptedData.medicalLicenseNumber = "[Encrypted]";
        }
      }

      return decryptedData;
    } catch (error) {
      logger.error("Failed to decrypt user PII:", error);
      throw new AppError(
        ErrorCodes.INTERNAL_ERROR,
        "Failed to decrypt user data",
        500
      );
    }
  }

  /**
   * Get user data with decrypted PII for authorized access
   */
  static async getUserWithDecryptedPII(userId: string, requestingUserId: string, userRole: string): Promise<any> {
    try {
      // Check if the requesting user has permission to access PII
      if (!this.hasPermissionToAccessPII(userRole)) {
        throw new AppError(
          ErrorCodes.AUTHORIZATION_ERROR,
          "Insufficient permissions to access PII data",
          403
        );
      }

      // Log PII access for audit
      PIIProtectionService.logPIIAccess(
        requestingUserId,
        "PII_ACCESS",
        ["firstName", "lastName", "email", "phone", "specialty", "medicalLicenseNumber"],
        true
      );

      // Get user data from database (this would be implemented based on your data access layer)
      // const user = await getUserById(userId);
      
      // For now, return a placeholder
      return {
        id: userId,
        // PII fields would be decrypted here
        // firstName: decryptedData.firstName,
        // lastName: decryptedData.lastName,
        // etc.
      };
    } catch (error) {
      logger.error("Failed to get user with decrypted PII:", error);
      throw error;
    }
  }

  /**
   * Check if user has permission to access PII data
   */
  private static hasPermissionToAccessPII(userRole: string): boolean {
    // Define which roles can access PII data
    const authorizedRoles = ["SUPER_ADMIN", "ADMIN", "DOCTOR"];
    return authorizedRoles.includes(userRole);
  }

  /**
   * Validate PII access request
   */
  static validatePIIAccessRequest(requestingUserId: string, targetUserId: string, purpose: string): boolean {
    // Implement access control logic here
    // For example:
    // - Users can only access their own PII
    // - Doctors can access their assigned patients' PII
    // - Admins can access all PII for management purposes
    
    if (requestingUserId === targetUserId) {
      return true; // Users can access their own data
    }

    // Add more complex access control logic here
    return false;
  }
}
