"use client"
import React, { FC, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { User, Calendar, FileText, AlertCircle, SquarePen } from "lucide-react";
import { Trash } from "iconsax-reactjs";

interface AppointmentModalProps {
    data: Appointment;
    onClose: () => void;
}

const AppointmentModal: FC<AppointmentModalProps> = ({ data, onClose }) => {
    const [isOpen, setIsOpen] = useState(true);
    const appt = data;

    const handleOpenChange = (open: boolean | ((prevState: boolean) => boolean)) => {
        setIsOpen(open);
        if (!open) {
            onClose();
        }
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return {
            day: date.toLocaleDateString('en-US', { weekday: 'long' }),
            date: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        };
    };

    const dateTime = formatDateTime(appt.startDateISO);

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader className="pb-4">
                    <div className="flex items-center justify-between border-b-gray-200 border-b pb-3">
                        <DialogTitle className="text-base font-semibold">Appointment Details</DialogTitle>
                    </div>
                </DialogHeader>
                <div className="flex items-start gap-3 pb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-blue-600">{appt.purpose || "Follow-up Visit"}</h3>
                        <p className="text-sm text-gray-600">
                            {dateTime.day}, {dateTime.date} {dateTime.time}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-100">
                    <div className="bg-gray-100 p-3 rounded-sm" >
                        <div className="flex items-center gap-2 mb-2 ">
                            <User className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-medium text-gray-500 uppercase">PATIENT</span>
                        </div>
                        <p className="font-medium">{appt.patientName}</p>
                        <p className="text-sm text-gray-500">(P-1008)</p>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-sm" >
                        <div className="flex items-center gap-2 mb-2 ">
                            <User className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-medium text-gray-500 uppercase">DOCTOR</span>
                        </div>
                        <p className="font-medium">Dr. Jennifer Lee</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-100">
                    <div className="bg-gray-100 p-3 rounded-sm" >
                        <div className="flex items-center gap-2 mb-2 ">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-medium text-gray-500 uppercase">PURPOSE</span>
                        </div>
                        <p className="font-medium">{appt.purpose || "Follow-up Visit"}</p>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-sm" >
                        <div className="flex items-center gap-2 mb-2 ">
                            <AlertCircle className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-medium text-gray-500 uppercase">STATUS</span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${appt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            appt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                appt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                            }`}>
                            {appt.status?.toUpperCase() || 'CANCELLED'}
                        </span>
                    </div>
                </div>

                {appt.notes && (
                    <div className="py-4 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-medium text-gray-500 uppercase">NOTES</span>
                        </div>
                        <p className="text-sm text-gray-700">{appt.notes}</p>
                    </div>
                )}

                <div className="flex justify-end  gap-2 pt-4 border-t border-gray-100">
                    <button className="flex-0.5 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-500 ">
                        <SquarePen size={16} /> Edit Appointment
                    </button>
                    <button className="flex-0.5 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-500 ">
                        <SquarePen size={16} /> View Patient Record
                    </button>
                    <button
                        onClick={() => handleOpenChange(false)}
                        className="px-4 py-2 text-sm font-medium  bg-slate-100 text-red-500 rounded-md  border-1 flex items-center justify-center gap-2"
                    >
                        <Trash variant="Bold" size={13} color="red" /> Delete
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default AppointmentModal