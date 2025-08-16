"use client";
import Button from "@/components/common/Button";
import AppointmentModal from "@/components/common/modals/AppointmentDetailsModal";
import ScheduleAppointmentModal from "@/components/common/modals/ScheduleAppointmentModal";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

interface Appointment {
  id: string;
  patientId: string;
  patientName?: string; // Optional for backward compatibility
  startDateISO?: string; // Optional for backward compatibility
  startTime: string | Date; // Can be string or Date
  endTime: string | Date; // Can be string or Date
  type: string;
  status: string;
  reason?: string;
  priority: string;
  // Real appointment fields
  patient?: {
    firstName: string;
    lastName: string;
  };
  provider?: {
    firstName: string;
    lastName: string;
  };
}

interface Props {
  appointments: Appointment[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  weeks: Date[][];
  isLoading?: boolean;
  showTitle?: boolean;
}

const CalendarSection = ({
  currentMonth,
  weeks,
  appointments,
  isLoading,
  onMonthChange,
  showTitle = true,
}: Props) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [openScheduleModal, setScheduleModal] = useState<boolean>(false);
  const [modalData, setModalData] = useState<Appointment | null>(null);
  const navigate = useRouter();
  const today = new Date();

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    console.log("Processing appointments for calendar:", appointments);

    appointments.forEach((a) => {
      // Handle both real appointment data (startTime as Date) and mock data (startDateISO as string)
      let dateKey: string;
      if (a.startTime instanceof Date) {
        // Use local date instead of UTC to avoid timezone shift issues
        const year = a.startTime.getFullYear();
        const month = String(a.startTime.getMonth() + 1).padStart(2, "0");
        const day = String(a.startTime.getDate()).padStart(2, "0");
        dateKey = `${year}-${month}-${day}`;
        console.log(
          `Appointment ${a.id}: startTime=${a.startTime}, localDate=${dateKey}`
        );
      } else if (a.startDateISO) {
        dateKey = a.startDateISO.slice(0, 10);
      } else {
        // Fallback: try to parse startTime as string
        try {
          const date = new Date(a.startTime);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          dateKey = `${year}-${month}-${day}`;
        } catch {
          console.warn("Invalid appointment date:", a);
          return;
        }
      }

      const arr = map.get(dateKey) ?? [];
      arr.push(a);
      map.set(dateKey, arr);
    });

