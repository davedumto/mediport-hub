// Medical Record Types
export interface MedicalRecord {
  id: string;
  patientId: string;
  recordType: MedicalRecordType;
  recordDate: Date;
  title: string;
  description?: string;
  findings?: string;
  recommendations?: string;
  isPrivate: boolean;
  restrictedAccess: boolean;
  accessRestrictions?: string[];
  tags?: string[];
  priority: MedicalRecordPriority;
  status: MedicalRecordStatus;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalRecordCreate {
  patientId: string;
  recordType: MedicalRecordType;
  recordDate: Date;
  title: string;
  description?: string;
  findings?: string;
  recommendations?: string;
  isPrivate?: boolean;
  restrictedAccess?: boolean;
  accessRestrictions?: string[];
  tags?: string[];
  priority?: MedicalRecordPriority;
  status?: MedicalRecordStatus;
}

export interface MedicalRecordUpdate {
  title?: string;
  description?: string;
  findings?: string;
  recommendations?: string;
  isPrivate?: boolean;
  restrictedAccess?: boolean;
  accessRestrictions?: string[];
  tags?: string[];
  priority?: MedicalRecordPriority;
  status?: MedicalRecordStatus;
}

export interface MedicalRecordSearch {
  patientId?: string;
  recordType?: MedicalRecordType;
  dateRange?: {
    start: Date;
    end: Date;
  };
  priority?: MedicalRecordPriority;
  status?: MedicalRecordStatus;
  tags?: string[];
  isPrivate?: boolean;
  createdBy?: string;
  search?: string;
}

// Appointment Types
export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  reason?: string;
  notesEncrypted?: Buffer;
  status: AppointmentStatus;
  type: AppointmentType;
  location?: string;
  roomNumber?: string;
  virtualMeetingUrl?: string;
  confirmationSent: boolean;
  reminderSentAt?: Date;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentCreate {
  patientId: string;
  doctorId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  reason?: string;
  notes?: string;
  status?: AppointmentStatus;
  type?: AppointmentType;
  location?: string;
  roomNumber?: string;
  virtualMeetingUrl?: string;
}

export interface AppointmentUpdate {
  title?: string;
  startTime?: Date;
  endTime?: Date;
  timezone?: string;
  reason?: string;
  notes?: string;
  status?: AppointmentStatus;
  type?: AppointmentType;
  location?: string;
  roomNumber?: string;
  virtualMeetingUrl?: string;
}

export interface AppointmentSearch {
  patientId?: string;
  doctorId?: string;
  status?: AppointmentStatus;
  type?: AppointmentType;
  dateRange?: {
    start: Date;
    end: Date;
  };
  location?: string;
  search?: string;
}

// Consultation Types
export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  chiefComplaintEncrypted?: Buffer;
  diagnosis?: string;
  treatmentPlanEncrypted?: Buffer;
  vitalSigns?: VitalSigns;
  prescriptions?: Prescription[];
  followUpInstructionsEncrypted?: Buffer;
  billingCodes?: string[];
  status: ConsultationStatus;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsultationCreate {
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  chiefComplaint?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  vitalSigns?: VitalSigns;
  prescriptions?: PrescriptionCreate[];
  followUpInstructions?: string;
  billingCodes?: string[];
  status?: ConsultationStatus;
}

export interface ConsultationUpdate {
  endTime?: Date;
  durationMinutes?: number;
  chiefComplaint?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  vitalSigns?: VitalSigns;
  prescriptions?: PrescriptionUpdate[];
  followUpInstructions?: string;
  billingCodes?: string[];
  status?: ConsultationStatus;
}

export interface ConsultationSearch {
  patientId?: string;
  doctorId?: string;
  appointmentId?: string;
  status?: ConsultationStatus;
  dateRange?: {
    start: Date;
    end: Date;
  };
  diagnosis?: string;
  search?: string;
}

// Vital Signs
export interface VitalSigns {
  bloodPressure?: {
    systolic: number;
    diastolic: number;
    unit: "mmHg";
  };
  heartRate?: {
    value: number;
    unit: "bpm";
  };
  temperature?: {
    value: number;
    unit: "°C" | "°F";
  };
  respiratoryRate?: {
    value: number;
    unit: "breaths/min";
  };
  oxygenSaturation?: {
    value: number;
    unit: "%";
  };
  weight?: {
    value: number;
    unit: "kg" | "lbs";
  };
  height?: {
    value: number;
    unit: "cm" | "inches";
  };
  bmi?: number;
  recordedAt: Date;
}

// Prescription Types
export interface Prescription {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  prescribedBy: string;
  prescribedAt: Date;
  status: PrescriptionStatus;
  refills?: number;
  refillsRemaining?: number;
  pharmacy?: string;
  cost?: number;
  insuranceCoverage?: boolean;
}

export interface PrescriptionCreate {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  refills?: number;
  pharmacy?: string;
  cost?: number;
  insuranceCoverage?: boolean;
}

export interface PrescriptionUpdate {
  medicationName?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  status?: PrescriptionStatus;
  refills?: number;
  refillsRemaining?: number;
  pharmacy?: string;
  cost?: number;
  insuranceCoverage?: boolean;
}

// Medical History
export interface MedicalHistory {
  id: string;
  patientId: string;
  condition: string;
  diagnosisDate?: Date;
  status: MedicalConditionStatus;
  severity?: MedicalConditionSeverity;
  description?: string;
  treatment?: string;
  medications?: string[];
  allergies?: string[];
  familyHistory?: boolean;
  notes?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalHistoryCreate {
  patientId: string;
  condition: string;
  diagnosisDate?: Date;
  status?: MedicalConditionStatus;
  severity?: MedicalConditionSeverity;
  description?: string;
  treatment?: string;
  medications?: string[];
  allergies?: string[];
  familyHistory?: boolean;
  notes?: string;
}

export interface MedicalHistoryUpdate {
  condition?: string;
  diagnosisDate?: Date;
  status?: MedicalConditionStatus;
  severity?: MedicalConditionSeverity;
  description?: string;
  treatment?: string;
  medications?: string[];
  allergies?: string[];
  familyHistory?: boolean;
  notes?: string;
}

// Lab Results
export interface LabResult {
  id: string;
  patientId: string;
  testName: string;
  testDate: Date;
  resultDate?: Date;
  value: string | number;
  unit?: string;
  referenceRange?: {
    low: number;
    high: number;
    unit: string;
  };
  status: LabResultStatus;
  category: LabTestCategory;
  notes?: string;
  orderedBy: string;
  performedBy?: string;
  labName?: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LabResultCreate {
  patientId: string;
  testName: string;
  testDate: Date;
  resultDate?: Date;
  value: string | number;
  unit?: string;
  referenceRange?: {
    low: number;
    high: number;
    unit: string;
  };
  status?: LabResultStatus;
  category: LabTestCategory;
  notes?: string;
  orderedBy: string;
  performedBy?: string;
  labName?: string;
}

export interface LabResultUpdate {
  testName?: string;
  testDate?: Date;
  resultDate?: Date;
  value?: string | number;
  unit?: string;
  referenceRange?: {
    low: number;
    high: number;
    unit: string;
  };
  status?: LabResultStatus;
  category?: LabTestCategory;
  notes?: string;
  performedBy?: string;
  labName?: string;
}

// Enums
export enum MedicalRecordType {
  CONSULTATION = "CONSULTATION",
  LAB_RESULT = "LAB_RESULT",
  IMAGING = "IMAGING",
  PRESCRIPTION = "PRESCRIPTION",
  PROCEDURE = "PROCEDURE",
  ALLERGY = "ALLERGY",
  IMMUNIZATION = "IMMUNIZATION",
  FAMILY_HISTORY = "FAMILY_HISTORY",
  SOCIAL_HISTORY = "SOCIAL_HISTORY",
  VITAL_SIGNS = "VITAL_SIGNS",
  NOTE = "NOTE",
  REFERRAL = "REFERRAL",
  DISCHARGE = "DISCHARGE",
  EMERGENCY = "EMERGENCY",
  OTHER = "OTHER",
}

export enum MedicalRecordPriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
  CRITICAL = "CRITICAL",
}

export enum MedicalRecordStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
  DELETED = "DELETED",
}

export enum AppointmentStatus {
  SCHEDULED = "SCHEDULED",
  CONFIRMED = "CONFIRMED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
  RESCHEDULED = "RESCHEDULED",
}

export enum AppointmentType {
  CONSULTATION = "CONSULTATION",
  FOLLOW_UP = "FOLLOW_UP",
  EMERGENCY = "EMERGENCY",
  ROUTINE = "ROUTINE",
  SPECIALIST = "SPECIALIST",
  LAB_TEST = "LAB_TEST",
  IMAGING = "IMAGING",
  PROCEDURE = "PROCEDURE",
  VIRTUAL = "VIRTUAL",
  HOME_VISIT = "HOME_VISIT",
}

export enum ConsultationStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export enum PrescriptionStatus {
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
  REFILLED = "REFILLED",
}

export enum MedicalConditionStatus {
  ACTIVE = "ACTIVE",
  RESOLVED = "RESOLVED",
  CHRONIC = "CHRONIC",
  REMISSION = "REMISSION",
  RECURRING = "RECURRING",
}

export enum MedicalConditionSeverity {
  MILD = "MILD",
  MODERATE = "MODERATE",
  SEVERE = "SEVERE",
  CRITICAL = "CRITICAL",
}

export enum LabResultStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  ERROR = "ERROR",
}

