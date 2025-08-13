"use client"
import CalendarSection from "@/components/pages/dashboard/CalendarSection";
import DashboardStatsSection from "@/components/pages/dashboard/DashboardStats";
import Header from "@/components/pages/dashboard/Header";
import { mockAppointments } from "@/components/pages/dashboard/mock/appointment";
import { buildMonthGrid, endOfMonth, startOfMonth } from "@/utils/calendar";
import { useMemo, useState } from "react";

const DoctorDashboard = () => {
    const [currentMonth, setCurrentMonth] = useState(() => new Date());
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startISO = monthStart.toISOString().slice(0, 10);
    const endISO = monthEnd.toISOString().slice(0, 10);
    const weeks = useMemo(() => buildMonthGrid(currentMonth), [currentMonth]);
    return (
        <>
            <div className="w-full min-h-screen bg-gray-100 relative pb-32" >
                <Header />

                <div className="w-full top-26 relative px-4" >
                    <DashboardStatsSection />
                    <section className="mt-6">
                        <CalendarSection

                            appointments={mockAppointments}
                            isLoading={false}
                            month={currentMonth}
                            onPrev={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                            onNext={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                            onToday={() => setCurrentMonth(new Date())}
                            weeks={weeks}
                        />
                    </section>
                </div>
            </div>
        </>
    );
}

export default DoctorDashboard;