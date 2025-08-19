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

interface MedicalReportFormData {
  patientId: string;
  visitDate: string;
  reportTitle: string;
  primaryDiagnosis: string;
  reportDetails: string;
  attachedFiles: FileList | null;
}

interface Patient {
  id: string;
  name: string;
}

interface MedicalReport {
  id: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  provider?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  recordDate?: string;
  createdAt: string;
  title: string;
  status: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "PUBLISHED";
  type: string;
  description?: string;
  findings?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  recommendations?: string;
  isPrivate: boolean;
}

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface FilterOptions {
  patientSearch: string;
  doctorFilter: string;
  dateFrom: string;
  dateTo: string;
}
