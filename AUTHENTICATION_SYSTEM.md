# EHR Authentication System

This document provides comprehensive documentation for the authentication system implemented in the EHR backend.

## Overview

The authentication system provides secure user authentication, authorization, and session management with the following features:

- **Multi-Factor Authentication (MFA)** using TOTP
- **JWT-based authentication** with access and refresh tokens
- **Account lockout protection** against brute force attacks
- **Password history validation** to prevent password reuse
- **Comprehensive audit logging** for security compliance
- **Rate limiting** to prevent abuse
- **Role-based access control (RBAC)**
- **Session management** with secure token handling

## Architecture

### Core Components

1. **Authentication Utilities** (`src/lib/auth.ts`)
2. **Audit Service** (`src/lib/audit.ts`)
3. **Authentication Middleware** (`src/middleware/auth.ts`)
4. **Rate Limiting Middleware** (`src/middleware/rateLimit.ts`)
5. **API Endpoints** (`src/pages/api/auth/`)

### Database Models

- `User` - User accounts and authentication data
- `UserSession` - Active user sessions
- `PasswordReset` - Password reset tokens
- `AuditLog` - Security audit trail
- `Role` - User roles and permissions
- `UserRoleAssignment` - User-role relationships

## API Endpoints

### 1. Authentication Endpoints

#### POST `/api/auth/login`

User login with email/password and optional MFA.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "mfaCode": "123456",
  "rememberMe": false
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "DOCTOR",
      "permissions": ["read:patients", "write:consultations"],
      "lastLogin": "2024-01-01T00:00:00Z",
      "mfaEnabled": true
    },
    "expiresAt": "2024-01-01T00:15:00Z",
    "sessionId": "uuid"
  }
}
```

#### POST `/api/auth/register`

User registration with automatic MFA setup.

**Request Body:**

```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "PATIENT",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-01T00:00:00Z"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "newuser@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "role": "PATIENT",
      "mfaEnabled": false
    },
    "message": "Registration successful. Please complete MFA setup to activate your account.",
    "mfaSetupRequired": true,
    "mfaSecret": "JBSWY3DPEHPK3PXP",
    "qrCodeUrl": "otpauth://totp/newuser@example.com?secret=JBSWY3DPEHPK3PXP&issuer=EHR%20System"
  }
}
```

#### POST `/api/auth/logout`

User logout and session termination.

**Headers:** `Authorization: Bearer <access_token>`

**Response:**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### POST `/api/auth/refresh`

Refresh access token using refresh token.

**Request Body:**

```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "new_access_token",
    "expiresAt": "2024-01-01T00:15:00Z",
    "sessionId": "uuid"
  }
}
```

### 2. Password Management Endpoints

#### POST `/api/auth/forgot-password`

Request password reset.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password reset link has been sent to your email address.",
  "data": {
    "expiresAt": "2024-01-01T01:00:00Z"
  }
}
```

#### POST `/api/auth/reset-password`

Complete password reset using token.

**Request Body:**

```json
{
  "token": "reset_token_here",
  "newPassword": "NewSecurePassword123!",
  "confirmPassword": "NewSecurePassword123!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password has been reset successfully. Please log in with your new password.",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "passwordChangedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### POST `/api/auth/change-password`

Change password for authenticated users.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePassword123!",
  "confirmPassword": "NewSecurePassword123!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Password changed successfully. You have been logged out of other devices.",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "passwordChangedAt": "2024-01-01T00:00:00Z"
  }
}
```

### 3. MFA Management Endpoints

#### GET `/api/auth/setup-mfa`

Generate new MFA secret for setup.

**Headers:** `Authorization: Bearer <access_token>`

**Response:**

```json
{
  "success": true,
  "data": {
    "mfaSecret": "JBSWY3DPEHPK3PXP",
    "qrCodeUrl": "otpauth://totp/user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=EHR%20System",
    "message": "New MFA secret generated. Please scan the QR code with your authenticator app and then verify with the code."
  }
}
```

#### POST `/api/auth/setup-mfa`

Verify MFA code and enable MFA.

**Headers:** `Authorization: Bearer <access_token>`

**Request Body:**

```json
{
  "mfaCode": "123456"
}
```

**Response:**

```json
{
  "success": true,
  "message": "MFA has been enabled successfully for your account.",
  "data": {
    "userId": "uuid",
    "email": "user@example.com",
    "mfaEnabled": true,
    "mfaSetupCompleted": true
  }
}
```

### 4. Test Endpoints

#### GET `/api/auth/test`

Test authentication middleware.

**Headers:** `Authorization: Bearer <access_token>`

#### GET `/api/auth/test?path=role`

Test role-based access control (requires ADMIN or SUPER_ADMIN role).

**Headers:** `Authorization: Bearer <access_token>`

