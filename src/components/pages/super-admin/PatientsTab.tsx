"use client";
import { useMemo, useState, useEffect } from "react";
import PatientCard from "./PatientsCard";
import Input from "@/components/common/Input";
import { Search, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { PIIDecryptionClient } from "@/services/piiDecryptionClient";

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  fullName: string;
  isVerified: boolean;
  hasMFA: boolean;
  lastLoginFormatted: string;
  // Patient-specific fields
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  status?: string;
  assignedProviderId?: string;
};

const PatientsTab = () => {
  const { user, tokens } = useAuth();
  const { showToast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch patients data
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        console.log("Debug - PatientsTab: Starting to fetch patients");

        const response = await fetch(
          "/api/super-admin/patients",
          {
            headers: {
              Authorization: `Bearer ${tokens?.accessToken}`,
            },
          }
        );

        console.log("Debug - PatientsTab: Response status:", response.status);
        console.log("Debug - PatientsTab: Response ok:", response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Debug - PatientsTab: Error response:", errorText);
          throw new Error("Failed to fetch patients");
        }

        const data = await response.json();
        console.log("Debug - PatientsTab: Response data:", data);
        console.log(
          "Debug - PatientsTab: Patients found:",
          data.data?.patients?.length || 0
        );
        
        const maskedPatients = data.data.patients;
        
        // Decrypt PII data for each patient
        const decryptedPatients = await Promise.all(
          maskedPatients.map(async (patient: any) => {
            try {
              const decryptedData = await PIIDecryptionClient.decryptUserProfile(
                patient.userId, // Use userId for patients
                tokens.accessToken
              );
              
              // Merge masked data with decrypted data
              const mergedPatient = PIIDecryptionClient.mergeWithDecrypted(
                patient,
                decryptedData
              );
              
              return {
                ...mergedPatient,
                fullName: `${mergedPatient.firstName || 'Unknown'} ${mergedPatient.lastName || 'User'}`,
                isVerified: mergedPatient.verificationStatus === 'VERIFIED',
                hasMFA: false, // TODO: Add MFA status if available
                lastLoginFormatted: mergedPatient.lastLogin 
                  ? new Date(mergedPatient.lastLogin).toLocaleDateString() 
                  : 'Never',
              };
            } catch (error) {
              console.warn(`Failed to decrypt patient ${patient.id}:`, error);
              // Return patient with masked data as fallback
              return {
                ...patient,
                fullName: `${patient.firstName || '[Encrypted]'} ${patient.lastName || '[Encrypted]'}`,
                isVerified: patient.verificationStatus === 'VERIFIED',
                hasMFA: false,
                lastLoginFormatted: patient.lastLogin 
                  ? new Date(patient.lastLogin).toLocaleDateString() 
                  : 'Never',
              };
            }
          })
        );

        setPatients(decryptedPatients);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load patients"
        );
        console.error("Error fetching patients:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user && tokens?.accessToken) {
      fetchPatients();
    } else {
      console.log("Debug - PatientsTab: Missing user or tokens, not fetching");
    }
  }, [user, tokens]);

  const filteredPatients = useMemo(() => {
    if (!searchTerm.trim()) return patients;
    return patients.filter(
      (patient) =>
        `${patient.firstName} ${patient.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.gender?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.bloodType?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [patients, searchTerm]);

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-20">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading patients...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-6 py-10">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading patients: {error}</p>
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
            placeholder="Search patients..."
            icon={<Search color="grey" size={16} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">
              {searchTerm
                ? "No patients found matching your search"
                : "No patients found"}
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default PatientsTab;
