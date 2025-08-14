import SuperAdminDashboardStatsSection from "@/components/pages/super-admin/SuperAdminDashboardStats";
import SuperAdminTab from "@/components/pages/super-admin/SuperAdminTab";

const SuperAdminDashboard = () => {
    return (
        <>
            <div className="w-full min-h-screenrelative pb-32" >
                <SuperAdminDashboardStatsSection />
                <SuperAdminTab />
            </div>
        </>
    );
}

export default SuperAdminDashboard;