# EHR RBAC System Implementation

## 🎯 Overview

This document provides comprehensive documentation for the Role-Based Access Control (RBAC) system implemented in the EHR backend. The system provides granular permissions, resource-level access control, and healthcare-specific role management.

## 🔐 Core Components

### 1. Permission System (`src/lib/permissions.ts`)

The permission system defines healthcare-specific permissions with granular control:

```typescript
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
```

### 2. Role Definitions (`src/types/auth.ts`)

Healthcare-specific roles with hierarchical permissions:

```typescript
export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN", // Full system access
  ADMIN = "ADMIN", // User management, system config
  DOCTOR = "DOCTOR", // Full patient records access
  NURSE = "NURSE", // Limited patient access (assigned only)
  PATIENT = "PATIENT", // Own records only
}
```

### 3. Role-Permission Matrix

The system automatically assigns permissions based on roles:

```typescript
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    // All permissions
    Permission.USER_CREATE,
    Permission.USER_READ_ALL,
    Permission.USER_UPDATE_ALL,
    Permission.USER_DELETE,
    Permission.USER_IMPERSONATE,
    Permission.PATIENT_CREATE,
    Permission.PATIENT_READ_ALL,
    Permission.PATIENT_UPDATE_ALL,
    Permission.PATIENT_DELETE,
    Permission.RECORD_CREATE,
    Permission.RECORD_READ_ALL,
    Permission.RECORD_UPDATE,
    Permission.RECORD_DELETE,
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_READ_ALL,
    Permission.APPOINTMENT_UPDATE,
    Permission.APPOINTMENT_DELETE,
    Permission.AUDIT_READ,
    Permission.SYSTEM_CONFIG,
    Permission.BACKUP_CREATE,
    Permission.BACKUP_RESTORE,
    Permission.GDPR_EXPORT,
    Permission.GDPR_DELETE,
    Permission.GDPR_CONSENT_MANAGE,
  ],

  [Role.ADMIN]: [
    Permission.USER_CREATE,
    Permission.USER_READ_ALL,
    Permission.USER_UPDATE_ALL,
    Permission.USER_DELETE,
    Permission.PATIENT_READ_ALL,
    Permission.PATIENT_UPDATE_ALL,
    Permission.APPOINTMENT_READ_ALL,
    Permission.APPOINTMENT_UPDATE,
    Permission.AUDIT_READ,
    Permission.SYSTEM_CONFIG,
  ],

  [Role.DOCTOR]: [
    Permission.PATIENT_CREATE,
    Permission.PATIENT_READ_ALL,
    Permission.PATIENT_UPDATE_ALL,
    Permission.RECORD_CREATE,
    Permission.RECORD_READ_ALL,
    Permission.RECORD_UPDATE,
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_READ_ALL,
    Permission.APPOINTMENT_UPDATE,
  ],

  [Role.NURSE]: [
    Permission.PATIENT_READ_ASSIGNED,
    Permission.PATIENT_UPDATE_ASSIGNED,
    Permission.RECORD_CREATE,
    Permission.RECORD_READ_ASSIGNED,
    Permission.RECORD_UPDATE,
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_READ_ASSIGNED,
    Permission.APPOINTMENT_UPDATE,
  ],

  [Role.PATIENT]: [
    Permission.USER_READ_OWN,
    Permission.USER_UPDATE_OWN,
    Permission.PATIENT_READ_OWN,
    Permission.RECORD_READ_OWN,
    Permission.APPOINTMENT_READ_OWN,
    Permission.GDPR_EXPORT,
    Permission.GDPR_DELETE,
  ],
};
```

## 🛡️ RBAC Middleware (`src/middleware/rbac.ts`)

### Permission-Based Middleware

```typescript
// Single permission requirement
export function requirePermission(permission: Permission);

// Multiple permissions requirement (ANY)
export function requireAnyPermission(permissions: Permission[]);

// Multiple permissions requirement (ALL)
export function requireAllPermissions(permissions: Permission[]);

// Role-based requirement
export function requireRole(role: Role);

// Resource-level permission checking
export function requireResourcePermission(
  permission: Permission,
  resourceType: string,
  resourceIdParam: string = "id"
);
```

### Specialized Middleware

