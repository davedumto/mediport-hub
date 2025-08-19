"use client";
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { SquarePen } from "lucide-react";
import Button from "@/components/common/Button";
import { Trash } from "iconsax-reactjs";

interface Appointment {
  id: string;
  appointmentId: string;
  patient: {
    name: string;
    patientId: string;
  };
  doctor: string;
  dateTime: string;
  purpose: string;
  status: "CONFIRMED" | "COMPLETED" | "CANCELLED" | "PENDING";
}

const sampleAppointments: Appointment[] = [
  {
    id: "1",
    appointmentId: "A-1002",
    patient: {
      name: "Sarah Smith",
      patientId: "P-1002",
    },
    doctor: "Dr. Michael Smith",
    dateTime: "2025-08-11 10:30 AM",
    purpose: "Vaccination",
    status: "CONFIRMED",
  },
  {
    id: "2",
    appointmentId: "A-1005",
    patient: {
      name: "Michael Wilson",
      patientId: "P-1005",
    },
    doctor: "Dr. David Brown",
    dateTime: "2025-08-11 11:00 AM",
    purpose: "Lab Test",
    status: "CONFIRMED",
  },
  {
    id: "3",
    appointmentId: "A-1008",
    patient: {
      name: "Lisa Taylor",
      patientId: "P-1008",
    },
    doctor: "Dr. Jennifer Lee",
    dateTime: "2025-08-11 04:00 PM",
    purpose: "Follow-up Visit",
    status: "CONFIRMED",
  },
  {
    id: "4",
    appointmentId: "A-1013",
    patient: {
      name: "Michael Wilson",
      patientId: "P-1005",
    },
    doctor: "Dr. David Brown",
    dateTime: "2025-08-11 01:00 PM",
    purpose: "Consultation",
    status: "COMPLETED",
  },
  {
    id: "5",
    appointmentId: "A-1018",
    patient: {
      name: "Emily Davis",
      patientId: "P-1004",
    },
    doctor: "Dr. Sarah Johnson",
    dateTime: "2025-08-11 03:30 PM",
    purpose: "Consultation",
    status: "CONFIRMED",
  },
];

const AppointmentsTable = () => {
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>(
    []
  );
  const [currentPage, setCurrentPage] = useState(1);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAppointments(sampleAppointments.map((apt) => apt.id));
    } else {
      setSelectedAppointments([]);
    }
  };

  const handleSelectAppointment = (appointmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedAppointments((prev) => [...prev, appointmentId]);
    } else {
      setSelectedAppointments((prev) =>
        prev.filter((id) => id !== appointmentId)
      );
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "CONFIRMED":
        return `${baseClasses} bg-green-100 text-green-700`;
      case "COMPLETED":
        return `${baseClasses} bg-blue-100 text-blue-700`;
      case "CANCELLED":
        return `${baseClasses} bg-red-100 text-red-700`;
      case "PENDING":
        return `${baseClasses} bg-yellow-100 text-yellow-700`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-700`;
    }
  };

  const hasSelectedAppointments = selectedAppointments.length > 0;
  const allSelected = selectedAppointments.length === sampleAppointments.length;

  return (
    <div className="w-full min-h-screen px-14 bg-gray-100 relative pb-32 pt-20">
      <div className="w-full bg-white rounded-lg shadow-sm border">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-blue-600">
            Today&apos;s Appointments
          </h2>
          <div className="flex gap-2">
            {hasSelectedAppointments && (
              <>
                <Button
                  btnTitle="✓ Confirm Selected"
                  onClick={() => {}}
                  className="bg-green-600 hover:bg-green-700 text-white"
                ></Button>
                <Button btnTitle="  ✕ Cancel Selected" onClick={() => {}} />
              </>
            )}
          </div>
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all appointments"
                />
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Appointment ID
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Patient
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Doctor
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Date & Time
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Purpose
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Status
              </TableHead>
              <TableHead className="font-semibold text-gray-700">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleAppointments.map((appointment) => (
              <TableRow key={appointment.id} className="hover:bg-gray-50">
                <TableCell>
                  <Checkbox
                    checked={selectedAppointments.includes(appointment.id)}
                    onCheckedChange={(checked) =>
                      handleSelectAppointment(
                        appointment.id,
                        checked as boolean
                      )
                    }
                    aria-label={`Select appointment ${appointment.appointmentId}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {appointment.appointmentId}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">
                      {appointment.patient.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {appointment.patient.patientId}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-gray-700">
                  {appointment.doctor}
                </TableCell>
                <TableCell className="text-gray-700">
                  {appointment.dateTime}
                </TableCell>
                <TableCell className="text-gray-700">
                  {appointment.purpose}
                </TableCell>
                <TableCell>
                  <span className={getStatusBadge(appointment.status)}>
                    {appointment.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {}}
                      className="h-8 w-8 p-0 text-white bg-blue-500 rounded-md"
                      icon={<SquarePen className="h-4 w-4" />}
                    />
                    <Button
                      onClick={() => {}}
                      icon={
                        <Trash variant="Bold" color="red" className="h-4 w-4" />
                      }
                      className="h-8 w-8 p-0 bg-slate-100 text-red-500"
                    ></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex items-stretch justify-center gap-2 py-4 border-t">
          <Button
            className="bg-white w-auto border border-gray-300 h-10"
            btnTitle="Previous"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            textClassName="text-blue-500"
            textColor="blue"
          />

          <div className="flex gap-1">
            <Button
              btnTitle="1"
              className="w-8 h-10 p-0"
              onClick={() => setCurrentPage(1)}
            />
          </div>

          <Button
            btnTitle="Next"
            className="bg-white w-auto border border-gray-300 h-10"
            textClassName="text-blue-500"
            textColor="blue"
            disabled={true}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          />
        </div>
      </div>
    </div>
  );
};

export default AppointmentsTable;
