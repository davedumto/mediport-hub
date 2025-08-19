"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  FileText,
  Calendar,
  User,
  Eye,
  Lock,
  CheckCircle,
  Clock,
  AlertCircle,
  Stethoscope,
  ArrowLeft,
} from "lucide-react";

interface MedicalRecord {
  id: string;
  type: string;
  title: string;
  recordDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  findings?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  recommendations?: string;
  provider: {
    id: string;
    firstName: string;
    lastName: string;
    specialty: string;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "PUBLISHED":
      return "bg-green-100 text-green-800 border-green-300";
    case "APPROVED":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "PENDING_REVIEW":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "PUBLISHED":
      return <CheckCircle className="h-4 w-4" />;
    case "APPROVED":
      return <CheckCircle className="h-4 w-4" />;
    case "PENDING_REVIEW":
      return <Clock className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getTypeLabel = (type: string) => {
  const types: { [key: string]: string } = {
    CONSULTATION: "Consultation",
    LAB_RESULT: "Lab Result",
    PRESCRIPTION: "Prescription",
    DIAGNOSIS: "Diagnosis",
    IMAGING: "Imaging",
    PROCEDURE: "Procedure",
  };
  return types[type] || type;
};

const MedicalRecordsTabs = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(
    null
  );
  const { tokens, user } = useAuth();

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

  const fetchMedicalRecords = async () => {
    if (!tokens?.accessToken || !user?.id) return;

    setIsLoading(true);
    try {
      // Get patient record first to get patientId
      const patientResponse = await fetch("/api/patients/profile", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (patientResponse.ok) {
        const patientData = await patientResponse.json();
        const patientId = patientData.data?.id;

        if (patientId) {
          // Only fetch medical records, no category filter needed
          const response = await fetch(
            `/api/medical-records?type=patient&patientId=${patientId}`,
            {
              headers: {
                Authorization: `Bearer ${tokens.accessToken}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            setRecords(data.data || []);
          } else if (response.status === 404) {
            setRecords([]);
          } else {
            console.error("Failed to fetch medical records");
            toast.error("Failed to load medical records");
          }
        }
      }
    } catch (error) {
      console.error("Error fetching medical records:", error);
      toast.error("Error loading medical records");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewRecord = async (record: MedicalRecord) => {
    if (!tokens?.accessToken) return;

    try {
      const response = await fetch(`/api/medical-records/${record.id}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Selected record data:", data.data); // Debug log
        setSelectedRecord(data.data);
      } else {
        toast.error("Failed to load record details");
      }
    } catch (error) {
      console.error("Error fetching record details:", error);
      toast.error("Error loading record details");
    }
  };

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your medical records...</p>
        </div>
      </div>
    );
  }

  if (selectedRecord) {
    return (
      <div className="w-full">
        <div className="mb-4">
          <button
            onClick={() => setSelectedRecord(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors p-2 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Medical Records
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{selectedRecord.title}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedRecord.recordDate).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Dr. {selectedRecord.provider.firstName}{" "}
                    {selectedRecord.provider.lastName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Stethoscope className="h-4 w-4" />
                    {selectedRecord.provider.specialty}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Record Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">
                      {getTypeLabel(selectedRecord.type)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                        selectedRecord.status
                      )}`}
                    >
                      {getStatusIcon(selectedRecord.status)}
                      <span className="ml-1">{selectedRecord.status}</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {new Date(selectedRecord.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Content */}
            <div className="space-y-6">
              {selectedRecord.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Description
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {selectedRecord.description}
                    </p>
                  </div>
                </div>
              )}

              {selectedRecord.findings && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Clinical Findings
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {selectedRecord.findings}
                    </p>
                  </div>
                </div>
              )}

              {selectedRecord.diagnosis && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Diagnosis
                  </h3>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {selectedRecord.diagnosis}
                    </p>
                  </div>
                </div>
              )}

              {selectedRecord.treatmentPlan && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Treatment Plan
                  </h3>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {selectedRecord.treatmentPlan}
                    </p>
                  </div>
                </div>
              )}

              {selectedRecord.recommendations && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Recommendations
                  </h3>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {selectedRecord.recommendations}
                    </p>
                  </div>
                </div>
              )}

              {/* Show message only if no detailed content is available */}
              {(() => {
                const hasContent =
                  selectedRecord.description ||
                  selectedRecord.findings ||
                  selectedRecord.diagnosis ||
                  selectedRecord.treatmentPlan ||
                  selectedRecord.recommendations;
                console.log("Content check:", {
                  description: selectedRecord.description,
                  findings: selectedRecord.findings,
                  diagnosis: selectedRecord.diagnosis,
                  treatmentPlan: selectedRecord.treatmentPlan,
                  recommendations: selectedRecord.recommendations,
                  hasContent,
                });
                return !hasContent;
              })() && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-blue-900">
                      Basic Medical Record
                    </h4>
                  </div>
                  <p className="text-sm text-blue-700">
                    This is a basic medical record entry. Detailed information
                    may be added during future consultations with your
                    healthcare provider.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderEmptyState = () => (
    <div className="w-full flex items-center justify-center py-12">
      <div className="text-center">
        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Medical Records
        </h3>
        <p className="text-gray-500 mb-4">
          You don't have any published medical records yet.
        </p>
        <p className="text-sm text-gray-400">
          Medical records will appear here once your doctor creates
          comprehensive documentation of your care.
        </p>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Medical Records
          </h2>
        </div>
        <span className="text-sm text-gray-500">
          {records.length} record{records.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900 mb-1">Medical Records</h3>
            <p className="text-sm text-blue-700">
              Comprehensive ongoing documentation of your healthcare including
              consultations, lab results, prescriptions, and treatment plans.
            </p>
          </div>
        </div>
      </div>

      {/* Records List or Empty State */}
      {records.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="grid gap-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewRecord(record)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-gray-900">
                      {record.title}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                        record.status
                      )}`}
                    >
                      {getStatusIcon(record.status)}
                      <span className="ml-1">{record.status}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {getTypeLabel(record.type)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(record.recordDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      Dr. {record.provider.firstName} {record.provider.lastName}
                    </span>
                  </div>

                  <div className="text-xs text-gray-500">
                    Created: {new Date(record.createdAt).toLocaleDateString()} |
                    Last updated:{" "}
                    {new Date(record.updatedAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="ml-4">
                  <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicalRecordsTabs;
