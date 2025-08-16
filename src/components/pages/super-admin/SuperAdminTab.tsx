"use client";
import { CustomTabs } from "@/components/common/CustomTab";
import DoctorTabs from "./DoctorsTab";
import NursesTab from "./NursesTab";
import PatientsTab from "./PatientsTab";
import DoctorAssignmentManager from "./DoctorAssignmentManager";

const SuperAdminTab = () => {
  return (
    <div className="space-y-10">
      {/* Doctor Assignment Manager */}
      <div className="w-full px-6 py-10 bg-white rounded-lg shadow shadow-gray-50">
        <DoctorAssignmentManager />
      </div>

      {/* Existing Tabs */}
      <div className="w-full px-6 py-10 bg-white rounded-lg shadow shadow-gray-50 mb-[3em]">
        <CustomTabs
          tabTitles={["Doctors", "Nurses", "Patients"]}
          tabs={[
            {
              id: "doctors",
              content: <DoctorTabs />,
            },
            {
              id: "nurses",
              content: <NursesTab />,
            },
            {
              id: "patient",
              content: <PatientsTab />,
            },
          ]}
          defaultActive="doctors"
        />
      </div>
    </div>
  );
};

export default SuperAdminTab;
