import { User, UserOctagon } from "iconsax-reactjs";
import React from "react";

type StatItem = {
    id: string;
    value: string | number;
    label: string;
    colorFrom: string;
    colorTo: string;
    icon?: React.ReactNode;
};


const SuperAdminDashboardStatsSection = () => {

    const stats = [
        {
            id: "doctors",
            value: 86,
            label: "Doctors",
            colorFrom: "#4db6ff",
            colorTo: "#2b9cff",
            icon: <UserOctagon  color="white" size={24} />,
        },
        {
            id: "nurses",
            value: 64,
            label: "Nurses",
            colorFrom: "#6ee7b7",
            colorTo: "#16a34a",
            icon: <UserOctagon  color="white" size={24} />,
        },
        {
            id: "patients",
            value: 12,
            label: "Patients",
            colorFrom: "#ffb36b",
            colorTo: "#f97316",
            icon: <User  color="white" size={24} />,
        },
    ]
    return (
        <section className="w-full ">
            <div className="w-full px-4">
                <div className="grid grid-cols-1  sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((s) => (
                        <div
                            key={s.id}
                            className="relative overflow-hidden rounded-sm shadow-md py-5 px-6 flex items-center transition transform duration-200 ease-out hover:scale-[1.01]"
                            style={{ background: `linear-gradient(90deg, ${s.colorFrom}, ${s.colorTo})` }}
                            aria-labelledby={`stat-${s.id}-title`}
                            role="group"
                        >
                            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-white/18 backdrop-blur flex items-center justify-center mr-4">
                                {s.icon}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div id={`stat-${s.id}-title`} className="text-white text-2xl font-semibold leading-tight">
                                    {s.value}
                                </div>
                                <div className="text-white/90 text-sm truncate mt-1">{s.label}</div>
                            </div>

                            <div
                                aria-hidden
                                className="pointer-events-none absolute right-4 top-4 opacity-30"
                                style={{ width: 90, height: 90, borderRadius: 9999, filter: "blur(18px)", background: "rgba(255,255,255,0.06)" }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}



export default SuperAdminDashboardStatsSection
