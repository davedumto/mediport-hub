"use client"

import ReportsFilter from "@/components/pages/dashboard/doctor/medical-report/ReportFilter";
import ReportModal from "@/components/pages/dashboard/doctor/medical-report/ReportModal";
import { filterReports, mockReports } from "@/components/pages/dashboard/doctor/medical-report/reports";
import ReportsTable from "@/components/pages/dashboard/doctor/medical-report/ReportsTable";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo, useState } from "react";


const MedicalReportsPage = () => {
  const { user } = useAuth();
  const [viewReport, setViewReport] = useState<boolean>(false)
  const [reportData, setReportData] = useState<MedicalReport | null>(null)
  const [filters, setFilters] = useState({
    patientSearch: '',
    doctorFilter: 'All Doctors',
    dateFrom: '',
    dateTo: ''
  });



  const filteredReports = useMemo(() => {
    return filterReports(mockReports, filters);
  }, [mockReports, filters]);

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

            <div>
              <h1 className="text-2xl text-black font-bold text-left" >Medical Reports</h1>
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