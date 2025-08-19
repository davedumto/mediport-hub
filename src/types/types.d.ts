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
  patient: {
    id: string;
    name: string;
  };
  doctor: {
    id: string;
    name: string;
  };
  date: string;
  subject: string;
  status: "Reviewed" | "Submitted" | "Draft" | "Pending Review";
  reportDetails: string;
  attachedFiles?: AttachedFile[];
  primaryDiagnosis?: string;
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
