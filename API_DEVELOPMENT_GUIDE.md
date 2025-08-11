# EHR System API Development Guide

## 🏗️ System Architecture Overview

This EHR (Electronic Health Record) system is built with a **layered architecture** designed for security, scalability, and compliance with healthcare regulations.

### **Technology Stack**

- **Database**: PostgreSQL with Prisma ORM
- **Runtime**: Node.js with TypeScript
- **Security**: AES-256-GCM encryption, JWT authentication
- **Validation**: Zod schemas for type safety
- **Logging**: Winston for structured logging
- **Architecture**: RESTful API with middleware pattern

---

## 🗄️ Database Layer

### **Core Tables & Relationships**

#### **1. Users Table (`users`)**

```sql
-- Primary authentication and user management
- id: UUID (Primary Key)
- email: String (Unique)
- passwordHash: String (Encrypted)
- firstName, lastName: String
- role: UserRole (SUPER_ADMIN, ADMIN, DOCTOR, NURSE, PATIENT)
- isActive, emailVerified, mfaEnabled: Boolean
- audit fields: createdAt, updatedAt, createdBy, updatedBy
```

**Key Relationships:**

- `users` → `patients` (one-to-many via `userId`)
- `users` → `medical_records` (one-to-many via `providerId`)
- `users` → `appointments` (one-to-many via `providerId`)

#### **2. Patients Table (`patients`)**

```sql
-- Healthcare-specific patient data
- id: UUID (Primary Key)
- userId: UUID (Optional, links to user account)
- assignedProviderId: UUID (Links to healthcare provider)
- demographics: firstName, lastName, email, dateOfBirth, gender
- medical: bloodType, allergies[], chronicConditions[], currentMedications[]
- status: PatientStatus (ACTIVE, INACTIVE, ARCHIVED)
- GDPR: gdprConsent, gdprConsentDate, gdprConsentVersion
```

**Encrypted Fields:**

- `phoneEncrypted`, `addressEncrypted`, `emergencyContactEncrypted` (stored as `bytea`)

#### **3. Medical Records Table (`medical_records`)**

```sql
-- Encrypted medical documentation
- id: UUID (Primary Key)
- patientId, providerId: UUID (Foreign Keys)
- type: RecordType (CONSULTATION, LAB_RESULT, PRESCRIPTION, etc.)
- title: String
- recordDate: DateTime
- encrypted fields: descriptionEncrypted, findingsEncrypted, recommendationsEncrypted
- access control: isPrivate, restrictedAccess, accessRestrictions
```

**Security Note:** All sensitive medical data is encrypted using AES-256-GCM before storage.

#### **4. Appointments Table (`appointments`)**

```sql
-- Scheduling and appointment management
- id: UUID (Primary Key)
- patientId, providerId: UUID (Foreign Keys)
- scheduling: startTime, endTime, timezone
- type: AppointmentType (CONSULTATION, FOLLOW_UP, EMERGENCY, etc.)
- status: AppointmentStatus (SCHEDULED, CONFIRMED, CANCELLED, etc.)
- location: locationType, roomNumber, virtualMeetingUrl
- encrypted: notesEncrypted
```

#### **5. Consultations Table (`consultations`)**

```sql
-- Detailed medical encounters
- id: UUID (Primary Key)
- appointmentId, patientId, providerId: UUID (Foreign Keys)
- type: ConsultationType
- timing: startTime, endTime, durationMinutes
- encrypted clinical data: chiefComplaintEncrypted, symptomsEncrypted, diagnosisEncrypted
- structured data: vitalSigns (JSON), prescriptions (JSON), billingCodes (JSON)
```

#### **6. Audit & Compliance Tables**

- **`audit_logs`**: GDPR compliance, security events, data access tracking
- **`consent_records`**: GDPR consent management, legal basis tracking
- **`user_sessions`**: Authentication sessions, device tracking
- **`roles` & `user_roles`**: Role-based access control (RBAC)

---

## 🔐 Security Implementation

### **Encryption System**

#### **AES-256-GCM Encryption**

```typescript
// Location: src/lib/encryption.ts
const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex"); // 32-byte key

export function encrypt(plaintext: string): EncryptedData {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, KEY);
  cipher.setAAD(Buffer.from("ehr-system", "utf8")); // Additional Authenticated Data

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
}
```

**Usage Pattern:**

```typescript
// Encrypting sensitive data before database storage
const encryptedDescription = encrypt(medicalDescription);
await prisma.medicalRecord.create({
  data: {
    descriptionEncrypted: Buffer.from(encryptedDescription.encrypted, "hex"),
    // ... other fields
  },
});

// Decrypting for API responses
const decryptedDescription = decrypt({
  encrypted: encryptedDescription.encrypted,
  iv: encryptedDescription.iv,
  tag: encryptedDescription.tag,
});
```

