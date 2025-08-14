type AppointmentStatus = "confirmed" | "pending" | "cancelled" | "completed";

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName?: string;
  startDateISO: string; // ISO string (UTC ideally)
  endDateISO?: string;
  purpose?: string;
  notes?: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt?: string;
}




