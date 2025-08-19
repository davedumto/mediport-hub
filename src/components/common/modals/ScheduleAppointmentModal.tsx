"use client";
import React, { FC, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

interface ScheduleAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule?: (appointmentData: any) => void;
}

interface AssignedPatient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const ScheduleAppointmentModal: FC<ScheduleAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSchedule,
}) => {
  const { user } = useAuth();
  const [assignedPatients, setAssignedPatients] = useState<AssignedPatient[]>(
    []
  );
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [formData, setFormData] = useState({
    patient: "",
    date: "",
    time: "",
    hour: "09",
    minute: "00",
    period: "AM",
    purpose: "Routine Checkup",
    notes: "",
    status: "Pending",
  });

  useEffect(() => {
    if (isOpen && user?.role === "DOCTOR") {
      fetchAssignedPatients();
    }
  }, [isOpen, user]);

  const fetchAssignedPatients = async () => {
    try {
      setIsLoadingPatients(true);
      const response = await fetch("/api/doctors/assigned-patients", {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("auth_tokens")
              ? JSON.parse(localStorage.getItem("auth_tokens")!).accessToken
              : ""
          }`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAssignedPatients(data.data.patients || []);
      }
    } catch (error) {
      console.error("Failed to fetch assigned patients:", error);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSchedule = () => {
    if (onSchedule) {
      // Convert 12-hour time to 24-hour format
      let hour24 = parseInt(formData.hour);
      if (formData.period === "PM" && hour24 !== 12) {
        hour24 += 12;
      } else if (formData.period === "AM" && hour24 === 12) {
        hour24 = 0;
      }

      // Format time as HH:MM in 24-hour format
      const formattedTime = `${hour24.toString().padStart(2, "0")}:${
        formData.minute
      }`;

      // Pass the formatted data with proper 24-hour time
      onSchedule({
        ...formData,
        time: formattedTime,
      });
    }
    onClose();
  };

  const handleCancel = () => {
    setFormData({
      patient: "",
      date: "",
      time: "",
      hour: "09",
      minute: "00",
      period: "AM",
      purpose: "Routine Checkup",
      notes: "",
      status: "Pending",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between border-b-gray-200 border-b pb-3">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Schedule New Appointment
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Patient
              </label>
              <select
                value={formData.patient}
                onChange={(e) => handleInputChange("patient", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                disabled={isLoadingPatients}
              >
                <option value="">
                  {isLoadingPatients ? "Loading patients..." : "Select Patient"}
                </option>
                {assignedPatients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName}
                  </option>
                ))}
              </select>
              {assignedPatients.length === 0 && !isLoadingPatients && (
                <p className="text-sm text-gray-500 mt-1">
                  No patients assigned to you. Contact a super admin to get
                  patients assigned.
                </p>
              )}
            </div>

            {user?.role === "DOCTOR" && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You are creating this appointment as
                  Dr. {user.firstName} {user.lastName}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="mm / dd / yyyy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.hour}
                  onChange={(e) => handleInputChange("hour", e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {[...Array(12)].map((_, i) => {
                    const hour = (i + 1).toString().padStart(2, "0");
                    return (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    );
                  })}
                </select>
                <span className="flex items-center px-2 text-gray-700">:</span>
                <select
                  value={formData.minute}
                  onChange={(e) => handleInputChange("minute", e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  {["00", "15", "30", "45"].map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}
                    </option>
                  ))}
                </select>
                <select
                  value={formData.period}
                  onChange={(e) => handleInputChange("period", e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purpose
            </label>
            <select
              value={formData.purpose}
              onChange={(e) => handleInputChange("purpose", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="Routine Checkup">Routine Checkup</option>
              <option value="Follow-up Visit">Follow-up Visit</option>
              <option value="Consultation">Consultation</option>
              <option value="Emergency">Emergency</option>
              <option value="Specialist Referral">Specialist Referral</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Additional notes about the appointment"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 pt-6 justify-end">
          <button
            onClick={handleCancel}
            className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Schedule Appointment
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleAppointmentModal;
