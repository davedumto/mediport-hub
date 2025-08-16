import {
  PrismaClient,
  Gender,
  BloodType,
  UserRole,
  VerificationStatus,
} from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // Create system roles
  const roles = [
    {
      name: "Super Admin",
      description: "Full system access and control",
      permissions: ["*"],
      isSystemRole: true,
    },
    {
      name: "Doctor",
      description: "Healthcare provider with patient management access",
      permissions: [
        "patients:read",
        "patients:write",
        "medical_records:read",
        "medical_records:write",
        "appointments:read",
        "appointments:write",
        "consultations:read",
        "consultations:write",
      ],
      isSystemRole: true,
    },
    {
      name: "Nurse",
      description: "Healthcare support staff",
      permissions: [
        "patients:read",
        "medical_records:read",
        "appointments:read",
        "appointments:write",
      ],
      isSystemRole: true,
    },
    {
      name: "Patient",
      description: "Healthcare service recipient",
      permissions: [
        "own_data:read",
        "own_appointments:read",
        "own_appointments:write",
      ],
      isSystemRole: true,
    },
    {
      name: "Data Analyst",
      description: "Analytics and reporting access",
      permissions: ["analytics:read", "reports:read", "statistics:read"],
      isSystemRole: true,
    },
  ];

  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    });
    console.log(`Role ${role.name} created/updated`);
  }

  // Create super admin user
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@edith.com" },
    update: {
      // Force update password hash even for existing users
      passwordHash: await hashPassword("Admin123!"),
    },
    create: {
      email: "admin@edith.com",
      passwordHash: await hashPassword("Admin123!"),
      firstName: "Super",
      lastName: "Admin",
      role: UserRole.SUPER_ADMIN,
      isActive: true,
      emailVerified: true,
      verificationStatus: "VERIFIED" as const,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      passwordHistory: [],
    },
  });

  console.log("Super admin created");

  // Assign super admin role
  await prisma.userRoleAssignment.upsert({
    where: {
      userId_roleId: {
        userId: superAdmin.id,
        roleId: (await prisma.role.findUnique({
          where: { name: "Super Admin" },
        }))!.id,
      },
    },
    update: {},
    create: {
      userId: superAdmin.id,
      roleId: (await prisma.role.findUnique({
        where: { name: "Super Admin" },
      }))!.id,
      grantedBy: superAdmin.id,
    },
  });

  console.log("Super admin role assigned");

  // Create sample doctor
  const doctor = await prisma.user.upsert({
    where: { email: "dr.smith@edith.com" },
    update: {
      // Force update password hash even for existing users
      passwordHash: await hashPassword("Doctor123!"),
    },
    create: {
      email: "dr.smith@edith.com",
      passwordHash: await hashPassword("Doctor123!"),
      firstName: "Dr. John",
      lastName: "Smith",
      role: UserRole.DOCTOR,
      specialty: "General Medicine",
      medicalLicenseNumber: "MD12345",
      isActive: true,
      emailVerified: true,
      verificationStatus: "VERIFIED" as const,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      passwordHistory: [],
    },
  });

  console.log("Sample doctor created");

  // Assign doctor role
  const doctorRole = await prisma.role.findUnique({
    where: { name: "Doctor" },
  });
  await prisma.userRoleAssignment.upsert({
    where: {
      userId_roleId: {
        userId: doctor.id,
        roleId: doctorRole!.id,
      },
    },
    update: {},
    create: {
      userId: doctor.id,
      roleId: doctorRole!.id,
      grantedBy: superAdmin.id,
    },
  });

  console.log("Sample doctor role assigned");

  // Create additional mock doctors
  const additionalDoctors = [
    {
      email: "dr.johnson@edith.com",
      passwordHash: await hashPassword("Doctor123!"),
      firstName: "Dr. Sarah",
      lastName: "Johnson",
      role: UserRole.DOCTOR,
      specialty: "Cardiology",
      medicalLicenseNumber: "MD67890",
      isActive: true,
      emailVerified: true,
      verificationStatus: "VERIFIED" as const,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      passwordHistory: [],
    },
    {
      email: "dr.williams@edith.com",
      passwordHash: await hashPassword("Doctor123!"),
      firstName: "Dr. Michael",
      lastName: "Williams",
      role: UserRole.DOCTOR,
      specialty: "Pediatrics",
      medicalLicenseNumber: "MD11111",
      isActive: true,
      emailVerified: true,
      verificationStatus: "VERIFIED" as const,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      passwordHistory: [],
    },
    {
      email: "dr.brown@edith.com",
      passwordHash: await hashPassword("Doctor123!"),
      firstName: "Dr. Emily",
      lastName: "Brown",
      role: UserRole.DOCTOR,
      specialty: "Neurology",
      medicalLicenseNumber: "MD22222",
      isActive: true,
      emailVerified: true,
      verificationStatus: "VERIFIED" as const,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      passwordHistory: [],
    },
  ];

  for (const doctorData of additionalDoctors) {
    const additionalDoctor = await prisma.user.upsert({
      where: { email: doctorData.email },
      update: {
        passwordHash: doctorData.passwordHash,
        firstName: doctorData.firstName,
        lastName: doctorData.lastName,
        specialty: doctorData.specialty,
        medicalLicenseNumber: doctorData.medicalLicenseNumber,
      },
      create: doctorData,
    });

    // Assign doctor role
    await prisma.userRoleAssignment.upsert({
      where: {
        userId_roleId: {
          userId: additionalDoctor.id,
          roleId: doctorRole!.id,
        },
      },
      update: {},
      create: {
        userId: additionalDoctor.id,
        roleId: doctorRole!.id,
        grantedBy: superAdmin.id,
      },
    });
    console.log(
      `Additional doctor ${additionalDoctor.firstName} ${additionalDoctor.lastName} created`
    );
  }

  // Create mock nurses
  const nurses = [
    {
      email: "nurse.anderson@edith.com",
      passwordHash: await hashPassword("Nurse123!"),
      firstName: "Nurse Lisa",
      lastName: "Anderson",
      role: UserRole.NURSE,
      specialty: "Emergency Care",
      medicalLicenseNumber: "RN33333",
      isActive: true,
      emailVerified: true,
      verificationStatus: "VERIFIED" as const,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      passwordHistory: [],
    },
    {
      email: "nurse.garcia@edith.com",
      passwordHash: await hashPassword("Nurse123!"),
      firstName: "Nurse Carlos",
      lastName: "Garcia",
      role: UserRole.NURSE,
      specialty: "ICU",
      medicalLicenseNumber: "RN44444",
      isActive: true,
      emailVerified: true,
      verificationStatus: "VERIFIED" as const,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      passwordHistory: [],
    },
    {
      email: "nurse.taylor@edith.com",
      passwordHash: await hashPassword("Nurse123!"),
      firstName: "Nurse Jennifer",
      lastName: "Taylor",
      role: UserRole.NURSE,
      specialty: "Surgery",
      medicalLicenseNumber: "RN55555",
      isActive: true,
      emailVerified: true,
      verificationStatus: "VERIFIED" as const,
      mfaEnabled: false,
      failedLoginAttempts: 0,
      passwordHistory: [],
    },
  ];

  for (const nurseData of nurses) {
    const nurse = await prisma.user.upsert({
      where: { email: nurseData.email },
      update: {
        passwordHash: nurseData.passwordHash,
        firstName: nurseData.firstName,
        lastName: nurseData.lastName,
        specialty: nurseData.specialty,
        medicalLicenseNumber: nurseData.medicalLicenseNumber,
      },
      create: nurseData,
    });

    // Assign nurse role
    const nurseRole = await prisma.role.findUnique({
      where: { name: "Nurse" },
    });

    await prisma.userRoleAssignment.upsert({
      where: {
        userId_roleId: {
          userId: nurse.id,
          roleId: nurseRole!.id,
        },
      },
      update: {},
      create: {
        userId: nurse.id,
        roleId: nurseRole!.id,
        grantedBy: superAdmin.id,
      },
    });
    console.log(`Nurse ${nurse.firstName} ${nurse.lastName} created`);
  }

  // Create sample patients with explicit typing
  const patients: Array<{
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: Date;
    gender: Gender;
    bloodType: BloodType;
    allergies: string[];
    chronicConditions: string[];
    currentMedications: string[];
    gdprConsent: boolean;
    gdprConsentDate: Date;
    gdprConsentVersion: string;
  }> = [
    {
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      dateOfBirth: new Date("1985-03-15"),
      gender: Gender.MALE,
      bloodType: BloodType.A_POSITIVE,
      allergies: ["Penicillin", "Peanuts"],
      chronicConditions: ["Hypertension"],
      currentMedications: ["Lisinopril 10mg daily"],
      gdprConsent: true,
      gdprConsentDate: new Date(),
      gdprConsentVersion: "1.0",
    },
    {
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@example.com",
      dateOfBirth: new Date("1990-07-22"),
      gender: Gender.FEMALE,
      bloodType: BloodType.O_POSITIVE,
      allergies: [],
      chronicConditions: ["Asthma"],
      currentMedications: ["Albuterol inhaler as needed"],
      gdprConsent: true,
      gdprConsentDate: new Date(),
      gdprConsentVersion: "1.0",
    },
  ];

  for (const patientData of patients) {
    const patient = await prisma.patient.upsert({
      where: { email: patientData.email },
      update: {
        // Update existing patient data
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        dateOfBirth: patientData.dateOfBirth,
        gender: patientData.gender,
        bloodType: patientData.bloodType,
        allergies: patientData.allergies,
        chronicConditions: patientData.chronicConditions,
        currentMedications: patientData.currentMedications,
        gdprConsent: patientData.gdprConsent,
        gdprConsentDate: patientData.gdprConsentDate,
        gdprConsentVersion: patientData.gdprConsentVersion,
        assignedProviderId: doctor.id,
        createdBy: superAdmin.id,
      },
      create: {
        ...patientData,
        assignedProviderId: doctor.id,
        createdBy: superAdmin.id,
      },
    });
    console.log(
      `Patient ${patient.firstName} ${patient.lastName} created/updated`
    );
  }

  // Create sample medical records
  const existingMedicalRecord = await prisma.medicalRecord.findFirst({
    where: {
      patientId: (await prisma.patient.findFirst({
        where: { email: "john.doe@example.com" },
      }))!.id,
      title: "Annual Physical Examination",
    },
  });

  if (!existingMedicalRecord) {
    await prisma.medicalRecord.create({
      data: {
        patientId: (await prisma.patient.findFirst({
          where: { email: "john.doe@example.com" },
        }))!.id,
        providerId: doctor.id,
        type: "CONSULTATION",
        title: "Annual Physical Examination",
        recordDate: new Date(),
        isPrivate: false,
        createdBy: doctor.id,
      },
    });
    console.log("Sample medical record created");
  } else {
    console.log("Sample medical record already exists, skipping creation");
  }

  // Create sample appointment
  const existingAppointment = await prisma.appointment.findFirst({
    where: {
      patientId: (await prisma.patient.findFirst({
        where: { email: "john.doe@example.com" },
      }))!.id,
      reason: "Follow-up on blood pressure medication",
    },
  });

  if (!existingAppointment) {
    await prisma.appointment.create({
      data: {
        patientId: (await prisma.patient.findFirst({
          where: { email: "john.doe@example.com" },
        }))!.id,
        providerId: doctor.id,
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        endTime: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000
        ), // +30 minutes
        type: "FOLLOW_UP",
        status: "SCHEDULED",
        reason: "Follow-up on blood pressure medication",
        priority: "NORMAL",
        locationType: "IN_PERSON",
        roomNumber: "101",
        createdBy: doctor.id,
      },
    });
    console.log("Sample appointment created");
  } else {
    console.log("Sample appointment already exists, skipping creation");
  }

  // Create sample consent record
  const existingConsent = await prisma.consentRecord.findFirst({
    where: {
      userId: superAdmin.id,
      consentType: "DATA_PROCESSING",
      purpose: "Medical treatment and healthcare management",
    },
  });

  if (!existingConsent) {
    await prisma.consentRecord.create({
      data: {
        userId: superAdmin.id, // Use the super admin user ID instead of patient ID
        consentType: "DATA_PROCESSING",
        purpose: "Medical treatment and healthcare management",
        granted: true,
        consentText:
          "I consent to the processing of my personal data for medical treatment purposes.",
        consentVersion: "1.0",
        legalBasis: "CONSENT",
        grantedAt: new Date(),
      },
    });
    console.log("Sample consent record created");
  } else {
    console.log("Sample consent record already exists, skipping creation");
  }

  console.log("Database seeding completed successfully!");
  console.log("\nSample Data Created:");
  console.log("- 1 Super Admin (admin@edith.com / Admin123!)");
  console.log("- 1 Doctor (dr.smith@edith.com / Doctor123!)");
  console.log("- 2 Patients");
  console.log("- 1 Medical Record");
  console.log("- 1 Appointment");
  console.log("- 1 Consent Record");
  console.log("- 5 System Roles");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
