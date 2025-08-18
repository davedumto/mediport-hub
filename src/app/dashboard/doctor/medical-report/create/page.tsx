"use client"
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form } from '@/components/common/forms/Form';
import { PatientVisitDetails } from '@/components/pages/dashboard/doctor/medical-report/PatientVisitDetails';
import { ReportDetails } from '@/components/pages/dashboard/doctor/medical-report/ReportDetails';
import FileUpload from '@/components/pages/dashboard/doctor/medical-report/FileUpload';
import FormActions from '@/components/pages/dashboard/doctor/medical-report/FormActions';
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient'),
  visitDate: z.string().min(1, 'Visit date is required'),
  reportTitle: z.string().min(1, 'Report title is required'),
  primaryDiagnosis: z.string().min(1, 'Primary diagnosis is required'),
  reportDetails: z.string().min(10, 'Report details must be at least 10 characters'),
  attachedFiles: z.any().optional(),
});

const mockPatients: Patient[] = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
  { id: '3', name: 'Robert Johnson' },
  { id: '4', name: 'Emily Davis' },
];
const CreateMedicalReportPage = () => {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const form = useForm<MedicalReportFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: '',
      visitDate: '',
      reportTitle: '',
      primaryDiagnosis: '',
      reportDetails: '',
      attachedFiles: null,
    },
  });

  const onSubmit = (data: MedicalReportFormData) => {
    console.log('Form submitted:', data);
    // Handle form submission here
  };
  const handleSaveDraft = () => {
    const currentData = form.getValues();
    console.log('Saving draft:', currentData);
    // Handle save as draft here
  };
  return (
    <>
      <div className="min-h-screen">
        <div className="bg-white rounded-lg shadow-md mb-7 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Dr. {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-gray-600 mt-1">
                {user?.specialty
                  ? `Specialty: ${user.specialty}`
                  : "Medical Professional"}
              </p>
              {user?.medicalLicenseNumber && (
                <p className="text-sm text-gray-500 mt-1">
                  License: {user.medicalLicenseNumber}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Status:{" "}
                {user?.verificationStatus === "VERIFIED"
                  ? "✅ Verified"
                  : "⏳ Pending Verification"}
              </p>
            </div>
            <div className="text-right flex flex-col items-end gap-3">
              <div>
                <p className="text-sm text-gray-500">Last Login</p>
                <p className="text-gray-900 font-medium">
                  {user?.lastLogin
                    ? new Date(user.lastLogin).toLocaleDateString()
                    : "First time"}
                </p>
              </div>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 30 013 3v1"
                  />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>


        <div className="flex-1 w-full ">

          <div className="w-full pb-8">
            <div className="w-full mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-9">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className=" ">
                    <PatientVisitDetails form={form} patients={mockPatients} />
                  </div>

                  <div className="  ">
                    <ReportDetails form={form} />
                  </div>

                  <div className="  ">
                    <FileUpload form={form} />
                  </div>

                  <div className="  ">
                    <FormActions
                      onSaveDraft={handleSaveDraft}
                      isSubmitting={form.formState.isSubmitting}
                    />
                  </div>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/95 backdrop-blur-md rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Logout
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to log out? You&apos;ll need to log in again
              to access your dashboard.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 hover:shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 hover:shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CreateMedicalReportPage;