import React from "react";

type StatItem = {
    id: string;
    value: string | number;
    label: string;
    /** CSS color values (hex, rgb, or color names) */
    colorFrom: string;
    colorTo: string;
    icon?: React.ReactNode;
};

type Props = {
    stats?: StatItem[];
};

const CardIconCalendar = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M7 10H9V12H7zM11 10H13V12H11zM15 10H17V12H15z" fill="white" opacity="0.9" />
        <path d="M7 3V5M17 3V5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="3" y="5" width="18" height="16" rx="2" stroke="white" strokeWidth="1.2" fill="none" />
    </svg>
);

const CardIconCheck = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const CardIconHourglass = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M6 2H18M6 22H18" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 6H16M8 18H16" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 6C8 9 11 11 12 12C13 11 16 9 16 6" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 18C8 15 11 13 12 12C13 13 16 15 16 18" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const CardIconX = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const DashboardStatsSection = () => {

    const stats = [
        {
            id: "today",
            value: 86,
            label: "Today's Appointments",
            colorFrom: "#4db6ff",
            colorTo: "#2b9cff",
            icon: <CardIconCalendar />,
        },
        {
            id: "confirmed",
            value: 64,
            label: "Confirmed",
            colorFrom: "#6ee7b7",
            colorTo: "#16a34a",
            icon: <CardIconCheck />,
        },
        {
            id: "pending",
            value: 12,
            label: "Pending",
            colorFrom: "#ffb36b",
            colorTo: "#f97316",
            icon: <CardIconHourglass />,
        },
        {
            id: "cancelled",
            value: 10,
            label: "Cancelled",
            colorFrom: "#ff7bd1",
            colorTo: "#8b5cf6",
            icon: <CardIconX />,
        },
    ]
    return (
        <section className="w-full ">
            <div className="w-full px-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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



export default DashboardStatsSection
