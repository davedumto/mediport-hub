"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useCallback } from "react";
import DashboardStatsSection from "@/components/pages/dashboard/DashboardStats";
import CalendarSection from "@/components/pages/dashboard/CalendarSection";
import FeedbackSection from "@/components/pages/dashboard/doctor/FeedbackSection";
import RouteGuard from "@/components/common/RouteGuard";
import { PIIDecryptionClient } from "@/services/piiDecryptionClient";

const DoctorDashboard = () => {
  const { user, tokens, isAuthenticated, logout, updateUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({});
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);

  // Generate calendar weeks for the current month
  const generateCalendarWeeks = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);

    // Adjust start date to include the first day of the week (Sunday)
    const dayOfWeek = firstDay.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const weeks = [];
    let currentWeek = [];
    const currentDate = new Date(startDate);

    // Fix: Only continue while we haven't exceeded the last day OR current week is incomplete
    while (
      currentDate <= lastDay ||
      (currentWeek.length > 0 && currentWeek.length < 7)
    ) {
      currentWeek.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);

      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    }

    // Add any remaining days in the last week
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  };

  const weeks = generateCalendarWeeks(currentMonth);

  // Decrypt user PII when component mounts
  useEffect(() => {
    const decryptUserData = async () => {
      if (!user?.id || !tokens?.accessToken) return;
      
      // Check if we already have decrypted data
      if (user.firstName && !user.firstName.includes("*")) {
        return; // Already decrypted
      }

      setIsDecrypting(true);
      try {
        const decryptedData = await PIIDecryptionClient.decryptUserProfile(
          user.id,
          tokens.accessToken
        );

        if (decryptedData) {
          // Merge decrypted data with existing user data
          const mergedUser = {
            ...user,
            ...decryptedData,
          };
          updateUser(mergedUser);
        }
      } catch (error) {
        console.error("Failed to decrypt user data:", error);
      } finally {
        setIsDecrypting(false);
      }
    };

    decryptUserData();
  }, [user?.id, user, tokens?.accessToken, updateUser]);

  const fetchDoctorData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoadingAppointments(true);
    try {
      // Fetch appointments for the current month
      const startDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
      );
      const endDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
      );
      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();

      const appointmentsResponse = await fetch(
        `/api/doctors/appointments?startDate=${startISO}&endDate=${endISO}`,
        {
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("auth_tokens")
                ? JSON.parse(localStorage.getItem("auth_tokens")!).accessToken
                : ""
            }`,
          },
        }
      );

      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        console.log("Appointments response:", appointmentsData);
        setAppointments(appointmentsData.data.appointments || []);
      } else {
        console.error(
          "Failed to fetch appointments:",
          appointmentsResponse.status,
          appointmentsResponse.statusText
        );
        const errorData = await appointmentsResponse.json().catch(() => ({}));
        console.error("Appointments error details:", errorData);
      }

      // Fetch dashboard stats
      const statsResponse = await fetch("/api/doctors/stats", {
        headers: {
          Authorization: `Bearer ${
            localStorage.getItem("auth_tokens")
              ? JSON.parse(localStorage.getItem("auth_tokens")!).accessToken
              : ""
          }`,
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data);
      }
    } catch (error) {
      console.error("Failed to fetch doctor data:", error);
    } finally {
      setIsLoadingAppointments(false);
    }

    // Debug: Log the current appointments state
    console.log("Current appointments state:", appointments);
  }, [user?.id, currentMonth]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    fetchDoctorData();
  }, [isAuthenticated, user, fetchDoctorData]);

  return (
    <RouteGuard requiredRole="DOCTOR">
      <div className="space-y-8">
        {/* Personalized Welcome Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {isDecrypting ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  <>Dr. {user?.firstName} {user?.lastName}</>
                )}
              </h2>
              <p className="text-gray-600 mt-1">
                {user?.specialty
                  ? `Specialty: ${user.specialty}`
                  : "Medical Professional"}
              </p>
              {user?.medicalLicenseNumber && (
                <p className="text-sm text-gray-500 mt-1">
                  License: {user.medicalLicenseNumber}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Status:{" "}
                {user?.verificationStatus === "VERIFIED"
                  ? "✅ Verified"
                  : "⏳ Pending Verification"}
              </p>
              {user?.email && (
                <p className="text-sm text-gray-500 mt-1">
                  Email: {user.email}
                </p>
              )}
              {user?.phone && (
                <p className="text-sm text-gray-500 mt-1">
                  Phone: {user.phone}
                </p>
              )}
            </div>
            <div className="text-right flex flex-col items-end gap-3">
              <div>
                <p className="text-sm text-gray-500">Last Login</p>
                <p className="text-gray-900 font-medium">
                  {user?.lastLogin
                    ? new Date(user.lastLogin).toLocaleDateString()
                    : "First time"}
                </p>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 30 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <DashboardStatsSection
          stats={stats}
          isLoading={isLoadingAppointments}
        />

        {/* Calendar Section */}
        <CalendarSection
          appointments={appointments}
          currentMonth={currentMonth}
          onMonthChange={setCurrentMonth}
          weeks={weeks}
          isLoading={isLoadingAppointments}
        />

        {/* Feedback Section */}
        <FeedbackSection />
      </div>

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Logout
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to log out? You&apos;ll need to log in again
              to access your dashboard.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 hover:shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </RouteGuard>
  );
};

export default DoctorDashboard;
