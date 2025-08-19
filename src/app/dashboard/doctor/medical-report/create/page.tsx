"use client"
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form } from '@/components/common/forms/Form';
import { PatientVisitDetails } from '@/components/pages/dashboard/doctor/medical-report/PatientVisitDetails';
import { ReportDetails } from '@/components/pages/dashboard/doctor/medical-report/ReportDetails';
import FileUpload from '@/components/pages/dashboard/doctor/medical-report/FileUpload';
import FormActions from '@/components/pages/dashboard/doctor/medical-report/FormActions';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient'),
  visitDate: z.string().min(1, 'Visit date is required'),
  reportTitle: z.string().min(1, 'Report title is required'),
  primaryDiagnosis: z.string().min(1, 'Primary diagnosis is required'),
  reportDetails: z.string().min(10, 'Report details must be at least 10 characters'),
  attachedFiles: z.any().optional(),
});

interface AssignedPatient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
}

interface ApiPatient extends Patient {
  firstName: string;
  lastName: string;
}
const CreateMedicalReportPage = () => {
  const { user, tokens } = useAuth();
  const router = useRouter();
  const [assignedPatients, setAssignedPatients] = useState<ApiPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
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

  useEffect(() => {
    fetchAssignedPatients();
  }, []);

  const fetchAssignedPatients = async () => {
    if (!tokens?.accessToken) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/doctors/assigned-patients', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const patients: ApiPatient[] = data.data.patients.map((patient: AssignedPatient) => ({
          id: patient.id,
          name: `${patient.firstName} ${patient.lastName}`,
          firstName: patient.firstName,
          lastName: patient.lastName,
        }));
        setAssignedPatients(patients);
      } else {
        toast.error('Failed to fetch assigned patients');
      }
    } catch (error) {
      console.error('Error fetching assigned patients:', error);
      toast.error('Error loading assigned patients');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: MedicalReportFormData) => {
    if (!tokens?.accessToken) {
      toast.error('Authentication required');
      return;
    }

    try {
      // Create medical record payload
      const payload = {
        patientId: data.patientId,
        type: 'CONSULTATION', // Default type, can be made configurable
        title: data.reportTitle,
        description: data.reportDetails,
        diagnosis: data.primaryDiagnosis,
        recordDate: new Date(data.visitDate).toISOString(),
        status: 'PUBLISHED', // Published status for submitted reports
        isPrivate: false,
      };

      const response = await fetch('/api/medical-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Medical report submitted successfully!', {
          description: 'The report has been saved and is now visible to the patient.',
        });
        
        // Reset form after successful submission
        form.reset();
      } else {
        toast.error('Failed to submit medical report', {
          description: result.message || 'Please try again',
        });
      }
    } catch (error) {
      console.error('Error submitting medical report:', error);
      toast.error('An unexpected error occurred', {
        description: 'Please check your connection and try again',
      });
    }
  };
  
  const handleSaveDraft = async () => {
    if (!tokens?.accessToken) {
      toast.error('Authentication required');
      return;
    }

    const currentData = form.getValues();
    
    // Only save draft if we have at least a patient and title
    if (!currentData.patientId || !currentData.reportTitle) {
      toast.error('Please select a patient and enter a report title before saving draft');
      return;
    }

    try {
      const payload = {
        patientId: currentData.patientId,
        type: 'CONSULTATION',
        title: currentData.reportTitle,
        description: currentData.reportDetails || '',
        diagnosis: currentData.primaryDiagnosis || '',
        recordDate: currentData.visitDate ? new Date(currentData.visitDate).toISOString() : new Date().toISOString(),
        status: 'DRAFT', // Draft status
        isPrivate: false,
      };

      const response = await fetch('/api/medical-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Draft saved successfully!', {
          description: 'You can continue editing this report later.',
        });
      } else {
        toast.error('Failed to save draft', {
          description: result.message || 'Please try again',
        });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('An unexpected error occurred while saving draft');
    }
  };
  return (
    <>
      <div className="min-h-screen">
        <div className="bg-white rounded-lg shadow-md mb-7 px-6 py-4">
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
              <h1 className="text-2xl text-black font-bold" >Create Medical Report</h1>
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
              <Form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className=" ">
                  <PatientVisitDetails form={form} patients={assignedPatients} isLoading={isLoading} />
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
              </Form>
            </div>
          </div>
        </div>
      </div>


    </>
  );
}

export default CreateMedicalReportPage;