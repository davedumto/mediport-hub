"use client"
import React, { FC, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface ScheduleAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSchedule?: (appointmentData: any) => void;
}

const ScheduleAppointmentModal: FC<ScheduleAppointmentModalProps> = ({
    isOpen,
    onClose,
    onSchedule
}) => {
    const [formData, setFormData] = useState({
        patient: '',
        doctor: '',
        date: '',
        time: '',
        purpose: 'Routine Checkup',
        notes: '',
        status: 'Pending'
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSchedule = () => {
        if (onSchedule) {
            onSchedule(formData);
        }
        onClose();
    };

    const handleCancel = () => {
        setFormData({
            patient: '',
            doctor: '',
            date: '',
            time: '',
            purpose: 'Routine Checkup',
            notes: '',
            status: 'Pending'
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader className="pb-4">
                    <div className="flex items-center justify-between border-b-gray-200 border-b pb-3">
                        <DialogTitle className="text-lg font-semibold text-gray-900">
                            Schedule New Appointment
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Patient
                            </label>
                            <select
                                value={formData.patient}
                                onChange={(e) => handleInputChange('patient', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            >
                                <option value="">Select Patient</option>
                                <option value="john-doe">John Doe</option>
                                <option value="jane-smith">Jane Smith</option>
                                <option value="lisa-taylor">Lisa Taylor</option>
                                <option value="mike-johnson">Mike Johnson</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Doctor
                            </label>
                            <select
                                value={formData.doctor}
                                onChange={(e) => handleInputChange('doctor', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            >
                                <option value="">Select Doctor</option>
                                <option value="dr-jennifer-lee">Dr. Jennifer Lee</option>
                                <option value="dr-michael-smith">Dr. Michael Smith</option>
                                <option value="dr-sarah-wilson">Dr. Sarah Wilson</option>
                                <option value="dr-david-brown">Dr. David Brown</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => handleInputChange('date', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="mm / dd / yyyy"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Time
                            </label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={(e) => handleInputChange('time', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Purpose
                        </label>
                        <select
                            value={formData.purpose}
                            onChange={(e) => handleInputChange('purpose', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                            <option value="Routine Checkup">Routine Checkup</option>
                            <option value="Follow-up Visit">Follow-up Visit</option>
                            <option value="Consultation">Consultation</option>
                            <option value="Emergency">Emergency</option>
                            <option value="Specialist Referral">Specialist Referral</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            placeholder="Additional notes about the appointment"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => handleInputChange('status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                        >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-3 pt-6 justify-end">
                    <button
                        onClick={handleCancel}
                        className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSchedule}
                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Schedule Appointment
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ScheduleAppointmentModal;