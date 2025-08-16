"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Loader2,
  Shield,
  Clock,
  Mail,
  Phone,
  Calendar,
  User,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface StaffDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  dateOfBirth?: string;
  isActive: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  failedLoginAttempts: number;
  lockedUntil?: string;
  fullName: string;
  isVerified: boolean;
  hasMFA: boolean;
  isLocked: boolean;
  lastLoginFormatted: string;
  createdAtFormatted: string;
  updatedAtFormatted: string;
  primaryRole: string;
  assignedRoles: string[];
  totalRoles: number;
  consentSummary: {
    totalConsents: number;
    activeConsents: number;
    latestConsent: string | null;
  };
  activitySummary: {
    totalActions: number;
    successfulActions: number;
    lastAction: string | null;
  };
}

const StaffDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user, tokens } = useAuth();
  const [staffDetails, setStaffDetails] = useState<StaffDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaffDetails = async () => {
      try {
        setLoading(true);
        console.log(
          "Debug - StaffDetails: Starting to fetch staff details for ID:",
          params.id
        );

        const response = await fetch(`/api/superadmin/users/${params.id}`, {
          headers: {
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
        });

        console.log("Debug - StaffDetails: Response status:", response.status);
        console.log("Debug - StaffDetails: Response ok:", response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Debug - StaffDetails: Error response:", errorText);
          throw new Error("Failed to fetch staff details");
        }

        const data = await response.json();
        console.log("Debug - StaffDetails: Response data:", data);
        setStaffDetails(data.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load staff details"
        );
        console.error("Error fetching staff details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user && tokens?.accessToken && params.id) {
      fetchStaffDetails();
    } else {
      console.log("Debug - StaffDetails: Missing user, tokens, or ID:", {
        hasUser: !!user,
        hasTokens: !!tokens,
        id: params.id,
      });
    }
  }, [user, tokens, params.id]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-100 text-purple-800";
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "DOCTOR":
        return "bg-blue-100 text-blue-800";
      case "NURSE":
        return "bg-green-100 text-green-800";
      case "PATIENT":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "👑";
      case "ADMIN":
        return "⚙️";
      case "DOCTOR":
        return "👨‍⚕️";
      case "NURSE":
        return "👩‍⚕️";
      case "PATIENT":
        return "👤";
      default:
        return "❓";
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-20">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading staff details...</span>
        </div>
      </div>
    );
  }

  if (error || !staffDetails) {
    return (
      <div className="w-full px-6 py-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Error loading staff details: {error || "Staff member not found"}
          </p>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="mt-2"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button onClick={() => router.back()} variant="outline" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Staff Member Details</h1>
      </div>

      {/* Staff Profile Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${staffDetails.firstName}`}
              />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xl">
                {staffDetails.firstName[0]}
                {staffDetails.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">
                {staffDetails.fullName}
              </CardTitle>
              <p className="text-gray-600">
                {staffDetails.role === "DOCTOR" ? "Dr. " : ""}
                {staffDetails.firstName} {staffDetails.lastName}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={getRoleColor(staffDetails.role)}>
                  {getRoleIcon(staffDetails.role)} {staffDetails.role}
                </Badge>
                {staffDetails.isActive ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">
                    <XCircle className="w-3 h-3 mr-1" />
                    Inactive
                  </Badge>
                )}
                {staffDetails.isLocked && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    🔒 Locked
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Email
                </label>
                <div className="flex items-center mt-1">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  <span className="truncate">{staffDetails.email}</span>
                </div>
              </div>
              {staffDetails.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Phone
                  </label>
                  <div className="flex items-center mt-1">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{staffDetails.phone}</span>
                  </div>
                </div>
              )}
              {staffDetails.dateOfBirth && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Date of Birth
                  </label>
                  <div className="flex items-center mt-1">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{staffDetails.dateOfBirth}</span>
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Status
                </label>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className={
                      staffDetails.isActive
                        ? "border-green-200 text-green-700"
                        : "border-red-200 text-red-700"
                    }
                  >
                    {staffDetails.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Email Verified
                </label>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className={
                      staffDetails.isVerified
                        ? "border-green-200 text-green-700"
                        : "border-red-200 text-red-700"
                    }
                  >
                    {staffDetails.isVerified ? "Verified" : "Not Verified"}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  MFA Status
                </label>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className={
                      staffDetails.hasMFA
                        ? "border-green-200 text-green-700"
                        : "border-yellow-200 text-yellow-700"
                    }
                  >
                    {staffDetails.hasMFA ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Failed Logins
                </label>
                <div className="mt-1">
                  <span
                    className={
                      staffDetails.failedLoginAttempts > 0
                        ? "text-red-600"
                        : "text-gray-600"
                    }
                  >
                    {staffDetails.failedLoginAttempts}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Last Login
                </label>
                <div className="mt-1 text-sm text-gray-600">
                  {staffDetails.lastLoginFormatted}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              Role Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Primary Role
              </label>
              <div className="mt-1">
                <Badge className={getRoleColor(staffDetails.primaryRole)}>
                  {getRoleIcon(staffDetails.primaryRole)}{" "}
                  {staffDetails.primaryRole}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Total Roles
              </label>
              <div className="mt-1 text-lg font-semibold">
                {staffDetails.totalRoles}
              </div>
            </div>
            {staffDetails.assignedRoles.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Assigned Roles
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {staffDetails.assignedRoles.map((role, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className={getRoleColor(role)}
                    >
                      {getRoleIcon(role)} {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Activity Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Total Actions
                </label>
                <div className="mt-1 text-lg font-semibold">
                  {staffDetails.activitySummary.totalActions}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Successful Actions
                </label>
                <div className="mt-1 text-lg font-semibold text-green-600">
                  {staffDetails.activitySummary.successfulActions}
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Last Action
              </label>
              <div className="mt-1 text-sm text-gray-600">
                {staffDetails.activitySummary.lastAction ||
                  "No recent activity"}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Account Created
              </label>
              <div className="mt-1 text-sm text-gray-600">
                {staffDetails.createdAtFormatted}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Last Updated
              </label>
              <div className="mt-1 text-sm text-gray-600">
                {staffDetails.updatedAtFormatted}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StaffDetailsPage;
