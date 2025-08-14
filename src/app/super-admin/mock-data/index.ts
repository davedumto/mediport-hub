export const mockDoctors = [
  {
    id: "1",
    email: "dr.smith@hospital.com",
    firstName: "John",
    lastName: "Smith",
    role: "DOCTOR",
    phone: "+1234567890",
    specialty: "Cardiology",
    medicalLicenseNumber: "MD123456",
    isActive: true,
    createdAt: "2024-01-15",
    assignedPatients: ["p1", "p2"],
  },
  {
    id: "2",
    email: "dr.johnson@hospital.com",
    firstName: "Sarah",
    lastName: "Johnson",
    role: "DOCTOR",
    phone: "+1234567891",
    specialty: "Neurology",
    medicalLicenseNumber: "MD789012",
    isActive: true,
    createdAt: "2024-02-01",
    assignedPatients: ["p3"],
  },
];

export const mockNurses = [
  {
    id: "3",
    email: "nurse.davis@hospital.com",
    firstName: "Emily",
    lastName: "Davis",
    role: "NURSE",
    phone: "+1234567892",
    specialty: "Emergency Care",
    medicalLicenseNumber: "RN345678",
    isActive: true,
    createdAt: "2024-01-20",
    assignedPatients: [],
  },
];

export const mockPatients = [
  {
    id: "p1",
    firstName: "Michael",
    lastName: "Brown",
    email: "michael.brown@email.com",
    dateOfBirth: "1985-06-15",
    gender: "MALE",
    bloodType: "O_POSITIVE",
    status: "ACTIVE",
    assignedProviderId: "1",
    appointments: [
      {
        id: "a1",
        startTime: "2024-08-20T10:00:00Z",
        endTime: "2024-08-20T11:00:00Z",
        type: "CONSULTATION",
        status: "SCHEDULED",
        providerId: "1",
        providerName: "Dr. John Smith",
      },
    ],
  },
];
