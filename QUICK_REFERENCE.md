# EHR System Quick Reference

## 🚀 Quick Start Commands

```bash
# Database operations
npx prisma generate          # Generate Prisma client
npx prisma migrate dev       # Run migrations
npx prisma studio           # Open database browser
npx prisma db pull          # Pull schema from database

# Environment setup
cp .env.local .env          # Copy environment variables
```

## 🔑 Environment Variables

```bash
DATABASE_URL="postgresql://ehr_user:ehr_password123@localhost:5432/ehr_database"
ENCRYPTION_KEY="f964ff9a066dd9880b92994fdddf1dbc3358f66803d432424240ebbe943caa10"
JWT_SECRET="1a8497bbcb7e2f1a44b77d6ade867b22c3ea13be003f081f38dca480ccac936c"
JWT_REFRESH_SECRET="5b54a55af8cddb57bda2e4b7133fdc85866b6994db0281cf247c3ec7f332e0ac"
NODE_ENV="development"
LOG_LEVEL="info"
```

## 📊 Database Schema Quick Reference

### **Core Tables**

- `users` - Authentication & user management
- `patients` - Patient demographics & medical info
- `medical_records` - Encrypted medical documentation
- `appointments` - Scheduling & appointments
- `consultations` - Detailed medical encounters
- `audit_logs` - Compliance & security logging
- `consent_records` - GDPR consent management
- `user_sessions` - Authentication sessions
- `roles` & `user_roles` - RBAC system

### **Key Relationships**

```
users (1) → patients (many)          # User can have multiple patients
users (1) → medical_records (many)   # Provider creates records
patients (1) → medical_records (many) # Patient has multiple records
appointments (1) → consultations (1)  # One appointment, one consultation
```

## 🔐 Security Patterns

### **Encryption Usage**

```typescript
import { encrypt, decrypt } from "./src/lib/encryption";

// Encrypt before storage
const encrypted = encrypt(sensitiveData);
await prisma.medicalRecord.create({
  data: {
    descriptionEncrypted: Buffer.from(encrypted.encrypted, "hex"),
    // ... other fields
  },
});

// Decrypt for API response
const decrypted = decrypt({
  encrypted: record.descriptionEncrypted.toString("hex"),
  iv: record.iv,
  tag: record.tag,
});
```

### **Role-Based Access**

```typescript
// User roles hierarchy
SUPER_ADMIN > ADMIN > DOCTOR > NURSE > PATIENT;

// Permission check
if (!["DOCTOR", "NURSE", "ADMIN"].includes(user.role)) {
  throw new AppError(ErrorCodes.INSUFFICIENT_PERMISSIONS, "Access denied", 403);
}
```

## 📝 Validation Patterns

### **Input Validation**

```typescript
import { createPatientSchema } from "./src/lib/validation";

// Validate request body
const validatedData = createPatientSchema.parse(req.body);
const patient = await prisma.patient.create({ data: validatedData });
```

### **Common Validation Schemas**

- `createUserSchema` - User registration
- `createPatientSchema` - Patient creation
- `createMedicalRecordSchema` - Medical record creation
- `createAppointmentSchema` - Appointment scheduling
- `loginSchema` - Authentication

## 🗃️ Database Query Patterns

### **Basic CRUD**

```typescript
// Create
const record = await prisma.medicalRecord.create({ data: {...} });

// Read
const record = await prisma.medicalRecord.findUnique({ where: { id } });

// Update
const updated = await prisma.medicalRecord.update({
  where: { id },
  data: { ... }
});

// Delete
await prisma.medicalRecord.delete({ where: { id } });
```

### **Relationships & Includes**

```typescript
// Get patient with medical records
const patient = await prisma.patient.findUnique({
  where: { id: patientId },
  include: {
    medicalRecords: {
      where: { type: "CONSULTATION" },
      orderBy: { recordDate: "desc" },
    },
    assignedProvider: {
      select: { id: true, firstName: true, lastName: true },
    },
  },
});
```

### **Filtering & Search**

