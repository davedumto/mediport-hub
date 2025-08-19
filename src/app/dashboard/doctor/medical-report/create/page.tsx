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
  const { user } = useAuth();
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
        <div className="bg-white rounded-lg shadow-md mb-7 px-6 py-4">
          <div className="flex items-center justify-between">

            <div>
              <h1 className="text-2xl text-black font-bold text-left" >Create Medical Report</h1>
            </div>
            <div className="flex items-center justify-between gap-2.5" >
              <h2 className="text-2xl font-bold text-gray-900">
                Dr. {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-gray-600 mt-1">
                {user?.specialty
                  ? `Specialty: ${user.specialty}`
                  : "Medical Professional"}
              </p>
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


    </>
  );
}

export default CreateMedicalReportPage;