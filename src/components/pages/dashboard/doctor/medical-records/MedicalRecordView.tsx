"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  FileText,
  Edit2,
  Calendar,
  User,
  Eye,
  Lock,
  CheckCircle,
  Clock,
  AlertCircle,
  Activity,
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
  id?: string;
  type: string;
  title: string;
  description?: string;
  findings?: string;
  recommendations?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  isPrivate: boolean;
  status: string;
  recordDate: string;
  version?: number;
  createdAt?: string;
  updatedAt?: string;
  provider?: {
    id: string;
    firstName: string;
    lastName: string;
    specialty: string;
  };
  auditTrail?: Array<{
    id: string;
    action: string;
    timestamp: string;
    user: {
      firstName: string;
      lastName: string;
    };
  }>;
}

interface MedicalRecordViewProps {
  record: MedicalRecord;
  patient: Patient;
  onEdit: () => void;
  onClose: () => void;
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

const MedicalRecordView: React.FC<MedicalRecordViewProps> = ({
  record: initialRecord,
  patient,
  onEdit,
  onClose,
}) => {
  const [record, setRecord] = useState<MedicalRecord>(initialRecord);
  const [isLoading, setIsLoading] = useState(false);
  const { tokens } = useAuth();

  useEffect(() => {
    if (initialRecord.id) {
      fetchFullRecord();
    }
  }, [initialRecord.id]);

  const fetchFullRecord = async () => {
    if (!tokens?.accessToken || !initialRecord.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/medical-records/${initialRecord.id}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRecord(data.data);
      } else {
        console.error("Failed to fetch full record");
        toast.error("Failed to load full record details");
      }
    } catch (error) {
      console.error("Error fetching full record:", error);
      toast.error("Error loading record details");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading record details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3  bg-opacity-20 rounded-lg">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{record.title}</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {patient.firstName} {patient.lastName}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(record.recordDate).toLocaleDateString()}
                </span>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium  bg-opacity-20`}
                >
                  {getStatusIcon(record.status)}
                  <span className="ml-1">{record.status.replace("_", " ")}</span>
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <Button
              onClick={onEdit}
              btnTitle="Edit Record"
              className=" bg-opacity-20 hover:bg-opacity-30 text-white border border-white border-opacity-30 px-4 py-2 rounded-lg transition-all"
              icon={<Edit2 className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Record Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{getTypeLabel(record.type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Record Date:</span>
                  <span className="font-medium">
                    {new Date(record.recordDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                      record.status
                    )}`}
                  >
                    {getStatusIcon(record.status)}
                    <span className="ml-1">{record.status.replace("_", " ")}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Privacy:</span>
                  <span className="flex items-center gap-1">
                    {record.isPrivate ? (
                      <>
                        <Lock className="h-3 w-3 text-red-500" />
                        <span className="text-red-600 text-xs">Private</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3 text-green-500" />
                        <span className="text-green-600 text-xs">Standard</span>
                      </>
                    )}
                  </span>
                </div>
                {record.version && record.version > 1 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-medium">v{record.version}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Provider Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Doctor:</span>
                  <span className="font-medium">
                    Dr. {record.provider?.firstName} {record.provider?.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Specialty:</span>
                  <span className="font-medium">
                    {record.provider?.specialty || "General Practice"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">
                    {record.createdAt && formatDate(record.createdAt)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium">
                    {record.updatedAt && formatDate(record.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Medical Content */}
        <div className="space-y-6">
          {record.description && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Description
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {record.description}
                </p>
              </div>
            </div>
          )}

          {record.findings && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Clinical Findings
              </h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {record.findings}
                </p>
              </div>
            </div>
          )}

          {record.diagnosis && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Diagnosis
              </h3>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {record.diagnosis}
                </p>
              </div>
            </div>
          )}

          {record.treatmentPlan && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Treatment Plan
              </h3>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {record.treatmentPlan}
                </p>
              </div>
            </div>
          )}

          {record.recommendations && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Recommendations
              </h3>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {record.recommendations}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Audit Trail */}
        {record.auditTrail && record.auditTrail.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </h3>
            <div className="space-y-3">
              {record.auditTrail.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {entry.action.replace("_", " ")}
                    </p>
                    <p className="text-xs text-gray-600">
                      by {entry.user.firstName} {entry.user.lastName}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatDate(entry.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
        <Button
          onClick={onClose}
          btnTitle="Close"
          className="px-4 py-2 text-gray-700 bg-red-500 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
        />
        <Button
          onClick={onEdit}
          btnTitle="Edit Record"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          icon={<Edit2 className="h-4 w-4" />}
        />
      </div>
    </div>
  );
};

export default MedicalRecordView;