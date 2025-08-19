"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { Save, FileText, AlertCircle, Upload, X, File } from "lucide-react";

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
  description: string;
  findings: string;
  recommendations: string;
  diagnosis: string;
  treatmentPlan: string;
  isPrivate: boolean;
  status: string;
  recordDate: string;
}

interface MedicalRecordFormProps {
  patient: Patient;
  record?: MedicalRecord;
  onSave: (record: MedicalRecord) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const RECORD_TYPES = [
  { value: "CONSULTATION", label: "Consultation" },
  { value: "LAB_RESULT", label: "Lab Result" },
  { value: "PRESCRIPTION", label: "Prescription" },
  { value: "DIAGNOSIS", label: "Diagnosis" },
  { value: "IMAGING", label: "Imaging" },
  { value: "PROCEDURE", label: "Procedure" },
];

const RECORD_STATUS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "PUBLISHED", label: "Published" },
];

const MedicalRecordForm: React.FC<MedicalRecordFormProps> = ({
  patient,
  record,
  onSave,
  onCancel,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<MedicalRecord>({
    type: record?.type || "CONSULTATION",
    title: record?.title || "",
    description: record?.description || "",
    findings: record?.findings || "",
    recommendations: record?.recommendations || "",
    diagnosis: record?.diagnosis || "",
    treatmentPlan: record?.treatmentPlan || "",
    isPrivate: record?.isPrivate || false,
    status: record?.status || "DRAFT",
    recordDate: record?.recordDate || new Date().toISOString().split('T')[0],
    ...record,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [consentRequested, setConsentRequested] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { tokens } = useAuth();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !tokens?.accessToken) return;

    setIsUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("patientId", patient.id);
        formData.append("recordId", record?.id || `temp_${Date.now()}`);

        const response = await fetch("/api/medical-records/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          return {
            id: data.data.id,
            filename: data.data.filename,
            size: data.data.size,
            url: data.data.url,
            format: data.data.format,
            uploadedAt: data.data.uploadedAt,
          };
        } else {
          const error = await response.json();
          throw new Error(error.message || "Upload failed");
        }
      } catch (error) {
        console.error("File upload error:", error);
        toast.error(`Failed to upload ${file.name}`, {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        return null;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(Boolean);
      
      setUploadedFiles(prev => [...prev, ...successfulUploads]);
      
      if (successfulUploads.length > 0) {
        toast.success(`${successfulUploads.length} file(s) uploaded successfully`);
      }
    } catch (error) {
      console.error("Batch upload error:", error);
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const removeUploadedFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    toast.success("File removed from upload list");
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsLoading(true);

    try {
      // If this is a new record or status is being changed to PUBLISHED, request consent
      if ((!isEditing || formData.status === "PUBLISHED") && !consentRequested) {
        const consentConfirm = window.confirm(
          `Are you sure you want to ${isEditing ? 'update' : 'create'} this medical record${
            formData.status === "PUBLISHED" ? ' and publish it for the patient to view' : ''
          }?\n\nThis action will be logged in the audit trail.`
        );
        
        if (!consentConfirm) {
          setIsLoading(false);
          return;
        }
        
        setConsentRequested(true);
      }

      const url = isEditing && record?.id 
        ? `/api/medical-records/${record.id}`
        : "/api/medical-records";

      const method = isEditing ? "PUT" : "POST";
      
      const payload = {
        ...formData,
        patientId: patient.id,
        recordDate: new Date(formData.recordDate).toISOString(),
        attachments: uploadedFiles.map(file => ({
          id: file.id,
          filename: file.filename,
          size: file.size,
          url: file.url,
          format: file.format,
          uploadedAt: file.uploadedAt,
        })),
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(
          isEditing ? "Medical record updated successfully" : "Medical record created successfully",
          {
            description: `Record for ${patient.firstName} ${patient.lastName} has been ${isEditing ? 'updated' : 'saved'}.`,
            duration: 4000,
          }
        );
        onSave({ ...formData, id: data.data?.id || record?.id });
      } else {
        toast.error("Failed to save medical record", {
          description: data.message || "Please try again",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error saving medical record:", error);
      toast.error("An unexpected error occurred", {
        description: "Please check your connection and try again",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {isEditing ? "Edit Medical Record" : "Create Medical Record"}
        </h2>
        <p className="text-gray-600 mt-1">
          Patient: {patient.firstName} {patient.lastName} ({patient.email})
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Record Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {RECORD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Record Date *
            </label>
            <input
              type="date"
              name="recordDate"
              value={formData.recordDate}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <Input
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Brief title for the medical record"
            required
            containerClassName="w-full"
          />
        </div>

        {/* Medical Details */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            placeholder="Detailed description of the visit or condition"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clinical Findings
            </label>
            <textarea
              name="findings"
              value={formData.findings}
              onChange={handleInputChange}
              rows={4}
              placeholder="Examination findings and observations"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diagnosis
            </label>
            <textarea
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleInputChange}
              rows={4}
              placeholder="Primary and secondary diagnoses"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Treatment Plan
            </label>
            <textarea
              name="treatmentPlan"
              value={formData.treatmentPlan}
              onChange={handleInputChange}
              rows={4}
              placeholder="Prescribed treatments and medications"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recommendations
            </label>
            <textarea
              name="recommendations"
              value={formData.recommendations}
              onChange={handleInputChange}
              rows={4}
              placeholder="Follow-up care and patient instructions"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
            />
          </div>
        </div>

        {/* File Upload Section */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Attachments
          </h3>
          
          <div className="space-y-4">
            {/* File Upload Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Medical Documents
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> medical documents
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX, JPG, PNG (MAX. 10MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.gif"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>
              
              {isUploading && (
                <div className="mt-2 flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Uploading files...</span>
                </div>
              )}
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Uploaded Files ({uploadedFiles.length})
                </h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={file.id || index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <File className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {file.filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)} • {file.format?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeUploadedFile(file.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                        title="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Record Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {RECORD_STATUS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
            {(formData.status === "PUBLISHED" || formData.status === "APPROVED") && (
              <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                This record will be visible to the patient
              </p>
            )}
          </div>

          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 block text-sm text-gray-700">
                Private Record
              </span>
            </label>
            <div className="ml-2 group relative">
              <AlertCircle className="h-4 w-4 text-gray-400 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Private records have restricted access and require special permissions to view
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            onClick={onCancel}
            btnTitle="Cancel"
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          />
          <Button
            type="submit"
            loading={isLoading}
            disabled={isLoading}
            btnTitle={
              isLoading
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                ? "Update Record"
                : "Create Record"
            }
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            icon={<Save className="h-4 w-4" />}
          />
        </div>
      </form>
    </div>
  );
};

export default MedicalRecordForm;