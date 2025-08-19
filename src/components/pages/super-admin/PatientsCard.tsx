"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Phone,
  Mail,
  User,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  Droplets,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  status?: string;
  assignedProviderId?: string;
  isActive: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  fullName: string;
  isVerified: boolean;
  hasMFA: boolean;
  lastLoginFormatted: string;
  patientSummary?: {
    status: string;
    hasConsent: boolean;
    consentDate: string | null;
    medicalConditions: number;
    allergies: number;
    medications: number;
  };
};

interface PatientCardProps {
  patient: Patient;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient }) => {
  const router = useRouter();

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Super Admin":
        return "bg-purple-100 text-purple-800";
      case "Admin":
        return "bg-red-100 text-red-800";
      case "Doctor":
        return "bg-blue-100 text-blue-800";
      case "Nurse":
        return "bg-green-100 text-green-800";
      case "Patient":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Super Admin":
        return "👑";
      case "Admin":
        return "⚙️";
      case "Doctor":
        return "👨‍⚕️";
      case "Nurse":
        return "👩‍⚕️";
      case "Patient":
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

  return (
    <>
      <Card className="w-full max-w-sm hover:shadow-lg transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${
                  patient.firstName || "patient"
                }`}
              />
              <AvatarFallback className="bg-orange-100 text-orange-700">
                {patient.firstName?.[0] || "P"}
                {patient.lastName?.[0] || "T"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-lg">
                {patient.firstName || "[Encrypted]"}{" "}
                {patient.lastName || "[Encrypted]"}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {patient.gender ? `${patient.gender} Patient` : "Patient"}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline" className={getRoleColor(patient.role)}>
                  <User className="w-3 h-3 mr-1" />
                  {getRoleIcon(patient.role)} {patient.role}
                </Badge>
                {patient.isActive ? (
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100 text-red-800">
                    <XCircle className="w-3 h-3 mr-1" />
                    Inactive
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-2 text-gray-500" />
              <span className="truncate">{patient.email}</span>
            </div>
            {patient.dateOfBirth && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
              </div>
            )}
            {patient.gender && (
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2 text-gray-500" />
                {getGenderIcon(patient.gender)} {patient.gender}
              </div>
            )}
            {patient.bloodType && (
              <div className="flex items-center">
                <Droplets className="w-4 h-4 mr-2 text-gray-500" />
                <Badge
                  variant="outline"
                  className={`text-xs ${getBloodTypeColor(patient.bloodType)}`}
                >
                  {patient.bloodType.replace("_", " ")}
                </Badge>
              </div>
            )}
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-gray-500" />
              Last login: {patient.lastLoginFormatted}
            </div>
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2 text-gray-500" />
              {patient.hasMFA ? "MFA Enabled" : "MFA Disabled"}
            </div>
          </div>

          <div className="flex space-x-2 mt-4">
            <Button
              onClick={() => {
                router.push(
                  `/super-admin/dashboard/patient-details/${patient.id}`
                );
              }}
              className="flex-1"
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default PatientCard;
