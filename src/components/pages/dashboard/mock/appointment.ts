// mock/appointments.mock.ts
export type AppointmentStatus = "confirmed" | "pending" | "cancelled" | "completed";


export const mockAppointments: Appointment[] = [
  // early August (other-month rendering)
  {
    id: "a-20250731-1",
    patientId: "p-001",
    patientName: "Emily Davis",
    doctorId: "d-01",
    doctorName: "Dr. Sarah Johnson",
    startDateISO: "2025-07-31T09:00:00Z",
    endDateISO: "2025-07-31T09:30:00Z",
    purpose: "Follow-up",
    notes: "Check blood pressure",
    status: "confirmed",
    createdAt: "2025-07-01T10:00:00Z",
  },

  // Week 1
  {
      id: "a-20250807-1",
      patientId: "p-002",
      patientName: "Lisa Taylor",
      doctorId: "d-01",
      startDateISO: "2025-08-07T00:00:00Z",
      endDateISO: "2025-08-07T00:30:00Z",
      purpose: "New patient consult",
      status: "confirmed",
      createdAt: ""
  },
  {
      id: "a-20250808-1",
      patientId: "p-003",
      patientName: "Emma Thompson",
      doctorId: "d-01",
      startDateISO: "2025-08-08T00:00:00Z",
      endDateISO: "2025-08-08T00:30:00Z",
      purpose: "Immunization",
      status: "confirmed",
      createdAt: ""
  },
  {
      id: "a-20250809-1",
      patientId: "p-004",
      patientName: "James Wilson",
      doctorId: "d-01",
      startDateISO: "2025-08-09T00:00:00Z",
      endDateISO: "2025-08-09T00:20:00Z",
      purpose: "Prescription renewal",
      status: "pending",
      createdAt: ""
  },

  // Week 2 - day with multiple appointments (Aug 10)
  {
      id: "a-20250810-1",
      patientId: "p-005",
      patientName: "Emily Davis",
      doctorId: "d-01",
      startDateISO: "2025-08-10T09:00:00Z",
      endDateISO: "2025-08-10T09:30:00Z",
      purpose: "Routine check",
      status: "confirmed",
      createdAt: ""
  },

  // Aug 11 - multiple entries (4) -> should show "+ 2 more" when maxVisible = 2
  {
      id: "a-20250811-1",
      patientId: "p-006",
      patientName: "Sarah Smith",
      doctorId: "d-01",
      startDateISO: "2025-08-11T10:30:00Z",
      endDateISO: "2025-08-11T11:00:00Z",
      purpose: "Dermatology consult",
      status: "confirmed",
      createdAt: ""
  },
  {
      id: "a-20250811-2",
      patientId: "p-007",
      patientName: "Michael Wilson",
      doctorId: "d-01",
      startDateISO: "2025-08-11T11:00:00Z",
      endDateISO: "2025-08-11T11:30:00Z",
      purpose: "Vaccine",
      status: "confirmed",
      createdAt: ""
  },
  {
      id: "a-20250811-3",
      patientId: "p-008",
      patientName: "John Doe",
      doctorId: "d-01",
      startDateISO: "2025-08-11T13:00:00Z",
      endDateISO: "2025-08-11T13:30:00Z",
      purpose: "Lab review",
      status: "pending",
      createdAt: ""
  },
  {
      id: "a-20250811-4",
      patientId: "p-009",
      patientName: "Alice Green",
      doctorId: "d-01",
      startDateISO: "2025-08-11T15:00:00Z",
      endDateISO: "2025-08-11T15:30:00Z",
      purpose: "Consult",
      status: "confirmed",
      createdAt: ""
  },

  // Aug 12
  {
      id: "a-20250812-1",
      patientId: "p-010",
      patientName: "Robert Johnson",
      doctorId: "d-01",
      startDateISO: "2025-08-12T14:00:00Z",
      endDateISO: "2025-08-12T14:30:00Z",
      purpose: "Cardiology follow-up",
      status: "confirmed",
      createdAt: ""
  },
  {
      id: "a-20250812-2",
      patientId: "p-011",
      patientName: "Emma Thompson",
      doctorId: "d-01",
      startDateISO: "2025-08-12T10:00:00Z",
      endDateISO: "2025-08-12T10:30:00Z",
      purpose: "Routine",
      status: "confirmed",
      createdAt: ""
  },

  // Aug 13 - two appointments
  {
      id: "a-20250813-1",
      patientId: "p-012",
      patientName: "Jennifer Lopez",
      doctorId: "d-01",
      startDateISO: "2025-08-13T15:00:00Z",
      endDateISO: "2025-08-13T15:30:00Z",
      purpose: "Consult",
      status: "confirmed",
      createdAt: ""
  },
  {
      id: "a-20250813-2",
      patientId: "p-013",
      patientName: "Jennifer Lopez",
      doctorId: "d-01",
      startDateISO: "2025-08-13T14:00:00Z",
      endDateISO: "2025-08-13T14:30:00Z",
      purpose: "Procedure follow-up",
      status: "confirmed",
      createdAt: ""
  },

  // Aug 14
  {
      id: "a-20250814-1",
      patientId: "p-014",
      patientName: "John Michael",
      doctorId: "d-01",
      startDateISO: "2025-08-14T00:00:00Z",
      endDateISO: "2025-08-14T00:30:00Z",
      purpose: "Checkup",
      status: "pending",
      createdAt: ""
  },
  {
      id: "a-20250814-2",
      patientId: "p-015",
      patientName: "David Miller",
      doctorId: "d-01",
      startDateISO: "2025-08-14T09:30:00Z",
      endDateISO: "2025-08-14T10:00:00Z",
      purpose: "Physical therapy",
      status: "confirmed",
      createdAt: ""
  },

  // Aug 15 / 16 entries
  {
      id: "a-20250815-1",
      patientId: "p-016",
      patientName: "Robert Johnson",
      doctorId: "d-01",
      startDateISO: "2025-08-15T11:00:00Z",
      endDateISO: "2025-08-15T11:30:00Z",
      purpose: "Post-op",
      status: "confirmed",
      createdAt: ""
  },
  {
      id: "a-20250816-1",
      patientId: "p-017",
      patientName: "David Miller",
      doctorId: "d-01",
      startDateISO: "2025-08-16T09:00:00Z",
      endDateISO: "2025-08-16T09:30:00Z",
      purpose: "Blood work review",
      status: "confirmed",
      createdAt: ""
  },

  // Later in month
  {
      id: "a-20250817-1",
      patientId: "p-018",
      patientName: "Sarah Smith",
      doctorId: "d-01",
      startDateISO: "2025-08-17T10:30:00Z",
      endDateISO: "2025-08-17T11:00:00Z",
      purpose: "New patient",
      status: "confirmed",
      createdAt: ""
  },
  {
      id: "a-20250818-1",
      patientId: "p-019",
      patientName: "John Michael",
      doctorId: "d-01",
      startDateISO: "2025-08-18T14:30:00Z",
      endDateISO: "2025-08-18T15:00:00Z",
      purpose: "Vaccination",
      status: "confirmed",
      createdAt: ""
  },

  // cross to next month (Sept)
  {
      id: "a-20250901-1",
      patientId: "p-020",
      patientName: "New Patient",
      doctorId: "d-01",
      startDateISO: "2025-09-01T09:00:00Z",
      endDateISO: "2025-09-01T09:30:00Z",
      purpose: "Initial consult",
      status: "pending",
      createdAt: ""
  },
];
