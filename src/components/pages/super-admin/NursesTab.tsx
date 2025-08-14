"use client"
import { mockNurses } from "@/app/super-admin/mock-data";
import Input from "@/components/common/Input";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import NurseCard from "./NurseCard";

const NursesTab = () => {
    interface AssignDoctorParams {
        patientId: string;
        appointmentId: string;
        doctorId: string;
    }

    const [searchTerm, setSearchTerm] = useState("");

    const filteredDoctors = useMemo(() => {
        if (!searchTerm.trim()) return mockNurses;
        return mockNurses.filter((doctor) =>
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
                        filteredDoctors.map((nurse) => (
                            <NurseCard
                                key={nurse.id}
                                nurse={nurse}
                            />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500">No nurses found</p>
                    )}
                </div>
            </div>
        </>
    );
}

export default NursesTab;