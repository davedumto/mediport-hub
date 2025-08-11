// User Session Types
export interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  refreshToken: string;
  deviceId?: string;
  deviceType?: DeviceType;
  deviceName?: string;
  browser?: string;
  browserVersion?: string;
  operatingSystem?: string;
  osVersion?: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  };
  isActive: boolean;
  lastActivity: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSessionCreate {
  userId: string;
  sessionToken: string;
  refreshToken: string;
  deviceId?: string;
  deviceType?: DeviceType;
  deviceName?: string;
  browser?: string;
  browserVersion?: string;
  operatingSystem?: string;
  osVersion?: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  };
  expiresAt: Date;
}

export interface UserSessionUpdate {
  isActive?: boolean;
  lastActivity?: Date;
  expiresAt?: Date;
  deviceName?: string;
  location?: {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
  };
}

export interface UserSessionSearch {
  userId?: string;
  deviceId?: string;
  deviceType?: DeviceType;
  ipAddress?: string;
  isActive?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

// Authentication Types
export interface AuthenticationContext {
  userId: string;
  userEmail: string;
  userRole: string;
  permissions: string[];
  sessionId: string;
  deviceId?: string;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  timestamp: Date;
  expiresAt: Date;
}

export interface AuthenticationRequest {
  email: string;
  password: string;
  deviceId?: string;
  deviceType?: DeviceType;
  deviceName?: string;
  browser?: string;
  browserVersion?: string;
  operatingSystem?: string;
  osVersion?: string;
  ipAddress: string;
  userAgent: string;
  rememberMe?: boolean;
  mfaCode?: string;
  captchaToken?: string;
}

export interface AuthenticationResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: string[];
    mfaEnabled: boolean;
    lastLoginAt?: Date;
  };
  session?: {
    sessionToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
  mfaRequired?: {
    type: MFAType;
    challenge: string;
    expiresAt: Date;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface MFAChallenge {
  id: string;
  userId: string;
  type: MFAType;
  challenge: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  isUsed: boolean;
  createdAt: Date;
}

export interface MFAChallengeCreate {
  userId: string;
  type: MFAType;
  challenge: string;
  expiresAt: Date;
  maxAttempts?: number;
}

export interface MFAVerification {
  userId: string;
  challengeId: string;
  code: string;
  deviceId?: string;
  ipAddress: string;
  userAgent: string;
}

export interface MFAVerificationResponse {
  success: boolean;
  session?: {
    sessionToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
  error?: {
    code: string;
    message: string;
    attemptsRemaining?: number;
  };
}

// Role and Permission Types
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  priority: number;
  metadata?: Record<string, any>;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleCreate {
  name: string;
  description: string;
  permissions: string[];
  isSystem?: boolean;
  priority?: number;
  metadata?: Record<string, any>;
}

export interface RoleUpdate {
  name?: string;
  description?: string;
  permissions?: string[];
  isActive?: boolean;
  priority?: number;
  metadata?: Record<string, any>;
}

export interface RoleSearch {
  name?: string;
  isSystem?: boolean;
  isActive?: boolean;
  permissions?: string[];
  search?: string;
}

export interface UserRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRoleAssignmentCreate {
  userId: string;
  roleId: string;
  assignedBy: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface UserRoleAssignmentUpdate {
  expiresAt?: Date;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

// Permission Types
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: PermissionCondition[];
  isSystem: boolean;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PermissionCreate {
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: PermissionCondition[];
  isSystem?: boolean;
  metadata?: Record<string, any>;
}

export interface PermissionUpdate {
  name?: string;
  description?: string;
  resource?: string;
  action?: string;
  conditions?: PermissionCondition[];
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface PermissionCondition {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "greater_than"
    | "less_than"
    | "in"
    | "not_in";
  value: any;
  logicalOperator?: "AND" | "OR";
}

// Session Management
export interface SessionManagement {
  activeSessions: UserSession[];
  totalSessions: number;
  activeDevices: number;
  recentActivity: Array<{
    timestamp: Date;
    action: string;
    device: string;
    location: string;
  }>;
  securityAlerts: SecurityAlert[];
}

export interface SecurityAlert {
  id: string;
  type: SecurityAlertType;
  severity: SecurityAlertSeverity;
  message: string;
  userId: string;
  sessionId?: string;
  deviceId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface SecurityAlertCreate {
  type: SecurityAlertType;
  severity: SecurityAlertSeverity;
  message: string;
  userId: string;
  sessionId?: string;
  deviceId?: string;
  ipAddress: string;
  userAgent: string;
}

export interface SecurityAlertUpdate {
  isResolved?: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolutionNotes?: string;
  severity?: SecurityAlertSeverity;
}

// Device Management
export interface DeviceInfo {
  id: string;
  userId: string;
  deviceId: string;
  deviceType: DeviceType;
  deviceName: string;
  browser?: string;
  browserVersion?: string;
  operatingSystem?: string;
  osVersion?: string;
  isTrusted: boolean;
  isActive: boolean;
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeviceInfoCreate {
  userId: string;
  deviceId: string;
  deviceType: DeviceType;
  deviceName: string;
  browser?: string;
  browserVersion?: string;
  operatingSystem?: string;
  osVersion?: string;
  isTrusted?: boolean;
}

export interface DeviceInfoUpdate {
  deviceName?: string;
  isTrusted?: boolean;
  isActive?: boolean;
  lastUsed?: Date;
}

// Session Statistics
export interface SessionStatistics {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  sessionsByDeviceType: Record<DeviceType, number>;
  sessionsByRole: Record<string, number>;
  averageSessionDuration: number;
  concurrentUsers: number;
  peakConcurrentUsers: number;
  peakTime: Date;
  recentTrends: Array<{
    date: string;
    activeSessions: number;
    newSessions: number;
    expiredSessions: number;
  }>;
}

// Enums
export enum DeviceType {
  DESKTOP = "DESKTOP",
  LAPTOP = "LAPTOP",
  TABLET = "TABLET",
  MOBILE = "MOBILE",
  SMART_TV = "SMART_TV",
  WEARABLE = "WEARABLE",
  OTHER = "OTHER",
}

export enum MFAType {
  TOTP = "TOTP",
  SMS = "SMS",
  EMAIL = "EMAIL",
  PUSH_NOTIFICATION = "PUSH_NOTIFICATION",
  HARDWARE_TOKEN = "HARDWARE_TOKEN",
  BIOMETRIC = "BIOMETRIC",
  OTHER = "OTHER",
}

export enum SecurityAlertType {
  SUSPICIOUS_LOGIN = "SUSPICIOUS_LOGIN",
  MULTIPLE_FAILED_ATTEMPTS = "MULTIPLE_FAILED_ATTEMPTS",
  UNUSUAL_LOCATION = "UNUSUAL_LOCATION",
  UNUSUAL_DEVICE = "UNUSUAL_DEVICE",
  UNUSUAL_TIME = "UNUSUAL_TIME",
  SESSION_HIJACKING = "SESSION_HIJACKING",
  BRUTE_FORCE_ATTEMPT = "BRUTE_FORCE_ATTEMPT",
  ACCOUNT_TAKEOVER = "ACCOUNT_TAKEOVER",
  DATA_EXFILTRATION = "DATA_EXFILTRATION",
  OTHER = "OTHER",
}

export enum SecurityAlertSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

// Session Policies
export interface SessionPolicy {
  id: string;
  name: string;
  description: string;
  maxSessionsPerUser: number;
  sessionTimeoutMinutes: number;
  idleTimeoutMinutes: number;
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  requireMFA: boolean;
  mfaTimeoutMinutes: number;
  allowedDeviceTypes: DeviceType[];
  blockedCountries: string[];
  allowedIPRanges: string[];
  blockedIPRanges: string[];
  isActive: boolean;
  applicableRoles: string[];
  createdBy: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionPolicyCreate {
  name: string;
  description: string;
  maxSessionsPerUser: number;
  sessionTimeoutMinutes: number;
  idleTimeoutMinutes: number;
  maxFailedAttempts: number;
  lockoutDurationMinutes: number;
  requireMFA: boolean;
  mfaTimeoutMinutes: number;
  allowedDeviceTypes: DeviceType[];
  blockedCountries: string[];
  allowedIPRanges: string[];
  blockedIPRanges: string[];
  applicableRoles: string[];
}

export interface SessionPolicyUpdate {
  name?: string;
  description?: string;
  maxSessionsPerUser?: number;
  sessionTimeoutMinutes?: number;
  idleTimeoutMinutes?: number;
  maxFailedAttempts?: number;
  lockoutDurationMinutes?: number;
  requireMFA?: boolean;
  mfaTimeoutMinutes?: number;
  allowedDeviceTypes?: DeviceType[];
  blockedCountries?: string[];
  allowedIPRanges?: string[];
  blockedIPRanges?: string[];
  isActive?: boolean;
  applicableRoles?: string[];
}
