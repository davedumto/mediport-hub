"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, UserMinus, Users, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PIIDecryptionClient } from "@/services/piiDecryptionClient";

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  specialty?: string;
  medicalLicenseNumber?: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  assignedProviderId?: string;
  assignedProvider?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface Assignment {
  id: string;
  doctorId: string;
  patientId: string;
  doctor: Doctor;
  patient: Patient;
  assignedAt: string;
  isActive: boolean;
}

const DoctorAssignmentManager = () => {
  const { user, isAuthenticated } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "assigned" | "unassigned"
  >("all");

  useEffect(() => {
    console.log("DoctorAssignmentManager mounted, auth state:", {
      isAuthenticated,
      user: user?.email,
    });
    if (isAuthenticated && user) {
      console.log("User authenticated, fetching data...");
      fetchData();
    } else {
      console.log("User not authenticated, skipping data fetch");
    }
  }, [isAuthenticated, user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Get auth token
      const authTokens = localStorage.getItem("auth_tokens");
      if (!authTokens) {
        console.error("No auth tokens found");
        return;
      }

      const { accessToken } = JSON.parse(authTokens);
      const headers = {
        Authorization: `Bearer ${accessToken}`,
      };

      // Fetch doctors
      const doctorsResponse = await fetch("/api/super-admin/doctors", {
        headers,
      });
      if (doctorsResponse.ok) {
        const doctorsData = await doctorsResponse.json();
        console.log("Doctors data:", doctorsData);
        const maskedDoctors = doctorsData.data?.doctors || [];
        
        // Decrypt PII data for each doctor
        const decryptedDoctors = await Promise.all(
          maskedDoctors.map(async (doctor: any) => {
            try {
              const decryptedData = await PIIDecryptionClient.decryptUserProfile(
                doctor.id,
                accessToken
              );
              
              // Merge masked data with decrypted data
              return PIIDecryptionClient.mergeWithDecrypted(doctor, decryptedData);
            } catch (error) {
              console.warn(`Failed to decrypt doctor ${doctor.id}:`, error);
              return doctor; // Return masked data as fallback
            }
          })
        );
        
        setDoctors(decryptedDoctors);
      } else {
        console.error(
          "Failed to fetch doctors:",
          doctorsResponse.status,
          doctorsResponse.statusText
        );
        const errorData = await doctorsResponse.json().catch(() => ({}));
        console.error("Doctors error details:", errorData);
      }

      // Fetch patients
      const patientsResponse = await fetch("/api/super-admin/patients", {
        headers,
      });
      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        console.log("Patients data:", patientsData);
        const maskedPatients = patientsData.data?.patients || [];
        
        // Decrypt PII data for each patient
        const decryptedPatients = await Promise.all(
          maskedPatients.map(async (patient: any) => {
            try {
              const decryptedData = await PIIDecryptionClient.decryptUserProfile(
                patient.userId, // Use userId for patients
                accessToken
              );
              
              // Merge masked data with decrypted data
              return PIIDecryptionClient.mergeWithDecrypted(patient, decryptedData);
            } catch (error) {
              console.warn(`Failed to decrypt patient ${patient.id}:`, error);
              return patient; // Return masked data as fallback
            }
          })
        );
        
        setPatients(decryptedPatients);
      } else {
        console.error(
          "Failed to fetch patients:",
          patientsResponse.status,
          patientsResponse.statusText
        );
        const errorData = await patientsResponse.json().catch(() => ({}));
        console.error("Patients error details:", errorData);
      }

      // Fetch current assignments
      const assignmentsResponse = await fetch(
        "/api/superadmin/doctor-assignments",
        {
          headers,
        }
      );
      if (assignmentsResponse.ok) {
        const assignmentsData = await assignmentsResponse.json();
        console.log("Assignments data:", assignmentsData);
        setAssignments(assignmentsData.data?.assignments || []);
      } else {
        console.error(
          "Failed to fetch assignments:",
          assignmentsResponse.status,
          assignmentsResponse.statusText
        );
        const errorData = await assignmentsResponse.json().catch(() => ({}));
        console.error("Assignments error details:", errorData);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignDoctor = async () => {
    if (!selectedDoctor || !selectedPatient) return;

    try {
      const response = await fetch("/api/superadmin/doctor-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            localStorage.getItem("auth_tokens")
              ? JSON.parse(localStorage.getItem("auth_tokens")!).accessToken
              : ""
          }`,
        },
        body: JSON.stringify({
          doctorId: selectedDoctor,
          patientId: selectedPatient,
        }),
      });

      if (response.ok) {
        await fetchData();
        setSelectedDoctor("");
        setSelectedPatient("");
      } else {
        const errorData = await response.json();
        alert(`Failed to assign doctor: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Failed to assign doctor:", error);
      alert("Failed to assign doctor");
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    console.log("Attempting to remove assignment:", assignmentId);

    try {
      const response = await fetch(
        `/api/superadmin/doctor-assignments/${assignmentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${
              localStorage.getItem("auth_tokens")
                ? JSON.parse(localStorage.getItem("auth_tokens")!).accessToken
                : ""
            }`,
          },
        }
      );

      console.log("Remove assignment response status:", response.status);
      console.log(
        "Remove assignment response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (response.ok) {
        console.log("Assignment removed successfully, refreshing data...");
        await fetchData();
      } else {
        console.error(
          "Remove assignment failed with status:",
          response.status,
          response.statusText
        );

        // Try to get the response text first to see what's actually returned
        const responseText = await response.text();
        console.error("Remove assignment response text:", responseText);

        let errorData = {};
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          console.error("Could not parse response as JSON:", e);
        }

        console.error("Remove assignment error response:", errorData);
        alert(
          `Failed to remove assignment: ${
            (errorData as any).message || response.statusText || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Failed to remove assignment:", error);
      alert("Failed to remove assignment");
    }
  };

  const clearAllAssignments = async () => {
    if (
      !confirm(
        "Are you sure you want to clear all doctor-patient assignments? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);

      // Remove all active assignments
      for (const assignment of assignments.filter((a) => a.isActive)) {
        const response = await fetch(
          `/api/superadmin/doctor-assignments/${assignment.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${
                localStorage.getItem("auth_tokens")
                  ? JSON.parse(localStorage.getItem("auth_tokens")!).accessToken
                  : ""
              }`,
            },
          }
        );

        if (!response.ok) {
          console.error(`Failed to remove assignment ${assignment.id}`);
        }
      }

      // Refresh data
      await fetchData();
      alert("All assignments have been cleared successfully.");
    } catch (error) {
      console.error("Failed to clear assignments:", error);
      alert(
        "Failed to clear some assignments. Please check the console for details."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      (assignment.doctor.firstName || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (assignment.doctor.lastName || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (assignment.patient.firstName || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (assignment.patient.lastName || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    if (filterStatus === "assigned")
      return matchesSearch && assignment.isActive;
    if (filterStatus === "unassigned")
      return matchesSearch && !assignment.isActive;
    return matchesSearch;
  });

  const unassignedPatients = patients.filter(
    (patient) =>
      !assignments.some(
        (assignment) =>
          assignment.patientId === patient.id && assignment.isActive
      )
  );

  // Debug logging
  console.log("Current state:", {
    user: user?.email,
    isAuthenticated,
    doctors: doctors.length,
    patients: patients.length,
    assignments: assignments.length,
    isLoading,
    selectedDoctor,
    selectedPatient,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading assignments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Doctor-Patient Assignments
          </h2>
          <p className="text-gray-600">Manage doctor-patient relationships</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          <span className="text-sm text-gray-500">
            {assignments.filter((a) => a.isActive).length} Active Assignments
          </span>
          {assignments.filter((a) => a.isActive).length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearAllAssignments()}
              className="text-red-600 hover:text-red-700"
            >
              Clear All Assignments
            </Button>
          )}
        </div>
      </div>

      {/* Assignment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Assign Doctor to Patient
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Doctor
              </label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {isLoading
                        ? "Loading doctors..."
                        : "No doctors available"}
                    </div>
                  ) : (
                    doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.role === "DOCTOR"
                          ? "Dr."
                          : doctor.role === "NURSE"
                          ? "Nurse"
                          : ""}{" "}
                        {doctor.firstName} {doctor.lastName}
                        {doctor.specialty && ` - ${doctor.specialty}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {doctors.length === 0 && !isLoading && (
                <p className="text-sm text-gray-500 mt-1">
                  No doctors found. Please check the console for errors.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Patient
              </label>
              <Select
                value={selectedPatient}
                onValueChange={setSelectedPatient}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a patient" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedPatients.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      {isLoading
                        ? "Loading patients..."
                        : "No patients available"}
                    </div>
                  ) : (
                    unassignedPatients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {unassignedPatients.length === 0 && !isLoading && (
                <div className="text-sm text-gray-500 mt-1 space-y-1">
                  <p>All patients are currently assigned to doctors.</p>
                  <p>To assign a patient to a different doctor:</p>
                  <ol className="list-decimal list-inside ml-2 space-y-1">
                    <li>
                      Remove the current assignment using the &quot;Remove&quot;
                      button below
                    </li>
                    <li>Then select the patient from this dropdown</li>
                  </ol>
                </div>
              )}
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleAssignDoctor}
                disabled={!selectedDoctor || !selectedPatient}
                className="w-full"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Assign
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select
          value={filterStatus}
          onValueChange={(value: any) => setFilterStatus(value)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignments</SelectItem>
            <SelectItem value="assigned">Active Only</SelectItem>
            <SelectItem value="unassigned">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No assignments found
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map((assignment) => {
                console.log("Rendering assignment:", assignment);
                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">
                          {assignment.doctor.role === "DOCTOR"
                            ? "Dr."
                            : assignment.doctor.role === "NURSE"
                            ? "Nurse"
                            : ""}{" "}
                          {assignment.doctor.firstName}{" "}
                          {assignment.doctor.lastName}
                        </span>
                        {assignment.doctor.specialty && (
                          <Badge variant="secondary">
                            {assignment.doctor.specialty}
                          </Badge>
                        )}
                      </div>

                      <span className="text-gray-400">→</span>

                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-green-500" />
                        <span className="font-medium">
                          {assignment.patient.firstName}{" "}
                          {assignment.patient.lastName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-500">
                        Assigned:{" "}
                        {new Date(assignment.assignedAt).toLocaleDateString()}
                      </div>

                      <Badge
                        variant={assignment.isActive ? "default" : "secondary"}
                      >
                        {assignment.isActive ? "Active" : "Inactive"}
                      </Badge>

                      {assignment.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveAssignment(assignment.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <UserMinus className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorAssignmentManager;
