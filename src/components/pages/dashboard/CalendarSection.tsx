"use client"
import Button from "@/components/common/Button";
import AppointmentModal from "@/components/common/modals/AppointmentDetailsModal";
import ScheduleAppointmentModal from "@/components/common/modals/ScheduleAppointmentModal";
import { ChevronLeft, ChevronRight, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";

type Props = {
    month: Date;
    weeks: Date[][];
    appointments: Appointment[];
    isLoading?: boolean;
    onPrev: () => void;
    onNext: () => void;
    onToday: () => void;
};

const CalendarSection = ({ month, weeks, appointments, isLoading, onPrev, onNext, onToday }: Props) => {
    const [showModal, setShowModal] = useState<boolean>(false);
    const [openScheduleModal, setScheduleModal] = useState<boolean>(false);
    const [modalData, setModalData] = useState<Appointment | null>(null)
    const navigate = useRouter();
    const today = new Date();
    const appointmentsByDay = useMemo(() => {
        const map = new Map<string, Appointment[]>();
        appointments.forEach(a => {
            const dateKey = a.startDateISO.slice(0, 10);
            const arr = map.get(dateKey) ?? [];
            arr.push(a);
            map.set(dateKey, arr);
        });
        return map;
    }, [appointments]);

    return (
        <>
            <div className="bg-white rounded-lg shadow p-4">

                <div className="w-full flex items-center justify-between border-b-gray-100 border-b-2 pb-2 mb-3" >
                    <h3 className="font-semibold text-sm text-blue-500">
                        Appointment Calendar
                    </h3>

                    <Button btnTitle="New Appointment" icon={<PlusIcon size={16} color="white" />} className="w-46 h-10 rounded-sm" textClassName="text-xs" onClick={() => {
                        setScheduleModal(true)
                    }} />
                </div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">
                        {month.toLocaleString("default", { month: "long", year: "numeric" })}

                    </h3>
                    <div className="flex gap-2 items-stretch">
                        <button onClick={onPrev} aria-label="Previous month" className=" border rounded-sm text-xs w-auto px-3 py-1">
                            <ChevronLeft size={13} />
                        </button>
                        <button onClick={onToday} className=" border rounded-sm text-xs w-auto px-3 py-1">
                            Today
                        </button>
                        <button onClick={onNext} className=" border rounded-sm text-xs w-auto px-3 py-1">
                            <ChevronRight size={13} />
                        </button>

                    </div>
                </div>

                <div className="grid grid-cols-7 gap-2 text-sm">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d} className="font-semibold text-center bg-blue-500 text-white p-2 rounded-sm">{d}</div>)}
                    {weeks.flat().map((date) => {
                        const key = date.toISOString().slice(0, 10);
                        const dayAppointments = appointmentsByDay.get(key) || [];
                        const isOtherMonth = date.getMonth() !== month.getMonth();
                        const isToday = key === today.toISOString().slice(0, 10);
                        const maxVisible = 2;
                        return (
                            <div key={key} className={`min-h-[96px] border rounded p-2 relative ${isOtherMonth ? "bg-gray-50" : ""} ${isToday ? "border-2 p-1  border-blue-500" : ""}`}>
                                <div className={`text-xs `}>{date.getDate()}</div>

                                <div className="mt-2 space-y-1">
                                    {dayAppointments.slice(0, maxVisible).map(a => (
                                        <button key={a.id} onClick={() => {
                                            setModalData(a)
                                            setShowModal(true)
                                        }} className="block w-full text-left truncate text-xs py-1 px-2 rounded bg-blue-50 border">
                                            {a.patientName} - {new Date(a.startDateISO).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </button>
                                    ))}

                                    {dayAppointments.length > maxVisible && (
                                        <button onClick={() => navigate.push('/dashboard/doctor/appointments/list')} className="text-xs cursor-pointer text-blue-600">+ {dayAppointments.length - maxVisible} more</button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {showModal && modalData && <AppointmentModal data={modalData} onClose={() => {
                setShowModal(false)
            }} />}

            <ScheduleAppointmentModal isOpen={openScheduleModal} onClose={() => {
                setScheduleModal(false)
            }} />
        </>
    );
}


export default CalendarSection