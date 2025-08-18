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

      // Helper function to parse encrypted data
      const parseEncryptedData = (encryptedField: any) => {
        if (Buffer.isBuffer(encryptedField)) {
          const bufferString = Buffer.from(encryptedField).toString('utf8');
          return JSON.parse(bufferString);
        } else if (typeof encryptedField === 'string') {
          return JSON.parse(encryptedField);
        } else if (encryptedField instanceof Uint8Array) {
          // Handle Uint8Array from database - convert to proper buffer first
          const buffer = Buffer.from(encryptedField);
          const bufferString = buffer.toString('utf8');
          return JSON.parse(bufferString);
        } else {
          return encryptedField;
        }
      };

      // Decrypt firstName if available
      if (user.firstNameEncrypted) {
        try {
          const encryptedData = parseEncryptedData(user.firstNameEncrypted);
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
          const encryptedData = parseEncryptedData(user.lastNameEncrypted);
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
          const encryptedData = parseEncryptedData(user.emailEncrypted);
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
          const encryptedData = parseEncryptedData(user.phoneEncrypted);
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
          const encryptedData = parseEncryptedData(user.specialtyEncrypted);
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
          const encryptedData = parseEncryptedData(user.medicalLicenseNumberEncrypted);
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

  /**
   * Decrypt patient PII data from encrypted database fields
   */
  static async decryptPatientPII(patient: any): Promise<any> {
    try {
      if (!patient) return null;

      const decryptedPatientData: any = {};

      // Helper function to parse encrypted data (same as in decryptUserPII)
      const parseEncryptedData = (encryptedField: any) => {
        if (Buffer.isBuffer(encryptedField)) {
          const bufferString = Buffer.from(encryptedField).toString('utf8');
          return JSON.parse(bufferString);
        } else if (typeof encryptedField === 'string') {
          return JSON.parse(encryptedField);
        } else if (encryptedField instanceof Uint8Array) {
          // Handle Uint8Array from database - convert to proper buffer first
          const buffer = Buffer.from(encryptedField);
          const bufferString = buffer.toString('utf8');
          return JSON.parse(bufferString);
        } else {
          return encryptedField;
        }
      };

      // Decrypt patient phone if available
      if (patient.phoneEncrypted) {
        try {
          const encryptedData = parseEncryptedData(patient.phoneEncrypted);
          decryptedPatientData.phone = PIIProtectionService.decryptField(
            encryptedData.encryptedData,
            encryptedData.iv,
            encryptedData.tag
          );
        } catch (error) {
          logger.warn("Failed to decrypt patient phone:", error);
          decryptedPatientData.phone = "[Encrypted]";
        }
      }

      // Decrypt address fields if available
      if (patient.addressStreetEncrypted) {
        try {
          const encryptedData = parseEncryptedData(patient.addressStreetEncrypted);
          decryptedPatientData.addressStreet = PIIProtectionService.decryptField(
            encryptedData.encryptedData,
            encryptedData.iv,
            encryptedData.tag
          );
        } catch (error) {
          logger.warn("Failed to decrypt address street:", error);
          decryptedPatientData.addressStreet = "[Encrypted]";
        }
      }

      if (patient.addressCityEncrypted) {
        try {
          const encryptedData = parseEncryptedData(patient.addressCityEncrypted);
          decryptedPatientData.addressCity = PIIProtectionService.decryptField(
            encryptedData.encryptedData,
            encryptedData.iv,
            encryptedData.tag
          );
        } catch (error) {
          logger.warn("Failed to decrypt address city:", error);
          decryptedPatientData.addressCity = "[Encrypted]";
        }
      }

      if (patient.addressStateEncrypted) {
        try {
          const encryptedData = parseEncryptedData(patient.addressStateEncrypted);
          decryptedPatientData.addressState = PIIProtectionService.decryptField(
            encryptedData.encryptedData,
            encryptedData.iv,
            encryptedData.tag
          );
        } catch (error) {
          logger.warn("Failed to decrypt address state:", error);
          decryptedPatientData.addressState = "[Encrypted]";
        }
      }

      if (patient.addressZipEncrypted) {
        try {
          const encryptedData = parseEncryptedData(patient.addressZipEncrypted);
          decryptedPatientData.addressZip = PIIProtectionService.decryptField(
            encryptedData.encryptedData,
            encryptedData.iv,
            encryptedData.tag
          );
        } catch (error) {
          logger.warn("Failed to decrypt address zip:", error);
          decryptedPatientData.addressZip = "[Encrypted]";
        }
      }

      if (patient.addressCountryEncrypted) {
        try {
          const encryptedData = parseEncryptedData(patient.addressCountryEncrypted);
          decryptedPatientData.addressCountry = PIIProtectionService.decryptField(
            encryptedData.encryptedData,
            encryptedData.iv,
            encryptedData.tag
          );
        } catch (error) {
          logger.warn("Failed to decrypt address country:", error);
          decryptedPatientData.addressCountry = "[Encrypted]";
        }
      }

      // Decrypt emergency contact fields if available
      if (patient.emergencyNameEncrypted) {
        try {
          const encryptedData = parseEncryptedData(patient.emergencyNameEncrypted);
          decryptedPatientData.emergencyName = PIIProtectionService.decryptField(
            encryptedData.encryptedData,
            encryptedData.iv,
            encryptedData.tag
          );
        } catch (error) {
          logger.warn("Failed to decrypt emergency name:", error);
          decryptedPatientData.emergencyName = "[Encrypted]";
        }
      }

      if (patient.emergencyRelationshipEncrypted) {
        try {
          const encryptedData = parseEncryptedData(patient.emergencyRelationshipEncrypted);
          decryptedPatientData.emergencyRelationship = PIIProtectionService.decryptField(
            encryptedData.encryptedData,
            encryptedData.iv,
            encryptedData.tag
          );
        } catch (error) {
          logger.warn("Failed to decrypt emergency relationship:", error);
          decryptedPatientData.emergencyRelationship = "[Encrypted]";
        }
      }

      if (patient.emergencyPhoneEncrypted) {
        try {
          const encryptedData = parseEncryptedData(patient.emergencyPhoneEncrypted);
          decryptedPatientData.emergencyPhone = PIIProtectionService.decryptField(
            encryptedData.encryptedData,
            encryptedData.iv,
            encryptedData.tag
          );
        } catch (error) {
          logger.warn("Failed to decrypt emergency phone:", error);
          decryptedPatientData.emergencyPhone = "[Encrypted]";
        }
      }

      return decryptedPatientData;
    } catch (error) {
      logger.error("Failed to decrypt patient PII:", error);
      throw new AppError(
        ErrorCodes.INTERNAL_ERROR,
        "Failed to decrypt patient data",
        500
      );
    }
  }
}
