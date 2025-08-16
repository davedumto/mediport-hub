import { z } from "zod";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// Configure DOMPurify for server-side use
const window = new JSDOM("").window;
const purify = DOMPurify(window);

// Security constants
const SECURITY_PATTERNS = {
  // Prevent common injection patterns
  SQL_INJECTION:
    /('|(\\')|(;)|(\-\-)|(\s+(OR|AND)\s+)|(\s+(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\s+))/gi,
  XSS_PATTERNS: /<script[^>]*>.*?<\/script>/gi,
  COMMAND_INJECTION: /[;&|`${}]/g,
  HTML_TAGS: /<[^>]*>/g,

  // Valid patterns
  NAME_PATTERN: /^[a-zA-Z\s'\-\.]+$/,
  PHONE_PATTERN: /^\+?[\d\s\-\(\)]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9\s]+$/,
  MEDICAL_CODE: /^[A-Z]\d{2}(\.\d{1,2})?$/, // ICD-10 format
  MEDICATION_NAME: /^[a-zA-Z0-9\s\-\(\)\.]+$/,
};

// Custom validation helpers
const createSecureString = (
  minLength: number = 1,
  maxLength: number = 255,
  pattern?: RegExp,
  allowedChars?: string
) => {
  return z
    .string()
    .min(minLength, `Must be at least ${minLength} characters`)
    .max(maxLength, `Must be no more than ${maxLength} characters`)
    .refine(
      (val) => !SECURITY_PATTERNS.SQL_INJECTION.test(val),
      "Contains potentially dangerous characters"
    )
    .refine(
      (val) => !SECURITY_PATTERNS.XSS_PATTERNS.test(val),
      "Contains potentially dangerous HTML"
    )
    .refine(
      (val) => !SECURITY_PATTERNS.COMMAND_INJECTION.test(val),
      "Contains potentially dangerous commands"
    )
    .refine((val) => (pattern ? pattern.test(val) : true), "Invalid format")
    .transform((val) => val.trim());
};

const createSanitizedHTML = (maxLength: number = 10000) => {
  return z
    .string()
    .max(maxLength, `HTML content too long (max ${maxLength} characters)`)
    .transform((val) => {
      // Sanitize HTML content
      return purify.sanitize(val, {
        ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "ol", "ul", "li"],
        ALLOWED_ATTR: [],
        ALLOW_DATA_ATTR: false,
      });
    })
    .refine(
      (val) => val.length > 0,
      "Content cannot be empty after sanitization"
    );
};

// Enhanced email validation
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .min(5, "Email too short")
  .max(255, "Email too long")
  .refine((email) => {
    // Additional email security checks
    const domain = email.split("@")[1];
    return domain && domain.length > 0 && !domain.includes("..");
  }, "Invalid email domain")
  .transform((email) => email.toLowerCase().trim());

// Enhanced password validation
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .refine((pwd) => /[A-Z]/.test(pwd), "Password must contain uppercase letter")
  .refine((pwd) => /[a-z]/.test(pwd), "Password must contain lowercase letter")
  .refine((pwd) => /[0-9]/.test(pwd), "Password must contain number")
  .refine(
    (pwd) => /[^A-Za-z0-9]/.test(pwd),
    "Password must contain special character"
  )
  .refine((pwd) => !pwd.includes(" "), "Password cannot contain spaces")
  .refine(
    (pwd) => !/(.)\1{2,}/.test(pwd),
    "Password cannot have 3+ repeated characters"
  )
  .refine((pwd) => {
    // Check against common passwords
    const commonPasswords = [
      "password",
      "123456",
      "qwerty",
      "admin",
      "letmein",
    ];
    return !commonPasswords.some((common) =>
      pwd.toLowerCase().includes(common)
    );
  }, "Password is too common");

// Medical-specific validation schemas
export const medicalIdSchema = z
  .string()
  .regex(/^[A-Z]{2}\d{6,10}$/, "Invalid medical ID format")
  .transform((id) => id.toUpperCase());

export const diagnosisCodeSchema = z
  .string()
  .regex(
    SECURITY_PATTERNS.MEDICAL_CODE,
    "Invalid diagnosis code format (ICD-10)"
  )
  .transform((code) => code.toUpperCase());

export const medicationNameSchema = createSecureString(
  2,
  100,
  SECURITY_PATTERNS.MEDICATION_NAME,
  "medication name"
);

// Personal information schemas
export const nameSchema = createSecureString(
  1,
  100,
  SECURITY_PATTERNS.NAME_PATTERN
);

export const phoneSchema = z
  .string()
  .regex(SECURITY_PATTERNS.PHONE_PATTERN, "Invalid phone number format")
  .min(10, "Phone number too short")
  .max(20, "Phone number too long")
  .transform((phone) => phone.replace(/\D/g, "")); // Remove non-digits

export const addressSchema = z.object({
  street: createSecureString(1, 255),
  city: createSecureString(1, 100, SECURITY_PATTERNS.NAME_PATTERN),
  state: createSecureString(1, 100, SECURITY_PATTERNS.NAME_PATTERN),
  zipCode: z
    .string()
    .regex(/^[\d\-\s]+$/, "Invalid zip code format")
    .min(5, "Zip code too short")
    .max(12, "Zip code too long")
    .transform((zip) => zip.replace(/\D/g, "")),
  country: createSecureString(1, 100, SECURITY_PATTERNS.NAME_PATTERN),
});

// Date validation with security constraints
export const dateSchema = z
  .string()
  .datetime("Invalid date format")
  .refine((date) => {
    const parsedDate = new Date(date);
    const now = new Date();
    const minDate = new Date("1900-01-01");
    return parsedDate >= minDate && parsedDate <= now;
  }, "Date must be between 1900 and current date");

export const futureDateSchema = z
  .string()
  .datetime("Invalid date format")
  .refine((date) => {
    const parsedDate = new Date(date);
    const now = new Date();
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 10); // Max 10 years in future
    return parsedDate > now && parsedDate <= maxDate;
  }, "Date must be in the future but not more than 10 years ahead");

// File upload validation
export const fileUploadSchema = z.object({
  filename: z
    .string()
    .min(1, "Filename required")
    .max(255, "Filename too long")
    .refine(
      (name) => !/[<>:"/\\|?*]/.test(name),
      "Invalid characters in filename"
    )
    .refine((name) => {
      const allowedExtensions = [
        ".pdf",
        ".jpg",
        ".jpeg",
        ".png",
        ".doc",
        ".docx",
      ];
      const extension = name.toLowerCase().substring(name.lastIndexOf("."));
      return allowedExtensions.includes(extension);
    }, "File type not allowed"),
  size: z
    .number()
    .min(1, "File cannot be empty")
    .max(10 * 1024 * 1024, "File too large (max 10MB)"),
  mimeType: z.string().refine((type) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    return allowedTypes.includes(type);
  }, "File type not allowed"),
});

// User validation schemas
export const userRoleSchema = z.enum([
  "SUPER_ADMIN",
  "ADMIN",
  "DOCTOR",
  "NURSE",
  "PATIENT",
]);

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: userRoleSchema.default("PATIENT"),
  phone: phoneSchema.optional(),
  dateOfBirth: dateSchema.optional(),
});

export const updateUserSchema = createUserSchema
  .partial()
  .omit({ password: true });

// Login request schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password required"),
  mfaCode: z.string().length(6, "MFA code must be 6 digits").optional(),
  rememberMe: z.boolean().default(false),
});

// Registration request schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
  role: userRoleSchema.default("PATIENT"),
  phone: phoneSchema.optional(),
  dateOfBirth: dateSchema.optional(),
  // GDPR consent requirements
  gdprConsent: z
    .boolean()
    .refine((val) => val === true, "GDPR consent is required to register"),
  consentText: z
    .string()
    .min(1, "Consent text is required")
    .max(2000, "Consent text too long"),
  consentVersion: z
    .string()
    .min(1, "Consent version is required")
    .max(10, "Consent version too long"),
  legalBasis: z
    .enum([
      "CONSENT",
      "CONTRACT",
      "LEGAL_OBLIGATION",
      "VITAL_INTERESTS",
      "PUBLIC_TASK",
      "LEGITIMATE_INTERESTS",
    ])
    .default("CONSENT"),
});

// Password reset request schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Password reset completion schema
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Password confirmation required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Change password schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Password confirmation required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// MFA setup schema
export const setupMFASchema = z.object({
  mfaCode: z.string().length(6, "MFA code must be 6 digits"),
});

// Patient validation schemas
export const genderSchema = z.enum(["MALE", "FEMALE", "OTHER"]);
export const bloodTypeSchema = z.enum([
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
]);
export const patientStatusSchema = z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]);

// Patient creation with enhanced validation
export const createPatientSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  dateOfBirth: dateSchema.refine((date) => {
    const age = new Date().getFullYear() - new Date(date).getFullYear();
    return age >= 0 && age <= 150;
  }, "Invalid age"),
  gender: genderSchema,

  address: addressSchema,

  emergencyContact: z.object({
    name: nameSchema,
    relationship: createSecureString(1, 50),
    phone: phoneSchema,
  }),

  medicalHistory: z
    .object({
      allergies: z
        .array(createSecureString(1, 100))
        .max(20, "Too many allergies listed"),
      conditions: z
        .array(createSecureString(1, 100))
        .max(20, "Too many conditions listed"),
      medications: z
        .array(medicationNameSchema)
        .max(50, "Too many medications listed"),
    })
    .optional(),

  assignedProviderId: z.string().uuid().optional(),
  gdprConsent: z
    .boolean()
    .refine((val) => val === true, "GDPR consent required"),
});

export const updatePatientSchema = createPatientSchema.partial();

// Medical record with sanitized content
export const recordTypeSchema = z.enum([
  "CONSULTATION",
  "LAB_RESULT",
  "PRESCRIPTION",
  "DIAGNOSIS",
  "IMAGING",
  "PROCEDURE",
]);

export const createMedicalRecordSchema = z.object({
  type: recordTypeSchema,
  title: createSecureString(1, 255),
  description: createSanitizedHTML(5000),
  findings: createSanitizedHTML(5000).optional(),
  recommendations: createSanitizedHTML(5000).optional(),

  // Structured medical data
  vitals: z
    .object({
      bloodPressureSystolic: z.number().min(50).max(300).optional(),
      bloodPressureDiastolic: z.number().min(30).max(200).optional(),
      heartRate: z.number().min(30).max(250).optional(),
      temperature: z.number().min(90).max(110).optional(), // Fahrenheit
      respiratoryRate: z.number().min(5).max(60).optional(),
      oxygenSaturation: z.number().min(70).max(100).optional(),
    })
    .optional(),

  medications: z
    .array(
      z.object({
        name: medicationNameSchema,
        dosage: createSecureString(1, 100),
        frequency: createSecureString(1, 100),
        duration: createSecureString(1, 100),
      })
    )
    .max(20, "Too many medications")
    .optional(),

  attachments: z.array(fileUploadSchema).max(10, "Too many attachments"),
  providerId: z.string().uuid(),
  date: dateSchema,
  isPrivate: z.boolean().default(false),
});

export const updateMedicalRecordSchema = createMedicalRecordSchema.partial();

// Appointment creation with time validation
export const appointmentTypeSchema = z.enum([
  "CONSULTATION",
  "FOLLOW_UP",
  "EMERGENCY",
  "ROUTINE_CHECK",
  "SURGERY",
  "THERAPY",
]);
export const appointmentStatusSchema = z.enum([
  "SCHEDULED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);
export const priorityLevelSchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]);
export const locationTypeSchema = z.enum([
  "IN_PERSON",
  "TELEMEDICINE",
  "PHONE",
]);

export const createAppointmentSchema = z
  .object({
    patientId: z.string().uuid(),
    providerId: z.string().uuid(),
    startTime: futureDateSchema,
    endTime: futureDateSchema,
    type: appointmentTypeSchema,
    reason: createSecureString(1, 500),
    notes: createSanitizedHTML(1000).optional(),
    priority: priorityLevelSchema.default("NORMAL"),
    locationType: locationTypeSchema.default("IN_PERSON"),
    sendReminder: z.boolean().default(true),
  })
  .refine((data) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    const duration = end.getTime() - start.getTime();
    return duration >= 15 * 60 * 1000 && duration <= 8 * 60 * 60 * 1000; // 15 minutes to 8 hours
  }, "Appointment duration must be between 15 minutes and 8 hours");

export const updateAppointmentSchema = createAppointmentSchema.partial();

// Consultation validation schemas
export const consultationTypeSchema = z.enum([
  "INITIAL",
  "FOLLOW_UP",
  "EMERGENCY",
  "SPECIALIST",
]);

export const createConsultationSchema = z.object({
  appointmentId: z.string().uuid("Invalid appointment ID").optional(),
  patientId: z.string().uuid("Invalid patient ID"),
  type: consultationTypeSchema,
  startTime: dateSchema,
  endTime: dateSchema.optional(),
  durationMinutes: z.number().int().positive().optional(),
  chiefComplaint: createSecureString(1, 500).optional(),
  symptoms: createSanitizedHTML(2000).optional(),
  diagnosis: createSanitizedHTML(2000).optional(),
  treatmentPlan: createSanitizedHTML(2000).optional(),
  vitalSigns: z.record(z.string(), z.any()).optional(),
  prescriptions: z.array(medicationNameSchema).default([]),
  followUpRequired: z.boolean().default(false),
  followUpDate: futureDateSchema.optional(),
  followUpInstructions: createSanitizedHTML(1000).optional(),
  billingCodes: z.array(z.string()).default([]),
});

export const updateConsultationSchema = createConsultationSchema.partial();

// Feedback validation schemas
export const feedbackTypeSchema = z.enum([
  "FEATURE_REQUEST",
  "BUG_REPORT",
  "IMPROVEMENT",
  "COMPLAINT",
  "COMPLIMENT",
  "GENERAL",
]);

export const feedbackPrioritySchema = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
]);

export const feedbackCategorySchema = z.enum([
  "USER_INTERFACE",
  "FUNCTIONALITY",
  "PERFORMANCE",
  "SECURITY",
  "ACCESSIBILITY",
  "DOCUMENTATION",
  "GENERAL",
]);

export const feedbackStatusSchema = z.enum([
  "PENDING",
  "IN_REVIEW",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
]);

export const createFeedbackSchema = z.object({
  type: feedbackTypeSchema,
  title: createSecureString(1, 200),
  description: createSecureString(1, 2000),
  priority: feedbackPrioritySchema.optional(),
  category: feedbackCategorySchema.optional(),
});

export const updateFeedbackSchema = createFeedbackSchema.partial();

// Consent validation schemas
export const consentTypeSchema = z.enum([
  "DATA_PROCESSING",
  "MEDICAL_TREATMENT",
  "MARKETING",
  "RESEARCH",
  "DATA_SHARING",
]);
export const legalBasisSchema = z.enum([
  "CONSENT",
  "CONTRACT",
  "LEGAL_OBLIGATION",
  "VITAL_INTERESTS",
  "PUBLIC_TASK",
  "LEGITIMATE_INTERESTS",
]);

export const createConsentRecordSchema = z.object({
  consentType: consentTypeSchema,
  purpose: createSecureString(1, 500),
  granted: z.boolean(),
  consentText: createSanitizedHTML(2000),
  consentVersion: createSecureString(1, 10),
  legalBasis: legalBasisSchema,
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  grantedAt: dateSchema.optional(),
  expiresAt: dateSchema.optional(),
});

export const updateConsentRecordSchema = createConsentRecordSchema.partial();

// Search and query validation
export const searchQuerySchema = z.object({
  query: z
    .string()
    .min(1, "Search query required")
    .max(100, "Search query too long")
    .refine(
      (q) => !SECURITY_PATTERNS.SQL_INJECTION.test(q),
      "Invalid search query"
    )
    .transform((q) => q.trim()),
  page: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(1000))
    .default(1),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .default(25),
  sortBy: z
    .enum(["createdAt", "updatedAt", "name", "date"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(1000))
    .default(1),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .default(25),
});

// Generic validation schemas
export const searchSchema = z.object({
  query: createSecureString(1, 100),
  filters: z.record(z.string(), z.any()).optional(),
});

// Doctor registration schema
export const doctorRegistrationSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Full name too long")
    .refine(
      (val) => !SECURITY_PATTERNS.SQL_INJECTION.test(val),
      "Contains potentially dangerous characters"
    )
    .refine(
      (val) => !SECURITY_PATTERNS.XSS_PATTERNS.test(val),
      "Contains potentially dangerous HTML"
    )
    .refine(
      (val) => !SECURITY_PATTERNS.COMMAND_INJECTION.test(val),
      "Contains potentially dangerous commands"
    )
    .transform((val) => val.trim()),
  email: emailSchema,
  password: passwordSchema,
  specialty: z
    .string()
    .min(1, "Specialty is required")
    .max(100, "Specialty too long")
    .refine(
      (val) => !SECURITY_PATTERNS.SQL_INJECTION.test(val),
      "Contains potentially dangerous characters"
    ),
  medicalLicenseNumber: z
    .string()
    .min(1, "Medical license number is required")
    .max(50, "Medical license number too long")
    .refine(
      (val) => !SECURITY_PATTERNS.SQL_INJECTION.test(val),
      "Contains potentially dangerous characters"
    ),
  gdprConsent: z
    .boolean()
    .refine((val) => val === true, "GDPR consent is required to register"),
});

// Patient registration schema
export const patientRegistrationSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Full name too long")
    .transform((val) => val.trim()),
  email: emailSchema,
  password: passwordSchema,
  gdprConsent: z
    .boolean()
    .refine((val) => val === true, "GDPR consent is required to register"),
});

// Export all schemas
export const validationSchemas = {
  user: {
    create: createUserSchema,
    update: updateUserSchema,
    login: loginSchema,
    register: registerSchema,
    role: userRoleSchema,
  },
  auth: {
    login: loginSchema,
    register: registerSchema,
    doctorRegister: doctorRegistrationSchema,
    patientRegister: patientRegistrationSchema,
    forgotPassword: forgotPasswordSchema,
    resetPassword: resetPasswordSchema,
    changePassword: changePasswordSchema,
    setupMFA: setupMFASchema,
    password: passwordSchema,
    email: emailSchema,
  },
  patient: {
    create: createPatientSchema,
    update: updatePatientSchema,
    gender: genderSchema,
    bloodType: bloodTypeSchema,
    status: patientStatusSchema,
  },
  medicalRecord: {
    create: createMedicalRecordSchema,
    update: updateMedicalRecordSchema,
    type: recordTypeSchema,
  },
  appointment: {
    create: createAppointmentSchema,
    update: updateAppointmentSchema,
    type: appointmentTypeSchema,
    status: appointmentStatusSchema,
    priority: priorityLevelSchema,
    locationType: locationTypeSchema,
  },
  consultation: {
    create: createConsultationSchema,
    update: updateConsultationSchema,
    type: consultationTypeSchema,
  },
  feedback: {
    create: createFeedbackSchema,
    update: updateFeedbackSchema,
    type: feedbackTypeSchema,
    priority: feedbackPrioritySchema,
    category: feedbackCategorySchema,
    status: feedbackStatusSchema,
  },
  consent: {
    create: createConsentRecordSchema,
    update: updateConsentRecordSchema,
    type: consentTypeSchema,
    legalBasis: legalBasisSchema,
  },
  common: {
    pagination: paginationSchema,
    search: searchSchema,
    searchQuery: searchQuerySchema,
  },
  security: {
    medicalId: medicalIdSchema,
    diagnosisCode: diagnosisCodeSchema,
    medicationName: medicationNameSchema,
    fileUpload: fileUploadSchema,
  },
};