```typescript
// Complex where clause
const patients = await prisma.patient.findMany({
  where: {
    status: "ACTIVE",
    OR: [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
    ],
    assignedProviderId: providerId,
  },
});
```

### **Pagination**

```typescript
const [records, total] = await Promise.all([
  prisma.medicalRecord.findMany({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: "desc" },
  }),
  prisma.medicalRecord.count(),
]);
```

## 📊 API Response Patterns

### **Success Response**

```typescript
res.json({
  success: true,
  data: result,
  message: "Operation completed successfully",
});
```

### **Error Response**

```typescript
res.status(error.statusCode || 500).json({
  success: false,
  error: {
    code: error.code || "INTERNAL_ERROR",
    message: error.message || "An unexpected error occurred",
  },
});
```

### **Paginated Response**

```typescript
res.json({
  success: true,
  data: records,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1,
  },
});
```

## 🔍 Audit Logging

### **Log Data Access**

```typescript
await prisma.auditLog.create({
  data: {
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: "READ",
    resource: "Patient",
    resourceId: patientId,
    requestId: req.headers["x-request-id"],
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    endpoint: req.path,
    method: req.method,
    statusCode: 200,
    success: true,
    severity: "INFO",
    category: "DATA_ACCESS",
  },
});
```

## 🚨 Error Handling

### **Custom Error Class**

```typescript
import { AppError, ErrorCodes } from "./src/utils/errors";

throw new AppError(
  ErrorCodes.INSUFFICIENT_PERMISSIONS,
  "User cannot access this resource",
  403
);
```

### **Common Error Codes**

- `INVALID_CREDENTIALS` - Authentication failed
- `INSUFFICIENT_PERMISSIONS` - Access denied
- `VALIDATION_ERROR` - Input validation failed
- `RESOURCE_NOT_FOUND` - Entity not found
- `RESOURCE_CONFLICT` - Duplicate or conflict
- `INTERNAL_ERROR` - System error

## 🧪 Testing Patterns

### **Database Testing**

```typescript
// Test database connection
await prisma.$connect();
const tables = await prisma.$queryRaw`
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public'
`;

// Test CRUD operations
const testUser = await prisma.user.create({
  data: {
    email: "test@example.com",
    passwordHash: "hash",
    firstName: "Test",
    lastName: "User",
    role: "PATIENT",
  },
});

// Clean up
await prisma.user.delete({ where: { id: testUser.id } });
```

## 📁 File Structure

```
src/
├── lib/
│   ├── db.ts              # Database connection
│   ├── encryption.ts      # AES-256-GCM encryption
│   ├── validation.ts      # Zod validation schemas
│   └── logger.ts          # Winston logging
├── types/                 # TypeScript interfaces
│   ├── auth.ts           # Authentication types
│   ├── user.ts           # User management types
│   ├── patient.ts        # Patient types
│   ├── medical.ts        # Medical record types
│   └── api.ts            # API response types
└── utils/
    ├── errors.ts         # Error handling
    ├── helpers.ts        # Utility functions
    └── constants.ts      # Application constants
```

## 🔄 Common Workflows

### **Patient Registration Flow**

1. Validate input with `createPatientSchema`
2. Check user permissions (DOCTOR/NURSE/ADMIN)
3. Create patient record
4. Log audit event
5. Return success response

### **Medical Record Creation Flow**

1. Validate input with `createMedicalRecordSchema`
2. Check provider permissions
3. Encrypt sensitive fields
4. Create medical record
5. Log audit event
6. Return decrypted data

### **Appointment Scheduling Flow**

1. Validate input with `createAppointmentSchema`
2. Check scheduling conflicts
3. Create appointment
4. Send notifications
5. Log audit event
6. Return confirmation

## 🚀 Next Steps

1. **Implement authentication middleware** using JWT
2. **Create API endpoints** for each entity
3. **Add rate limiting** and security headers
4. **Implement file upload** for medical documents
5. **Add real-time notifications** for appointments
6. **Create admin dashboard** for system management
7. **Add comprehensive testing** with Jest/Supertest
8. **Implement monitoring** and health checks
