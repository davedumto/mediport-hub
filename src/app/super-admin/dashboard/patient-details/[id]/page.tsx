"use client";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Calendar, ArrowLeft, User, UserCheck } from "lucide-react";
import { CustomTabs } from "@/components/common/CustomTab";
import { useParams, useRouter } from "next/navigation";
import { mockPatients } from "../../../mock-data";


interface Appointment {
    id: string;
    startTime: string;
    endTime: string;
    type: string;
    status: string;
    providerId?: string;
    providerName?: string;
    reason?: string;
}
interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    bloodType?: string;
    status?: string;
    assignedProviderId?: string;
    appointments?: Appointment[];
    allergies?: string[];
    chronicConditions?: string[];
    currentMedications?: string[];
    createdAt?: string;
}
interface FormValues {
    appointmentId?: string;
    doctorId?: string;
}

const PatientDetailsPage: React.FC = () => {
    const router = useRouter()
    const params = useParams() as { id?: string } | undefined;
    const { id } = params || {};

    const [patient, setPatient] = useState<Patient | null>(null);

    const { register, handleSubmit, setValue, watch } = useForm<FormValues>();

    useEffect(() => {
        register("appointmentId");
        register("doctorId");
    }, [register]);

    const selectedAppointment = watch("appointmentId");
    const selectedDoctor = watch("doctorId");

    const age =
        patient && patient.dateOfBirth
            ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
            : null;

    useEffect(() => {
        if (id) {
            const foundPatient = mockPatients.find((d: any) => d.id === id) as Patient | undefined;
            setPatient(foundPatient ?? null);
        }
    }, [id]);

    if (!id) {
        return <div className="p-6">No patient id provided.</div>;
    }

    if (!patient) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center py-12 text-gray-600">
                        <p>Loading patient data or patient not found.</p>
                    </div>
                </div>
            </div>
        );
    }

    const onSubmit = (data: FormValues) => {
        console.log("Assigning doctor", {
            patientId: patient.id,
            appointmentId: data.appointmentId,
            doctorId: data.doctorId,
        });
        // integrate API call here
    };

    const personalDetailsContent = (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        Personal Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label className="text-sm font-medium text-gray-500">Full Name</Label>
                            <p className="text-base font-medium">{patient.firstName} {patient.lastName}</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-gray-500">Email Address</Label>
                            <p className="text-base">{patient.email ?? "—"}</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-gray-500">Phone Number</Label>
                            <p className="text-base">{patient.phone ?? "—"}</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-gray-500">Date of Birth</Label>
                            <p className="text-base">{patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : "—"}</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-gray-500">Gender</Label>
                            <p className="text-base">{patient.gender ?? "—"}</p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-gray-500">Blood Type</Label>
                            <Badge variant="secondary">{patient.bloodType ?? "—"}</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Medical Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <Label className="text-sm font-medium text-gray-500">Allergies</Label>
                            <div className="mt-2 space-y-1">
                                {patient.allergies && patient.allergies.length > 0 ? (
                                    patient.allergies.map((allergy, index) => (
                                        <Badge key={index} variant="destructive" className="mr-1">{allergy}</Badge>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">None</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-gray-500">Chronic Conditions</Label>
                            <div className="mt-2 space-y-1">
                                {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                                    patient.chronicConditions.map((condition, index) => (
                                        <Badge key={index} variant="secondary" className="mr-1">{condition}</Badge>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">None</p>
                                )}
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-gray-500">Current Medications</Label>
                            <div className="mt-2 space-y-1">
                                {patient.currentMedications && patient.currentMedications.length > 0 ? (
                                    patient.currentMedications.map((medication, index) => (
                                        <Badge key={index} variant="outline" className="mr-1">{medication}</Badge>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">None</p>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Account Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label className="text-sm font-medium text-gray-500">Status</Label>
                            <Badge variant={patient.status === "ACTIVE" ? "default" : "secondary"}>{patient.status}</Badge>
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-gray-500">Registered</Label>
                            <p className="text-base">{patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : "—"}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const appointmentsContent = (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Appointments ({patient.appointments?.length ?? 0})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {patient.appointments && patient.appointments.length > 0 ? (
                            patient.appointments.map((appointment) => (
                                <Card key={appointment.id} className="border-l-4 border-l-blue-500">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <Badge variant="outline">{appointment.type}</Badge>
                                                    <Badge variant={appointment.status === "SCHEDULED" ? "default" : appointment.status === "COMPLETED" ? "secondary" : appointment.status === "CANCELLED" ? "destructive" : "outline"}>
                                                        {appointment.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-lg font-medium">{appointment.reason}</p>
                                                <div className="text-sm text-gray-600 space-y-1">
                                                    <p><strong>Date:</strong> {new Date(appointment.startTime).toLocaleDateString()}</p>
                                                    <p><strong>Time:</strong> {new Date(appointment.startTime).toLocaleTimeString()} - {new Date(appointment.endTime).toLocaleTimeString()}</p>
                                                    <p><strong>Provider:</strong> {appointment.providerName}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No appointments scheduled</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );



    const tabs = [
        { id: "details", content: personalDetailsContent },
        { id: "appointments", content: appointmentsContent },
    ];

    const tabTitles = ["Personal Details", "Appointments",];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Button variant="ghost" className="mb-4" onClick={() => {
                        router.back()
                    }}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Patients
                    </Button>

                    <div className="flex items-center space-x-4 mb-6">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(patient.firstName ?? "")}`} />
                            <AvatarFallback className="bg-purple-100 text-purple-700">{(patient.firstName?.[0] ?? "") + (patient.lastName?.[0] ?? "")}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{patient.firstName} {patient.lastName}</h1>
                            <p className="text-lg text-gray-600">Age: {age ?? "—"} • {patient.gender ?? "—"}</p>
                            <Badge variant="outline" className="mt-2"><User className="w-3 h-3 mr-1" />Patient</Badge>
                        </div>
                    </div>
                </div>

                <CustomTabs tabTitles={tabTitles} tabs={tabs} />
            </div>
        </div>
    );
};

export default PatientDetailsPage;
