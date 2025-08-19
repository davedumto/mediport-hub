"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Search, User } from "lucide-react";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  assignedProviderId: string;
}

interface PatientSelectorProps {
  onPatientSelect: (patient: Patient) => void;
  selectedPatient: Patient | null;
}

const PatientSelector: React.FC<PatientSelectorProps> = ({
  onPatientSelect,
  selectedPatient,
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { tokens } = useAuth();

  useEffect(() => {
    fetchAssignedPatients();
  }, []);

  useEffect(() => {
    // Filter patients based on search term
    const filtered = patients.filter(
      (patient) =>
        `${patient.firstName} ${patient.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);

  const fetchAssignedPatients = async () => {
    if (!tokens?.accessToken) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/doctors/assigned-patients", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPatients(data.data?.patients || []);
        setFilteredPatients(data.data?.patients || []);
      } else {
        console.error("Failed to fetch assigned patients");
      }
    } catch (error) {
      console.error("Error fetching assigned patients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Select Patient
      </h2>
      
      {/* Search Bar */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search patients by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Patients List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading patients...</p>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>{searchTerm ? "No patients found" : "No assigned patients"}</p>
          </div>
        ) : (
          filteredPatients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => onPatientSelect(patient)}
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                selectedPatient?.id === patient.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {patient.firstName} {patient.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{patient.email}</p>
                  <p className="text-xs text-gray-400">
                    DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>
                {selectedPatient?.id === patient.id && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedPatient && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <span className="font-medium">Selected:</span>{" "}
            {selectedPatient.firstName} {selectedPatient.lastName}
          </p>
        </div>
      )}
    </div>
  );
};

export default PatientSelector;