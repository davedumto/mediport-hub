"use client";
import React, { FC, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  Calendar,
  FileText,
  AlertCircle,
  SquarePen,
  Trash2,
} from "lucide-react";

interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  startTime: string | Date;
  endTime: string | Date;
  type: string;
  status: string;
  reason?: string;
  priority: string;
  patient?: {
    firstName: string;
    lastName: string;
  };
  provider?: {
    firstName: string;
    lastName: string;
  };
}

interface AppointmentModalProps {
  data: Appointment;
  open: boolean;
  onClose: () => void;
  readOnly?: boolean; // Add this prop to disable editing
  onUpdate?: (appointmentId: string, updates: Partial<Appointment>) => void;
  onDelete?: (appointmentId: string) => void;
}

const AppointmentModal: FC<AppointmentModalProps> = ({
  data,
  open,
  onClose,
  readOnly = false, // Default to false for backward compatibility
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedStatus, setEditedStatus] = useState(data.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const appt = data;

  const handleOpenChange = (
    open: boolean | ((prevState: boolean) => boolean)
  ) => {
    if (!open) {
      onClose();
    }
  };

  const formatDateTime = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    return {
      day: date.toLocaleDateString("en-US", { weekday: "long" }),
      date: date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
  };

  const dateTime = formatDateTime(appt.startTime);

  const handleStatusUpdate = async () => {
    if (!onUpdate || editedStatus === appt.status) return;

    setIsUpdating(true);
    try {
      await onUpdate(appt.id, { status: editedStatus });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update appointment status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;

    if (
      !confirm(
        "Are you sure you want to delete this appointment? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await onDelete(appt.id);
      handleOpenChange(false);
    } catch (error) {
      console.error("Failed to delete appointment:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "scheduled":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "no_show":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "SCHEDULED";
      case "confirmed":
        return "CONFIRMED";
      case "completed":
        return "COMPLETED";
      case "cancelled":
        return "CANCELLED";
      case "no_show":
        return "NO SHOW";
      default:
        return status.toUpperCase();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="pb-4">
          <div className="flex items-center justify-between border-b-gray-200 border-b pb-3">
            <DialogTitle className="text-base font-semibold">
              Appointment Details
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex items-start gap-3 pb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-600">
              {appt.type || "Appointment"}
            </h3>
            <p className="text-sm text-gray-600">
              {dateTime.day}, {dateTime.date} {dateTime.time}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-100">
          <div className="bg-gray-100 p-3 rounded-sm">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">
                PATIENT
              </span>
            </div>
            <p className="font-medium">
              {appt.patient
                ? `${appt.patient.firstName} ${appt.patient.lastName}`
                : "Unknown Patient"}
            </p>
          </div>
          <div className="bg-gray-100 p-3 rounded-sm">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">
                CONSULTANT
              </span>
            </div>
            <p className="font-medium">
              {appt.provider
                ? `Dr. ${appt.provider.firstName} ${appt.provider.lastName}`
                : "Unknown Consultant"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-100">
          <div className="bg-gray-100 p-3 rounded-sm">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">
                TYPE
              </span>
            </div>
            <p className="font-medium">{appt.type || "Appointment"}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-sm">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">
                STATUS
              </span>
            </div>
            {isEditing && !readOnly ? (
              <select
                value={editedStatus}
                onChange={(e) => setEditedStatus(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SCHEDULED">SCHEDULED</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="NO_SHOW">NO SHOW</option>
              </select>
            ) : (
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  appt.status
                )}`}
              >
                {getStatusDisplayName(appt.status)}
              </span>
            )}
          </div>
        </div>

        {appt.reason && (
          <div className="py-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-500 uppercase">
                REASON
              </span>
            </div>
            <p className="text-sm text-gray-700">{appt.reason}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
          {readOnly ? (
            // Read-only mode - just show close button
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          ) : isEditing ? (
            // Editing mode - show save/cancel buttons
            <>
              <button
                onClick={handleStatusUpdate}
                disabled={isUpdating || editedStatus === appt.status}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedStatus(appt.status);
                }}
                className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
            </>
          ) : (
            // View mode - show edit/delete buttons (only for non-readonly users)
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
              >
                <SquarePen size={16} /> Edit Status
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 disabled:opacity-50"
              >
                <Trash2 size={16} /> {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentModal;