    console.log("Final appointmentsByDay map:", Object.fromEntries(map));
    return map;
  }, [appointments]);

  const handlePrevMonth = () => {
    const newMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      1
    );
    onMonthChange(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1
    );
    onMonthChange(newMonth);
  };

  const handleToday = () => {
    onMonthChange(new Date());
  };

  const handleAppointmentUpdate = async (
    appointmentId: string,
    updates: any
  ) => {
    try {
      // Get the current user's auth token
      const authTokens = localStorage.getItem("auth_tokens");
      if (!authTokens) {
        console.error("No auth tokens found");
        return;
      }

      const { accessToken } = JSON.parse(authTokens);

      const response = await fetch(
        `/api/doctors/appointments/${appointmentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(updates),
        }
      );

      if (response.ok) {
        console.log("Appointment updated successfully");
        // Refresh the appointments list
        window.location.reload();
      } else {
        const errorData = await response.json();
        console.error("Failed to update appointment:", errorData);
        alert(
          `Failed to update appointment: ${
            errorData.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      alert("Error updating appointment. Please try again.");
    }
  };

  const handleAppointmentDelete = async (appointmentId: string) => {
    try {
      // Get the current user's auth token
      const authTokens = localStorage.getItem("auth_tokens");
      if (!authTokens) {
        console.error("No auth tokens found");
        return;
      }

      const { accessToken } = JSON.parse(authTokens);

      const response = await fetch(
        `/api/doctors/appointments/${appointmentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        console.log("Appointment deleted successfully");
        // Refresh the appointments list
        window.location.reload();
      } else {
        const errorData = await response.json();
        console.error("Failed to delete appointment:", errorData);
        alert(
          `Failed to delete appointment: ${
            errorData.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error deleting appointment:", error);
      alert("Error deleting appointment. Please try again.");
    }
  };

  const handleScheduleAppointment = async (appointmentData: any) => {
    try {
      // Get the current user's auth token
      const authTokens = localStorage.getItem("auth_tokens");
      if (!authTokens) {
        console.error("No auth tokens found");
        return;
      }

      const { accessToken } = JSON.parse(authTokens);

      // Combine date and time into a proper datetime
      const dateTime = new Date(
        `${appointmentData.date}T${appointmentData.time}`
      );
      const endTime = new Date(dateTime.getTime() + 30 * 60000); // 30 minutes duration

      // Map frontend values to database enum values
      const mapPurposeToType = (purpose: string) => {
        switch (purpose) {
          case "Routine Checkup":
            return "ROUTINE_CHECK";
          case "Follow-up Visit":
            return "FOLLOW_UP";
          case "Consultation":
            return "CONSULTATION";
          case "Emergency":
            return "EMERGENCY";
          case "Specialist Referral":
            return "CONSULTATION";
          default:
            return "ROUTINE_CHECK";
        }
      };

      const mapStatusToEnum = (status: string) => {
        switch (status) {
          case "Pending":
            return "SCHEDULED";
          case "Confirmed":
            return "CONFIRMED";
          case "Cancelled":
            return "CANCELLED";
          case "Completed":
            return "COMPLETED";
          default:
            return "SCHEDULED";
        }
      };

      const appointmentPayload = {
        patientId: appointmentData.patient,
        startTime: dateTime.toISOString(),
        endTime: endTime.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        type: mapPurposeToType(appointmentData.purpose),
        status: mapStatusToEnum(appointmentData.status),
        reason: appointmentData.notes,
        priority: "NORMAL",
        locationType: "IN_PERSON",
        notesEncrypted: appointmentData.notes
          ? Buffer.from(appointmentData.notes).toString("base64")
          : null,
      };

      const response = await fetch("/api/doctors/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(appointmentPayload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Appointment created successfully:", result);

        // Refresh the appointments list by triggering a page reload
        // This will update the calendar with the new appointment
        window.location.reload();
      } else {
        const errorData = await response.json();
        console.error("Failed to create appointment:", errorData);
        alert(
          `Failed to create appointment: ${
            errorData.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert("Error creating appointment. Please try again.");
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="w-full flex items-center justify-between border-b-gray-100 border-b-2 pb-2 mb-3">
          {showTitle && (
            <h3 className="font-semibold text-sm text-blue-500">
              Appointment Calendar
            </h3>
          )}

          <Button
            btnTitle="New Appointment"
            icon={<Plus size={16} color="white" />}
            className="w-46 h-10 rounded-sm"
            textClassName="text-xs"
            onClick={() => {
              setScheduleModal(true);
            }}
          />
        </div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">
            {currentMonth.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h3>
          <div className="flex gap-2 items-stretch">
            <button
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className=" border rounded-sm text-xs w-auto px-3 py-1"
            >
              <ChevronLeft size={13} />
            </button>
            <button
              onClick={handleToday}
              className=" border rounded-sm text-xs w-auto px-3 py-1"
            >
              Today
            </button>
            <button
              onClick={handleNextMonth}
              className=" border rounded-sm text-xs w-auto px-3 py-1"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 text-sm">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="font-semibold text-center bg-blue-500 text-white p-2 rounded-sm"
            >
              {d}
            </div>
          ))}
          {weeks.flat().map((date) => {
            // Use local date instead of UTC to avoid timezone shift issues
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const key = `${year}-${month}-${day}`;

            const dayAppointments = appointmentsByDay.get(key) || [];
            const isOtherMonth = date.getMonth() !== currentMonth.getMonth();

            // Also fix today comparison
            const todayYear = today.getFullYear();
            const todayMonth = String(today.getMonth() + 1).padStart(2, "0");
            const todayDay = String(today.getDate()).padStart(2, "0");
            const todayKey = `${todayYear}-${todayMonth}-${todayDay}`;
            const isToday = key === todayKey;
            const maxVisible = 2;
            return (
              <div
                key={key}
                className={`min-h-[96px] border rounded p-2 relative ${
                  isOtherMonth ? "bg-gray-50" : ""
                } ${isToday ? "border-2 p-1  border-blue-500" : ""}`}
              >
                <div className={`text-xs `}>{date.getDate()}</div>

                <div className="mt-2 space-y-1">
                  {dayAppointments.slice(0, maxVisible).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setModalData(a);
                        setShowModal(true);
                      }}
                      className="block w-full text-left truncate text-xs py-1 px-2 rounded bg-blue-50 border"
                    >
                      {/* Use real patient data if available, fallback to mock data */}
                      {a.patient?.firstName && a.patient?.lastName
                        ? `${a.patient.firstName} ${a.patient.lastName}`
                        : a.patientName || "Unknown Patient"}{" "}
                      -{" "}
                      {a.startTime instanceof Date
                        ? a.startTime.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : a.startDateISO
                        ? new Date(a.startDateISO).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : new Date(a.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                    </button>
                  ))}

                  {dayAppointments.length > maxVisible && (
                    <button
                      onClick={() =>
                        navigate.push("/dashboard/doctor/appointments/list")
                      }
                      className="text-xs cursor-pointer text-blue-600"
                    >
                      + {dayAppointments.length - maxVisible} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showModal && modalData && (
        <AppointmentModal
          data={modalData}
          onClose={() => {
            setShowModal(false);
          }}
          onUpdate={handleAppointmentUpdate}
          onDelete={handleAppointmentDelete}
        />
      )}

      <ScheduleAppointmentModal
        isOpen={openScheduleModal}
        onClose={() => {
          setScheduleModal(false);
        }}
        onSchedule={handleScheduleAppointment}
      />
    </>
  );
};

export default CalendarSection;
