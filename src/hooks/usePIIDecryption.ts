import { useState, useEffect } from "react";
import {
  DecryptionService,
  Patient,
  MedicalRecord,
  Consultation,
  Appointment,
} from "../services/decryptionService";
import { logger } from "../utils/logger";

export function usePIIDecryption<
  T extends Patient | MedicalRecord | Consultation | Appointment | null
>(encryptedData: T) {
  const [decryptedData, setDecryptedData] = useState<T | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!encryptedData) {
      setDecryptedData(null);
      return;
    }

    const decryptData = async () => {
      setIsDecrypting(true);
      setError(null);

      try {
        if ("phoneEncrypted" in encryptedData) {
          // This is patient data
          const decrypted = await DecryptionService.decryptPatientPII(
            encryptedData as Patient
          );
          setDecryptedData(decrypted as T);
        } else if ("descriptionEncrypted" in encryptedData) {
          // This is medical record data
          const decrypted = await DecryptionService.decryptMedicalRecordPII(
            encryptedData as MedicalRecord
          );
          setDecryptedData(decrypted as T);
        } else if ("chiefComplaintEncrypted" in encryptedData) {
          // This is consultation data
          const decrypted = await DecryptionService.decryptConsultationPII(
            encryptedData as Consultation
          );
          setDecryptedData(decrypted as T);
        } else if ("notesEncrypted" in encryptedData) {
          // This is appointment data
          const decrypted = await DecryptionService.decryptAppointmentPII(
            encryptedData as Appointment
          );
          setDecryptedData(decrypted as T);
        } else {
          // No encrypted fields, use as-is
          setDecryptedData(encryptedData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Decryption failed");
        logger.error("PII decryption error:", err);
      } finally {
        setIsDecrypting(false);
      }
    };

    decryptData();
  }, [encryptedData]);

  // Clear decrypted data when component unmounts
  useEffect(() => {
    return () => {
      setDecryptedData(null);
    };
  }, []);

  return { decryptedData, isDecrypting, error };
}
