"use client";
import { useMemo, useState, useEffect } from "react";
import DoctorCard from "./DoctorCard";
import Input from "@/components/common/Input";
import { Search, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { PIIDecryptionClient } from "@/services/piiDecryptionClient";

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  specialty?: string;
  medicalLicenseNumber?: string;
  isActive: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  assignedPatients?: any[];
  fullName: string;
  isVerified: boolean;
  hasMFA: boolean;
  lastLoginFormatted: string;
}

const DoctorTabs = () => {
  const { user, tokens } = useAuth();
  const { showToast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleUpdateLoading, setRoleUpdateLoading] = useState<string | null>(
    null
  );

  // Fetch doctors data
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);

        console.log("Debug - DoctorsTab: Starting to fetch doctors");
        console.log("Debug - DoctorsTab: User:", user);
        console.log("Debug - DoctorsTab: Tokens:", tokens);
        console.log("Debug - DoctorsTab: Access Token:", tokens?.accessToken);

        if (!tokens?.accessToken) {
          console.error("Debug - DoctorsTab: No access token available");
          setError("No access token available");
          return;
        }

        const response = await fetch("/api/super-admin/doctors", {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch doctors");
        }

        const data = await response.json();
        const maskedDoctors = data.data.doctors;

        // Decrypt PII data for each doctor
        const decryptedDoctors = await Promise.all(
          maskedDoctors.map(async (doctor: any) => {
            try {
              const decryptedData =
                await PIIDecryptionClient.decryptUserProfile(
                  doctor.id,
                  tokens.accessToken
                );

              // Merge masked data with decrypted data
              const mergedDoctor = PIIDecryptionClient.mergeWithDecrypted(
                doctor,
                decryptedData
              );

              return {
                ...mergedDoctor,
                fullName: `${mergedDoctor.firstName || "Unknown"} ${
                  mergedDoctor.lastName || "User"
                }`,
                isVerified: mergedDoctor.verificationStatus === "VERIFIED",
                hasMFA: false, // TODO: Add MFA status if available
                lastLoginFormatted: mergedDoctor.lastLogin
                  ? new Date(mergedDoctor.lastLogin).toLocaleDateString()
                  : "Never",
              };
            } catch (error) {
              console.warn(`Failed to decrypt doctor ${doctor.id}:`, error);
              // Return doctor with masked data as fallback
              return {
                ...doctor,
                fullName: `${doctor.firstName || "[Encrypted]"} ${
                  doctor.lastName || "[Encrypted]"
                }`,
                isVerified: doctor.verificationStatus === "VERIFIED",
                hasMFA: false,
                lastLoginFormatted: doctor.lastLogin
                  ? new Date(doctor.lastLogin).toLocaleDateString()
                  : "Never",
              };
            }
          })
        );

        setDoctors(decryptedDoctors);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load doctors");
        console.error("Error fetching doctors:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user && tokens?.accessToken) {
      fetchDoctors();
    } else {
      console.log("Debug - DoctorsTab: Missing user or tokens, not fetching");
    }
  }, [user, tokens]);

  const handleAssignDoctor = ({
    patientId,
    appointmentId,
    doctorId,
  }: {
    patientId: string;
    appointmentId: string;
    doctorId: string;
  }) => {
    console.log(
      `Assigning doctor ${doctorId} to appointment ${appointmentId} for patient ${patientId}`
    );
  };

  const handleAssignRole = async (doctor: Doctor, newRole: string) => {
    try {
      setRoleUpdateLoading(doctor.id);

      const response = await fetch(`/api/superadmin/users/${doctor.id}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          newRole,
          reason: `Role changed from ${doctor.role} to ${newRole} by super admin`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Debug - Role update failed:", {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        throw new Error(
          `Failed to update role: ${response.status} ${response.statusText}`
        );
      }

      // Update local state
      setDoctors((prev) =>
        prev.map((d) => (d.id === doctor.id ? { ...d, role: newRole } : d))
      );

      // Show success toast
      showToast(
        "success",
        "Role Updated Successfully",
        `${doctor.fullName}&apos;s role has been changed to ${newRole}`,
        4000
      );
    } catch (err) {
      console.error("Error updating role:", err);
      // Show error toast
      showToast(
        "error",
        "Role Update Failed",
        err instanceof Error ? err.message : "Failed to update user role",
        6000
      );
    } finally {
      setRoleUpdateLoading(null);
    }
  };

  const filteredDoctors = useMemo(() => {
    if (!searchTerm.trim()) return doctors;
    return doctors.filter(
      (doctor) =>
        `${doctor.firstName} ${doctor.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        doctor.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [doctors, searchTerm]);

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-20">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading doctors...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-6 py-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading doctors: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        <div className="w-64">
          <Input
            placeholder="Search doctors..."
            icon={<Search color="grey" size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          {filteredDoctors.length > 0 ? (
            filteredDoctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                onAssignRole={handleAssignRole}
                roleUpdateLoading={roleUpdateLoading === doctor.id}
              />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">
              {searchTerm
                ? "No doctors found matching your search"
                : "No doctors found"}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default DoctorTabs;
