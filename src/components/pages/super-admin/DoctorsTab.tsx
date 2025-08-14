"use client"
import { mockDoctors } from "@/app/super-admin/mock-data";
import DoctorCard from "./DoctorCard";
import Input from "@/components/common/Input";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

const DoctorTabs = () => {
    interface AssignDoctorParams {
        patientId: string;
        appointmentId: string;
        doctorId: string;
    }

    const handleAssignDoctor = ({ patientId, appointmentId, doctorId }: AssignDoctorParams) => {
        console.log(`Assigning doctor ${doctorId} to appointment ${appointmentId} for patient ${patientId}`);
    }
    const handleAssignRole = (doctor: any): void => {
        console.log(`Assigning role to doctor ${doctor.id}`);
    };
    const [searchTerm, setSearchTerm] = useState("");

    const filteredDoctors = useMemo(() => {
        if (!searchTerm.trim()) return mockDoctors;
        return mockDoctors.filter((doctor) =>
            `${doctor.firstName} ${doctor.lastName}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            doctor.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);
    return (
        <>
            <div className="w-full" >
                <div className="w-64" >
                    <Input placeholder="Search..." icon={<Search color="grey" size={16} />}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                    {filteredDoctors.length > 0 ? (
                        filteredDoctors.map((doctor) => (
                            <DoctorCard
                                key={doctor.id}
                                doctor={doctor}
                                onAssignRole={handleAssignRole}
                            />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500">No doctors found</p>
                    )}
                </div>
            </div>
        </>
    );
}

export default DoctorTabs;