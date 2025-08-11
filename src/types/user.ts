import { UserRole } from "@prisma/client";

// Base user types
export interface BaseUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  dateOfBirth?: Date;
  isActive: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseUser {
  mfaSecret?: string;
  lastLogin?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  passwordHistory: string[];
  createdBy?: string;
  updatedBy?: string;
}

// User creation and update types
export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  dateOfBirth?: string;
}

export interface CreateUserResponse {
  success: boolean;
  user: Omit<User, "passwordHash" | "mfaSecret" | "passwordHistory">;
  message: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  isActive?: boolean;
}

export interface UpdateUserResponse {
  success: boolean;
  user: User;
  message: string;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
  reason?: string;
}

export interface UpdateUserRoleResponse {
  success: boolean;
  user: User;
  message: string;
}

// User profile types
export interface UserProfile extends BaseUser {
  fullName: string;
  age?: number;
  displayName: string;
  avatar?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: "12h" | "24h";
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  accessibility: AccessibilityPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  appointmentReminders: boolean;
  medicalUpdates: boolean;
  securityAlerts: boolean;
  marketing: boolean;
}

export interface PrivacyPreferences {
  profileVisibility: "public" | "private" | "friends";
  showEmail: boolean;
  showPhone: boolean;
  showDateOfBirth: boolean;
  allowDataSharing: boolean;
  allowAnalytics: boolean;
}

export interface AccessibilityPreferences {
  fontSize: "small" | "medium" | "large";
  highContrast: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
}

// User search and filtering types
export interface UserSearchFilters {
  role?: UserRole;
  isActive?: boolean;
  emailVerified?: boolean;
  mfaEnabled?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  searchTerm?: string;
}

export interface UserSearchRequest {
  filters: UserSearchFilters;
  pagination: {
    page: number;
    limit: number;
  };
  sorting: {
    field: keyof User;
    order: "asc" | "desc";
  };
}

export interface UserSearchResponse {
  success: boolean;
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// User statistics types
export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: Record<UserRole, number>;
  usersByStatus: {
    emailVerified: number;
    emailUnverified: number;
    mfaEnabled: number;
    mfaDisabled: number;
  };
  recentRegistrations: number;
  averageAge?: number;
  genderDistribution?: Record<string, number>;
}

export interface UserActivityMetrics {
  userId: string;
  lastLogin: Date;
  loginCount: number;
  failedLoginAttempts: number;
  passwordChanges: number;
  profileUpdates: number;
  sessionDuration: number;
  actionsPerSession: number;
}

// User import/export types
export interface UserImportRequest {
  users: Omit<CreateUserRequest, "password">[];
  sendWelcomeEmail: boolean;
  assignDefaultRole: boolean;
  validateOnly: boolean;
}

export interface UserImportResponse {
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

export interface UserExportRequest {
  filters: UserSearchFilters;
  format: "csv" | "json" | "xlsx";
  includeSensitiveData: boolean;
}

export interface UserExportResponse {
  success: boolean;
  downloadUrl: string;
  expiresAt: Date;
  recordCount: number;
}

// User bulk operations
export interface BulkUserOperation {
  operation: "activate" | "deactivate" | "delete" | "changeRole" | "sendEmail";
  userIds: string[];
  parameters?: Record<string, any>;
}

export interface BulkUserOperationResponse {
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{
    userId: string;
    error: string;
  }>;
  message: string;
}

// User audit types
export interface UserAuditLog {
  id: string;
  userId: string;
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

export interface UserAuditRequest {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  actions?: string[];
  limit?: number;
}

export interface UserAuditResponse {
  success: boolean;
  logs: UserAuditLog[];
  total: number;
}

// User session management
export interface UserSessionInfo {
  id: string;
  deviceInfo?: {
    deviceType: string;
    browser: string;
    os: string;
    ipAddress: string;
  };
  createdAt: Date;
  lastAccessed: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface UserSessionsResponse {
  success: boolean;
  sessions: UserSessionInfo[];
  activeSessions: number;
  totalSessions: number;
}

export interface RevokeSessionRequest {
  sessionId: string;
  reason?: string;
}

export interface RevokeSessionResponse {
  success: boolean;
  message: string;
}

// User verification types
export interface EmailVerificationRequest {
  email: string;
}

export interface EmailVerificationResponse {
  success: boolean;
  message: string;
  expiresIn: number;
}

export interface PhoneVerificationRequest {
  phone: string;
}

export interface PhoneVerificationResponse {
  success: boolean;
  message: string;
  expiresIn: number;
}

export interface VerifyCodeRequest {
  type: "email" | "phone";
  identifier: string;
  code: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  message: string;
  verified: boolean;
}

// User onboarding types
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  order: number;
}

export interface OnboardingProgress {
  userId: string;
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  steps: OnboardingStep[];
  completed: boolean;
}

export interface CompleteOnboardingStepRequest {
  stepId: string;
  data?: Record<string, any>;
}

export interface CompleteOnboardingStepResponse {
  success: boolean;
  progress: OnboardingProgress;
  message: string;
}
