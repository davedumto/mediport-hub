"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Phone,
  Mail,
  Stethoscope,
  Users,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Nurse = {
  id: string;
  firstName: string;
  lastName: string;
  specialty?: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  assignedPatients?: any[];
  fullName: string;
  isVerified: boolean;
  hasMFA: boolean;
  lastLoginFormatted: string;
};

interface NurseCardProps {
  nurse: Nurse;
  onAssignRole: (nurse: Nurse, newRole: string) => void;
  roleUpdateLoading?: boolean;
}

const NurseCard: React.FC<NurseCardProps> = ({
  nurse,
  onAssignRole,
  roleUpdateLoading,
}) => {
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(nurse.role);
  const router = useRouter();

  const handleRoleChange = async () => {
    if (selectedRole !== nurse.role) {
      await onAssignRole(nurse, selectedRole);
      setIsRoleDialogOpen(false);
    }
  };

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

  return (
    <>
      <Card className="w-full max-w-sm hover:shadow-lg transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${nurse.firstName}`}
              />
              <AvatarFallback className="bg-green-100 text-green-700">
                {nurse.firstName[0]}
                {nurse.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-lg">
                {nurse.firstName} {nurse.lastName}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {nurse.specialty || "General Nursing"}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline" className={getRoleColor(nurse.role)}>
                  <Stethoscope className="w-3 h-3 mr-1" />
                  {getRoleIcon(nurse.role)} {nurse.role}
                </Badge>
                {nurse.isActive ? (
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
              <span className="truncate">{nurse.email}</span>
            </div>
            {nurse.phone && (
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-gray-500" />
                {nurse.phone}
              </div>
            )}
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 text-gray-500" />
              {nurse.assignedPatients?.length || 0} Patients
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-gray-500" />
              Last login: {nurse.lastLoginFormatted}
            </div>
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2 text-gray-500" />
              {nurse.hasMFA ? "MFA Enabled" : "MFA Disabled"}
            </div>
          </div>

          <div className="flex space-x-2 mt-4">
            <Button
              onClick={() => setIsRoleDialogOpen(true)}
              variant="outline"
              className="flex-1"
              disabled={roleUpdateLoading}
            >
              {roleUpdateLoading ? "Updating..." : "Change Role"}
            </Button>
            <Button
              onClick={() => {
                router.push(`/super-admin/dashboard/staff-details/${nurse.id}`);
              }}
              className="flex-1"
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Role Change Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Change Role for Nurse {nurse.firstName} {nurse.lastName}
            </DialogTitle>
            <DialogDescription>
              Current role:{" "}
              <Badge className={getRoleColor(nurse.role)}>{nurse.role}</Badge>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">New Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Doctor">👨‍⚕️ Doctor</SelectItem>
                  <SelectItem value="Nurse">👩‍⚕️ Nurse</SelectItem>
                  <SelectItem value="Admin">⚙️ Admin</SelectItem>
                  <SelectItem value="Patient">👤 Patient</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-gray-600">
              <p>
                <strong>Warning:</strong> Changing a user&apos;s role will
                affect their permissions and access to the system.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRoleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={selectedRole === nurse.role || roleUpdateLoading}
            >
              {roleUpdateLoading ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NurseCard;
