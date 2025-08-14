"use client"
const SuperAdminDashboardStats = ({
    children,
}: {
    children: React.ReactNode;
}) => {


    return (
        <>
            <div className="w-full min-h-screen  bg-gray-100 " >
                <div className="w-full top-10 relative px-8" >
                    {children}
                </div>

            </div>
        </>
    );
}

export default SuperAdminDashboardStats;