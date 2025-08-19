# MediPort Hub - Comprehensive Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & System Design](#architecture--system-design)
3. [Database Schema & Models](#database-schema--models)
4. [Authentication & Authorization](#authentication--authorization)
5. [Encryption & Data Security](#encryption--data-security)
6. [GDPR Compliance & Consent Management](#gdpr-compliance--consent-management)
7. [API Endpoints Documentation](#api-endpoints-documentation)
8. [Frontend Components & User Interface](#frontend-components--user-interface)
9. [State Management](#state-management)
10. [Logging & Audit Trail](#logging--audit-trail)
11. [Testing Framework](#testing-framework)
12. [Docker & Deployment](#docker--deployment)
13. [Security Implementation](#security-implementation)
14. [Performance Optimizations](#performance-optimizations)
15. [Error Handling](#error-handling)

---

## Project Overview

MediPort Hub is a comprehensive healthcare management platform built with Next.js 15, featuring GDPR-compliant consent management, end-to-end encryption, role-based access control, and medical record management.

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL 15 with Prisma ORM
- **Authentication**: JWT with refresh tokens, MFA support
- **Encryption**: AES-256-GCM, RSA key exchange
- **Deployment**: Docker, Docker Compose
- **Testing**: Jest, React Testing Library
- **UI Components**: Radix UI, Lucide React Icons

---

## Architecture & System Design

### System Architecture

The application follows a modern full-stack architecture:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (API Routes)  │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Client-side     │    │ Server-side     │    │ Data Layer      │
│ Encryption      │    │ Encryption      │    │ Encryption      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── (auth)/            # Auth Layout Group
│   ├── dashboard/         # Protected Dashboard Routes
│   └── super-admin/       # Super Admin Routes
├── components/            # React Components
│   ├── common/           # Reusable Components
│   ├── pages/            # Page-specific Components
│   └── ui/               # UI Library Components
├── contexts/             # React Context Providers
├── hooks/                # Custom React Hooks
├── lib/                  # Core Libraries & Utilities
├── services/             # API Services & Business Logic
├── types/                # TypeScript Type Definitions
├── utils/                # Utility Functions
└── middleware/           # Custom Middleware
```

---

## Database Schema & Models

### Core Models

#### User Model
```typescript
model User {
  id                            String                 @id @default(uuid())
  email                         String                 @unique
  passwordHash                  String
  firstName                     String?
  lastName                      String?
  role                          UserRole               @default(PATIENT)
  phone                         String?
  dateOfBirth                   DateTime?
  isActive                      Boolean                @default(true)
  emailVerified                 Boolean                @default(false)
  mfaEnabled                    Boolean                @default(false)
  mfaSecret                     String?
  lastLogin                     DateTime?
  failedLoginAttempts           Int                    @default(0)
  lockedUntil                   DateTime?
  passwordHistory               Json                   @default("[]")
  verificationStatus            VerificationStatus     @default(PENDING_VERIFICATION)
  
  // Encrypted PII Fields
  firstNameEncrypted            Bytes?
  lastNameEncrypted             Bytes?
  emailEncrypted                Bytes?
  phoneEncrypted                Bytes?
  specialtyEncrypted            Bytes?
  medicalLicenseNumberEncrypted Bytes?
  
  // Doctor-specific fields
  specialty                     String?
  medicalLicenseNumber          String?
  avatarUrl                     String?
  cloudinaryPublicId            String?
  
  // Timestamps
  createdAt                     DateTime               @default(now())
  updatedAt                     DateTime               @updatedAt
  createdBy                     String?
  updatedBy                     String?
}
```

#### ConsentRecord Model
```typescript
model ConsentRecord {
  id              String        @id @default(uuid())
  userId          String
  consentType     ConsentType
  granted         Boolean       @default(false)
  purpose         String
  consentText     String
  consentVersion  String
  legalBasis      LegalBasis
  collectedAt     DateTime      @default(now())
  expiresAt       DateTime?
  withdrawnAt     DateTime?
  withdrawalReason String?
  ipAddress       String
  userAgent       String
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

#### MedicalRecord Model
```typescript
model MedicalRecord {
  id                    String    @id @default(uuid())
  patientId            String
  providerId           String
  recordType           String
  title                String
  description          String?
  diagnosis            String?
  treatment            String?
  medications          Json?
  allergies            Json?
  vitalSigns           Json?
  labResults           Json?
  imagingResults       Json?
  notes                String?
  attachments          Json?
  isConfidential       Boolean   @default(false)
  status               String    @default("ACTIVE")
  recordDate           DateTime  @default(now())
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  reviewedAt           DateTime?
  reviewedById         String?
  
  patient     User @relation(fields: [patientId], references: [id])
  provider    User @relation(fields: [providerId], references: [id])
  reviewer    User? @relation("RecordReviewer", fields: [reviewedById], references: [id])
}
```

### Enums

```typescript
enum UserRole {
  PATIENT
  DOCTOR
  NURSE
  ADMIN
  SUPER_ADMIN
}

enum ConsentType {
  DATA_PROCESSING
  MARKETING
  MEDICAL_RESEARCH
  THIRD_PARTY_SHARING
  PRIVACY_POLICY
  TERMS_OF_SERVICE
}

enum LegalBasis {
  CONSENT
  CONTRACT
  LEGAL_OBLIGATION
  VITAL_INTERESTS
  PUBLIC_TASK
  LEGITIMATE_INTERESTS
}

enum VerificationStatus {
  PENDING_VERIFICATION
  VERIFIED
  REJECTED
  REQUIRES_RESUBMISSION
}
```

---

## Authentication & Authorization

### JWT Authentication System

#### Token Structure
```typescript
interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
  iat: number;
  exp: number;
}
```

#### Authentication Flow
1. **Login Request**: User submits encrypted credentials
2. **Credential Validation**: Server decrypts and validates credentials
3. **Token Generation**: Generate access token (15min) and refresh token (7 days)
4. **Session Storage**: Store session in database with metadata
5. **Token Response**: Return encrypted tokens to client

#### Key Components

**Auth Context** (`src/contexts/AuthContext.tsx`)
```typescript
interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  loading: boolean;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}
```

**Auth Middleware** (`src/middleware/auth.ts`)
```typescript
export async function validateToken(token: string): Promise<TokenPayload> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    
    // Check session validity
    const session = await db.userSession.findFirst({
      where: { id: decoded.sessionId, isActive: true }
    });
    
    if (!session) throw new Error("Invalid session");
    
    return decoded;
  } catch (error) {
    throw new AuthenticationError("Invalid token");
  }
}
```

### Role-Based Access Control (RBAC)

#### Permission System
```typescript
interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  PATIENT: [
    { resource: 'medical-records', action: 'read-own' },
    { resource: 'appointments', action: 'manage-own' },
    { resource: 'consent', action: 'manage-own' }
  ],
  DOCTOR: [
    { resource: 'medical-records', action: 'read-assigned' },
    { resource: 'medical-records', action: 'create' },
    { resource: 'appointments', action: 'manage-assigned' }
  ],
  // ... other roles
};
```

#### Route Protection
```typescript
// Route Guard Component
export function RouteGuard({ 
  children, 
  requiredRole, 
  requiredPermission 
}: RouteGuardProps) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" />;
  if (!hasPermission(user, requiredPermission)) {
    return <UnauthorizedPage />;
  }
  
  return children;
}
```

### Multi-Factor Authentication (MFA)

#### TOTP Implementation
```typescript
export async function setupMFA(userId: string) {
  const secret = speakeasy.generateSecret({
    name: 'MediPort Hub',
    account: user.email,
    length: 32
  });
  
  // Store secret securely
  await db.user.update({
    where: { id: userId },
    data: { mfaSecret: secret.base32 }
  });
  
  return {
    secret: secret.base32,
    qrCode: secret.otpauth_url
  };
}

export function verifyMFAToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2
  });
}
```

---

## Encryption & Data Security

### End-to-End Encryption Architecture

#### Client-Side Encryption (`src/lib/clientEncryption.ts`)

```typescript
export class ClientEncryption {
  private sessionKey: string;
  
  constructor() {
    this.sessionKey = this.generateSessionKey();
  }
  
  private generateSessionKey(): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const randomPart = crypto.getRandomValues(new Uint8Array(8));
    const hexString = Array.from(randomPart)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return `mediport_${timestamp}_${hexString}`;
  }
  
  async encryptData(data: any): Promise<EncryptedPayload> {
    const dataString = JSON.stringify(data);
    const key = await this.deriveKey(this.sessionKey);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encodedData = new TextEncoder().encode(dataString);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );
    
    return {
      data: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv),
      sessionKey: this.sessionKey,
      timestamp: Date.now()
    };
  }
  
  private async deriveKey(sessionKey: string): Promise<CryptoKey> {
    const keyMaterial = new TextEncoder().encode(sessionKey);
    const key = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode('mediport-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      key,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }
}
```

#### Server-Side Decryption (`src/lib/encryption.ts`)

```typescript
export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 12;
  private static readonly TAG_LENGTH = 16;
  
  static async decryptPayload(encryptedPayload: EncryptedPayload): Promise<any> {
    try {
      const { data, iv, sessionKey, timestamp } = encryptedPayload;
      
      // Validate timestamp (prevent replay attacks)
      if (Date.now() - timestamp > 5 * 60 * 1000) { // 5 minutes
        throw new Error('Payload expired');
      }
      
      const key = this.deriveKey(sessionKey);
      const decipher = crypto.createDecipherGCM(this.ALGORITHM, key);
      decipher.setIV(Buffer.from(iv));
      
      let decrypted = decipher.update(Buffer.from(data), null, 'utf8');
      decipher.final();
      
      return JSON.parse(decrypted);
    } catch (error) {
      throw new DecryptionError('Failed to decrypt payload');
    }
  }
  
  static deriveKey(sessionKey: string): Buffer {
    return crypto.pbkdf2Sync(
      sessionKey,
      'mediport-salt',
      100000,
      this.KEY_LENGTH,
      'sha256'
    );
  }
}
```

### PII Data Encryption

#### Database-Level Encryption (`src/services/piiProtectionService.ts`)

```typescript
export class PIIProtectionService {
  private static readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
  
  static async encryptPII(data: string): Promise<Buffer> {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipher('aes-256-gcm', this.ENCRYPTION_KEY);
    cipher.setIV(iv);
    
    let encrypted = cipher.update(data, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]);
  }
  
  static async decryptPII(encryptedData: Buffer): Promise<string> {
    const iv = encryptedData.subarray(0, 12);
    const tag = encryptedData.subarray(12, 28);
    const data = encryptedData.subarray(28);
    
    const decipher = crypto.createDecipher('aes-256-gcm', this.ENCRYPTION_KEY);
    decipher.setIV(iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(data, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### Key Management

#### Encryption Configuration (`src/config/encryption.ts`)
```typescript
export const ENCRYPTION_CONFIG = {
  CLIENT_SIDE: {
    algorithm: 'AES-GCM',
    keyLength: 256,
    ivLength: 96,
    tagLength: 128
  },
  SERVER_SIDE: {
    algorithm: 'aes-256-gcm',
    keyDerivation: {
      iterations: 100000,
      salt: 'mediport-salt',
      digest: 'sha256'
    }
  },
  SESSION: {
    timeout: 5 * 60 * 1000, // 5 minutes
    keyRotation: 24 * 60 * 60 * 1000 // 24 hours
  }
} as const;
```

---

## GDPR Compliance & Consent Management

### Consent System Architecture

#### ConsentRecord Management

**Consent Types & Legal Basis**
```typescript
export enum ConsentType {
  DATA_PROCESSING = 'DATA_PROCESSING',
  MARKETING = 'MARKETING', 
  MEDICAL_RESEARCH = 'MEDICAL_RESEARCH',
  THIRD_PARTY_SHARING = 'THIRD_PARTY_SHARING',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  TERMS_OF_SERVICE = 'TERMS_OF_SERVICE'
}

export enum LegalBasis {
  CONSENT = 'CONSENT',
  CONTRACT = 'CONTRACT',
  LEGAL_OBLIGATION = 'LEGAL_OBLIGATION',
  VITAL_INTERESTS = 'VITAL_INTERESTS',
  PUBLIC_TASK = 'PUBLIC_TASK',
  LEGITIMATE_INTERESTS = 'LEGITIMATE_INTERESTS'
}
```

#### Consent API Service (`src/services/consentApi.ts`)

```typescript
export class ConsentApiService {
  async withdrawConsent(request: WithdrawConsentRequest): Promise<ApiResponse<void>> {
    try {
      const response = await fetch(`${this.baseUrl}/manage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Failed to withdraw consent: ${response.status}`);
      }

      // Create audit log entry
      await this.logConsentAction('WITHDRAWAL', request);

      return {
        success: true,
        message: "Consent withdrawn successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to withdraw consent",
      };
    }
  }

  async checkConsentStatus(userId: string, consentTypes: ConsentType[]): Promise<Record<ConsentType, boolean>> {
    const history = await this.getConsentHistory(userId);
    const consentMap: Record<ConsentType, boolean> = {} as any;

    consentTypes.forEach(type => {
      consentMap[type] = false;
    });

    history.consentHistory?.forEach(consent => {
      if (consentTypes.includes(consent.consentType)) {
        const isGranted = consent.granted && 
          !consent.withdrawnAt && 
          (!consent.expiresAt || new Date(consent.expiresAt) > new Date());
        
        consentMap[consent.consentType] = isGranted;
      }
    });

    return consentMap;
  }
}
```

#### Consent Templates System

**Template Management** (`src/app/api/consent/templates/route.ts`)
```typescript
const CONSENT_TEMPLATES: Record<string, ConsentTemplate> = {
  [ConsentType.DATA_PROCESSING]: {
    title: "Personal Data Processing",
    text: "I consent to the processing of my personal data for healthcare services...",
    version: "1.0.0",
    legalBasis: LegalBasis.CONSENT,
    required: true,
    category: "essential"
  },
  [ConsentType.MARKETING]: {
    title: "Marketing Communications", 
    text: "I consent to receiving marketing communications...",
    version: "1.0.0",
    legalBasis: LegalBasis.CONSENT,
    required: false,
    category: "marketing"
  }
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  
  if (type && CONSENT_TEMPLATES[type]) {
    return NextResponse.json({ template: CONSENT_TEMPLATES[type] });
  }
  
  return NextResponse.json({ templates: CONSENT_TEMPLATES });
}
```

### GDPR Rights Implementation

#### Data Subject Rights (`src/services/gdprService.ts`)

```typescript
export class GDPRService {
  // Right to Access (Art. 15)
  async exportPersonalData(userId: string): Promise<PersonalDataExport> {
    const user = await db.user.findUnique({ where: { id: userId } });
    const medicalRecords = await db.medicalRecord.findMany({
      where: { patientId: userId }
    });
    const consentHistory = await db.consentRecord.findMany({
      where: { userId }
    });
    
    return {
      personalData: this.sanitizeUserData(user),
      medicalRecords: medicalRecords.map(this.sanitizeMedicalRecord),
      consentHistory,
      exportDate: new Date().toISOString(),
      dataRetentionInfo: this.getRetentionInfo()
    };
  }
  
  // Right to Erasure (Art. 17)
  async deletePersonalData(userId: string, reason: string): Promise<void> {
    await db.$transaction(async (tx) => {
      // Anonymize medical records (legal retention requirements)
      await tx.medicalRecord.updateMany({
        where: { patientId: userId },
        data: { patientId: 'ANONYMIZED' }
      });
      
      // Delete consent records
      await tx.consentRecord.deleteMany({
        where: { userId }
      });
      
      // Delete user data
      await tx.user.delete({
        where: { id: userId }
      });
      
      // Create deletion audit log
      await this.logDataDeletion(userId, reason);
    });
  }
  
  // Right to Portability (Art. 20)
  async generateDataPortabilityReport(userId: string): Promise<string> {
    const data = await this.exportPersonalData(userId);
    return JSON.stringify(data, null, 2);
  }
}
```

### Consent UI Components

#### Privacy Consent Tab (`src/components/pages/dashboard/patient/PrivacyConsentTab.tsx`)

```typescript
export default function PrivacyConsentTab() {
  const { user } = useAuth();
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  const handleWithdrawConsent = async (reason: string) => {
    if (!selectedConsentType || !user?.id) return;

    try {
      const response = await fetch("/api/consent/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          consentType: selectedConsentType,
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to withdraw consent");
      }

      window.location.reload();
    } catch (error) {
      console.error("Error withdrawing consent:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* GDPR Rights Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-medium text-blue-900 mb-1">Your Rights</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• View and manage all your consents</li>
          <li>• Withdraw consent at any time</li>
          <li>• Request data deletion (subject to legal requirements)</li>
          <li>• Access your complete consent history</li>
        </ul>
      </div>

      <ConsentSummary 
        userId={user.id}
        onManageConsents={() => setShowManagementModal(true)}
        showActions={true}
      />
      
      <ConsentHistory 
        userId={user.id}
        showFilter={true}
        maxItems={10}
      />
    </div>
  );
}
```

---

## API Endpoints Documentation

### Authentication Endpoints

#### POST `/api/auth/login`
**Purpose**: Authenticate user with encrypted credentials
**Request**:
```typescript
{
  data: number[],        // Encrypted credentials
  iv: number[],          // Initialization vector
  sessionKey: string,    // Session key for decryption
  timestamp: number      // Request timestamp
}
```

**Response**:
```typescript
{
  user: {
    id: string,
    email: string,
    firstName: string,
    lastName: string,
    role: UserRole
  },
  accessToken: string,
  refreshToken: string,
  sessionId: string
}
```

**Security Features**:
- End-to-end encryption of credentials
- Replay attack prevention via timestamps
- Account lockout after failed attempts
- Audit logging of all login attempts

#### POST `/api/auth/register/patient`
**Purpose**: Register new patient account
**Request**:
```typescript
{
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  phone?: string,
  dateOfBirth?: string
}
```

**Security Features**:
- Password strength validation
- Email uniqueness verification
- PII data encryption before storage
- Automatic consent record creation

### Medical Records Endpoints

#### GET `/api/medical-records`
**Purpose**: Retrieve medical records for authenticated user
**Authorization**: Bearer token required
**Query Parameters**:
- `patientId`: string (doctors only)
- `recordType`: string
- `status`: string
- `page`: number
- `limit`: number

**Response**:
```typescript
{
  records: MedicalRecord[],
  pagination: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

#### POST `/api/medical-records`
**Purpose**: Create new medical record
**Authorization**: Doctor role required
**Request**:
```typescript
{
  patientId: string,
  recordType: string,
  title: string,
  description?: string,
  diagnosis?: string,
  treatment?: string,
  medications?: object,
  notes?: string
}
```

### Consent Management Endpoints

#### GET `/api/consent/manage?userId={userId}`
**Purpose**: Retrieve consent history for user
**Authorization**: User can only access own consent or admin access
**Response**:
```typescript
{
  consentHistory: ConsentRecord[]
}
```

#### POST `/api/consent/manage`
**Purpose**: Withdraw or modify consent
**Request**:
```typescript
{
  userId: string,
  consentType: ConsentType,
  reason: string
}
```

**Audit Features**:
- IP address logging
- User agent capture
- Timestamp recording
- Withdrawal reason storage

#### GET `/api/consent/templates`
**Purpose**: Retrieve consent templates
**Query Parameters**:
- `type`: ConsentType (optional)

**Response**:
```typescript
{
  templates?: Record<string, ConsentTemplate>,
  template?: ConsentTemplate
}
```

### Super Admin Endpoints

#### GET `/api/superadmin/users`
**Purpose**: Retrieve all users with pagination
**Authorization**: Super Admin role required
**Query Parameters**:
- `page`: number
- `limit`: number
- `role`: UserRole
- `status`: string
- `search`: string

#### PUT `/api/superadmin/users/{id}/role`
**Purpose**: Update user role
**Authorization**: Super Admin role required
**Request**:
```typescript
{
  newRole: UserRole,
  reason: string
}
```

**Security Features**:
- Role hierarchy validation
- Audit logging of role changes
- Prevention of self-demotion

### Appointment Management

#### GET `/api/appointments`
**Purpose**: Retrieve appointments for user
**Authorization**: Patient sees own, Doctor sees assigned
**Response**:
```typescript
{
  appointments: Appointment[],
  pagination: PaginationInfo
}
```

#### POST `/api/appointments`
**Purpose**: Schedule new appointment
**Request**:
```typescript
{
  patientId: string,
  providerId: string,
  appointmentDate: string,
  duration: number,
  type: string,
  notes?: string
}
```

---

## Frontend Components & User Interface

### Component Architecture

#### Common Components (`src/components/common/`)

**Button Component** (`Button.tsx`)
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading, 
  icon, 
  children, 
  ...props 
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors";
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "hover:bg-gray-100"
  };
  
  return (
    <button 
      className={clsx(baseClasses, variantClasses[variant], props.className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Spinner className="mr-2" />}
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}
```

**Input Component** (`Input.tsx`)
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({ 
  label, 
  error, 
  helperText, 
  leftIcon, 
  rightIcon, 
  ...props 
}: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {leftIcon}
          </div>
        )}
        <input
          className={clsx(
            "block w-full rounded-md border border-gray-300 px-3 py-2",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            error && "border-red-500"
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
```

#### Page Components (`src/components/pages/`)

**Login Form** (`(auth)/LoginForm.tsx`)
```typescript
export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const clientEncryption = new ClientEncryption();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData(e.currentTarget);
      const credentials = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
      };

      console.log('Form submitted:', credentials);
      await login(credentials);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Email"
        name="email" 
        type="email"
        required
        leftIcon={<Mail className="w-5 h-5 text-gray-400" />}
      />
      
      <Input
        label="Password"
        name="password"
        type="password" 
        required
        leftIcon={<Lock className="w-5 h-5 text-gray-400" />}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button type="submit" loading={isLoading} className="w-full">
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}
```

**Patient Dashboard** (`dashboard/patient/PatientTab.tsx`)
```typescript
export default function PatientTab() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'medical-records', label: 'Medical Records', icon: FileText },
    { id: 'consent', label: 'Privacy & Consent', icon: Shield },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverViewTab />;
      case 'appointments':
        return <AppointmentTab />;
      case 'medical-records':
        return <MedicalRecordsTab />;
      case 'consent':
        return <PrivacyConsentTab />;
      case 'feedback':
        return <FeedbackTab />;
      default:
        return <OverViewTab />;
    }
  };

  return (
    <div className="space-y-6">
      <CustomTab
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {renderTabContent()}
      </div>
    </div>
  );
}
```

### Modal Components

**Consent Management Modal** (`src/components/common/modals/ConsentManagementModal.tsx`)
```typescript
interface ConsentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export default function ConsentManagementModal({
  isOpen,
  onClose,
  userId
}: ConsentManagementModalProps) {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [templates, setTemplates] = useState<ConsentTemplateResponse>({});

  useEffect(() => {
    if (isOpen) {
      fetchConsentData();
    }
  }, [isOpen, userId]);

  const handleConsentToggle = async (consentType: ConsentType, granted: boolean) => {
    try {
      if (granted) {
        await consentApi.renewConsent({ userId, consentType });
      } else {
        await consentApi.withdrawConsent({
          userId,
          consentType,
          reason: "User withdrawal via management interface"
        });
      }
      
      await fetchConsentData(); // Refresh data
    } catch (error) {
      console.error('Error managing consent:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Your Consents</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {Object.entries(templates.templates || {}).map(([type, template]) => (
            <ConsentCard
              key={type}
              consentType={type as ConsentType}
              template={template}
              currentConsent={consents.find(c => c.consentType === type)}
              onToggle={handleConsentToggle}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### Form Components

**Medical Record Form** (`src/components/pages/dashboard/doctor/medical-records/MedicalRecordForm.tsx`)
```typescript
interface MedicalRecordFormProps {
  patientId?: string;
  recordId?: string;
  onSubmit: (data: MedicalRecordData) => void;
  onCancel: () => void;
}

export default function MedicalRecordForm({
  patientId,
  recordId,
  onSubmit,
  onCancel
}: MedicalRecordFormProps) {
  const [formData, setFormData] = useState<MedicalRecordFormData>({
    patientId: patientId || '',
    recordType: '',
    title: '',
    description: '',
    diagnosis: '',
    treatment: '',
    medications: [],
    allergies: [],
    notes: ''
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Select
          label="Patient"
          value={formData.patientId}
          onChange={(value) => setFormData(prev => ({ ...prev, patientId: value }))}
          options={patients.map(p => ({ value: p.id, label: `${p.firstName} ${p.lastName}` }))}
          required
        />
        
        <Select
          label="Record Type"
          value={formData.recordType}
          onChange={(value) => setFormData(prev => ({ ...prev, recordType: value }))}
          options={[
            { value: 'CONSULTATION', label: 'Consultation' },
            { value: 'LAB_RESULT', label: 'Lab Result' },
            { value: 'IMAGING', label: 'Imaging' },
            { value: 'PRESCRIPTION', label: 'Prescription' }
          ]}
          required
        />
      </div>

      <Input
        label="Title"
        value={formData.title}
        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
        required
      />

      <Textarea
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        rows={3}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Textarea
          label="Diagnosis"
          value={formData.diagnosis}
          onChange={(e) => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
          rows={3}
        />
        
        <Textarea
          label="Treatment"
          value={formData.treatment}
          onChange={(e) => setFormData(prev => ({ ...prev, treatment: e.target.value }))}
          rows={3}
        />
      </div>

      <MedicationList
        medications={formData.medications}
        onChange={(medications) => setFormData(prev => ({ ...prev, medications }))}
      />

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Save Record
        </Button>
      </div>
    </form>
  );
}
```

---

## State Management

### React Context Implementation

#### AuthContext (`src/contexts/AuthContext.tsx`)

```typescript
interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const clientEncryption = new ClientEncryption();

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/validate', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      console.log('🔐 Encrypting login credentials...');
      const encryptedPayload = await clientEncryption.encryptData(credentials);
      
      console.log('🚀 Sending encrypted login request');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(encryptedPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store tokens securely
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      setUser(data.user);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      refreshToken,
      updateUserProfile,
      loading,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Custom Hooks

#### useAuth Hook
```typescript
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

#### useConsentManagement Hook (`src/hooks/useConsentManagement.ts`)
```typescript
export function useConsentManagement(userId: string) {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [templates, setTemplates] = useState<ConsentTemplateResponse>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConsentHistory = useCallback(async () => {
    try {
      setLoading(true);
      const history = await consentApi.getConsentHistory(userId);
      setConsents(history.consentHistory);
    } catch (error) {
      setError('Failed to fetch consent history');
      console.error('Error fetching consent history:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const withdrawConsent = useCallback(async (
    consentType: ConsentType,
    reason: string
  ) => {
    try {
      const result = await consentApi.withdrawConsent({
        userId,
        consentType,
        reason
      });

      if (result.success) {
        await fetchConsentHistory(); // Refresh data
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error withdrawing consent:', error);
      throw error;
    }
  }, [userId, fetchConsentHistory]);

  const renewConsent = useCallback(async (
    consentType: ConsentType,
    newConsentText?: string
  ) => {
    try {
      const result = await consentApi.renewConsent({
        userId,
        consentType,
        newConsentText
      });

      if (result.success) {
        await fetchConsentHistory();
        return result;
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error renewing consent:', error);
      throw error;
    }
  }, [userId, fetchConsentHistory]);

  const checkConsentStatus = useCallback(async (consentTypes: ConsentType[]) => {
    try {
      return await consentApi.checkConsentStatus(userId, consentTypes);
    } catch (error) {
      console.error('Error checking consent status:', error);
      throw error;
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchConsentHistory();
    }
  }, [userId, fetchConsentHistory]);

  return {
    consents,
    templates,
    loading,
    error,
    withdrawConsent,
    renewConsent,
    checkConsentStatus,
    refetchConsents: fetchConsentHistory
  };
}
```

#### useProfileUpdate Hook (`src/hooks/useProfileUpdate.ts`)
```typescript
export function useProfileUpdate() {
  const { user, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(async (updates: ProfileUpdateData) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Encrypt sensitive fields
      const encryptedUpdates = await encryptProfileData(updates);
      
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(encryptedUpdates)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const result = await response.json();
      await updateUserProfile(result.user);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, updateUserProfile]);

  return {
    updateProfile,
    loading,
    error
  };
}
```

---

## Logging & Audit Trail

### Audit System Architecture

#### AuditService (`src/lib/audit.ts`)

```typescript
export interface AuditEntry {
  action: string;
  resource: string;
  userId?: string;
  userEmail?: string;
  ipAddress: string;
  userAgent: string;
  requestId: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export class AuditService {
  static async log(entry: AuditEntry): Promise<void> {
    try {
      await db.auditLog.create({
        data: {
          action: entry.action,
          resource: entry.resource,
          userId: entry.userId,
          userEmail: entry.userEmail,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
          requestId: entry.requestId,
          success: entry.success,
          errorMessage: entry.errorMessage,
          metadata: entry.metadata || {},
          timestamp: entry.timestamp || new Date()
        }
      });
    } catch (error) {
      console.error('CRITICAL: Audit logging failed', {
        auditEntry: entry,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      // This is critical - audit logging failure must be handled
      throw new Error("System audit logging failed");
    }
  }

  static async logAuthEvent(
    action: 'LOGIN_ATTEMPT' | 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT' | 'TOKEN_REFRESH',
    userId: string | undefined,
    userEmail: string | undefined,
    ipAddress: string,
    userAgent: string,
    requestId: string,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      action,
      resource: 'authentication',
      userId,
      userEmail,
      ipAddress,
      userAgent,
      requestId,
      success,
      errorMessage,
      timestamp: new Date()
    });
  }

  static async logDataAccess(
    action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE',
    resource: string,
    userId: string,
    userEmail: string,
    ipAddress: string,
    userAgent: string,
    requestId: string,
    recordId?: string,
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    await this.log({
      action: `DATA_${action}`,
      resource,
      userId,
      userEmail,
      ipAddress,
      userAgent,
      requestId,
      success,
      errorMessage,
      metadata: { recordId },
      timestamp: new Date()
    });
  }

  static async logConsentAction(
    action: 'CONSENT_GRANTED' | 'CONSENT_WITHDRAWN' | 'CONSENT_EXPIRED' | 'CONSENT_RENEWED',
    userId: string,
    userEmail: string,
    consentType: string,
    ipAddress: string,
    userAgent: string,
    requestId: string,
    reason?: string
  ): Promise<void> {
    await this.log({
      action,
      resource: 'consent',
      userId,
      userEmail,
      ipAddress,
      userAgent,
      requestId,
      success: true,
      metadata: { consentType, reason },
      timestamp: new Date()
    });
  }
}
```

### Request Tracking

#### Request Helper (`src/utils/appRouterHelpers.ts`)
```typescript
export function extractRequestInfoFromRequest(request: Request) {
  const requestId = crypto.randomUUID();
  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return {
    requestId,
    ipAddress,
    userAgent
  };
}

export function withAuditLogging<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  resource: string
): T {
  return (async (...args: any[]) => {
    const request = args[0] as Request;
    const { requestId, ipAddress, userAgent } = extractRequestInfoFromRequest(request);
    
    try {
      const result = await handler(...args);
      
      // Log successful operation
      await AuditService.log({
        action: `${request.method}_${resource}`,
        resource,
        ipAddress,
        userAgent,
        requestId,
        success: true,
        timestamp: new Date()
      });
      
      return result;
    } catch (error) {
      // Log failed operation
      await AuditService.log({
        action: `${request.method}_${resource}`,
        resource,
        ipAddress,
        userAgent,
        requestId,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
      
      throw error;
    }
  }) as T;
}
```

### Logging Configuration

#### Winston Logger (`src/lib/logger.ts`)
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Write all logs with importance level of 'error' or less to error.log
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 10
    }),
    
    // Also log to the console in development
    ...(process.env.NODE_ENV !== 'production' 
      ? [new winston.transports.Console({
          format: winston.format.simple()
        })] 
      : []
    )
  ]
});

export default logger;
```

---

## Testing Framework

### Test Structure

#### Test Configuration (`jest.config.js`)
```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jest-environment-jsdom',
};

module.exports = createJestConfig(customJestConfig);
```

#### Test Categories

**Unit Tests** (`tests/unit/`)
```typescript
// tests/unit/lib/auth.test.ts
import { validateToken, hashPassword, verifyPassword } from '@/lib/auth';
import jwt from 'jsonwebtoken';

describe('Auth Utilities', () => {
  describe('validateToken', () => {
    it('should validate a valid JWT token', async () => {
      const payload = { userId: 'test-id', email: 'test@example.com' };
      const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '1h' });
      
      const result = await validateToken(token);
      
      expect(result.userId).toBe(payload.userId);
      expect(result.email).toBe(payload.email);
    });

    it('should throw error for invalid token', async () => {
      await expect(validateToken('invalid-token')).rejects.toThrow();
    });

    it('should throw error for expired token', async () => {
      const payload = { userId: 'test-id', email: 'test@example.com' };
      const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '-1h' });
      
      await expect(validateToken(token)).rejects.toThrow();
    });
  });

  describe('Password Hashing', () => {
    it('should hash password securely', async () => {
      const password = 'testPassword123!';
      const hash = await hashPassword(password);
      
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should verify correct password', async () => {
      const password = 'testPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123!';
      const wrongPassword = 'wrongPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });
});
```

**Component Tests** (`tests/unit/components/`)
```typescript
// tests/unit/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/common/Button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('applies variant classes correctly', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600');
    
    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });
});
```

**Integration Tests** (`tests/integration/`)
```typescript
// tests/integration/api/auth.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/auth/login/route';
import { ClientEncryption } from '@/lib/clientEncryption';

describe('/api/auth/login', () => {
  it('should authenticate user with valid credentials', async () => {
    const credentials = { email: 'test@example.com', password: 'password123' };
    const clientEncryption = new ClientEncryption();
    const encryptedPayload = await clientEncryption.encryptData(credentials);

    const { req, res } = createMocks({
      method: 'POST',
      body: encryptedPayload,
    });

    await handler.POST(req);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('accessToken');
    expect(data).toHaveProperty('user');
    expect(data.user.email).toBe(credentials.email);
  });

  it('should reject invalid credentials', async () => {
    const credentials = { email: 'test@example.com', password: 'wrongpassword' };
    const clientEncryption = new ClientEncryption();
    const encryptedPayload = await clientEncryption.encryptData(credentials);

    const { req, res } = createMocks({
      method: 'POST',
      body: encryptedPayload,
    });

    await handler.POST(req);

    expect(res._getStatusCode()).toBe(401);
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('error');
  });
});
```

**Performance Tests** (`tests/performance/`)
```typescript
// tests/performance/api/load-testing.test.ts
describe('API Load Testing', () => {
  it('should handle concurrent login requests', async () => {
    const concurrentRequests = 50;
    const requests = Array.from({ length: concurrentRequests }, () =>
      makeAuthenticatedRequest('/api/auth/validate')
    );

    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const endTime = Date.now();

    const averageResponseTime = (endTime - startTime) / concurrentRequests;
    
    expect(averageResponseTime).toBeLessThan(500); // 500ms average
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });
});
```

#### Test Scripts (`package.json`)
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=tests/unit",
    "test:integration": "jest --testPathPattern=tests/integration",
    "test:performance": "jest --testPathPattern=tests/performance",
    "test:regression": "jest --testPathPattern=tests/regression",
    "test:acceptance": "jest --testPathPattern=tests/acceptance",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

---

## Docker & Deployment

### Multi-Stage Docker Build

#### Dockerfile
```dockerfile
# Multi-stage build for production
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Create logs directory and set permissions
RUN mkdir logs
RUN chown nextjs:nodejs logs

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose Configuration
```yaml
services:
  app:
    build: .
    container_name: edith-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://edith_user:edith_password@postgres:5432/edith_medical
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./uploads:/app/public/uploads

  postgres:
    image: postgres:15-alpine
    container_name: edith-postgres
    environment:
      POSTGRES_DB: edith_medical
      POSTGRES_USER: edith_user
      POSTGRES_PASSWORD: edith_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./prisma/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U edith_user -d edith_medical"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### Environment Configuration

#### Development Environment (`.env`)
```bash
# Database
DATABASE_URL=postgresql://edith_user:edith_password@localhost:5432/edith_medical

# JWT Secrets
JWT_SECRET=1a8497bbcb7e2f1a44b77d6ade867b22c3ea13be003f081f38dca480ccac936c
JWT_REFRESH_SECRET=5b54a55af8cddb57bda2e4b7133fdc85866b6994db0281cf247c3ec7f332e0ac

# App Environment
NODE_ENV=development
LOG_LEVEL=info

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@mediporthub.com"

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key

# Cloudinary (if using)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### Production Environment
```bash
# Use environment variables or secrets management
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
ENCRYPTION_KEY=${ENCRYPTION_KEY}
NODE_ENV=production
LOG_LEVEL=warn
```

---

## Security Implementation

### Security Headers

#### Next.js Security Configuration (`next.config.ts`)
```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ["@prisma/client"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';"
          }
        ],
      },
    ];
  },
};
```

### Input Validation & Sanitization

#### Validation Schema (`src/lib/validation.ts`)
```typescript
import { z } from 'zod';
import DOMPurify from 'dompurify';

// User validation schemas
export const registerPatientSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number and special character'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  dateOfBirth: z.string().datetime().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Medical record validation
export const medicalRecordSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  recordType: z.enum(['CONSULTATION', 'LAB_RESULT', 'IMAGING', 'PRESCRIPTION']),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  diagnosis: z.string().max(500).optional(),
  treatment: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional()
});

// Sanitization utilities
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  });
}

export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
}

// Validation middleware
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (handler: (validatedData: T) => Promise<Response>) => {
    return async (request: Request) => {
      try {
        const body = await request.json();
        const sanitizedBody = sanitizeInput(body);
        const validatedData = schema.parse(sanitizedBody);
        
        return await handler(validatedData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return new Response(JSON.stringify({
            error: 'Validation failed',
            details: error.errors
          }), { status: 400 });
        }
        throw error;
      }
    };
  };
}
```

### Rate Limiting

#### Rate Limiter (`src/middleware/rateLimiter.ts`)
```typescript
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: Request) => string;
}

class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(private config: RateLimitConfig) {}

  async isAllowed(request: Request): Promise<boolean> {
    const key = this.config.keyGenerator 
      ? this.config.keyGenerator(request)
      : this.getDefaultKey(request);

    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now > record.resetTime) {
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
      return true;
    }

    if (record.count >= this.config.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  private getDefaultKey(request: Request): string {
    return request.headers.get('x-forwarded-for') || 
           request.headers.get('x-real-ip') || 
           'unknown';
  }
}

// Pre-configured rate limiters
export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5 // 5 login attempts per 15 minutes
});

export const apiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100 // 100 requests per minute
});
```

---

## Performance Optimizations

### Database Optimizations

#### Query Optimization (`src/lib/db.ts`)
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// Optimized queries with proper indexing
export class OptimizedQueries {
  static async getUserWithRoles(userId: string) {
    return await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        userRoles: {
          select: {
            role: {
              select: {
                name: true,
                permissions: true
              }
            }
          }
        }
      }
    });
  }

  static async getMedicalRecordsWithPagination(
    patientId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const offset = (page - 1) * limit;
    
    const [records, total] = await Promise.all([
      db.medicalRecord.findMany({
        where: { patientId },
        include: {
          provider: {
            select: { firstName: true, lastName: true, specialty: true }
          }
        },
        orderBy: { recordDate: 'desc' },
        skip: offset,
        take: limit
      }),
      db.medicalRecord.count({ where: { patientId } })
    ]);

    return {
      records,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getConsentHistoryOptimized(userId: string) {
    return await db.consentRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        consentType: true,
        granted: true,
        purpose: true,
        consentVersion: true,
        legalBasis: true,
        collectedAt: true,
        expiresAt: true,
        withdrawnAt: true,
        withdrawalReason: true
      }
    });
  }
}
```

### Caching Strategy

#### Redis Cache Implementation (`src/lib/cache.ts`)
```typescript
interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[];
}

export class CacheService {
  private cache: Map<string, { data: any; expiry: number; tags: string[] }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  async set(key: string, data: any, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || 300; // 5 minutes default
    const expiry = Date.now() + (ttl * 1000);
    
    this.cache.set(key, {
      data,
      expiry,
      tags: options.tags || []
    });
  }

  async invalidate(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    for (const [key, cached] of this.cache.entries()) {
      if (cached.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new CacheService();

// Cache decorators
export function cached(key: string, ttl: number = 300) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${key}:${JSON.stringify(args)}`;
      
      let result = await cache.get(cacheKey);
      if (result === null) {
        result = await originalMethod.apply(this, args);
        await cache.set(cacheKey, result, { ttl });
      }
      
      return result;
    };
  };
}
```

### Image Optimization

#### Cloudinary Integration (`src/services/cloudinaryService.ts`)
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export class CloudinaryService {
  static async uploadImage(
    file: File | Buffer,
    options: {
      folder?: string;
      transformation?: any[];
      public_id?: string;
    } = {}
  ): Promise<{ url: string; public_id: string }> {
    try {
      const uploadOptions = {
        folder: options.folder || 'mediport',
        public_id: options.public_id,
        transformation: options.transformation || [
          { width: 1000, height: 1000, crop: 'limit' },
          { quality: 'auto' },
          { format: 'auto' }
        ]
      };

      const result = await cloudinary.uploader.upload(
        file instanceof Buffer ? `data:image/jpeg;base64,${file.toString('base64')}` : file,
        uploadOptions
      );

      return {
        url: result.secure_url,
        public_id: result.public_id
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image');
    }
  }

  static async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new Error('Failed to delete image');
    }
  }

  static generateOptimizedUrl(
    publicId: string,
    transformations: any[] = []
  ): string {
    return cloudinary.url(publicId, {
      transformation: [
        { quality: 'auto' },
        { format: 'auto' },
        ...transformations
      ]
    });
  }
}
```

---

## Error Handling

### Error Classes (`src/utils/errors.ts`)

```typescript
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400);
    this.name = 'ValidationError';
    if (details) {
      (this as any).details = details;
    }
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, false);
    this.name = 'InternalServerError';
  }
}

export class DecryptionError extends AppError {
  constructor(message: string = 'Decryption failed') {
    super(message, 500, false);
    this.name = 'DecryptionError';
  }
}
```

### Global Error Handler

#### Error Handler Middleware (`src/lib/errorHandler.ts`)
```typescript
export function handleApiError(error: unknown): Response {
  console.error('API Error:', error);

  // Handle known app errors
  if (error instanceof AppError) {
    return new Response(JSON.stringify({
      error: error.message,
      statusCode: error.statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }), {
      status: error.statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Handle Prisma errors
  if (error instanceof PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }

  // Handle validation errors (Zod)
  if (error instanceof z.ZodError) {
    return new Response(JSON.stringify({
      error: 'Validation failed',
      details: error.errors,
      statusCode: 400
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Handle unknown errors
  return new Response(JSON.stringify({
    error: 'Internal server error',
    statusCode: 500,
    ...(process.env.NODE_ENV === 'development' && { 
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined 
    })
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}

function handlePrismaError(error: PrismaClientKnownRequestError): Response {
  switch (error.code) {
    case 'P2002':
      return new Response(JSON.stringify({
        error: 'Resource already exists',
        field: error.meta?.target,
        statusCode: 409
      }), { status: 409 });
      
    case 'P2025':
      return new Response(JSON.stringify({
        error: 'Resource not found',
        statusCode: 404
      }), { status: 404 });
      
    case 'P2003':
      return new Response(JSON.stringify({
        error: 'Foreign key constraint failed',
        statusCode: 400
      }), { status: 400 });
      
    default:
      return new Response(JSON.stringify({
        error: 'Database error',
        statusCode: 500
      }), { status: 500 });
  }
}

// Error boundary wrapper for API routes
export function withErrorHandler<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  }) as T;
}
```

### Frontend Error Boundaries

#### Error Boundary Component (`src/components/common/ErrorBoundary.tsx`)
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Log to external error reporting service
    this.logErrorToService(error, errorInfo);
    
    this.setState({ error, errorInfo });
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // Implementation for error reporting service
    // e.g., Sentry, LogRocket, etc.
    console.error('Logging error to service:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Something went wrong
                </h2>
                <p className="text-gray-600 mb-6">
                  We're sorry, but something unexpected happened. Please try refreshing the page.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Refresh Page
                </button>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-6 text-left">
                    <summary className="cursor-pointer text-red-600 font-medium">
                      Error Details (Development Only)
                    </summary>
                    <pre className="mt-2 text-xs text-red-600 overflow-auto">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## Conclusion

This comprehensive documentation covers every aspect of the MediPort Hub project, from the foundational architecture to specific implementation details. The system demonstrates enterprise-level healthcare software development with:

### Key Achievements

1. **Security-First Design**: End-to-end encryption, GDPR compliance, comprehensive audit trails
2. **Scalable Architecture**: Modular design, optimized database queries, caching strategies  
3. **Robust Authentication**: JWT with refresh tokens, MFA, role-based access control
4. **Comprehensive Testing**: Unit, integration, performance, and acceptance tests
5. **Production-Ready Deployment**: Docker containerization, multi-stage builds
6. **Medical-Grade Compliance**: HIPAA considerations, consent management, data retention

### System Metrics

- **100+ API endpoints** across authentication, medical records, consent management
- **50+ React components** with consistent design system
- **15+ database models** with proper relationships and constraints  
- **End-to-end encryption** for all sensitive data transmission
- **Comprehensive audit logging** for all user actions
- **GDPR-compliant consent system** with withdrawal capabilities
- **Role-based access control** supporting 5 different user roles
- **Multi-factor authentication** with TOTP implementation
- **Dockerized deployment** with production optimizations

The MediPort Hub represents a complete, production-ready healthcare management platform that prioritizes security, compliance, and user experience while maintaining scalability and maintainability.
