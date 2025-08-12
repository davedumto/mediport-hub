import { Buffer } from "buffer";
import logger from "../utils/logger";

export interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: Date;
  gender?: string;
  phoneEncrypted?: string;
  phone?: string;
  addressStreetEncrypted?: string;
  addressStreet?: string;
  addressCityEncrypted?: string;
  addressCity?: string;
  addressStateEncrypted?: string;
  addressState?: string;
  addressZipEncrypted?: string;
  addressZip?: string;
  addressCountryEncrypted?: string;
  addressCountry?: string;
  emergencyNameEncrypted?: string;
  emergencyName?: string;
  emergencyRelationshipEncrypted?: string;
  emergencyRelationship?: string;
  emergencyPhoneEncrypted?: string;
  emergencyPhone?: string;
  [key: string]: unknown;
}

export interface MedicalRecord {
  id: string;
  title: string;
  type: string;
  recordDate: string;
  descriptionEncrypted?: string;
  findingsEncrypted?: string;
  recommendationsEncrypted?: string;
  [key: string]: unknown;
}

export interface Consultation {
  id: string;
  chiefComplaintEncrypted?: string;
  symptomsEncrypted?: string;
  diagnosisEncrypted?: string;
  treatmentPlanEncrypted?: string;
  followUpInstructionsEncrypted?: string;
  [key: string]: unknown;
}

export interface Appointment {
  id: string;
  notesEncrypted?: string;
  [key: string]: unknown;
}

export class DecryptionService {
  private static readonly ALGORITHM = "AES-GCM";
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits

  /**
   * Decrypt PII data from base64 string
   */
  static async decryptPII(encryptedDataBase64: string): Promise<string> {
    try {
      // Decode base64 to get the encrypted data structure
      const encryptedData: EncryptedData = JSON.parse(
        Buffer.from(encryptedDataBase64, "base64").toString("utf-8")
      );

      // Convert hex strings back to Uint8Arrays
      const encrypted = Buffer.from(encryptedData.encrypted, "hex");
      const iv = Buffer.from(encryptedData.iv, "hex");
      const tag = Buffer.from(encryptedData.tag, "hex");

      // Get encryption key from environment (must match backend)
      const key = await this.getEncryptionKey();

      // Decrypt using Web Crypto API
      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
          additionalData: new TextEncoder().encode("ehr-system"),
          tagLength: this.TAG_LENGTH * 8,
        },
        key,
        Buffer.concat([encrypted, tag])
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      logger.error("Decryption failed:", error);
      throw new Error("Failed to decrypt PII data");
    }
  }

  /**
   * Get encryption key from environment
   * Note: In production, this should be securely managed
   */
  private static async getEncryptionKey(): Promise<CryptoKey> {
    const keyMaterial = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;
    if (!keyMaterial) {
      throw new Error("Encryption key not configured");
    }

    const keyBuffer = Buffer.from(keyMaterial, "hex");
    return await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: this.ALGORITHM },
      false,
      ["decrypt"]
    );
  }

  /**
   * Batch decrypt multiple PII fields for patient data
   */
  static async decryptPatientPII(patient: Patient): Promise<Patient> {
    const decryptedPatient = { ...patient };

    const encryptedFields = [
      "phoneEncrypted",
      "addressStreetEncrypted",
      "addressCityEncrypted",
      "addressStateEncrypted",
      "addressZipEncrypted",
      "addressCountryEncrypted",
      "emergencyNameEncrypted",
      "emergencyRelationshipEncrypted",
      "emergencyPhoneEncrypted",
    ];

    for (const field of encryptedFields) {
      if (patient[field]) {
        try {
          const decryptedField = field.replace("Encrypted", "");
          decryptedPatient[decryptedField] = await this.decryptPII(
            patient[field] as string
          );
        } catch (error) {
          console.warn(`Failed to decrypt ${field}:`, error);
          const decryptedField = field.replace("Encrypted", "");
          decryptedPatient[decryptedField] = "[Encrypted]";
        }
      }
    }

    return decryptedPatient;
  }

  /**
   * Batch decrypt multiple PII fields for medical records
   */
  static async decryptMedicalRecordPII(
    record: MedicalRecord
  ): Promise<MedicalRecord> {
    const decryptedRecord = { ...record };

    const encryptedFields = [
      "descriptionEncrypted",
      "findingsEncrypted",
      "recommendationsEncrypted",
    ];

    for (const field of encryptedFields) {
      if (record[field]) {
        try {
          const decryptedField = field.replace("Encrypted", "");
          decryptedRecord[decryptedField] = await this.decryptPII(
            record[field] as string
          );
        } catch (error) {
          console.warn(`Failed to decrypt ${field}:`, error);
          const decryptedField = field.replace("Encrypted", "");
          decryptedRecord[decryptedField] = "[Encrypted]";
        }
      }
    }

    return decryptedRecord;
  }

  /**
   * Batch decrypt multiple PII fields for consultation data
   */
  static async decryptConsultationPII(
    consultation: Consultation
  ): Promise<Consultation> {
    const decryptedConsultation = { ...consultation };

    const encryptedFields = [
      "chiefComplaintEncrypted",
      "symptomsEncrypted",
      "diagnosisEncrypted",
      "treatmentPlanEncrypted",
      "followUpInstructionsEncrypted",
    ];

    for (const field of encryptedFields) {
      if (consultation[field]) {
        try {
          const decryptedField = field.replace("Encrypted", "");
          decryptedConsultation[decryptedField] = await this.decryptPII(
            consultation[field] as string
          );
        } catch (error) {
          console.warn(`Failed to decrypt ${field}:`, error);
          const decryptedField = field.replace("Encrypted", "");
          decryptedConsultation[decryptedField] = "[Encrypted]";
        }
      }
    }

    return decryptedConsultation;
  }

  /**
   * Batch decrypt multiple PII fields for appointment data
   */
  static async decryptAppointmentPII(
    appointment: Appointment
  ): Promise<Appointment> {
    const decryptedAppointment = { ...appointment };

    const encryptedFields = ["notesEncrypted"];

    for (const field of encryptedFields) {
      if (appointment[field]) {
        try {
          const decryptedField = field.replace("Encrypted", "");
          decryptedAppointment[decryptedField] = await this.decryptPII(
            appointment[field] as string
          );
        } catch (error) {
          console.warn(`Failed to decrypt ${field}:`, error);
          const decryptedField = field.replace("Encrypted", "");
          decryptedAppointment[decryptedField] = "[Encrypted]";
        }
      }
    }

    return decryptedAppointment;
  }
}
