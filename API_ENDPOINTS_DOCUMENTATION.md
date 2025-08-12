# API Endpoints Documentation

## Overview

This document outlines all available API endpoints in the MediPort Hub project. The API is built using Next.js App Router and follows RESTful conventions with comprehensive security, validation, and audit logging.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://yourdomain.com/api`

## Authentication Endpoints

### User Authentication

#### POST `/api/auth/login`

**Description**: Authenticate user with email and password
**Request Body**:

```json
{
  "email": "string",
  "password": "string",
  "mfaCode": "string (optional)",
  "rememberMe": "boolean (optional)"
}
```

**Response**:

- `200`: Login successful, returns user data and tokens
- `401`: Invalid credentials or account locked
- `423`: Account locked due to multiple failed attempts
  **Features**: MFA support, account lockout protection, audit logging

#### POST `/api/auth/register/patient`

**Description**: Register a new patient account
**Request Body**:

```json
{
  "fullName": "string",
  "email": "string",
  "password": "string",
  "gdprConsent": "boolean (required: true)"
}
```

**Response**:

- `201`: Registration successful
- `400`: Validation error or user already exists
  **Features**: GDPR consent validation, audit logging

#### POST `/api/auth/register/doctor`

**Description**: Register a new doctor account
**Request Body**:

```json
{
  "fullName": "string",
  "email": "string",
  "password": "string",
  "specialty": "string",
  "medicalLicenseNumber": "string",
  "gdprConsent": "boolean (required: true)"
}
```

**Response**:

- `200`: Registration successful (pending verification)
- `400`: Validation error or user already exists
  **Features**: Medical license validation, GDPR consent, audit logging

#### POST `/api/auth/logout`

**Description**: Logout user and invalidate session
**Request Body**:

```json
{
  "sessionId": "string"
}
```

**Response**:

- `200`: Logout successful
- `400`: Missing session ID
  **Features**: Session revocation, audit logging

#### POST `/api/auth/refresh`

**Description**: Refresh access token using refresh token
**Request Body**:

```json
{
  "refreshToken": "string"
}
```

**Response**:

- `200`: Token refreshed successfully
- `401`: Invalid or expired refresh token
  **Features**: Automatic token refresh, session extension

#### POST `/api/auth/change-password`

**Description**: Change user password
**Request Body**:

