import { EncryptionService } from "../lib/encryption";
import logger from "../lib/logger";

export interface PIIField {
  value: string;
  encrypted: boolean;
  iv?: string;
  tag?: string;
}

export interface EncryptedPII {
  [key: string]: {
    encryptedData: string;
    iv: string;
    tag: string;
  };
}

export class PIIProtectionService {
  private static encryptionKey: string;

  /**
   * Initialize the encryption key
   */
  static initialize(encryptionKey: string) {
    this.encryptionKey = encryptionKey;
  }

  /**
   * Get the current encryption key
   */
  static getEncryptionKey(): string {
    if (!this.encryptionKey) {
      throw new Error("Encryption key not initialized");
    }
    return this.encryptionKey;
  }

  /**
   * Encrypt a single PII field
   */
  static encryptField(fieldValue: string): {
    encryptedData: string;
    iv: string;
    tag: string;
  } {
    try {
      if (!fieldValue || typeof fieldValue !== "string") {
        throw new Error("Invalid field value for encryption");
      }

      const key = this.getEncryptionKey();
      return EncryptionService.encrypt(fieldValue, key);
    } catch (error) {
      logger.error("Failed to encrypt PII field:", error);
      throw new Error(
        `PII encryption failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Decrypt a single PII field
   */
  static decryptField(encryptedData: string, iv: string, tag: string): string {
    try {
      const key = this.getEncryptionKey();
      return EncryptionService.decrypt(encryptedData, key, iv, tag);
    } catch (error) {
      logger.error("Failed to decrypt PII field:", error);
      throw new Error(
        `PII decryption failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Encrypt multiple PII fields at once
   */
  static encryptFields(fields: Record<string, string>): EncryptedPII {
    const encryptedFields: EncryptedPII = {};

    for (const [fieldName, fieldValue] of Object.entries(fields)) {
      if (fieldValue && typeof fieldValue === "string") {
        try {
          encryptedFields[fieldName] = this.encryptField(fieldValue);
        } catch (error) {
          logger.error(`Failed to encrypt field ${fieldName}:`, error);
          // Continue with other fields instead of failing completely
        }
      }
    }

    return encryptedFields;
  }

  /**
   * Decrypt multiple PII fields at once
   */
  static decryptFields(encryptedFields: EncryptedPII): Record<string, string> {
    const decryptedFields: Record<string, string> = {};

    for (const [fieldName, encryptedData] of Object.entries(encryptedFields)) {
      try {
        decryptedFields[fieldName] = this.decryptField(
          encryptedData.encryptedData,
          encryptedData.iv,
          encryptedData.tag
        );
      } catch (error) {
        logger.error(`Failed to decrypt field ${fieldName}:`, error);
        decryptedFields[fieldName] = "[Encrypted]";
      }
    }

    return decryptedFields;
  }

  /**
   * Prepare user data for storage (encrypt PII fields)
   */
  static prepareUserDataForStorage(userData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    specialty?: string;
    medicalLicenseNumber?: string;
  }): {
    encryptedFields: EncryptedPII;
    safeFields: Record<string, any>;
  } {
    const piiFields: Record<string, string> = {};
    const safeFields: Record<string, any> = {};

    // Separate PII from safe fields
    if (userData.firstName) piiFields.firstName = userData.firstName;
    if (userData.lastName) piiFields.lastName = userData.lastName;
    if (userData.email) piiFields.email = userData.email;
    if (userData.phone) piiFields.phone = userData.phone;
    if (userData.specialty) piiFields.specialty = userData.specialty;
    if (userData.medicalLicenseNumber)
      piiFields.medicalLicenseNumber = userData.medicalLicenseNumber;

    // Encrypt PII fields
    const encryptedFields = this.encryptFields(piiFields);

    // Keep safe fields as-is
    Object.keys(userData).forEach((key) => {
      if (!(key in piiFields)) {
        safeFields[key] = userData[key as keyof typeof userData];
      }
    });

    return { encryptedFields, safeFields };
  }

  /**
   * Prepare user data for API response (mask sensitive data)
   */
  static prepareUserDataForResponse(
    userData: any,
    includeMasked: boolean = false
  ): any {
    const safeResponse: any = { ...userData };

    // Remove encrypted fields from response
    delete safeResponse.firstNameEncrypted;
    delete safeResponse.lastNameEncrypted;
    delete safeResponse.emailEncrypted;
    delete safeResponse.phoneEncrypted;
    delete safeResponse.specialtyEncrypted;
    delete safeResponse.medicalLicenseNumberEncrypted;

    // Mask PII fields if requested
    if (includeMasked) {
      if (safeResponse.firstName) {
        safeResponse.firstName = EncryptionService.maskPII(
          safeResponse.firstName,
          "name"
        );
      }
      if (safeResponse.lastName) {
        safeResponse.lastName = EncryptionService.maskPII(
          safeResponse.lastName,
          "name"
        );
      }
      if (safeResponse.email) {
        safeResponse.email = EncryptionService.maskPII(
          safeResponse.email,
          "email"
        );
      }
      if (safeResponse.phone) {
        safeResponse.phone = EncryptionService.maskPII(
          safeResponse.phone,
          "phone"
        );
      }
      if (safeResponse.medicalLicenseNumber) {
        safeResponse.medicalLicenseNumber = EncryptionService.maskPII(
          safeResponse.medicalLicenseNumber,
          "license"
        );
      }
    } else {
      // Remove PII fields completely for security
      delete safeResponse.firstName;
      delete safeResponse.lastName;
      delete safeResponse.email;
      delete safeResponse.phone;
      delete safeResponse.specialty;
      delete safeResponse.medicalLicenseNumber;
    }

    return safeResponse;
  }

  /**
   * Validate PII data before encryption
   */
  static validatePIIData(data: Record<string, string>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check for empty or null values
    for (const [fieldName, value] of Object.entries(data)) {
      if (!value || value.trim().length === 0) {
        errors.push(`${fieldName} cannot be empty`);
      }
    }

    // Email validation
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push("Invalid email format");
    }

    // Phone validation
    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push("Invalid phone number format");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if email is valid
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if phone number is valid
   */
  private static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ""));
  }

  /**
   * Log PII access for audit purposes
   */
  static logPIIAccess(
    userId: string,
    action: string,
    fields: string[],
    success: boolean
  ): void {
    logger.info("PII access logged", {
      userId,
      action,
      fields,
      success,
      timestamp: new Date().toISOString(),
      ipAddress: "N/A", // Should be passed from request context
    });
  }
}
