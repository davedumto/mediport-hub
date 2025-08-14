"use client"
import CalendarSection from "../CalendarSection";
import { mockAppointments } from "@/components/pages/dashboard/mock/appointment";
import { buildMonthGrid, endOfMonth, startOfMonth } from "@/utils/calendar";
import { useMemo, useState } from "react";

const AppointmentTab = () => {
    const [currentMonth, setCurrentMonth] = useState(() => new Date());
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const weeks = useMemo(() => buildMonthGrid(currentMonth), [currentMonth]);
    return (
        <>
            <div className="w-full space-y-5" >
                <CalendarSection
                    showTitle={false}
                    appointments={mockAppointments}
                    isLoading={false}
                    month={currentMonth}
                    onPrev={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                    onNext={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                    onToday={() => setCurrentMonth(new Date())}
                    weeks={weeks}
                />
            </div>
        </>
    );
}

export default AppointmentTab;