```typescript
// Administrative operations (super admin only)
export function requireSuperAdmin();

// Administrative operations (admin or super admin)
export function requireAdmin();

// Healthcare provider access (doctor or nurse)
export function requireHealthcareProvider();

// Patient data access (with ownership validation)
export function requirePatientAccess(
  permission: Permission,
  resourceType: "patient" | "medical_record" | "appointment" = "patient"
);

// Medical record access (with provider assignment validation)
export function requireMedicalRecordAccess(permission: Permission);

// Appointment access (with provider/patient validation)
export function requireAppointmentAccess(permission: Permission);
```

## 🔧 Role Management Service (`src/services/roleService.ts`)

### Core Operations

```typescript
export class RoleService {
  // Assign role to user
  static async assignRole(
    userId: string,
    roleName: Role,
    grantedBy: string,
    requestInfo: any
  );

  // Revoke role from user
  static async revokeRole(
    userId: string,
    roleName: Role,
    revokedBy: string,
    requestInfo: any
  );

  // Get user's effective permissions
  static async getUserPermissions(userId: string): Promise<Permission[]>;

  // Create custom role
  static async createRole(
    name: string,
    description: string,
    permissions: Permission[],
    createdBy: string,
    requestInfo: any
  );

  // Update role permissions
  static async updateRolePermissions(
    roleName: string,
    permissions: Permission[],
    updatedBy: string,
    requestInfo: any
  );
}
```

### Utility Methods

```typescript
// Get all roles
static async getAllRoles(): Promise<any[]>

// Get role by name
static async getRoleByName(name: string): Promise<any | null>

// Get user's roles
static async getUserRoles(userId: string): Promise<any[]>

// Check if user has specific role
static async userHasRole(userId: string, roleName: string): Promise<boolean>

// Get users with specific role
static async getUsersWithRole(roleName: string): Promise<any[]>

// Bulk assign roles to users
static async bulkAssignRoles(assignments: Array<{ userId: string; roleName: Role }>, grantedBy: string, requestInfo: any)

// Get role statistics
static async getRoleStatistics(): Promise<any>

// Validate role permissions
static validateRolePermissions(permissions: Permission[]): { valid: boolean; errors: string[] }

// Get recommended permissions for role type
static getRecommendedPermissions(roleType: 'healthcare' | 'administrative' | 'patient'): Permission[]
```

## 🔍 Resource Ownership Validation

The system automatically validates resource access based on user roles and relationships:

### Patient Access

- **PATIENT**: Can only access their own patient records
- **NURSE**: Can access patients assigned to them
- **DOCTOR/ADMIN**: Can access all patients

### Medical Record Access

- **PATIENT**: Can only access their own medical records
- **NURSE**: Can access records for patients assigned to them
- **DOCTOR/ADMIN**: Can access all medical records

### Appointment Access

- **PATIENT**: Can only access their own appointments
- **NURSE**: Can access appointments for assigned patients or where they are the provider
- **DOCTOR/ADMIN**: Can access all appointments

## 📝 Usage Examples

### 1. Protected Endpoint with Resource Permission

```typescript
// pages/api/patients/[id].ts
import { requireResourcePermission } from "../../../middleware/rbac";
import { Permission } from "../../../types/auth";

async function patientHandler(req: NextApiRequest, res: NextApiResponse) {
  // Handler logic here
}

export default authenticateUser(
  requireResourcePermission(
    Permission.PATIENT_READ_ALL,
    "patient",
    "id"
  )(patientHandler)
);
```

### 2. Role Management Endpoint

```typescript
// pages/api/admin/roles/assign.ts
import { requirePermission } from "../../../../middleware/rbac";
import { Permission } from "../../../../types/auth";

async function assignRoleHandler(req: NextApiRequest, res: NextApiResponse) {
  // Handler logic here
}

export default authenticateUser(
  requirePermission(Permission.USER_UPDATE_ALL)(assignRoleHandler)
);
```

### 3. Multiple Permission Requirements

```typescript
// Require any of the specified permissions
export default authenticateUser(
  requireAnyPermission([
    Permission.PATIENT_READ_ALL,
    Permission.PATIENT_READ_ASSIGNED,
  ])(handler)
);

// Require all of the specified permissions
export default authenticateUser(
  requireAllPermissions([
    Permission.PATIENT_READ_ALL,
    Permission.PATIENT_UPDATE_ALL,
  ])(handler)
);
```

### 4. Role-Based Access

```typescript
// Require specific role
export default authenticateUser(requireRole(Role.DOCTOR)(handler));

// Require admin or super admin
export default authenticateUser(requireAdmin()(handler));
```

## 🧪 Testing

### Running Tests

