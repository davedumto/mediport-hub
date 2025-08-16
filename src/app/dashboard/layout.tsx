"use client";
import Header from "@/components/pages/dashboard/Header";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import RouteGuard from "@/components/common/RouteGuard";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    // Check if user is on the correct dashboard path
    const currentPath = window.location.pathname;
    const userRole = user?.role?.toLowerCase();
    const expectedPath = `/dashboard/${userRole}`;

    if (currentPath !== expectedPath && currentPath !== "/dashboard") {
      router.replace(expectedPath);
    }
  }, [isAuthenticated, user, isLoading, router]);

  return (
    <RouteGuard>
      <div className="w-full min-h-screen bg-gray-100">
        <Header />
        <div className="w-full top-26 relative px-8">
          {/* User-specific dashboard content */}
          {user && (
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.firstName}!
              </h1>
              <p className="text-gray-600 mt-2">
                {user.role === "DOCTOR" &&
                  `Dr. ${user.firstName} ${user.lastName} - ${user.specialty}`}
                {user.role === "PATIENT" &&
                  `${user.firstName} ${user.lastName} - Patient Dashboard`}
                {user.role === "NURSE" &&
                  `${user.firstName} ${user.lastName} - Nursing Staff`}
                {user.role === "ADMIN" &&
                  `${user.firstName} ${user.lastName} - Administrator`}
                {user.role === "SUPER_ADMIN" &&
                  `${user.firstName} ${user.lastName} - System Administrator`}
              </p>
            </div>
          )}
          {children}
        </div>
      </div>
    </RouteGuard>
  );
};

export default DashboardLayout;
