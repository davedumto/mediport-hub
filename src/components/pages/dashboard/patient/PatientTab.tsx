import { CustomTabs } from "@/components/common/CustomTab";
import OverViewTab from "./OverViewTab";
import AppointmentTab from "./AppointmentTab";
import MedicalRecordsTabs from "./MedicalRecordsTab";

const PatientTab = () => {
  return (
    <>
      <div className="w-full px-6 py-10 bg-white rounded-lg shadow shadow-gray-50 mt-10">
        <CustomTabs
          tabTitles={["Overview", "Appointments", "Medical Records"]}
          tabs={[
            {
              id: "overview",
              content: <OverViewTab />,
            },
            {
              id: "appointments",
              content: <AppointmentTab />,
            },
            {
              id: "records",
              content: <MedicalRecordsTabs />,
            },
          ]}
          defaultActive="overview"
        />
      </div>
    </>
  );
};

export default PatientTab;
