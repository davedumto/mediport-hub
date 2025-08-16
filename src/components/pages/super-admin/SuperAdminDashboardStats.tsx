"use client";
import { User, UserOctagon } from "iconsax-reactjs";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type StatItem = {
  id: string;
  value: string | number;
  label: string;
  colorFrom: string;
  colorTo: string;
  icon?: React.ReactNode;
};

type DashboardStats = {
  totalUsers: number;
  roleDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
};

const SuperAdminDashboardStatsSection = () => {
  const { user, tokens, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully", {
        description: "You have been logged out of the super admin panel",
        duration: 3000,
      });
      router.push("/super-admin-login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed", {
        description: "Please try again",
        duration: 3000,
      });
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(
          "Debug - SuperAdminDashboardStats: Starting to fetch stats"
        );
        console.log("Debug - SuperAdminDashboardStats: User:", user);
        console.log("Debug - SuperAdminDashboardStats: Tokens:", tokens);
        console.log(
          "Debug - SuperAdminDashboardStats: Access Token:",
          tokens?.accessToken
        );

        if (!tokens?.accessToken) {
          console.error(
            "Debug - SuperAdminDashboardStats: No access token available"
          );
          setError("No access token available");
          return;
        }

        // Fetch users for each role
        const [doctorsResponse, nursesResponse, patientsResponse] =
          await Promise.all([
            fetch("/api/superadmin/users?role=DOCTOR&limit=1", {
              headers: { Authorization: `Bearer ${tokens.accessToken}` },
            }),
            fetch("/api/superadmin/users?role=NURSE&limit=1", {
              headers: { Authorization: `Bearer ${tokens.accessToken}` },
            }),
            fetch("/api/superadmin/users?role=PATIENT&limit=1", {
              headers: { Authorization: `Bearer ${tokens.accessToken}` },
            }),
          ]);

        const doctorsData = await doctorsResponse.json();
        const nursesData = await nursesResponse.json();
        const patientsData = await patientsResponse.json();

        const doctorCount = doctorsData.data?.pagination?.total || 0;
        const nurseCount = nursesData.data?.pagination?.total || 0;
        const patientCount = patientsData.data?.pagination?.total || 0;

        setStats([
          {
            id: "doctors",
            value: doctorCount,
            label: "Doctors",
            colorFrom: "#4db6ff",
            colorTo: "#2b9cff",
            icon: <UserOctagon color="white" size={24} />,
          },
          {
            id: "nurses",
            value: nurseCount,
            label: "Nurses",
            colorFrom: "#6ee7b7",
            colorTo: "#16a34a",
            icon: <UserOctagon color="white" size={24} />,
          },
          {
            id: "patients",
            value: patientCount,
            label: "Patients",
            colorFrom: "#ffb36b",
            colorTo: "#f97316",
            icon: <User color="white" size={24} />,
          },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load stats");
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user && tokens?.accessToken) {
      fetchStats();
    } else {
      console.log(
        "Debug - SuperAdminDashboardStats: Missing user or tokens, not fetching"
      );
    }
  }, [user, tokens]);

  if (loading) {
    return (
      <section className="w-full">
        <div className="w-full px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-sm shadow-md py-5 px-6 flex items-center animate-pulse"
                style={{
                  background: "linear-gradient(90deg, #e5e7eb, #d1d5db)",
                }}
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-300 mr-4"></div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-300 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      {/* Header with Logout Button */}
      <div className="w-full px-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Dashboard Overview
            </h2>
            <p className="text-gray-600">Welcome back, Admin!</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="w-full px-4 mb-[3em]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {Array.isArray(stats) &&
            stats.map((s) => (
              <div
                key={s.id}
                className="relative overflow-hidden rounded-lg shadow-md py-6 px-6 flex items-center transition transform duration-200 ease-out hover:scale-[1.02] min-h-[120px]"
                style={{
                  background: `linear-gradient(135deg, ${s.colorFrom}, ${s.colorTo})`,
                }}
                aria-labelledby={`stat-${s.id}-title`}
                role="group"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center mr-4">
                  {s.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    id={`stat-${s.id}-title`}
                    className="text-white text-2xl md:text-3xl font-bold leading-tight"
                  >
                    {s.value}
                  </div>
                  <div className="text-white/90 text-sm md:text-base font-medium truncate mt-1">
                    {s.label}
                  </div>
                </div>

                <div
                  aria-hidden
                  className="pointer-events-none absolute right-2 top-2 opacity-20"
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 9999,
                    filter: "blur(12px)",
                    background: "rgba(255,255,255,0.1)",
                  }}
                />
              </div>
            ))}
        </div>
      </div>
    </section>
  );
};

export default SuperAdminDashboardStatsSection;
