"use client";
import { useState, useEffect } from "react";
import { Calendar, Clock, User, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import AppointmentDetailsModal from "@/components/common/modals/AppointmentDetailsModal";

interface RealAppointment {
  id: string;
  patientId: string;
  providerId: string;
  startTime: string;
  endTime: string;
  type: string;
  status: string;
  reason?: string;
  priority: string;
  locationType: string;
  roomNumber?: string;
  virtualMeetingUrl?: string;
  patient: {
    firstName: string;
    lastName: string;
  };
  provider: {
    firstName: string;
    lastName: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

const AppointmentTab = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<RealAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedAppointment, setSelectedAppointment] =
    useState<RealAppointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchPatientAppointments();
    }
  }, [user]);

  // Reset modal when appointments change
  useEffect(() => {
    if (
      selectedAppointment &&
      !appointments.find((apt) => apt.id === selectedAppointment.id)
    ) {
      setSelectedAppointment(null);
      setIsModalOpen(false);
    }
  }, [appointments, selectedAppointment]);

  const fetchPatientAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/patients/appointments", {
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
        setAppointments(data.data.appointments || []);
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter appointments based on selected status
  const filteredAppointments =
    selectedStatus === "all"
      ? appointments
      : appointments.filter(
          (appointment) => appointment.status.toLowerCase() === selectedStatus
        );

  // Group appointments by date
  const appointmentsByDate = filteredAppointments.reduce((acc, appointment) => {
    const date = new Date(appointment.startTime).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(appointment);
    return acc;
  }, {} as Record<string, RealAppointment[]>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return "✅";
      case "pending":
        return "⏳";
      case "cancelled":
        return "❌";
      case "completed":
        return "✅";
      default:
        return "❓";
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
          <p className="text-gray-600">
            Manage and view your upcoming appointments
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Appointments</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appointments...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(appointmentsByDate).map(([date, appointments]) => (
            <div
              key={date}
              className="bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  {date}
                </h3>
              </div>

              <div className="divide-y divide-gray-100">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {getStatusIcon(appointment.status)}{" "}
                            {appointment.status.charAt(0).toUpperCase() +
                              appointment.status.slice(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(appointment.startTime).toLocaleTimeString(
                              "en-US",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </span>
                        </div>

                        <h4 className="font-medium text-gray-900 mb-1">
                          {appointment.type || "Appointment"}
                        </h4>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>
                              Dr. {appointment.provider?.firstName}{" "}
                              {appointment.provider?.lastName || "Unknown"}
                            </span>
                          </div>

                          {appointment.reason && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{appointment.reason}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setIsModalOpen(true);
                          }}
                        >
                          View Details
                        </button>
                        {appointment.status === "pending" && (
                          <button className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredAppointments.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No appointments found
              </h3>
              <p className="text-gray-600">
                You don&apos;t have any appointments for the selected criteria.
              </p>
            </div>
          )}
        </div>
      )}

      {selectedAppointment && (
        <AppointmentDetailsModal
          data={selectedAppointment}
          open={isModalOpen}
          readOnly={true} // Patients can only view, not edit
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAppointment(null);
          }}
        />
      )}
    </div>
  );
};

export default AppointmentTab;
