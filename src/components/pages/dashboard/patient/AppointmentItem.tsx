import { FC } from "react";

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  reason?: string;
  provider: {
    firstName: string;
    lastName: string;
    specialty?: string;
  };
  locationType: string;
  roomNumber?: string;
}

interface AppointmentItemProps {
  appointment: Appointment;
}

const AppointmentItem: FC<AppointmentItemProps> = ({ appointment }) => {
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-200 text-green-500";
      case "scheduled":
        return "bg-blue-200 text-blue-500";
      case "completed":
        return "bg-gray-200 text-gray-500";
      case "cancelled":
        return "bg-red-200 text-red-500";
      case "no_show":
        return "bg-orange-200 text-orange-500";
      default:
        return "bg-gray-200 text-gray-500";
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

  const formatAppointmentType = (type: string) => {
    // Handle both the new API format (CONSULTATION) and the old format (Consult)
    if (type.includes("_")) {
      return type.replace(/_/g, " ").toUpperCase();
    }
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  return (
    <div className="flex items-center justify-between bg-white shadow-gray-100 p-3 shadow-sm rounded-lg border border-gray-100">
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-600 font-medium">
            {formatDateTime(appointment.startTime)}
          </p>
          <span className="text-gray-400">•</span>
          <p className="text-sm text-blue-600 font-semibold">
            {formatAppointmentType(appointment.type)}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>
            With Dr. {appointment.provider.firstName}{" "}
            {appointment.provider.lastName}
          </span>
          {appointment.provider.specialty && (
            <>
              <span>•</span>
              <span>{appointment.provider.specialty}</span>
            </>
          )}
        </div>

        {appointment.reason && (
          <p className="text-sm text-gray-600 italic">"{appointment.reason}"</p>
        )}
      </div>

      <div className="ml-4">
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
            appointment.status
          )}`}
        >
          {getStatusDisplayName(appointment.status)}
        </div>
      </div>
    </div>
  );
};

export default AppointmentItem;
