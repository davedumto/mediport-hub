"use client"

import ReportsFilter from "@/components/pages/dashboard/doctor/medical-report/ReportFilter";
import ReportModal from "@/components/pages/dashboard/doctor/medical-report/ReportModal";
import ReportsTable from "@/components/pages/dashboard/doctor/medical-report/ReportsTable";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";


const MedicalReportsPage = () => {
  const { user, tokens } = useAuth();
  const router = useRouter();
  const [viewReport, setViewReport] = useState<boolean>(false)
  const [reportData, setReportData] = useState<MedicalRecord | null>(null)
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    patientSearch: '',
    doctorFilter: 'All Doctors',
    dateFrom: '',
    dateTo: ''
  });

  // Fetch real medical records from API
  useEffect(() => {
    fetchMedicalRecords();
  }, [tokens]);

  const fetchMedicalRecords = async () => {
    if (!tokens?.accessToken) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/medical-records?type=doctor', {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMedicalRecords(data.data || []);
      } else {
        console.error('Failed to fetch medical records');
        toast.error('Failed to load medical records');
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
      toast.error('Error loading medical records');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReports = useMemo(() => {
    return medicalRecords.filter(record => {
      const patientName = `${record.patient?.firstName} ${record.patient?.lastName}`.toLowerCase();
      
      const matchesPatientSearch =
        !filters.patientSearch ||
        patientName.includes(filters.patientSearch.toLowerCase()) ||
        record.title.toLowerCase().includes(filters.patientSearch.toLowerCase());

      const matchesDateFrom =
        !filters.dateFrom || new Date(record.recordDate) >= new Date(filters.dateFrom);

      const matchesDateTo =
        !filters.dateTo || new Date(record.recordDate) <= new Date(filters.dateTo);

      return matchesPatientSearch && matchesDateFrom && matchesDateTo;
    });
  }, [medicalRecords, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      patientSearch: '',
      doctorFilter: 'All Doctors',
      dateFrom: '',
      dateTo: ''
    });
  };
  return (
    <>
      <div className="w-full min-h-screen" >
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
              <h1 className="text-2xl text-black font-bold" >Medical Reports</h1>
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


        <ReportsFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />


        <ReportsTable reports={filteredReports} onViewReport={(report) => {
          setViewReport(true)
          setReportData(report)
        }} />

      </div>

      <ReportModal report={reportData} onClose={() => {
        setViewReport(false)
        setReportData(null)
      }} isOpen={viewReport} />
    </>
  );
}

export default MedicalReportsPage;