"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import RouteGuard from "@/components/common/RouteGuard";
import PatientSelector from "@/components/pages/dashboard/doctor/medical-records/PatientSelector";
import MedicalRecordsList from "@/components/pages/dashboard/doctor/medical-records/MedicalRecordsList";
import MedicalRecordForm from "@/components/pages/dashboard/doctor/medical-records/MedicalRecordForm";
import MedicalRecordView from "@/components/pages/dashboard/doctor/medical-records/MedicalRecordView";
import { Stethoscope, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  assignedProviderId: string;
}

interface MedicalRecord {
  id?: string;
  type: string;
  title: string;
  description: string;
  findings: string;
  recommendations: string;
  diagnosis: string;
  treatmentPlan: string;
  isPrivate: boolean;
  status: string;
  recordDate: string;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

type ViewMode = "selection" | "records" | "create" | "edit" | "view";

const MedicalRecordsManagement = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>("selection");
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setCurrentView("records");
    setSelectedRecord(null);
  };

  const handleBackToSelection = () => {
    setCurrentView("selection");
    setSelectedPatient(null);
    setSelectedRecord(null);
  };

  const handleBackToRecords = () => {
    setCurrentView("records");
    setSelectedRecord(null);
  };

  const handleCreateNew = () => {
    setSelectedRecord(null);
    setCurrentView("create");
  };

  const handleEditRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setCurrentView("edit");
  };

  const handleViewRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setCurrentView("view");
  };

  const handleSaveRecord = (record: MedicalRecord) => {
    setRefreshTrigger(prev => prev + 1);
    setCurrentView("records");
    setSelectedRecord(null);
  };

  const handleCancelForm = () => {
    setCurrentView("records");
    setSelectedRecord(null);
  };

  const renderContent = () => {
    switch (currentView) {
      case "selection":
        return (
          <PatientSelector
            onPatientSelect={handlePatientSelect}
            selectedPatient={selectedPatient}
          />
        );

      case "records":
        if (!selectedPatient) return null;
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToSelection}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Back to Patient Selection"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Medical Records Management
                </h1>
                <p className="text-gray-600">
                  Managing records for {selectedPatient.firstName} {selectedPatient.lastName}
                </p>
              </div>
            </div>

            <MedicalRecordsList
              patient={selectedPatient}
              onCreateNew={handleCreateNew}
              onEditRecord={handleEditRecord}
              onViewRecord={handleViewRecord}
              refreshTrigger={refreshTrigger}
            />
          </div>
        );

      case "create":
        if (!selectedPatient) return null;
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToRecords}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Back to Records List"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Create New Medical Record
                </h1>
                <p className="text-gray-600">
                  Adding new record for {selectedPatient.firstName} {selectedPatient.lastName}
                </p>
              </div>
            </div>

            <MedicalRecordForm
              patient={selectedPatient}
              onSave={handleSaveRecord}
              onCancel={handleCancelForm}
              isEditing={false}
            />
          </div>
        );

      case "edit":
        if (!selectedPatient || !selectedRecord) return null;
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToRecords}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Back to Records List"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Edit Medical Record
                </h1>
                <p className="text-gray-600">
                  Editing record for {selectedPatient.firstName} {selectedPatient.lastName}
                </p>
              </div>
            </div>

            <MedicalRecordForm
              patient={selectedPatient}
              record={selectedRecord}
              onSave={handleSaveRecord}
              onCancel={handleCancelForm}
              isEditing={true}
            />
          </div>
        );

      case "view":
        if (!selectedPatient || !selectedRecord) return null;
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToRecords}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Back to Records List"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  View Medical Record
                </h1>
                <p className="text-gray-600">
                  Record for {selectedPatient.firstName} {selectedPatient.lastName}
                </p>
              </div>
            </div>

            <MedicalRecordView
              record={selectedRecord}
              patient={selectedPatient}
              onEdit={() => handleEditRecord(selectedRecord)}
              onClose={handleBackToRecords}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <RouteGuard requiredRole="DOCTOR">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header - only show on selection page */}
          {currentView === "selection" && (
            <div className="mb-8">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.back()}
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <div className="border-l border-gray-300 h-6"></div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Stethoscope className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                          Medical Records Management
                        </h1>
                        <p className="text-gray-600 mt-1">
                          Create and manage medical records for your patients
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Dr. {user?.firstName} {user?.lastName}
                    </h2>
                    <p className="text-gray-600">
                      {user?.specialty || "Medical Professional"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Content */}
          {renderContent()}
        </div>
      </div>
    </RouteGuard>
  );
};

export default MedicalRecordsManagement;