"use client";

import ProfileCard from "@/components/common/profile/ProfileCard";
import PatientTab from "@/components/pages/dashboard/patient/PatientTab";
import RouteGuard from "@/components/common/RouteGuard";
import { useAuth } from "@/contexts/AuthContext";

const PatientDashboard = () => {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  return (
    <RouteGuard requiredRole="PATIENT">
      <div className="w-full relative pb-32">
        {/* Personalized Welcome Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-gray-600 mt-1">
                Patient Dashboard •{" "}
                {user?.verificationStatus || "Unknown Status"}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Medical Record #: {user?.id?.slice(-8) || "N/A"}
              </p>
            </div>
            <button
              onClick={() => logout()}
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1"
                />
              </svg>
              Logout
            </button>
          </div>
        </div>

        <ProfileCard />
        <PatientTab />
      </div>
    </RouteGuard>
  );
};

export default PatientDashboard;
