import { Role, Permission, PermissionContext } from "../types/auth";
import prisma from "./db";
import { AppError, ErrorCodes } from "../utils/errors";

export type { PermissionContext };

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

// Get permissions for a role
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

// Check if user has specific permission
export function hasPermission(
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean {
  return userPermissions.includes(requiredPermission);
}

// Check if user has any of the required permissions
export function hasAnyPermission(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.some((permission) =>
    userPermissions.includes(permission)
  );
}

// Check if user has all required permissions
export function hasAllPermissions(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.every((permission) =>
    userPermissions.includes(permission)
  );
}

// Resource ownership validation
export async function validateResourceOwnership(
  resourceType: string,
  resourceId: string,
  userId: string,
  userRole: Role
): Promise<boolean> {
  switch (resourceType) {
    case "patient":
      if (userRole === Role.PATIENT) {
        const patient = await prisma.patient.findUnique({
          where: { id: resourceId },
          select: { userId: true },
        });
        return patient?.userId === userId;
      }

      if (userRole === Role.NURSE) {
        const patient = await prisma.patient.findUnique({
          where: { id: resourceId },
          select: { assignedProviderId: true },
        });
        return patient?.assignedProviderId === userId;
      }

      return true; // Doctors and admins can access all patients

    case "medical_record":
      const record = await prisma.medicalRecord.findUnique({
        where: { id: resourceId },
        include: { patient: true },
      });

      if (!record) return false;

      if (userRole === Role.PATIENT) {
        return record.patient.userId === userId;
      }

      if (userRole === Role.NURSE) {
        return record.patient.assignedProviderId === userId;
      }

      return true; // Doctors and admins can access all records

    case "appointment":
      const appointment = await prisma.appointment.findUnique({
        where: { id: resourceId },
        include: { patient: true },
      });

      if (!appointment) return false;

      if (userRole === Role.PATIENT) {
        return appointment.patient.userId === userId;
      }

      if (userRole === Role.NURSE) {
        return (
          appointment.patient.assignedProviderId === userId ||
          appointment.providerId === userId
        );
      }

      return true; // Doctors and admins can access all appointments

    case "user":
      return userRole === Role.PATIENT ? resourceId === userId : true;

    default:
      return false;
  }
}

// Context-aware permission checking
export async function checkContextualPermission(
  permission: Permission,
  context: PermissionContext,
  userPermissions: Permission[]
): Promise<boolean> {
  // First check if user has the basic permission
  if (!hasPermission(userPermissions, permission)) {
    return false;
  }

  // For resource-specific permissions, validate ownership/assignment
  if (context.resourceType && context.resourceId) {
    const canAccess = await validateResourceOwnership(
      context.resourceType,
      context.resourceId,
      context.userId,
      context.userRole
    );

    if (!canAccess) {
      return false;
    }
  }

  return true;
}

// Initialize system roles
export async function initializeSystemRoles(): Promise<void> {
  const systemRoles = [
    {
      name: Role.SUPER_ADMIN,
      description: "Super Administrator with full system access",
      permissions: ROLE_PERMISSIONS[Role.SUPER_ADMIN],
      isSystemRole: true,
    },
    {
      name: Role.ADMIN,
      description: "Administrator with user management capabilities",
      permissions: ROLE_PERMISSIONS[Role.ADMIN],
      isSystemRole: true,
    },
    {
      name: Role.DOCTOR,
      description: "Medical Doctor with patient care responsibilities",
      permissions: ROLE_PERMISSIONS[Role.DOCTOR],
      isSystemRole: true,
    },
    {
      name: Role.NURSE,
      description: "Nurse with assigned patient care",
      permissions: ROLE_PERMISSIONS[Role.NURSE],
      isSystemRole: true,
    },
    {
      name: Role.PATIENT,
      description: "Patient with access to own records",
      permissions: ROLE_PERMISSIONS[Role.PATIENT],
      isSystemRole: true,
    },
  ];

  for (const roleData of systemRoles) {
    await prisma.role.upsert({
      where: { name: roleData.name },
      update: {
        permissions: roleData.permissions,
        description: roleData.description,
      },
      create: {
        name: roleData.name,
        description: roleData.description,
        permissions: roleData.permissions,
        isSystemRole: roleData.isSystemRole,
      },
    });
  }
}

// Get user's effective permissions from all assigned roles
export async function getUserEffectivePermissions(
  userId: string
): Promise<Permission[]> {
  const userRoles = await prisma.userRoleAssignment.findMany({
    where: {
      userId,
      revokedAt: null,
    },
    include: { role: true },
  });

  const allPermissions = new Set<Permission>();

  for (const userRole of userRoles) {
    const rolePermissions = userRole.role.permissions as Permission[];
    rolePermissions.forEach((permission) => allPermissions.add(permission));
  }

  return Array.from(allPermissions);
}

// Check if user can access a specific resource
export async function canAccessResource(
  userId: string,
  userRole: Role,
  resourceType: string,
  resourceId: string,
  action: Permission
): Promise<boolean> {
  // Get user's permissions
  const userPermissions = await getUserEffectivePermissions(userId);

  // Check if user has the required permission
  if (!hasPermission(userPermissions, action)) {
    return false;
  }

  // Check resource ownership/assignment
  return await validateResourceOwnership(
    resourceType,
    resourceId,
    userId,
    userRole
  );
}

// Get accessible resources for a user
export async function getAccessibleResources(
  userId: string,
  userRole: Role,
  resourceType: string
): Promise<string[]> {
  switch (resourceType) {
    case "patient":
      if (userRole === Role.PATIENT) {
        const patient = await prisma.patient.findUnique({
          where: { userId },
          select: { id: true },
        });
        return patient ? [patient.id] : [];
      }

      if (userRole === Role.NURSE) {
        const patients = await prisma.patient.findMany({
          where: { assignedProviderId: userId },
          select: { id: true },
        });
        return patients.map((p) => p.id);
      }

      // Doctors and admins can access all patients
      if (
        userRole === Role.DOCTOR ||
        userRole === Role.ADMIN ||
        userRole === Role.SUPER_ADMIN
      ) {
        const patients = await prisma.patient.findMany({
          select: { id: true },
        });
        return patients.map((p) => p.id);
      }
      break;

    case "medical_record":
      if (userRole === Role.PATIENT) {
        const records = await prisma.medicalRecord.findMany({
          where: { patient: { userId } },
          select: { id: true },
        });
        return records.map((r) => r.id);
      }

      if (userRole === Role.NURSE) {
        const records = await prisma.medicalRecord.findMany({
          where: { patient: { assignedProviderId: userId } },
          select: { id: true },
        });
        return records.map((r) => r.id);
      }

      // Doctors and admins can access all records
      if (
        userRole === Role.DOCTOR ||
        userRole === Role.ADMIN ||
        userRole === Role.SUPER_ADMIN
      ) {
        const records = await prisma.medicalRecord.findMany({
          select: { id: true },
        });
        return records.map((r) => r.id);
      }
      break;
  }

  return [];
}
