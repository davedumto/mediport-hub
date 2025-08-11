// Consent Management Types
export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: ConsentType;
  purpose: string;
  granted: boolean;
  consentText: string;
  consentVersion: string;
  legalBasis: LegalBasis;
  grantedAt?: Date;
  withdrawnAt?: Date;
  expiresAt?: Date;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentRecordCreate {
  userId: string;
  consentType: ConsentType;
  purpose: string;
  granted: boolean;
  consentText: string;
  consentVersion: string;
  legalBasis: LegalBasis;
  expiresAt?: Date;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

export interface ConsentRecordUpdate {
  granted?: boolean;
  withdrawnAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface ConsentRecordSearch {
  userId?: string;
  consentType?: ConsentType;
  granted?: boolean;
  legalBasis?: LegalBasis;
  dateRange?: {
    start: Date;
    end: Date;
  };
  active?: boolean;
  search?: string;
}

// Data Processing Consent
export interface DataProcessingConsent {
  id: string;
  userId: string;
  dataCategory: DataCategory[];
  processingPurpose: ProcessingPurpose[];
  thirdPartySharing: boolean;
  thirdParties?: string[];
  retentionPeriod: number; // in days
  automatedDecisionMaking: boolean;
  profiling: boolean;
  internationalTransfer: boolean;
  transferCountries?: string[];
  granted: boolean;
  grantedAt?: Date;
  withdrawnAt?: Date;
  expiresAt?: Date;
  consentVersion: string;
  legalBasis: LegalBasis;
  ipAddress: string;
  userAgent: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataProcessingConsentCreate {
  userId: string;
  dataCategory: DataCategory[];
  processingPurpose: ProcessingPurpose[];
  thirdPartySharing: boolean;
  thirdParties?: string[];
  retentionPeriod: number;
  automatedDecisionMaking: boolean;
  profiling: boolean;
  internationalTransfer: boolean;
  transferCountries?: string[];
  granted: boolean;
  expiresAt?: Date;
  consentVersion: string;
  legalBasis: LegalBasis;
  ipAddress: string;
  userAgent: string;
}

export interface DataProcessingConsentUpdate {
  granted?: boolean;
  withdrawnAt?: Date;
  expiresAt?: Date;
  thirdPartySharing?: boolean;
  thirdParties?: string[];
  retentionPeriod?: number;
  automatedDecisionMaking?: boolean;
  profiling?: boolean;
  internationalTransfer?: boolean;
  transferCountries?: string[];
}

// Medical Consent
export interface MedicalConsent {
  id: string;
  patientId: string;
  consentType: MedicalConsentType;
  procedure?: string;
  risks?: string[];
  alternatives?: string[];
  benefits?: string[];
  questionsAnswered: boolean;
  interpreterUsed?: boolean;
  interpreterLanguage?: string;
  witnessPresent?: boolean;
  witnessName?: string;
  granted: boolean;
  grantedAt?: Date;
  withdrawnAt?: Date;
  expiresAt?: Date;
  consentVersion: string;
  legalBasis: LegalBasis;
  ipAddress: string;
  userAgent: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalConsentCreate {
  patientId: string;
  consentType: MedicalConsentType;
  procedure?: string;
  risks?: string[];
  alternatives?: string[];
  benefits?: string[];
  questionsAnswered: boolean;
  interpreterUsed?: boolean;
  interpreterLanguage?: string;
  witnessPresent?: boolean;
  witnessName?: string;
  granted: boolean;
  expiresAt?: Date;
  consentVersion: string;
  legalBasis: LegalBasis;
  ipAddress: string;
  userAgent: string;
}

export interface MedicalConsentUpdate {
  granted?: boolean;
  withdrawnAt?: Date;
  expiresAt?: Date;
  risks?: string[];
  alternatives?: string[];
  benefits?: string[];
  questionsAnswered?: boolean;
}

// Consent Templates
export interface ConsentTemplate {
  id: string;
  name: string;
  description: string;
  consentType: ConsentType;
  templateVersion: string;
  content: string;
  legalBasis: LegalBasis[];
  requiredFields: string[];
  optionalFields: string[];
  defaultRetentionPeriod?: number;
  isActive: boolean;
  applicableRoles: string[];
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentTemplateCreate {
  name: string;
  description: string;
  consentType: ConsentType;
  templateVersion: string;
  content: string;
  legalBasis: LegalBasis[];
  requiredFields: string[];
  optionalFields: string[];
  defaultRetentionPeriod?: number;
  applicableRoles: string[];
}

export interface ConsentTemplateUpdate {
  name?: string;
  description?: string;
  templateVersion?: string;
  content?: string;
  legalBasis?: LegalBasis[];
  requiredFields?: string[];
  optionalFields?: string[];
  defaultRetentionPeriod?: number;
  isActive?: boolean;
  applicableRoles?: string[];
}

// Consent Workflow
export interface ConsentWorkflow {
  id: string;
  name: string;
  description: string;
  steps: ConsentWorkflowStep[];
  isActive: boolean;
  applicableConsentTypes: ConsentType[];
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentWorkflowStep {
  stepNumber: number;
  name: string;
  description: string;
  action: ConsentAction;
  required: boolean;
  order: number;
  conditions?: ConsentCondition[];
  timeout?: number; // in hours
}

export interface ConsentCondition {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
  value: any;
  logicalOperator?: "AND" | "OR";
}

export interface ConsentAction {
  type: "user_action" | "system_action" | "notification" | "approval";
  description: string;
  parameters?: Record<string, any>;
}

// Consent Audit
export interface ConsentAudit {
  id: string;
  consentId: string;
  action: ConsentAuditAction;
  userId: string;
  userRole: string;
  timestamp: Date;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  metadata?: Record<string, any>;
}

export interface ConsentAuditCreate {
  consentId: string;
  action: ConsentAuditAction;
  userId: string;
  userRole: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  metadata?: Record<string, any>;
}

// Consent Statistics
export interface ConsentStatistics {
  totalConsents: number;
  activeConsents: number;
  expiredConsents: number;
  withdrawnConsents: number;
  consentByType: Record<ConsentType, number>;
  consentByStatus: Record<ConsentStatus, number>;
  averageRetentionPeriod: number;
  complianceRate: number;
  recentWithdrawals: number;
  upcomingExpirations: number;
}

// Enums
export enum ConsentType {
  GENERAL_TERMS = "GENERAL_TERMS",
  PRIVACY_POLICY = "PRIVACY_POLICY",
  DATA_PROCESSING = "DATA_PROCESSING",
  MARKETING = "MARKETING",
  THIRD_PARTY_SHARING = "THIRD_PARTY_SHARING",
  MEDICAL_TREATMENT = "MEDICAL_TREATMENT",
  MEDICAL_RESEARCH = "MEDICAL_RESEARCH",
  PHOTO_VIDEO = "PHOTO_VIDEO",
  EMERGENCY_CONTACT = "EMERGENCY_CONTACT",
  INSURANCE = "INSURANCE",
  BILLING = "BILLING",
  OTHER = "OTHER",
}

export enum MedicalConsentType {
  TREATMENT = "TREATMENT",
  PROCEDURE = "PROCEDURE",
  MEDICATION = "MEDICATION",
  ANESTHESIA = "ANESTHESIA",
  BLOOD_TRANSFUSION = "BLOOD_TRANSFUSION",
  RESEARCH = "RESEARCH",
  ORGAN_DONATION = "ORGAN_DONATION",
  AUTOPSY = "AUTOPSY",
  PHOTO_VIDEO = "PHOTO_VIDEO",
  OTHER = "OTHER",
}

export enum LegalBasis {
  CONSENT = "CONSENT",
  CONTRACT = "CONTRACT",
  LEGAL_OBLIGATION = "LEGAL_OBLIGATION",
  VITAL_INTERESTS = "VITAL_INTERESTS",
  PUBLIC_TASK = "PUBLIC_TASK",
  LEGITIMATE_INTERESTS = "LEGITIMATE_INTERESTS",
  MEDICAL_TREATMENT = "MEDICAL_TREATMENT",
  PUBLIC_HEALTH = "PUBLIC_HEALTH",
  SCIENTIFIC_RESEARCH = "SCIENTIFIC_RESEARCH",
  OTHER = "OTHER",
}

export enum DataCategory {
  PERSONAL_IDENTIFIERS = "PERSONAL_IDENTIFIERS",
  MEDICAL_RECORDS = "MEDICAL_RECORDS",
  FINANCIAL_INFORMATION = "FINANCIAL_INFORMATION",
  CONTACT_INFORMATION = "CONTACT_INFORMATION",
  DEMOGRAPHIC_DATA = "DEMOGRAPHIC_DATA",
  BIOMETRIC_DATA = "BIOMETRIC_DATA",
  GENETIC_DATA = "GENETIC_DATA",
  HEALTH_INSURANCE = "HEALTH_INSURANCE",
  FAMILY_HISTORY = "FAMILY_HISTORY",
  LIFESTYLE_DATA = "LIFESTYLE_DATA",
  OTHER = "OTHER",
}

export enum ProcessingPurpose {
  MEDICAL_TREATMENT = "MEDICAL_TREATMENT",
  BILLING = "BILLING",
  INSURANCE = "INSURANCE",
  RESEARCH = "RESEARCH",
  PUBLIC_HEALTH = "PUBLIC_HEALTH",
  QUALITY_IMPROVEMENT = "QUALITY_IMPROVEMENT",
  TRAINING = "TRAINING",
  MARKETING = "MARKETING",
  THIRD_PARTY_SERVICES = "THIRD_PARTY_SERVICES",
  OTHER = "OTHER",
}

export enum ConsentStatus {
  PENDING = "PENDING",
  GRANTED = "GRANTED",
  WITHDRAWN = "WITHDRAWN",
  EXPIRED = "EXPIRED",
  INVALID = "INVALID",
}

export enum ConsentAuditAction {
  CREATED = "CREATED",
  GRANTED = "GRANTED",
  WITHDRAWN = "WITHDRAWN",
  EXPIRED = "EXPIRED",
  UPDATED = "UPDATED",
  VIEWED = "VIEWED",
  EXPORTED = "EXPORTED",
  DELETED = "DELETED",
}

// Consent Notifications
export interface ConsentNotification {
  id: string;
  userId: string;
  consentId: string;
  type: ConsentNotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  actionRequired: boolean;
  actionUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
  readAt?: Date;
}

export enum ConsentNotificationType {
  CONSENT_EXPIRING = "CONSENT_EXPIRING",
  CONSENT_EXPIRED = "CONSENT_EXPIRED",
  CONSENT_WITHDRAWN = "CONSENT_WITHDRAWN",
  NEW_CONSENT_REQUIRED = "NEW_CONSENT_REQUIRED",
  CONSENT_UPDATED = "CONSENT_UPDATED",
  COMPLIANCE_ALERT = "COMPLIANCE_ALERT",
  OTHER = "OTHER",
}

export enum NotificationPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

// Consent Compliance
export interface ConsentCompliance {
  userId: string;
  overallCompliance: number; // percentage
  missingConsents: ConsentType[];
  expiredConsents: ConsentType[];
  upcomingExpirations: Array<{
    consentType: ConsentType;
    expiresAt: Date;
    daysUntilExpiry: number;
  }>;
  complianceScore: number;
  lastReviewDate?: Date;
  nextReviewDate?: Date;
  riskLevel: ComplianceRiskLevel;
  recommendations: string[];
}

export enum ComplianceRiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}
