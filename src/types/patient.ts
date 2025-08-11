import { Gender, BloodType, PatientStatus } from "@prisma/client";

// Base patient types
export interface BasePatient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: Date;
  gender: Gender;
  bloodType?: BloodType;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  status: PatientStatus;
  gdprConsent: boolean;
  gdprConsentDate?: Date;
  gdprConsentVersion?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Patient extends BasePatient {
  userId?: string;
  assignedProviderId?: string;
  // Encrypted fields (stored as encrypted bytes in database)
  phoneEncrypted?: Uint8Array;
  addressStreetEncrypted?: Uint8Array;
  addressCityEncrypted?: Uint8Array;
  addressStateEncrypted?: Uint8Array;
  addressZipEncrypted?: Uint8Array;
  addressCountryEncrypted?: Uint8Array;
  emergencyNameEncrypted?: Uint8Array;
  emergencyRelationshipEncrypted?: Uint8Array;
  emergencyPhoneEncrypted?: Uint8Array;
  createdBy?: string;
  updatedBy?: string;
}

// Decrypted patient data (for API responses)
export interface PatientData extends BasePatient {
  userId?: string;
  assignedProviderId?: string;
  phone?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  addressCountry?: string;
  emergencyName?: string;
  emergencyRelationship?: string;
  emergencyPhone?: string;
  createdBy?: string;
  updatedBy?: string;
}

// Patient creation and update types
export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  gender: Gender;
  phone?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  addressCountry?: string;
  emergencyName?: string;
  emergencyRelationship?: string;
  emergencyPhone?: string;
  bloodType?: BloodType;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  assignedProviderId?: string;
  gdprConsent: boolean;
}

export interface CreatePatientResponse {
  success: boolean;
  patient: PatientData;
  message: string;
}

export interface UpdatePatientRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: Gender;
  phone?: string;
  addressStreet?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  addressCountry?: string;
  emergencyName?: string;
  emergencyRelationship?: string;
  emergencyPhone?: string;
  bloodType?: BloodType;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  assignedProviderId?: string;
  status?: PatientStatus;
  gdprConsent?: boolean;
}

export interface UpdatePatientResponse {
  success: boolean;
  patient: PatientData;
  message: string;
}

// Patient profile types
export interface PatientProfile extends PatientData {
  fullName: string;
  age: number;
  displayName: string;
  avatar?: string;
  assignedProvider?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  medicalSummary: MedicalSummary;
  contactInfo: ContactInfo;
  emergencyContacts: EmergencyContact[];
  insuranceInfo?: InsuranceInfo;
  preferences: PatientPreferences;
}

export interface MedicalSummary {
  lastVisit?: Date;
  nextAppointment?: Date;
  activeConditions: string[];
  recentMedications: string[];
  allergies: string[];
  immunizations: Immunization[];
  familyHistory: FamilyHistory[];
}

export interface Immunization {
  name: string;
  date: Date;
  nextDue?: Date;
  status: "completed" | "due" | "overdue";
}

export interface FamilyHistory {
  relation: string;
  condition: string;
  ageOfOnset?: number;
  notes?: string;
}

export interface ContactInfo {
  primaryPhone?: string;
  secondaryPhone?: string;
  email: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  preferredContactMethod: "phone" | "email" | "sms";
  preferredContactTime: "morning" | "afternoon" | "evening";
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
  canMakeDecisions: boolean;
}

export interface InsuranceInfo {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  subscriberName: string;
  relationship: string;
  effectiveDate: Date;
  expiryDate?: Date;
  copay?: number;
  deductible?: number;
  notes?: string;
}

export interface PatientPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: "12h" | "24h";
  notifications: PatientNotificationPreferences;
  privacy: PatientPrivacyPreferences;
  accessibility: PatientAccessibilityPreferences;
}

export interface PatientNotificationPreferences {
  appointmentReminders: boolean;
  medicationReminders: boolean;
  testResults: boolean;
  followUpReminders: boolean;
  healthTips: boolean;
  emergencyAlerts: boolean;
  method: "email" | "sms" | "push" | "all";
}

export interface PatientPrivacyPreferences {
  shareDataWithProviders: boolean;
  shareDataForResearch: boolean;
  shareDataWithFamily: boolean;
  allowMarketing: boolean;
  dataRetentionPeriod: number; // in years
}

export interface PatientAccessibilityPreferences {
  fontSize: "small" | "medium" | "large";
  highContrast: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  audioDescriptions: boolean;
}

// Patient search and filtering types
export interface PatientSearchFilters {
  status?: PatientStatus;
  gender?: Gender;
  bloodType?: BloodType;
  assignedProviderId?: string;
  ageRange?: {
    min: number;
    max: number;
  };
  hasAllergies?: boolean;
  hasChronicConditions?: boolean;
  gdprConsent?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  searchTerm?: string;
}

