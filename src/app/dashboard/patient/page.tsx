import ProfileCard from "@/components/common/profile/ProfileCard";
import PatientTab from "@/components/pages/dashboard/patient/PatientTab";

const PatientDashboard = () => {
    return (
        <>
            <div className="w-full min-h-screen relative pb-32" >
                <ProfileCard />

                <PatientTab />
            </div>
        </>
    );
}

export default PatientDashboard;