type Role = "PATIENT" | "DOCTOR" | "ADMIN" | "SUPER_ADMIN";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: Role;
  permissions: string[];
  lastLogin?: string;
  mfaEnabled?: boolean;
}

interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken?: string;
    expiresAt?: string;
    sessionId?: string;
    mfaSetupRequired?: boolean;
    mfaSecret?: string;
    qrCodeUrl?: string;
  };
  message?: string;
}

interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
  rememberMe?: boolean;
}

interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
  phone?: string;
  dateOfBirth?: string;
}

interface RefreshResponse {
  success: boolean;
  data: {
    accessToken: string;
    expiresAt: string;
    sessionId?: string;
  };
}

interface PasswordResetRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