export enum LabTestCategory {
  BLOOD_CHEMISTRY = "BLOOD_CHEMISTRY",
  HEMATOLOGY = "HEMATOLOGY",
  IMMUNOLOGY = "IMMUNOLOGY",
  MICROBIOLOGY = "MICROBIOLOGY",
  PATHOLOGY = "PATHOLOGY",
  RADIOLOGY = "RADIOLOGY",
  CARDIOLOGY = "CARDIOLOGY",
  NEUROLOGY = "NEUROLOGY",
  OTHER = "OTHER",
}

// Medical Statistics
export interface MedicalStatistics {
  patientId: string;
  totalRecords: number;
  totalAppointments: number;
  totalConsultations: number;
  totalPrescriptions: number;
  totalLabResults: number;
  activeConditions: number;
  upcomingAppointments: number;
  lastVisit?: Date;
  nextAppointment?: Date;
  averageConsultationDuration: number;
  complianceRate: number;
  riskFactors: string[];
  alerts: MedicalAlert[];
}

export interface MedicalAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  patientId: string;
  relatedRecordId?: string;
  isActive: boolean;
  createdAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export enum AlertType {
  ALLERGY = "ALLERGY",
  DRUG_INTERACTION = "DRUG_INTERACTION",
  ABNORMAL_LAB = "ABNORMAL_LAB",
  MISSED_APPOINTMENT = "MISSED_APPOINTMENT",
  MEDICATION_DUE = "MEDICATION_DUE",
  FOLLOW_UP_DUE = "FOLLOW_UP_DUE",
  HIGH_RISK = "HIGH_RISK",
  OTHER = "OTHER",
}

export enum AlertSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}