```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

**Response**:

- `200`: Password changed successfully
- `400`: Validation error
- `401`: Invalid current password
  **Features**: Password validation, audit logging

#### POST `/api/auth/forgot-password`

**Description**: Request password reset
**Request Body**:

```json
{
  "email": "string"
}
```

**Response**:

- `200`: Reset email sent
- `400`: Invalid email
  **Features**: Secure token generation, email delivery

#### POST `/api/auth/reset-password`

**Description**: Reset password using reset token
**Request Body**:

```json
{
  "token": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

**Response**:

- `200`: Password reset successful
- `400`: Validation error
- `401`: Invalid or expired token
  **Features**: Token validation, password reset

#### POST `/api/auth/setup-mfa`

**Description**: Setup or configure MFA for user account
**Request Body**:

```json
{
  "enable": "boolean",
  "mfaCode": "string (optional)"
}
```

**Response**:

- `200`: MFA setup successful
- `400`: Validation error
- `401`: Invalid MFA code
  **Features**: TOTP setup, QR code generation, backup codes

## Patient Management Endpoints

### Patient Operations

#### GET `/api/patients/[id]`

**Description**: Retrieve patient information by ID
**URL Parameters**:

- `id`: Patient unique identifier
  **Response**:
- `200`: Patient data with medical records and assigned provider
- `404`: Patient not found
  **Features**: Role-based access control, audit logging, PII encryption

#### PUT `/api/patients/[id]`

**Description**: Update patient information
**URL Parameters**:

- `id`: Patient unique identifier
  **Request Body**: Patient data fields
  **Response**:
- `200`: Patient updated successfully
- `400`: Validation error
- `404`: Patient not found
  **Features**: Data validation, audit logging, PII encryption

#### DELETE `/api/patients/[id]`

**Description**: Delete patient record
**URL Parameters**:

- `id`: Patient unique identifier
  **Response**:
- `200`: Patient deleted successfully
- `404`: Patient not found
  **Features**: Soft delete, audit logging, GDPR compliance

## Consent Management Endpoints

### Consent Operations

#### GET `/api/consent/templates`

**Description**: Retrieve GDPR consent templates
**Query Parameters**:

- `type`: Specific consent template type (optional)
  **Response**:
- `200`: Consent templates or specific template
  **Features**: GDPR compliance, template management

#### GET `/api/consent/manage`

**Description**: Get user consent history
**Response**:

- `200`: User consent records
- `401`: Unauthorized
  **Features**: Consent history, GDPR compliance

#### POST `/api/consent/manage`

**Description**: Withdraw or renew consent
**Request Body**:

```json
{
  "action": "withdraw" | "renew",
  "consentId": "string",
  "reason": "string (optional)"
}
```

**Response**:

- `200`: Consent action successful
- `400`: Validation error
- `401`: Unauthorized
  **Features**: Consent management, audit logging

## Administrative Endpoints

### Role Management

#### POST `/api/admin/roles/assign`

**Description**: Assign role to user
**Request Body**:

```json
{
  "userId": "string",
  "roleName": "string",
  "grantedBy": "string (optional)"
}
```

**Response**:

- `200`: Role assigned successfully
- `400`: Validation error
- `401`: Unauthorized
- `403`: Insufficient permissions
  **Features**: Role assignment, audit logging, permission validation

#### DELETE `/api/admin/roles/assign`

**Description**: Revoke role from user
**Request Body**:

```json
{
  "userId": "string",
  "roleName": "string",
  "revokedBy": "string (optional)",
  "reason": "string (optional)"
}
```

**Response**:

- `200`: Role revoked successfully
- `400`: Validation error
- `401`: Unauthorized
- `403`: Insufficient permissions
  **Features**: Role revocation, audit logging, permission validation

## Security Features

### Authentication & Authorization

- **JWT Tokens**: Access and refresh token system
- **Role-Based Access Control (RBAC)**: Hierarchical permission system
- **Multi-Factor Authentication (MFA)**: TOTP-based MFA support
- **Session Management**: Secure session handling with expiration

### Data Protection

- **PII Encryption**: AES-256-GCM encryption for sensitive data
- **GDPR Compliance**: Consent management and data processing
- **Audit Logging**: Comprehensive activity tracking
- **Input Validation**: SQL injection and XSS prevention

### Security Headers

- **Content Security Policy (CSP)**: XSS protection
- **HTTP Strict Transport Security (HSTS)**: HTTPS enforcement
- **X-Frame-Options**: Clickjacking prevention
- **X-Content-Type-Options**: MIME type sniffing prevention

## Error Handling

### Standard Error Response Format

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": ["Array of specific error details"],
  "statusCode": 400
}
```

### Common HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `423`: Locked (account locked)
- `500`: Internal Server Error

## Rate Limiting

### Authentication Endpoints

- **Login Attempts**: 5 attempts per minute
- **Account Lockout**: 30 minutes after 5 failed attempts
- **Password Reset**: 3 requests per hour per email

### General API Endpoints

- **Standard Rate**: 100 requests per minute per IP
- **Burst Protection**: Configurable burst limits

## Testing

### Test Coverage

- **Unit Tests**: Individual endpoint testing
- **Integration Tests**: End-to-end API testing
- **Security Tests**: Vulnerability testing
- **Performance Tests**: Load and stress testing

### Test Files Location

- `src/tests/`: Main test directory
- `src/tests/rbac/`: Role and permission tests
- `src/tests/security/`: Security validation tests
- `src/tests/gdpr/`: GDPR compliance tests

## Development Guidelines

### Adding New Endpoints

1. Create route file in appropriate directory
2. Implement proper validation and sanitization
3. Add comprehensive error handling
4. Include audit logging for sensitive operations
5. Write unit and integration tests
6. Update this documentation

### Security Best Practices

1. Always validate and sanitize input data
2. Implement proper authentication and authorization
3. Use HTTPS in production
4. Log all sensitive operations
5. Implement rate limiting
6. Regular security audits

## Monitoring & Logging

### Audit Logs

- **User Actions**: Login, logout, data access
- **Data Changes**: Create, update, delete operations
- **Security Events**: Failed authentication, permission violations
- **System Events**: Role assignments, configuration changes

### Log Levels

- **ERROR**: System errors and security violations
- **WARN**: Potential issues and unusual behavior
- **INFO**: Normal operations and user actions
- **DEBUG**: Detailed debugging information

## Dependencies

### Core Libraries

- **Next.js**: App Router framework
- **Prisma**: Database ORM
- **JWT**: Token-based authentication
- **bcrypt**: Password hashing
- **DOMPurify**: HTML sanitization

### Security Libraries

- **helmet**: Security headers
- **rate-limiter-flexible**: Rate limiting
- **validator**: Input validation
- **crypto**: Encryption utilities

## Support & Maintenance

### Documentation Updates

This documentation is maintained alongside the codebase and should be updated whenever new endpoints are added or existing ones are modified.

### API Versioning

Currently using unversioned API endpoints. Consider implementing versioning (e.g., `/api/v1/`) for future major changes.

### Deprecation Policy

- **Deprecation Notice**: 6 months advance notice
- **Breaking Changes**: Major version releases only
- **Migration Guides**: Provided for deprecated endpoints