### **Authentication & Authorization**

#### **JWT Token System**

```typescript
// Environment variables needed:
JWT_SECRET = "your_jwt_secret_key";
JWT_REFRESH_SECRET = "your_refresh_token_secret";
```

**Token Structure:**

- **Access Token**: 15 minutes expiry, contains user ID, role, permissions
- **Refresh Token**: 7 days expiry, used to generate new access tokens

#### **Role-Based Access Control (RBAC)**

```typescript
// User roles hierarchy:
SUPER_ADMIN > ADMIN > DOCTOR > NURSE > PATIENT

// Permission system:
- SUPER_ADMIN: Full system access
- ADMIN: User management, system settings
- DOCTOR: Patient management, medical records, appointments
- NURSE: Patient care, appointment scheduling
- PATIENT: Own data access, appointment booking
```

---

## 📝 Data Validation & Type Safety

### **Zod Schema System**

#### **User Validation**

```typescript
// Location: src/lib/validation.ts
export const createUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  role: userRoleSchema.default("PATIENT"),
  phone: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
});
```

#### **Patient Validation**

```typescript
export const createPatientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email format"),
  dateOfBirth: z.string().datetime(),
  gender: genderSchema,
  bloodType: bloodTypeSchema.optional(),
  allergies: z.array(z.string()).default([]),
  chronicConditions: z.array(z.string()).default([]),
  currentMedications: z.array(z.string()).default([]),
  status: patientStatusSchema.default("ACTIVE"),
  gdprConsent: z.boolean(),
});
```

**Validation Flow:**

```typescript
// In your API endpoint:
const validatedData = createPatientSchema.parse(request.body);
const patient = await prisma.patient.create({
  data: validatedData,
});
```

---

## 🗃️ Database Operations with Prisma

### **Connection Setup**

