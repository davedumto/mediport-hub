// Application constants
export const APP_NAME = "EHR System";
export const APP_VERSION = "1.0.0";
export const API_VERSION = "v1";

// Security constants
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const SESSION_TOKEN_LENGTH = 32;
export const REFRESH_TOKEN_LENGTH = 64;
export const MFA_SECRET_LENGTH = 32;

// JWT constants
export const JWT_ACCESS_TOKEN_EXPIRY = "24h";
export const JWT_REFRESH_TOKEN_EXPIRY = "7d";
export const JWT_ISSUER = "ehr-system";

// Rate limiting constants
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = 100;
export const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5;
export const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// File upload constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  "pdf",
  "doc",
  "docx",
  "txt",
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
];
export const MAX_ATTACHMENTS_PER_RECORD = 10;

// Pagination constants
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_SORT_ORDER = "desc";

// Audit log constants
export const AUDIT_LOG_RETENTION_DAYS = 2555; // 7 years for medical records
export const AUDIT_LOG_MAX_ENTRIES = 1000000;

// GDPR constants
export const CONSENT_VERSION = "1.0";
export const DATA_RETENTION_DAYS = 2555; // 7 years
export const CONSENT_EXPIRY_DAYS = 365; // 1 year

// GDPR Consent Text Templates
export const GDPR_CONSENT_TEMPLATES = {
  DATA_PROCESSING: {
    title: "Data Processing Consent",
    text: `By registering with our Electronic Health Record (EHR) system, you explicitly consent to the processing of your personal data for the following purposes:

1. **Account Management**: Creating and maintaining your user account
2. **Authentication**: Verifying your identity during login and system access
3. **Communication**: Sending important notifications about your account and health records
4. **Service Provision**: Providing access to healthcare services and medical records
5. **Legal Compliance**: Meeting regulatory and legal obligations

Your data will be processed securely in accordance with GDPR Article 6(1)(a) - explicit consent. You have the right to withdraw this consent at any time by contacting our data protection officer.

Data retention: Your account data will be retained for 7 years as required by healthcare regulations, or until you request deletion (subject to legal requirements).

For more information about your rights and our data processing practices, please refer to our Privacy Policy.`,
    version: "1.0",
    legalBasis: "CONSENT" as const,
  },
  MEDICAL_TREATMENT: {
    title: "Medical Treatment Consent",
    text: `This consent covers the processing of your health data for medical treatment purposes, including:

1. **Medical Records**: Creating and maintaining your health records
2. **Treatment Planning**: Developing and monitoring your treatment plans
3. **Care Coordination**: Coordinating care between healthcare providers
4. **Emergency Care**: Providing necessary information in emergency situations
5. **Quality Improvement**: Improving healthcare services (anonymized where possible)

Legal basis: GDPR Article 6(1)(c) - Legal obligation, and Article 9(2)(h) - Medical treatment.

Your health data will be processed with the highest level of security and confidentiality, following healthcare privacy standards and regulations.`,
    version: "1.0",
    legalBasis: "LEGAL_OBLIGATION" as const,
  },
} as const;

// Medical record constants
export const RECORD_TYPES = {
  CONSULTATION: "CONSULTATION",
  LAB_RESULT: "LAB_RESULT",
  PRESCRIPTION: "PRESCRIPTION",
  DIAGNOSIS: "DIAGNOSIS",
  IMAGING: "IMAGING",
  PROCEDURE: "PROCEDURE",
} as const;

