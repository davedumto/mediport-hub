export const ENCRYPTION_CONFIG = {
  // Algorithm settings
  ALGORITHM: "aes-256-gcm",
  KEY_LENGTH: 32, // 256 bits
  IV_LENGTH: 16, // 128 bits
  TAG_LENGTH: 16, // 128 bits
  
  // Additional authenticated data
  AAD: "mediport-pii",
  
  // Key rotation settings
  KEY_ROTATION_DAYS: 90, // Rotate keys every 90 days
  
  // PII field encryption settings
  PII_FIELDS: {
    USER: [
      "firstName",
      "lastName", 
      "email",
      "phone",
      "specialty",
      "medicalLicenseNumber"
    ],
    PATIENT: [
      "phone",
      "addressStreet",
      "addressCity", 
      "addressState",
      "addressZip",
      "addressCountry",
      "emergencyName",
      "emergencyRelationship",
      "emergencyPhone"
    ],
    MEDICAL_RECORD: [
      "description",
      "findings",
      "recommendations"
    ],
    CONSULTATION: [
      "chiefComplaint",
      "symptoms",
      "diagnosis",
      "treatmentPlan",
      "followUpInstructions"
    ]
  },
  
  // Access control settings
  ACCESS_CONTROL: {
    OWN_DATA: true, // Users can access their own PII
    ASSIGNED_PATIENTS: true, // Doctors can access assigned patients' PII
    ADMIN_ACCESS: true, // Admins can access all PII for management
    AUDIT_LOGGING: true, // Log all PII access attempts
  },
  
  // Compliance settings
  COMPLIANCE: {
    GDPR_ENABLED: true,
    HIPAA_ENABLED: true,
    DATA_RETENTION_DAYS: 2555, // 7 years
    CONSENT_REQUIRED: true,
    RIGHT_TO_FORGOTTEN: true,
  }
};

export const ENCRYPTION_ERRORS = {
  KEY_NOT_INITIALIZED: "Encryption key not initialized",
  INVALID_KEY_FORMAT: "Invalid encryption key format",
  ENCRYPTION_FAILED: "Data encryption failed",
  DECRYPTION_FAILED: "Data decryption failed",
  INSUFFICIENT_PERMISSIONS: "Insufficient permissions to access PII",
  AUDIT_LOG_FAILED: "Failed to log PII access for audit",
};

export const ENCRYPTION_MESSAGES = {
  PII_ENCRYPTED: "PII data encrypted successfully",
  PII_DECRYPTED: "PII data decrypted successfully",
  ACCESS_GRANTED: "PII access granted",
  ACCESS_DENIED: "PII access denied",
  AUDIT_LOGGED: "PII access logged for audit",
};
