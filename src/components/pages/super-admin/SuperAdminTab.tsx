"use client"
import { CustomTabs } from "@/components/common/CustomTab";
import DoctorTabs from "./DoctorsTab";
import NursesTab from "./NursesTab";
import PatientsTab from "./PatientsTab";

const SuperAdminTab = () => {
    return (

        <div className="w-full px-6 py-10 bg-white rounded-lg shadow shadow-gray-50 mt-10">
            <CustomTabs tabTitles={["Doctors", "Nurses", "Patients"]} tabs={[
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
                    content: <PatientsTab/>,
                },
            ]}
                defaultActive="doctors" />
        </div>
    );
}

export default SuperAdminTab;