```typescript
// Location: src/lib/db.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "error", "warn"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### **Common Query Patterns**

#### **Creating Records with Relationships**

```typescript
// Create patient with assigned provider
const patient = await prisma.patient.create({
  data: {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    assignedProvider: {
      connect: { id: providerId },
    },
  },
  include: {
    assignedProvider: {
      select: { id: true, firstName: true, lastName: true, role: true },
    },
  },
});
```

#### **Querying with Filters and Includes**

```typescript
// Get all active patients with their medical records
const patients = await prisma.patient.findMany({
  where: {
    status: "ACTIVE",
    assignedProviderId: providerId,
  },
  include: {
    medicalRecords: {
      where: {
        type: "CONSULTATION",
        recordDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      orderBy: {
        recordDate: "desc",
      },
    },
  },
});
```

#### **Handling Encrypted Data**

```typescript
// When creating medical records, encrypt sensitive fields
import { encrypt } from "../lib/encryption";

const medicalRecord = await prisma.medicalRecord.create({
  data: {
    patientId,
    providerId,
    type: "CONSULTATION",
    title: "Annual Checkup",
    recordDate: new Date(),
    descriptionEncrypted: Buffer.from(encrypt(description).encrypted, "hex"),
    findingsEncrypted: Buffer.from(encrypt(findings).encrypted, "hex"),
    recommendationsEncrypted: Buffer.from(
      encrypt(recommendations).encrypted,
      "hex"
    ),
    isPrivate: false,
    restrictedAccess: false,
  },
});

// When retrieving, decrypt for API response
import { decrypt } from "../lib/encryption";

const decryptedRecord = {
  ...medicalRecord,
  description: decrypt({
    encrypted: medicalRecord.descriptionEncrypted.toString("hex"),
    iv: medicalRecord.iv,
    tag: medicalRecord.tag,
  }),
  // ... decrypt other encrypted fields
};
```

---

## 📊 API Response Patterns

### **Standard Response Structure**

```typescript
// Location: src/types/api.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

### **Error Handling**

```typescript
// Location: src/utils/errors.ts
export enum ErrorCodes {
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  // ... more error codes
}

export class AppError extends Error {
  public readonly code: ErrorCodes;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(
    code: ErrorCodes,
    message: string,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = "AppError";
  }
}
```

---

## 🔍 Building API Endpoints

### **Example: Patient Management API**

#### **1. Create Patient Endpoint**

```typescript
// POST /api/patients
export async function createPatient(req: Request, res: Response) {
  try {
    // 1. Validate input
    const validatedData = createPatientSchema.parse(req.body);

    // 2. Check permissions (user must be DOCTOR, NURSE, or ADMIN)
    const user = req.user; // From auth middleware
    if (!["DOCTOR", "NURSE", "ADMIN"].includes(user.role)) {
      throw new AppError(
        ErrorCodes.INSUFFICIENT_PERMISSIONS,
        "Insufficient permissions to create patients",
        403
      );
    }

    // 3. Create patient
    const patient = await prisma.patient.create({
      data: {
        ...validatedData,
        createdBy: user.id,
      },
      include: {
        assignedProvider: {
          select: { id: true, firstName: true, lastName: true, role: true },
        },
      },
    });

    // 4. Log audit event
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: "CREATE",
        resource: "Patient",
        resourceId: patient.id,
        requestId: req.headers["x-request-id"] as string,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] || "",
        endpoint: req.path,
        method: req.method,
        statusCode: 201,
        responseTime: Date.now() - req.startTime,
        changes: { created: patient },
        success: true,
        severity: "INFO",
        category: "DATA_ACCESS",
      },
    });

    // 5. Return response
    res.status(201).json({
      success: true,
      data: patient,
      message: "Patient created successfully",
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      });
    }
  }
}
```

#### **2. Get Patients with Pagination**

```typescript
// GET /api/patients?page=1&limit=10&status=ACTIVE&search=john
export async function getPatients(req: Request, res: Response) {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: "insensitive" } },
        { lastName: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
      ];
    }

    // Get patients with pagination
    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          assignedProvider: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
          _count: {
            select: { medicalRecords: true, appointments: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.patient.count({ where }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: patients,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1,
      },
    });
  } catch (error) {
    // Error handling...
  }
}
```

---

## 🚀 Getting Started with API Development

### **1. Environment Setup**

```bash
# Required environment variables
DATABASE_URL="postgresql://ehr_user:ehr_password123@localhost:5432/ehr_database"
ENCRYPTION_KEY="f964ff9a066dd9880b92994fdddf1dbc3358f66803d432424240ebbe943caa10"
JWT_SECRET="1a8497bbcb7e2f1a44b77d6ade867b22c3ea13be003f081f38dca480ccac936c"
JWT_REFRESH_SECRET="5b54a55af8cddb57bda2e4b7133fdc85866b6994db0281cf247c3ec7f332e0ac"
NODE_ENV="development"
LOG_LEVEL="info"
```

### **2. Database Operations**

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Open Prisma Studio (database browser)
npx prisma studio
```

### **3. Development Workflow**

1. **Define API endpoints** in your framework (Express, Fastify, etc.)
2. **Use validation schemas** from `src/lib/validation.ts`
3. **Implement database operations** using Prisma client
4. **Add encryption** for sensitive data before storage
5. **Include audit logging** for compliance
6. **Handle errors** using the AppError system
7. **Return standardized responses** using ApiResponse interface

### **4. Testing Your Setup**

```bash
# Test database connection
DATABASE_URL="your_db_url" npx prisma studio

# Check tables
psql "your_db_url" -c "\dt"

# Verify enums
psql "your_db_url" -c "SELECT unnest(enum_range(NULL::\"UserRole\"));"
```

---

## 🔒 Security Best Practices

### **Data Encryption**

- **Always encrypt** sensitive medical data before database storage
- **Use the encryption utility** from `src/lib/encryption.ts`
- **Never store** encryption keys in code or version control
- **Rotate keys** periodically in production

### **Authentication**

- **Implement JWT middleware** for protected routes
- **Validate tokens** on every request
- **Use refresh tokens** for better security
- **Implement rate limiting** for login endpoints

### **Authorization**

- **Check user roles** before allowing operations
- **Validate resource ownership** (patients can only see their own data)
- **Log all access attempts** for audit purposes
- **Implement session management** with proper expiry

### **Input Validation**

- **Always validate** input using Zod schemas
- **Sanitize data** before database operations
- **Use parameterized queries** (Prisma handles this automatically)
- **Validate file uploads** and scan for malware

---

## 📚 Additional Resources

### **Key Files to Study**

- `prisma/schema.prisma` - Database schema and relationships
- `src/lib/validation.ts` - All validation schemas
- `src/types/` - TypeScript interfaces for all entities
- `src/utils/errors.ts` - Error handling system
- `src/lib/encryption.ts` - Security implementation

### **Database Relationships Map**

```
users (1) ←→ (many) patients
users (1) ←→ (many) medical_records
users (1) ←→ (many) appointments
users (1) ←→ (many) consultations
patients (1) ←→ (many) medical_records
patients (1) ←→ (many) appointments
appointments (1) ←→ (1) consultations
```

### **Common Patterns**

- **CRUD operations** with proper validation
- **Relationship queries** with includes and selects
- **Encrypted field handling** for sensitive data
- **Audit logging** for compliance
- **Error handling** with proper HTTP status codes
- **Pagination** for large datasets
- **Search and filtering** with dynamic where clauses

---

This system provides a solid foundation for building a secure, compliant, and scalable EHR API. The encryption, validation, and audit systems are production-ready, and the database schema supports complex healthcare workflows while maintaining data integrity and security.
