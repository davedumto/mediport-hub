"use client";
import SuperAdminTab from "@/components/pages/super-admin/SuperAdminTab";
import SuperAdminDashboardStats from "@/components/pages/super-admin/SuperAdminDashboardStats";
import RouteGuard from "@/components/common/RouteGuard";

export default function SuperAdminDashboard() {
  return (
    <RouteGuard requiredRole="SUPER_ADMIN">
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <SuperAdminDashboardStats />
          <SuperAdminTab />
        </div>
      </div>
    </RouteGuard>
  );
}