```bash
# Run all RBAC tests
npm test -- --testPathPattern=rbac

# Run specific test file
npm test -- src/tests/rbac/permissions.test.ts
npm test -- src/tests/rbac/roles.test.ts
```

### Test Coverage

The test suite covers:

- Basic permission checking
- Resource ownership validation
- Middleware integration
- Role hierarchy validation
- Role assignment and revocation
- Permission calculation
- Role validation
- Statistics and utilities

## 🚀 Initialization

### System Setup

```bash
# Initialize RBAC system
npx ts-node src/scripts/initialize-rbac.ts
```

This script will:

1. Create all system roles with appropriate permissions
2. Create a super admin user if none exists
3. Display role statistics

### Default Super Admin

- **Email**: `superadmin@ehr.local`
- **Password**: `SuperAdmin123!`
- **Role**: `SUPER_ADMIN`
- **⚠️ Important**: Change password immediately after first login

## 🔒 Security Features

### Audit Logging

All role and permission changes are logged with:

- User identification
- Action performed
- Resource affected
- Timestamp
- IP address and user agent
- Success/failure status

### Prevention of Privilege Escalation

- System roles cannot be modified
- Users cannot assign roles higher than their own
- Resource access is validated at multiple levels

### Context-Aware Permissions

- Permissions are checked in context of resource ownership
- Automatic validation of patient-provider relationships
- Support for complex healthcare workflows

## 📊 Monitoring and Analytics

### Role Statistics

```typescript
const stats = await RoleService.getRoleStatistics();
// Returns:
// - Role name and description
// - Number of users with each role
// - Permissions for each role
// - System role status
```

### Permission Analysis

```typescript
// Get user's effective permissions
const permissions = await RoleService.getUserPermissions(userId);

// Check specific permission
const hasAccess = await canAccessResource(
  userId,
  userRole,
  "patient",
  patientId,
  Permission.PATIENT_READ_ALL
);

// Get accessible resources
const accessiblePatients = await getAccessibleResources(
  userId,
  userRole,
  "patient"
);
```

## 🔄 Workflow Examples

### 1. Patient Registration Flow

1. **DOCTOR/NURSE** creates patient (requires `PATIENT_CREATE` permission)
2. **DOCTOR/NURSE** assigned as provider (automatic role assignment)
3. **NURSE** can only access assigned patients
4. **DOCTOR** can access all patients

### 2. Medical Record Access Flow

1. **PROVIDER** creates medical record (requires `RECORD_CREATE` permission)
2. **PATIENT** can only access own records (automatic ownership validation)
3. **NURSE** can access records for assigned patients
4. **DOCTOR** can access all records

### 3. Role Assignment Flow

1. **ADMIN** assigns role to user (requires `USER_UPDATE_ALL` permission)
2. System validates role exists and permissions are valid
3. User's effective permissions are recalculated
4. Audit log entry is created
5. User's primary role is updated if needed

## 🚨 Troubleshooting

### Common Issues

1. **Permission Denied Errors**

   - Check user's role and permissions
   - Verify resource ownership/assignment
   - Check middleware configuration

2. **Role Assignment Failures**

   - Ensure role exists in database
   - Check for duplicate assignments
   - Verify user has permission to assign roles

3. **Resource Access Issues**
   - Check user's role hierarchy
   - Verify patient-provider relationships
   - Check resource ownership validation

### Debug Mode

Enable detailed logging by setting:

```bash
LOG_LEVEL=debug
NODE_ENV=development
```

## 🔮 Future Enhancements

1. **Dynamic Permission System**

   - Runtime permission modification
   - Conditional permissions based on context
   - Permission inheritance rules

2. **Advanced Role Management**

   - Role templates and inheritance
   - Temporary role assignments
   - Role approval workflows

3. **Enhanced Monitoring**

   - Real-time permission usage analytics
   - Anomaly detection
   - Performance metrics

4. **Integration Features**
   - LDAP/Active Directory integration
   - Single Sign-On (SSO) support
   - Multi-tenant role management

## 📚 Additional Resources

- **Authentication System**: See `AUTHENTICATION_SYSTEM.md`
- **API Development Guide**: See `API_DEVELOPMENT_GUIDE.md`
- **Database Schema**: See `prisma/schema.prisma`
- **Error Handling**: See `src/utils/errors.ts`
- **Audit System**: See `src/lib/audit.ts`

---

This RBAC system provides enterprise-grade security while maintaining flexibility for healthcare workflows. The granular permission system ensures compliance with healthcare regulations while supporting complex organizational structures.