## Security Features

### Password Requirements

- Minimum 8 characters, maximum 128 characters
- Must contain uppercase letter, lowercase letter, number, and special character
- Cannot reuse last 5 passwords
- Bcrypt hashing with 12 rounds

### Account Protection

- **Account Lockout**: 5 failed login attempts locks account for 30 minutes
- **Rate Limiting**:
  - Global: 1000 requests per hour
  - Authentication: 5 attempts per 15 minutes
  - Sensitive operations: 10 per hour
- **Session Security**:
  - Access tokens expire in 15 minutes
  - Refresh tokens expire in 7 days
  - Secure HTTP-only cookies
  - Session invalidation on password change

### MFA Security

- TOTP-based (Time-based One-Time Password)
- 6-digit codes with 2-step tolerance
- QR code generation for easy setup
- Automatic MFA secret generation

### Audit Logging

All authentication events are logged with:

- User identification
- IP address and user agent
- Timestamp and request ID
- Success/failure status
- Detailed error messages
- Resource access information

## Middleware Usage

### Authentication Middleware

```typescript
import {
  authenticateUser,
  requireRole,
  requirePermission,
} from "../middleware/auth";

// Require authentication
export default authenticateUser(handler);

// Require specific role
export default requireRole(["ADMIN", "DOCTOR"])(handler);

// Require specific permission
export default requirePermission("read:patients")(handler);
```

### Rate Limiting Middleware

```typescript
import {
  globalRateLimit,
  authRateLimit,
  sensitiveRateLimit,
} from "../middleware/rateLimit";

// Apply rate limiting
export default applyRateLimit(authRateLimit)(handler);

// Use predefined limiters
export default globalRateLimit(handler);
export default sensitiveRateLimit(handler);
```

## Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Application URL (for password reset links)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ehr_db
```

## Database Schema Updates

The authentication system requires the following database models:

### PasswordReset Model

```prisma
model PasswordReset {
  id        String    @id @default(uuid())
  userId    String
  token     String    @unique
  expiresAt DateTime
  used      Boolean   @default(false)
  usedAt    DateTime?
  ipAddress String?
  userAgent String?
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id])

  @@map("password_resets")
}
```

### User Model Updates

The User model includes these authentication fields:

- `passwordHash`: Bcrypt-hashed password
- `mfaEnabled`: Boolean flag for MFA status
- `mfaSecret`: TOTP secret for MFA
- `failedLoginAttempts`: Counter for failed logins
- `lockedUntil`: Account lockout timestamp
- `passwordHistory`: JSON array of previous password hashes

## Testing

### Manual Testing

1. **Registration**: Test user registration with various roles
2. **Login**: Test login with and without MFA
3. **MFA Setup**: Test MFA secret generation and verification
4. **Password Reset**: Test forgot password and reset flow
5. **Session Management**: Test token refresh and logout
6. **Access Control**: Test role-based and permission-based access

### Test Endpoints

- `/api/auth/test` - Basic authentication test
- `/api/auth/test?path=role` - Role-based access control test

## Security Considerations

### Production Deployment

1. **Environment Variables**: Ensure all secrets are properly set
2. **HTTPS**: Always use HTTPS in production
3. **Cookie Security**: Secure and HttpOnly cookies
4. **Rate Limiting**: Consider Redis-based rate limiting for production
5. **Email Service**: Integrate with email service for password reset emails
6. **Monitoring**: Set up alerts for failed authentication attempts

### Compliance

- **GDPR**: User consent and data portability
- **HIPAA**: Audit logging and access controls
- **SOC 2**: Security controls and monitoring

## Troubleshooting

### Common Issues

1. **JWT Token Expired**: Use refresh token to get new access token
2. **MFA Code Invalid**: Ensure time synchronization on authenticator app
3. **Account Locked**: Wait for lockout period or contact administrator
4. **Rate Limited**: Wait for rate limit window to reset

### Debug Mode

Set `NODE_ENV=development` to enable:

- Detailed error messages
- Password reset links in responses
- Enhanced logging

## Future Enhancements

1. **Social Login**: OAuth integration with Google, Microsoft, etc.
2. **Biometric Authentication**: Fingerprint, face recognition
3. **Hardware Security Keys**: FIDO2/U2F support
4. **Advanced MFA**: SMS, email, push notifications
5. **Risk-Based Authentication**: Adaptive authentication based on risk factors
6. **Single Sign-On (SSO)**: SAML/OIDC integration

## Support

For issues or questions regarding the authentication system:

1. Check the audit logs for detailed error information
2. Review the validation schemas for input requirements
3. Verify environment variable configuration
4. Check database connectivity and schema
5. Review rate limiting configuration

---

_This authentication system provides enterprise-grade security while maintaining ease of use and comprehensive audit capabilities._
