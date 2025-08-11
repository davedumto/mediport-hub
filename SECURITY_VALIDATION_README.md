# EHR Security Validation System

## 🛡️ Overview

The EHR Security Validation System provides comprehensive protection against common web vulnerabilities including SQL injection, XSS attacks, file upload exploits, and data poisoning. This system implements defense-in-depth security with multiple layers of validation and sanitization.

## 🚀 Features

### ✅ Input Validation & Sanitization

- **Zod Schema Validation**: Type-safe validation with security constraints
- **HTML Sanitization**: DOMPurify-based content cleaning
- **Medical Data Validation**: Healthcare-specific validation rules
- **File Upload Security**: Type, size, and content validation

### ✅ Attack Prevention

- **SQL Injection Detection**: Pattern-based detection and blocking
- **XSS Protection**: Content sanitization and pattern detection
- **Command Injection Prevention**: Dangerous character filtering
- **Path Traversal Protection**: URL path validation

### ✅ Security Middleware

- **Security Headers**: Comprehensive HTTP security headers
- **Request Size Limiting**: DoS attack prevention
- **Rate Limiting**: Brute force attack protection
- **Honeypot Detection**: Bot activity identification
- **Behavioral Analysis**: Suspicious request pattern detection

### ✅ Medical-Specific Security

- **ICD-10 Code Validation**: Medical diagnosis code format validation
- **Medication Name Sanitization**: Pharmaceutical name cleaning
- **Patient Data Protection**: HIPAA-compliant data handling
- **Medical Record Security**: Structured medical content validation

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    API Endpoint                             │
├─────────────────────────────────────────────────────────────┤
│              applySecurityMiddleware()                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   Security  │ │   Input     │ │   File      │          │
│  │   Headers   │ │ Validation  │ │   Upload    │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │     SQL     │ │     XSS     │ │ Suspicious  │          │
│  │  Injection  │ │ Protection  │ │  Behavior   │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│                    Business Logic                           │
└─────────────────────────────────────────────────────────────┘
```

## 📁 File Structure

```
src/
├── lib/
│   └── validation.ts          # Enhanced validation schemas
├── middleware/
│   └── security.ts            # Security middleware functions
├── services/
│   └── sanitizationService.ts # Data sanitization service
└── tests/
    └── security/
        └── validation.test.ts # Comprehensive test suite
```

## 🛠️ Usage Examples

### Basic Security Middleware

```typescript
import { applySecurityMiddleware } from "../middleware/security";
import { createPatientSchema } from "../lib/validation";

// Apply basic security
export default applySecurityMiddleware({
  validateBody: createPatientSchema,
})(handler);
```

### Comprehensive Security Configuration

```typescript
export default applySecurityMiddleware({
  validateBody: createPatientSchema,
  validateQuery: searchQuerySchema,
  maxRequestSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ["application/pdf", "image/jpeg"],
  maxFileSize: 5 * 1024 * 1024, // 5MB
  enableHoneypot: true,
  honeypotField: "email_confirm",
})(handler);
```

### Individual Security Functions

```typescript
import {
  securityHeaders,
  detectSQLInjection,
  detectXSS,
  validateRequest,
} from "../middleware/security";

// Compose security middleware manually
export default securityHeaders()(
  detectSQLInjection()(
    detectXSS()(validateRequest(createPatientSchema)(handler))
  )
);
```

### Data Sanitization

```typescript
import { SanitizationService } from "../services/sanitizationService";

// Sanitize HTML content
const cleanHTML = SanitizationService.sanitizeHTML(dirtyHTML);

// Sanitize medical data
const cleanMedicalData = SanitizationService.sanitizeMedicalData(rawData);

