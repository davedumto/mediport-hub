import { PrismaClient, Gender, BloodType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create system roles
  const roles = [
    {
      name: "Super Admin",
      description: "Full system access and control",
      permissions: ["*"],
      isSystem: true,
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
      isSystem: true,
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
      isSystem: true,
    },
    {
      name: "Patient",
      description: "Healthcare service recipient",
      permissions: [
        "own_data:read",
        "own_appointments:read",
        "own_appointments:write",
      ],
      isSystem: true,
    },
    {
      name: "Data Analyst",
      description: "Analytics and reporting access",
      permissions: ["analytics:read", "reports:read", "statistics:read"],
      isSystem: true,
    },
  ];

  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    });
    console.log(`✅ Role ${role.name} created/updated`);
  }

  // Create super admin user
  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@edith.com" },
    update: {},
    create: {
      email: "admin@edith.com",
      passwordHash:
        "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.s6mG", // admin123
      firstName: "Super",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      isActive: true,
      emailVerified: true,
      verificationStatus: "VERIFIED",
      mfaEnabled: false,
      failedLoginAttempts: 0,
      passwordHistory: [],
    },
  });

  console.log("✅ Super admin created");

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

  console.log("✅ Super admin role assigned");

  // Create sample doctor
  const doctor = await prisma.user.upsert({
    where: { email: "dr.smith@edith.com" },
    update: {},
    create: {
      email: "dr.smith@edith.com",
      passwordHash:
        "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.s6mG", // doctor123
      firstName: "Dr. John",
      lastName: "Smith",
      role: "DOCTOR",
      specialty: "General Medicine",
      medicalLicenseNumber: "MD12345",
      isActive: true,
      emailVerified: true,
      verificationStatus: "VERIFIED",
      mfaEnabled: false,
      failedLoginAttempts: 0,
      passwordHistory: [],
    },
  });

  console.log("✅ Sample doctor created");

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

  console.log("✅ Sample doctor role assigned");

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
    const patient = await prisma.patient.create({
      data: {
        ...patientData,
        assignedProviderId: doctor.id,
        createdBy: superAdmin.id,
      },
    });
    console.log(`✅ Patient ${patient.firstName} ${patient.lastName} created`);
  }

  // Create sample medical records
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

  console.log("✅ Sample medical record created");

  // Create sample appointment
  await prisma.appointment.create({
    data: {
      patientId: (await prisma.patient.findFirst({
        where: { email: "john.doe@example.com" },
      }))!.id,
      providerId: doctor.id,
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // +30 minutes
      type: "FOLLOW_UP",
      status: "SCHEDULED",
      reason: "Follow-up on blood pressure medication",
      priority: "NORMAL",
      locationType: "IN_PERSON",
      roomNumber: "101",
      createdBy: doctor.id,
    },
  });

  console.log("✅ Sample appointment created");

  // Create sample consent record
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

  console.log("✅ Sample consent record created");

  console.log("🎉 Database seeding completed successfully!");
  console.log("\n📋 Sample Data Created:");
  console.log("- 1 Super Admin (admin@edith.com / admin123)");
  console.log("- 1 Doctor (dr.smith@edith.com / doctor123)");
  console.log("- 2 Patients");
  console.log("- 1 Medical Record");
  console.log("- 1 Appointment");
  console.log("- 1 Consent Record");
  console.log("- 5 System Roles");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
