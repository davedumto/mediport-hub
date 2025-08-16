"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Heart,
  Droplets,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface PatientDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  status?: string;
  assignedProviderId?: string;
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
  patientSummary?: {
    status: string;
    hasConsent: boolean;
    consentDate: string | null;
    medicalConditions: number;
    allergies: number;
    medications: number;
  };
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

const PatientDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user, tokens } = useAuth();
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/superadmin/users/${params.id}`, {
          headers: {
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch patient details");
        }

        const data = await response.json();
        setPatientDetails(data.data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load patient details"
        );
        console.error("Error fetching patient details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user && tokens?.accessToken && params.id) {
      fetchPatientDetails();
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

  const getGenderIcon = (gender?: string) => {
    switch (gender) {
      case "MALE":
        return "👨";
      case "FEMALE":
        return "👩";
      default:
        return "👤";
    }
  };

  const getBloodTypeColor = (bloodType?: string) => {
    switch (bloodType) {
      case "O_POSITIVE":
        return "bg-red-100 text-red-800";
      case "A_POSITIVE":
        return "bg-blue-100 text-blue-800";
      case "B_POSITIVE":
        return "bg-green-100 text-green-800";
      case "AB_POSITIVE":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-20">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading patient details...</span>
        </div>
      </div>
    );
  }

  if (error || !patientDetails) {
    return (
      <div className="w-full px-6 py-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Error loading patient details: {error || "Patient not found"}
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
        <h1 className="text-2xl font-bold">Patient Details</h1>
      </div>

      {/* Patient Profile Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${patientDetails.firstName}`}
              />
              <AvatarFallback className="bg-orange-100 text-orange-700 text-xl">
                {patientDetails.firstName[0]}
                {patientDetails.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">
                {patientDetails.fullName}
              </CardTitle>
              <p className="text-gray-600">
                {patientDetails.gender
                  ? `${patientDetails.gender} Patient`
                  : "Patient"}
                {patientDetails.dateOfBirth &&
                  ` • Age: ${
                    new Date().getFullYear() -
                    new Date(patientDetails.dateOfBirth).getFullYear()
                  }`}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={getRoleColor(patientDetails.role)}>
                  {getRoleIcon(patientDetails.role)} {patientDetails.role}
                </Badge>
                {patientDetails.isActive ? (
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
                {patientDetails.isLocked && (
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
                  <span className="truncate">{patientDetails.email}</span>
                </div>
              </div>
              {patientDetails.phone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Phone
                  </label>
                  <div className="flex items-center mt-1">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{patientDetails.phone}</span>
                  </div>
                </div>
              )}
              {patientDetails.dateOfBirth && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Date of Birth
                  </label>
                  <div className="flex items-center mt-1">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{patientDetails.dateOfBirth}</span>
                  </div>
                </div>
              )}
              {patientDetails.gender && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Gender
                  </label>
                  <div className="flex items-center mt-1">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    <span>
                      {getGenderIcon(patientDetails.gender)}{" "}
                      {patientDetails.gender}
                    </span>
                  </div>
                </div>
              )}
              {patientDetails.bloodType && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Blood Type
                  </label>
                  <div className="mt-1">
                    <Badge
                      className={getBloodTypeColor(patientDetails.bloodType)}
                    >
                      <Droplets className="w-3 h-3 mr-1" />
                      {patientDetails.bloodType.replace("_", " ")}
                    </Badge>
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
                      patientDetails.isActive
                        ? "border-green-200 text-green-700"
                        : "border-red-200 text-red-700"
                    }
                  >
                    {patientDetails.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="w-5 h-5 mr-2" />
              Medical Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {patientDetails.patientSummary ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Patient Status
                    </label>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {patientDetails.patientSummary.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      GDPR Consent
                    </label>
                    <div className="mt-1">
                      <Badge
                        variant="outline"
                        className={
                          patientDetails.patientSummary.hasConsent
                            ? "border-green-200 text-green-700"
                            : "border-red-200 text-red-700"
                        }
                      >
                        {patientDetails.patientSummary.hasConsent
                          ? "Consented"
                          : "No Consent"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {patientDetails.patientSummary.medicalConditions}
                    </div>
                    <div className="text-sm text-blue-600">Conditions</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {patientDetails.patientSummary.allergies}
                    </div>
                    <div className="text-sm text-yellow-600">Allergies</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {patientDetails.patientSummary.medications}
                    </div>
                    <div className="text-sm text-green-600">Medications</div>
                  </div>
                </div>
                {patientDetails.patientSummary.consentDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Consent Date
                    </label>
                    <div className="mt-1 text-sm text-gray-600">
                      {patientDetails.patientSummary.consentDate}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No medical information available</p>
              </div>
            )}
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
                      patientDetails.isVerified
                        ? "border-green-200 text-green-700"
                        : "border-red-200 text-red-700"
                    }
                  >
                    {patientDetails.isVerified ? "Verified" : "Not Verified"}
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
                      patientDetails.hasMFA
                        ? "border-green-200 text-green-700"
                        : "border-yellow-200 text-yellow-700"
                    }
                  >
                    {patientDetails.hasMFA ? "Enabled" : "Disabled"}
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
                      patientDetails.failedLoginAttempts > 0
                        ? "text-red-600"
                        : "text-gray-600"
                    }
                  >
                    {patientDetails.failedLoginAttempts}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Last Login
                </label>
                <div className="mt-1 text-sm text-gray-600">
                  {patientDetails.lastLoginFormatted}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consent & Activity Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Consent & Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Total Consents
                </label>
                <div className="mt-1 text-lg font-semibold">
                  {patientDetails.consentSummary.totalConsents}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Active Consents
                </label>
                <div className="mt-1 text-lg font-semibold text-green-600">
                  {patientDetails.consentSummary.activeConsents}
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Latest Consent
              </label>
              <div className="mt-1 text-sm text-gray-600">
                {patientDetails.consentSummary.latestConsent ||
                  "No consent records"}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Total Actions
                </label>
                <div className="mt-1 text-lg font-semibold">
                  {patientDetails.activitySummary.totalActions}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Successful Actions
                </label>
                <div className="mt-1 text-lg font-semibold text-green-600">
                  {patientDetails.activitySummary.successfulActions}
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Last Action
              </label>
              <div className="mt-1 text-sm text-gray-600">
                {patientDetails.activitySummary.lastAction ||
                  "No recent activity"}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Account Created
              </label>
              <div className="mt-1 text-sm text-gray-600">
                {patientDetails.createdAtFormatted}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Last Updated
              </label>
              <div className="mt-1 text-sm text-gray-600">
                {patientDetails.updatedAtFormatted}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientDetailsPage;