export const PRIORITY_LEVELS = {
  LOW: "LOW",
  NORMAL: "NORMAL",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;

// Appointment constants
export const APPOINTMENT_TYPES = {
  CONSULTATION: "CONSULTATION",
  FOLLOW_UP: "FOLLOW_UP",
  EMERGENCY: "EMERGENCY",
  ROUTINE_CHECK: "ROUTINE_CHECK",
  SURGERY: "SURGERY",
  THERAPY: "THERAPY",
} as const;

export const APPOINTMENT_STATUSES = {
  SCHEDULED: "SCHEDULED",
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const;

export const LOCATION_TYPES = {
  IN_PERSON: "IN_PERSON",
  TELEMEDICINE: "TELEMEDICINE",
  PHONE: "PHONE",
} as const;

// User role constants
export const USER_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  DOCTOR: "DOCTOR",
  NURSE: "NURSE",
  PATIENT: "PATIENT",
} as const;

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: ["*"], // All permissions
  ADMIN: [
    "user:read",
    "user:write",
    "user:delete",
    "patient:read",
    "patient:write",
    "patient:delete",
    "medical_record:read",
    "medical_record:write",
    "medical_record:delete",
    "appointment:read",
    "appointment:write",
    "appointment:delete",
    "consultation:read",
    "consultation:write",
    "consultation:delete",
    "audit:read",
    "system:read",
    "system:write",
  ],
  DOCTOR: [
    "patient:read",
    "patient:write",
    "medical_record:read",
    "medical_record:write",
    "appointment:read",
    "appointment:write",
    "consultation:read",
    "consultation:write",
    "audit:read",
  ],
  NURSE: [
    "patient:read",
    "patient:write",
    "medical_record:read",
    "medical_record:write",
    "appointment:read",
    "appointment:write",
    "consultation:read",
    "consultation:write",
  ],
  PATIENT: [
    "patient:read",
    "medical_record:read",
    "appointment:read",
    "consultation:read",
  ],
} as const;

// Blood type constants
export const BLOOD_TYPES = {
  A_POSITIVE: "A+",
  A_NEGATIVE: "A-",
  B_POSITIVE: "B+",
  B_NEGATIVE: "B-",
  AB_POSITIVE: "AB+",
  AB_NEGATIVE: "AB-",
  O_POSITIVE: "O+",
  O_NEGATIVE: "O-",
} as const;

// Gender constants
export const GENDERS = {
  MALE: "MALE",
  FEMALE: "FEMALE",
  OTHER: "OTHER",
} as const;

// Patient status constants
export const PATIENT_STATUSES = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  VALIDATION_ERROR: "Validation failed",
  AUTHENTICATION_ERROR: "Authentication failed",
  AUTHORIZATION_ERROR: "Insufficient permissions",
  NOT_FOUND: "Resource not found",
  CONFLICT: "Resource conflict",
  INTERNAL_ERROR: "Internal server error",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable",
  INVALID_CREDENTIALS: "Invalid email or password",
  ACCOUNT_LOCKED: "Account is locked",
  TOKEN_EXPIRED: "Token has expired",
  INVALID_TOKEN: "Invalid token",
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  CREATED: "Resource created successfully",
  UPDATED: "Resource updated successfully",
  DELETED: "Resource deleted successfully",
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  PASSWORD_CHANGED: "Password changed successfully",
  EMAIL_VERIFIED: "Email verified successfully",
} as const;

// Database constants
export const DB_CONSTRAINTS = {
  MAX_STRING_LENGTH: 255,
  MAX_TEXT_LENGTH: 65535,
  MAX_JSON_SIZE: 16777215, // 16MB
} as const;

// Logging constants
export const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
} as const;

export const LOG_CATEGORIES = {
  AUTH: "authentication",
  USER: "user",
  PATIENT: "patient",
  MEDICAL_RECORD: "medical_record",
  APPOINTMENT: "appointment",
  CONSULTATION: "consultation",
  AUDIT: "audit",
  SYSTEM: "system",
} as const;

// Time constants
export const TIME_UNITS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
} as const;

// Encryption constants
export const ENCRYPTION = {
  ALGORITHM: "aes-256-gcm",
  KEY_LENGTH: 32, // bytes
  IV_LENGTH: 16, // bytes
  TAG_LENGTH: 16, // bytes
  AAD: "ehr-system",
} as const;
