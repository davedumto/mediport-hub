import AllergiesAndConditions from "./Allergies&Conditions";
import HealthSummary from "./HealthSummary";
import RecentMedicalRecords from "./RecentMedicalRecords";
import UpcomingAppointments from "./UpcomingAppointments";

const OverViewTab = () => {
    return (
        <>
            <div className="w-full flex items-start justify-center gap-10" >
                <HealthSummary />
                <AllergiesAndConditions />
            </div>
            <div className="w-full flex items-start justify-center gap-10 mt-8" >
                <UpcomingAppointments />
                <RecentMedicalRecords />
            </div>
        </>
    );
}

export default OverViewTab;