export interface PatientSearchRequest {
  filters: PatientSearchFilters;
  pagination: {
    page: number;
    limit: number;
  };
  sorting: {
    field: keyof PatientData;
    order: "asc" | "desc";
  };
}

export interface PatientSearchResponse {
  success: boolean;
  patients: PatientData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Patient statistics types
export interface PatientStatistics {
  totalPatients: number;
  activePatients: number;
  inactivePatients: number;
  archivedPatients: number;
  patientsByGender: Record<Gender, number>;
  patientsByBloodType: Record<BloodType, number>;
  patientsByAgeGroup: Record<string, number>;
  patientsByStatus: Record<PatientStatus, number>;
  averageAge: number;
  newPatientsThisMonth: number;
  patientsWithAllergies: number;
  patientsWithChronicConditions: number;
}

export interface PatientDemographics {
  totalPatients: number;
  genderDistribution: Record<Gender, number>;
  ageDistribution: Record<string, number>;
  bloodTypeDistribution: Record<BloodType, number>;
  geographicDistribution: Record<string, number>;
  insuranceDistribution: Record<string, number>;
}

// Patient import/export types
export interface PatientImportRequest {
  patients: Omit<CreatePatientRequest, "gdprConsent">[];
  sendWelcomeEmail: boolean;
  assignDefaultProvider: boolean;
  validateOnly: boolean;
  gdprConsentDefault: boolean;
}

export interface PatientImportResponse {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    email: string;
    error: string;
  }>;
  message: string;
}

export interface PatientExportRequest {
  filters: PatientSearchFilters;
  format: "csv" | "json" | "xlsx";
  includeSensitiveData: boolean;
  includeMedicalData: boolean;
}

export interface PatientExportResponse {
  success: boolean;
  downloadUrl: string;
  expiresAt: Date;
  recordCount: number;
}

// Patient bulk operations
export interface BulkPatientOperation {
  operation:
    | "activate"
    | "deactivate"
    | "archive"
    | "assignProvider"
    | "sendEmail"
    | "updateStatus";
  patientIds: string[];
  parameters?: Record<string, any>;
}

export interface BulkPatientOperationResponse {
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{
    patientId: string;
    error: string;
  }>;
  message: string;
}

// Patient audit types
export interface PatientAuditLog {
  id: string;
  patientId: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PatientAuditRequest {
  patientId: string;
  startDate?: Date;
  endDate?: Date;
  actions?: string[];
  limit?: number;
}

export interface PatientAuditResponse {
  success: boolean;
  logs: PatientAuditLog[];
  total: number;
}

// Patient consent management
export interface ConsentManagement {
  patientId: string;
  consents: ConsentRecord[];
  lastUpdated: Date;
  nextReviewDate: Date;
}

export interface ConsentRecord {
  type: string;
  purpose: string;
  granted: boolean;
  grantedAt?: Date;
  withdrawnAt?: Date;
  expiresAt?: Date;
  version: string;
  legalBasis: string;
}

export interface UpdateConsentRequest {
  patientId: string;
  consentType: string;
  granted: boolean;
  purpose: string;
  legalBasis: string;
  expiresAt?: Date;
}

export interface UpdateConsentResponse {
  success: boolean;
  consent: ConsentRecord;
  message: string;
}

// Patient health summary
export interface PatientHealthSummary {
  patientId: string;
  lastUpdated: Date;
  vitalSigns: VitalSigns;
  currentMedications: Medication[];
  allergies: Allergy[];
  conditions: MedicalCondition[];
  immunizations: Immunization[];
  recentTests: LabTest[];
  upcomingAppointments: Appointment[];
}

export interface VitalSigns {
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  oxygenSaturation?: number;
  lastRecorded: Date;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  status: "active" | "discontinued" | "completed";
  notes?: string;
}

export interface Allergy {
  allergen: string;
  severity: "mild" | "moderate" | "severe";
  reaction: string;
  onsetDate: Date;
  lastReaction?: Date;
  notes?: string;
}

export interface MedicalCondition {
  name: string;
  diagnosisDate: Date;
  status: "active" | "resolved" | "chronic";
  severity: "mild" | "moderate" | "severe";
  notes?: string;
}

export interface LabTest {
  name: string;
  date: Date;
  result: string;
  normalRange?: string;
  status: "pending" | "completed" | "abnormal";
  orderedBy: string;
}

export interface Appointment {
  id: string;
  type: string;
  scheduledAt: Date;
  provider: string;
  status: string;
  notes?: string;
}
