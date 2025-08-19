"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  FileText, 
  Edit2, 
  Eye, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Calendar,
  User
} from "lucide-react";
import Button from "@/components/common/Button";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
}

interface MedicalRecord {
  id: string;
  type: string;
  title: string;
  recordDate: string;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface MedicalRecordsListProps {
  patient: Patient;
  onCreateNew: () => void;
  onEditRecord: (record: MedicalRecord) => void;
  onViewRecord: (record: MedicalRecord) => void;
  refreshTrigger?: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "bg-gray-100 text-gray-800 border-gray-300";
    case "PENDING_REVIEW":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "APPROVED":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "PUBLISHED":
      return "bg-green-100 text-green-800 border-green-300";
    case "ARCHIVED":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "DRAFT":
      return <Edit2 className="h-4 w-4" />;
    case "PENDING_REVIEW":
      return <Clock className="h-4 w-4" />;
    case "APPROVED":
    case "PUBLISHED":
      return <CheckCircle className="h-4 w-4" />;
    case "ARCHIVED":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
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

const MedicalRecordsList: React.FC<MedicalRecordsListProps> = ({
  patient,
  onCreateNew,
  onEditRecord,
  onViewRecord,
  refreshTrigger,
}) => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "status" | "type">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const { tokens } = useAuth();

  useEffect(() => {
    if (patient) {
      fetchPatientRecords();
    }
  }, [patient, refreshTrigger]);

  const fetchPatientRecords = async () => {
    if (!tokens?.accessToken) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/medical-records?type=patient&patientId=${patient.id}`,
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
        console.error("Failed to fetch patient records");
        toast.error("Failed to load medical records");
      }
    } catch (error) {
      console.error("Error fetching patient records:", error);
      toast.error("Error loading medical records");
    } finally {
      setIsLoading(false);
    }
  };

  const sortedRecords = [...records].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case "date":
        comparison = new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime();
        break;
      case "status":
        comparison = a.status.localeCompare(b.status);
        break;
      case "type":
        comparison = a.type.localeCompare(b.type);
        break;
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
  });

  const handleSort = (newSortBy: "date" | "status" | "type") => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medical Records
          </h2>
          <p className="text-gray-600 mt-1 flex items-center gap-1">
            <User className="h-4 w-4" />
            {patient.firstName} {patient.lastName}
          </p>
        </div>
        <Button
          onClick={onCreateNew}
          btnTitle="Create New Record"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          icon={<Plus className="h-4 w-4" />}
        />
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-gray-200">
        <span className="text-sm text-gray-600">Sort by:</span>
        <button
          onClick={() => handleSort("date")}
          className={`text-sm px-3 py-1 rounded-md transition-colors ${
            sortBy === "date"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
        </button>
        <button
          onClick={() => handleSort("type")}
          className={`text-sm px-3 py-1 rounded-md transition-colors ${
            sortBy === "type"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Type {sortBy === "type" && (sortOrder === "asc" ? "↑" : "↓")}
        </button>
        <button
          onClick={() => handleSort("status")}
          className={`text-sm px-3 py-1 rounded-md transition-colors ${
            sortBy === "status"
              ? "bg-blue-100 text-blue-700"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Status {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}
        </button>
      </div>

      {/* Records List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading medical records...</p>
        </div>
      ) : sortedRecords.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Medical Records
          </h3>
          <p className="text-gray-500 mb-6">
            No medical records found for this patient.
          </p>
          <Button
            onClick={onCreateNew}
            btnTitle="Create First Record"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          />
        </div>
      ) : (
        <div className="space-y-3">
          {sortedRecords.map((record) => (
            <div
              key={record.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
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
                      <span className="ml-1">
                        {record.status.replace("_", " ")}
                      </span>
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
                    {record.version > 1 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        v{record.version}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    Created: {new Date(record.createdAt).toLocaleDateString()} | 
                    Last updated: {new Date(record.updatedAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => onViewRecord(record)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="View Record"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onEditRecord(record)}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Edit Record"
                  >
                    <Edit2 className="h-4 w-4" />
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

export default MedicalRecordsList;