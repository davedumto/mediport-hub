import { UserRole } from "@prisma/client";

// Healthcare Roles Definition
export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN", // Full system access
  ADMIN = "ADMIN", // User management, system config
  DOCTOR = "DOCTOR", // Full patient records access
  NURSE = "NURSE", // Limited patient access (assigned only)
  PATIENT = "PATIENT", // Own records only
}

// Permission system with granular control
export enum Permission {
  // User Management
  USER_CREATE = "user:create",
  USER_READ_ALL = "user:read:all",
  USER_READ_OWN = "user:read:own",
  USER_UPDATE_ALL = "user:update:all",
  USER_UPDATE_OWN = "user:update:own",
  USER_DELETE = "user:delete",
  USER_IMPERSONATE = "user:impersonate",

  // Patient Management
  PATIENT_CREATE = "patient:create",
  PATIENT_READ_ALL = "patient:read:all",
  PATIENT_READ_ASSIGNED = "patient:read:assigned",
  PATIENT_READ_OWN = "patient:read:own",
  PATIENT_UPDATE_ALL = "patient:update:all",
  PATIENT_UPDATE_ASSIGNED = "patient:update:assigned",
  PATIENT_DELETE = "patient:delete",

  // Medical Records
  RECORD_CREATE = "record:create",
  RECORD_READ_ALL = "record:read:all",
  RECORD_READ_ASSIGNED = "record:read:assigned",
  RECORD_READ_OWN = "record:read:own",
  RECORD_UPDATE = "record:update",
  RECORD_DELETE = "record:delete",

  // Appointments
  APPOINTMENT_CREATE = "appointment:create",
  APPOINTMENT_READ_ALL = "appointment:read:all",
  APPOINTMENT_READ_ASSIGNED = "appointment:read:assigned",
  APPOINTMENT_READ_OWN = "appointment:read:own",
  APPOINTMENT_UPDATE = "appointment:update",
  APPOINTMENT_DELETE = "appointment:delete",

  // System Administration
  AUDIT_READ = "audit:read",
  SYSTEM_CONFIG = "system:config",
  BACKUP_CREATE = "backup:create",
  BACKUP_RESTORE = "backup:restore",

  // GDPR Operations
  GDPR_EXPORT = "gdpr:export",
  GDPR_DELETE = "gdpr:delete",
  GDPR_CONSENT_MANAGE = "gdpr:consent:manage",
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    isActive: boolean;
    emailVerified: boolean;
    mfaEnabled: boolean;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  accessToken: string;
  expiresIn: number;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface LogoutResponse {
  success: boolean;
  message: string;
}

// JWT payload types
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

// Session types
export interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  refreshToken: string;
  deviceInfo?: DeviceInfo;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  lastAccessed: Date;
  expiresAt: Date;
  isActive: boolean;
  revokedAt?: Date;
  revocationReason?: string;
}

export interface DeviceInfo {
  deviceType: "desktop" | "mobile" | "tablet";
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceId?: string;
}

// MFA types
export interface MFARequest {
  email: string;
  password: string;
  mfaCode: string;
}

export interface MFASetupRequest {
  enable: boolean;
}

export interface MFASetupResponse {
  success: boolean;
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface MFAVerifyRequest {
  code: string;
}

export interface MFAVerifyResponse {
  success: boolean;
  message: string;
}

// Password management types
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface SetNewPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SetNewPasswordResponse {
  success: boolean;
  message: string;
}

// Email verification types
export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  success: boolean;
  message: string;
}

// Account security types
export interface AccountLockInfo {
  isLocked: boolean;
  lockedUntil?: Date;
  failedAttempts: number;
  remainingAttempts: number;
}

export interface UnlockAccountRequest {
  email: string;
  unlockToken: string;
}

export interface UnlockAccountResponse {
  success: boolean;
  message: string;
}

// Enhanced Permission types
export interface PermissionContext {
  userId: string;
  userRole: Role;
  resourceType?: string;
  resourceId?: string;
  resourceOwnerId?: string;
  assignedProviderId?: string;
}

// Role types
export interface RoleDefinition {
  id: string;
  name: Role;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  grantedBy?: string;
  grantedAt: Date;
  revokedAt?: Date;
  role: RoleDefinition;
}

export interface RoleStatistics {
  name: string;
  description: string | null;
  isSystemRole: boolean;
  userCount: number;
  permissions: any;
}

// Authentication context types
export interface AuthContext {
  userId: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RequestContext {
  requestId: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  userId?: string;
  userRole?: UserRole;
}

// Security audit types
export interface SecurityEvent {
  type:
    | "login"
    | "logout"
    | "password_change"
    | "mfa_setup"
    | "mfa_verify"
    | "account_lock"
    | "account_unlock";
  userId: string;
  email: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: Record<string, any>;
  timestamp: Date;
}

// Rate limiting types
export interface RateLimitInfo {
  remaining: number;
  reset: Date;
  limit: number;
}

export interface RateLimitHeaders {
  "X-RateLimit-Limit": string;
  "X-RateLimit-Remaining": string;
  "X-RateLimit-Reset": string;
  "Retry-After"?: string;
}

// Authentication middleware types
export interface AuthMiddlewareOptions {
  requireAuth: boolean;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  allowPublic?: boolean;
}

export interface AuthResult {
  isAuthenticated: boolean;
  user?: AuthContext;
  error?: string;
  statusCode: number;
}