// Sanitize filenames
const safeFilename = SanitizationService.sanitizeFilename(dangerousFilename);
```

## 🔒 Security Features in Detail

### 1. Input Validation Schemas

#### Enhanced Password Validation

```typescript
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
```

#### Medical Data Validation

```typescript
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
```

### 2. Security Middleware Functions

#### SQL Injection Detection

```typescript
export function detectSQLInjection() {
  return (handler: NextApiHandler): NextApiHandler => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const suspiciousPatterns = [
        /('|(\\')|(;)|(\-\-)|(\s+(OR|AND)\s+))/gi,
        /(\s+(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\s+)/gi,
        /(EXEC|EXECUTE)\s*\(/gi,
        /(\bUNION\b.*\bSELECT\b)/gi,
      ];

      // Check request body and query parameters
      const hasSQLInjection = checkData(req.body) || checkData(req.query);

      if (hasSQLInjection) {
        // Log and block the request
        await AuditService.log({
          action: AuditAction.SUSPICIOUS_ACTIVITY,
          resource: "sql_injection_attempt",
          success: false,
          errorMessage: "Potential SQL injection detected",
        });

        return res.status(400).json({
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Invalid characters in input",
          },
        });
      }

      return handler(req, res);
    };
  };
}
```

#### XSS Protection

```typescript
export function detectXSS() {
  return (handler: NextApiHandler): NextApiHandler => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /<iframe[^>]*>.*?<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<img[^>]*src[^>]*=.*javascript:/gi,
      ];

      const hasXSS = checkData(req.body) || checkData(req.query);

      if (hasXSS) {
        return res.status(400).json({
          success: false,
          error: { code: "INVALID_INPUT", message: "Invalid content detected" },
        });
      }

      return handler(req, res);
    };
  };
}
```

### 3. Data Sanitization Service

#### HTML Sanitization

```typescript
static sanitizeHTML(html: string, allowedTags?: string[]): string {
  const defaultAllowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3'];

  return purify.sanitize(html, {
    ALLOWED_TAGS: allowedTags || defaultAllowedTags,
    ALLOWED_ATTR: ['href', 'title'],
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ['style', 'onclick', 'onload', 'onerror'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
    USE_PROFILES: { html: true }
  });
}
```

#### Medical Data Sanitization

```typescript
static sanitizeMedicalData(data: any): any {
  if (typeof data === 'string') {
    return data
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  if (Array.isArray(data)) {
    return data.map(item => this.sanitizeMedicalData(item));
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = this.sanitizeMedicalData(value);
    }
    return sanitized;
  }

  return data;
}
```

## 🧪 Testing

### Run Security Tests

```bash
# Run all security tests
npm run test:security

# Run with coverage
npm run test:coverage

# Run specific test file
npm test src/tests/security/validation.test.ts
```

### Test Coverage

The security test suite covers:

- ✅ SQL injection detection
- ✅ XSS attack prevention
- ✅ File upload security
- ✅ Input validation
- ✅ Data sanitization
- ✅ Security headers
- ✅ Honeypot detection
- ✅ Suspicious behavior analysis
- ✅ Edge cases and error handling

## 🔧 Configuration

### Environment Variables

```bash
# Required for encryption
ENCRYPTION_KEY=your-32-byte-encryption-key

# JWT secret for authentication
JWT_SECRET=your-jwt-secret-key

# Database connection
DATABASE_URL=your-database-connection-string
```

### Security Constants

```typescript
const SECURITY_PATTERNS = {
  SQL_INJECTION:
    /('|(\\')|(;)|(\-\-)|(\s+(OR|AND)\s+)|(\s+(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\s+))/gi,
  XSS_PATTERNS: /<script[^>]*>.*?<\/script>/gi,
  COMMAND_INJECTION: /[;&|`${}]/g,
  HTML_TAGS: /<[^>]*>/g,

  NAME_PATTERN: /^[a-zA-Z\s'-\.]+$/,
  PHONE_PATTERN: /^\+?[\d\s\-\(\)]+$/,
  MEDICAL_CODE: /^[A-Z]\d{2}(\.\d{1,2})?$/,
  MEDICATION_NAME: /^[a-zA-Z0-9\s\-\(\)\.]+$/,
};
```

## 🚨 Security Best Practices

### 1. Always Use Validation

```typescript
// ❌ Bad - No validation
export default function handler(req, res) {
  const data = req.body;
  // Process data without validation
}

// ✅ Good - With validation
export default applySecurityMiddleware({
  validateBody: createPatientSchema,
})(handler);
```

### 2. Sanitize All User Input

```typescript
// ❌ Bad - Raw user input
const userInput = req.body.description;

// ✅ Good - Sanitized input
const cleanInput = SanitizationService.sanitizeHTML(userInput);
```

### 3. Use Comprehensive Security Middleware

```typescript
// ❌ Bad - Minimal security
export default securityHeaders()(handler);

// ✅ Good - Comprehensive security
export default applySecurityMiddleware({
  validateBody: schema,
  maxRequestSize: 5 * 1024 * 1024,
  allowedFileTypes: ["application/pdf"],
  enableHoneypot: true,
})(handler);
```

### 4. Log Security Events

```typescript
// All security events are automatically logged
await AuditService.log({
  action: AuditAction.SUSPICIOUS_ACTIVITY,
  resource: "sql_injection_attempt",
  success: false,
  errorMessage: "Potential SQL injection detected",
});
```

## 📊 Performance Considerations

### Validation Overhead

- **Zod Validation**: ~1-5ms per request
- **Security Pattern Detection**: ~0.1-1ms per request
- **HTML Sanitization**: ~2-10ms per request (depends on content size)
- **Total Security Overhead**: ~3-16ms per request

### Optimization Tips

1. **Cache Validation Results**: For repeated requests
2. **Lazy Loading**: Load security patterns on demand
3. **Async Processing**: Process large files asynchronously
4. **Rate Limiting**: Prevent abuse of expensive operations

## 🔍 Monitoring & Alerting

### Security Metrics

- SQL injection attempts blocked
- XSS attacks prevented
- Malicious file uploads blocked
- Suspicious behavior detected
- Rate limit violations

### Audit Logging

All security events are logged with:

- Timestamp and request ID
- IP address and user agent
- Request details and payload
- Security action taken
- Risk assessment score

## 🚀 Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] SSL/TLS enabled
- [ ] Rate limiting configured
- [ ] Monitoring and alerting set up
- [ ] Security headers verified
- [ ] File upload restrictions configured
- [ ] Honeypot fields implemented
- [ ] Audit logging enabled

### Security Headers Verification

```bash
# Check security headers
curl -I https://your-domain.com/api/security-demo

# Expected headers:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000; includeSubDomains
```

## 🆘 Troubleshooting

### Common Issues

#### 1. Validation Errors

```typescript
// Check validation schema
const result = schema.safeParse(data);
if (!result.success) {
  console.log("Validation errors:", result.error.errors);
}
```

#### 2. Security Middleware Not Working

```typescript
// Ensure proper middleware composition
export default applySecurityMiddleware({
  validateBody: schema,
})(handler);
```

#### 3. File Upload Issues

```typescript
// Check file type and size restrictions
const allowedTypes = ["application/pdf", "image/jpeg"];
const maxSize = 5 * 1024 * 1024; // 5MB
```

### Debug Mode

```typescript
// Enable debug logging
process.env.DEBUG = "security:*";

// Check security middleware execution
console.log("Security middleware applied:", req.security);
```

## 📚 Additional Resources

### Documentation

- [Zod Validation](https://zod.dev/)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Healthcare Security Standards](https://www.hhs.gov/hipaa/index.html)

### Security Tools

- [Security Headers Checker](https://securityheaders.com/)
- [OWASP ZAP](https://owasp.org/www-project-zap/)
- [Burp Suite](https://portswigger.net/burp)

## 🤝 Contributing

### Security Improvements

1. **Report Vulnerabilities**: Security issues should be reported privately
2. **Code Review**: All security-related code requires security review
3. **Testing**: New security features must include comprehensive tests
4. **Documentation**: Security changes must be documented

### Development Guidelines

- Follow security-first development principles
- Write security tests for all new features
- Use TypeScript for type safety
- Implement defense-in-depth security
- Regular security audits and updates

## 📄 License

This security validation system is part of the EHR project and follows the same licensing terms. All security features are designed to protect patient data and ensure HIPAA compliance.

---

**⚠️ Security Notice**: This system provides robust protection against common web vulnerabilities, but security is an ongoing process. Regular updates, monitoring, and security audits are essential for maintaining protection against evolving threats.
