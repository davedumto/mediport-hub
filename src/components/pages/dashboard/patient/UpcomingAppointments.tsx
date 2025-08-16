import { Calendar, Health } from "iconsax-reactjs";
import { FC, useEffect, useState } from "react";
import AppointmentItem from "./AppointmentItem";
import { useAuth } from "@/contexts/AuthContext";

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

const UpcomingAppointments = () => {
  const { tokens } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUpcomingAppointments();
  }, [tokens]);

  // Debug effect to monitor appointments state
  useEffect(() => {
    console.log("🔄 Appointments state changed:", {
      length: appointments.length,
      appointments: appointments,
    });
  }, [appointments]);

  const fetchUpcomingAppointments = async () => {
    if (!tokens?.accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const now = new Date();
      // Include appointments from 30 days ago to 30 days in the future
      const startDate = new Date(
        now.getTime() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      const endDate = new Date(
        now.getTime() + 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      console.log("🕐 Current time:", now.toISOString());
      console.log("📅 Start date (filter):", startDate);
      console.log("📅 End date (filter):", endDate);
      console.log(
        "🌍 Current timezone:",
        Intl.DateTimeFormat().resolvedOptions().timeZone
      );

      const apiUrl = `/api/patients/appointments?startDate=${startDate}&endDate=${endDate}&status=SCHEDULED&status=CONFIRMED&limit=5`;

      console.log("🔍 Fetching appointments with URL:", apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ API Response:", data);
        console.log(
          "📋 Appointments found:",
          data.data?.appointments?.length || 0
        );

        if (data.data?.appointments) {
          data.data.appointments.forEach((apt: any, index: number) => {
            console.log(`📝 Appointment ${index + 1}:`, {
              id: apt.id,
              startTime: apt.startTime,
              status: apt.status,
              type: apt.type,
            });
          });
        }

        setAppointments(data.data.appointments || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ API Error:", errorData);
        setError(errorData.message || "Failed to fetch appointments");
      }
    } catch (error) {
      console.error("💥 Fetch error:", error);
      setError("Failed to fetch appointments");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-1/2">
        <div className="w-full flex items-center justify-start gap-1.5">
          <Calendar variant="Bold" className="text-blue-500" size={16} />
          <p className="text-sm text-black font-semibold">
            Upcoming Appointments
          </p>
        </div>
        <div className="w-full mt-6 space-y-3">
          <div className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-md"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-md"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-1/2">
        <div className="w-full flex items-center justify-start gap-1.5">
          <Calendar variant="Bold" className="text-blue-500" size={16} />
          <p className="text-sm text-black font-semibold">
            Upcoming Appointments
          </p>
        </div>
        <div className="w-full mt-6">
          <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="w-1/2">
        <div className="w-full flex items-center justify-start gap-1.5">
          <Calendar variant="Bold" className="text-blue-500" size={16} />
          <p className="text-sm text-black font-semibold">
            Upcoming Appointments
          </p>
        </div>
        <div className="w-full mt-6">
          <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md text-center">
            No upcoming appointments scheduled
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-1/2">
        <div className="w-full flex items-center justify-start gap-1.5">
          <Calendar variant="Bold" className="text-blue-500" size={16} />
          <p className="text-sm text-black font-semibold">
            Upcoming Appointments
          </p>
        </div>
        <div className="w-full mt-6 space-y-3">
          {appointments.map((appointment) => (
            <AppointmentItem key={appointment.id} appointment={appointment} />
          ))}
        </div>
      </div>
    </>
  );
};

export default UpcomingAppointments;
