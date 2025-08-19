"use client";
import { useMemo, useState, useEffect } from "react";
import NurseCard from "./NurseCard";
import Input from "@/components/common/Input";
import { Search, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { PIIDecryptionClient } from "@/services/piiDecryptionClient";

interface Nurse {
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

const NursesTab = () => {
  const { user, tokens } = useAuth();
  const { showToast } = useToast();
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleUpdateLoading, setRoleUpdateLoading] = useState<string | null>(
    null
  );

  // Fetch nurses data
  useEffect(() => {
    const fetchNurses = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "/api/superadmin/users?role=NURSE&limit=100",
          {
            headers: {
              Authorization: `Bearer ${tokens?.accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch nurses");
        }

        const data = await response.json();
        const maskedNurses = data.data.users;

        // Decrypt PII data for each nurse
        const decryptedNurses = await Promise.all(
          maskedNurses.map(async (nurse: any) => {
            try {
              const decryptedData = await PIIDecryptionClient.decryptUserProfile(
                nurse.id,
                tokens.accessToken
              );

              // Merge masked data with decrypted data
              const mergedNurse = PIIDecryptionClient.mergeWithDecrypted(
                nurse,
                decryptedData
              );

              return {
                ...mergedNurse,
                fullName: `${mergedNurse.firstName || "Unknown"} ${
                  mergedNurse.lastName || "User"
                }`,
                isVerified: mergedNurse.verificationStatus === "VERIFIED",
                hasMFA: false, // TODO: Add MFA status if available
                lastLoginFormatted: mergedNurse.lastLogin
                  ? new Date(mergedNurse.lastLogin).toLocaleDateString()
                  : "Never",
              };
            } catch (error) {
              console.warn(`Failed to decrypt nurse ${nurse.id}:`, error);
              // Return nurse with masked data as fallback
              return {
                ...nurse,
                fullName: `${nurse.firstName || "[Encrypted]"} ${
                  nurse.lastName || "[Encrypted]"
                }`,
                isVerified: nurse.verificationStatus === "VERIFIED",
                hasMFA: false,
                lastLoginFormatted: nurse.lastLogin
                  ? new Date(nurse.lastLogin).toLocaleDateString()
                  : "Never",
              };
            }
          })
        );

        setNurses(decryptedNurses);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load nurses");
        console.error("Error fetching nurses:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user && tokens?.accessToken) {
      fetchNurses();
    }
  }, [user, tokens]);

  const handleAssignRole = async (nurse: Nurse, newRole: string) => {
    try {
      setRoleUpdateLoading(nurse.id);

      const response = await fetch(`/api/superadmin/users/${nurse.id}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify({
          newRole,
          reason: `Role changed from ${nurse.role} to ${newRole} by super admin`,
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
      setNurses((prev) =>
        prev.map((n) => (n.id === nurse.id ? { ...n, role: newRole } : n))
      );

      // Show success toast
      showToast(
        "success",
        "Role Updated Successfully",
        `${nurse.fullName}&apos;s role has been changed to ${newRole}`,
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

  const filteredNurses = useMemo(() => {
    if (!searchTerm.trim()) return nurses;
    return nurses.filter(
      (nurse) =>
        `${nurse.firstName} ${nurse.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        nurse.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nurse.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [nurses, searchTerm]);

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-20">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading nurses...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-6 py-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading nurses: {error}</p>
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
            placeholder="Search nurses..."
            icon={<Search color="grey" size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          {filteredNurses.length > 0 ? (
            filteredNurses.map((nurse) => (
              <NurseCard
                key={nurse.id}
                nurse={nurse}
                onAssignRole={handleAssignRole}
                roleUpdateLoading={roleUpdateLoading === nurse.id}
              />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">
              {searchTerm
                ? "No nurses found matching your search"
                : "No nurses found"}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default NursesTab;
