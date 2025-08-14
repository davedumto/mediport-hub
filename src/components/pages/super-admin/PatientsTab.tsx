"use client"
import Input from "@/components/common/Input";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { mockPatients } from "@/app/super-admin/mock-data";
import PatientCard from "./PatientsCard";

const PatientsTab = () => {

    const [searchTerm, setSearchTerm] = useState("");

    const filteredPatients = useMemo(() => {
        if (!searchTerm.trim()) return mockPatients;
        return mockPatients.filter((patient) =>
            `${patient.firstName} ${patient.lastName}`
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
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
                    {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                            <PatientCard
                                key={patient.id}
                                patient={patient}
                            />
                        ))
                    ) : (
                        <p className="col-span-full text-center text-gray-500">No patient found</p>
                    )}
                </div>
            </div>
        </>
    );
}

export default PatientsTab;