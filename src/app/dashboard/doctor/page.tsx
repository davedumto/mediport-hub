"use client"
import CalendarSection from "@/components/pages/dashboard/CalendarSection";
import DashboardStatsSection from "@/components/pages/dashboard/DashboardStats";
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
            <div className="w-full min-h-screenrelative pb-32" >
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
        </>
    );
}

export default DoctorDashboard;