"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const DashboardFallback = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        // User not authenticated, redirect to login
        router.replace("/login");
        return;
      }

      // User is authenticated, redirect to appropriate dashboard
      switch (user.role.toLowerCase()) {
        case "doctor":
          router.replace("/dashboard/doctor");
          break;
        case "patient":
          router.replace("/dashboard/patient");
          break;
        case "nurse":
          router.replace("/dashboard/nurse");
          break;
        case "super_admin":
          router.replace("/super-admin/dashboard");
          break;
        case "admin":
          router.replace("/dashboard/admin");
          break;
        default:
          // Unknown role, redirect to login
          router.replace("/login");
      }
    }
  }, [user, isAuthenticated, isLoading, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};

export default DashboardFallback;
