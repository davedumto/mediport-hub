"use client";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";

interface RouteGuardProps {
  children: ReactNode;
  requiredRole?: string;
  requiredPermissions?: string[];
  fallback?: ReactNode;
}

const RouteGuard = ({
  children,
  requiredRole,
  requiredPermissions = [],
  fallback,
}: RouteGuardProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      router.replace("/dashboard");
      return;
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasRequiredPermissions = requiredPermissions.every((permission) =>
        user?.permissions?.includes(permission)
      );

      if (!hasRequiredPermissions) {
        router.replace("/dashboard");
        return;
      }
    }
  }, [
    isAuthenticated,
    user,
    requiredRole,
    requiredPermissions,
    user?.permissions,
    isLoading,
    router,
  ]);

  // Show loading state while auth is initializing
  if (isLoading) {
    return (
      <div className="w-full min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show fallback if access is denied
  if (
    !isAuthenticated ||
    (requiredRole && user?.role !== requiredRole) ||
    (requiredPermissions.length > 0 &&
      !requiredPermissions.some((permission) =>
        user?.permissions?.includes(permission)
      ))
  ) {
    return fallback || null;
  }

  return <>{children}</>;
};

export default RouteGuard;
