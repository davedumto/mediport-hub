"use client"
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


import { Phone, Mail, Stethoscope, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
type Doctor = {
    firstName: string;
    lastName: string;
    specialty: string;
    email: string;
    phone: string;
    assignedPatients?: any[];
};

interface DoctorCardProps {
    doctor: Doctor;
    onAssignRole: (doctor: Doctor) => void;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onAssignRole }) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const router = useRouter()
    return (
        <>
            <Card className="w-full max-w-sm hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.firstName}`} />
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                                {doctor.firstName[0]}{doctor.lastName[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <CardTitle className="text-lg">Dr. {doctor.firstName} {doctor.lastName}</CardTitle>
                            <p className="text-sm text-gray-600">{doctor.specialty}</p>
                            <Badge variant="outline" className="mt-1">
                                <Stethoscope className="w-3 h-3 mr-1" />
                                Doctor
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-gray-500" />
                            {doctor.email}
                        </div>
                        <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-500" />
                            {doctor.phone}
                        </div>
                        <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2 text-gray-500" />
                            {doctor.assignedPatients?.length || 0} Patients
                        </div>
                    </div>
                    <Button
                        onClick={() => {
                            router.push(`dashboard/staff-details/${doctor.firstName}`);
                        }}
                        className="w-full mt-4"
                    >
                        View Details
                    </Button>
                </CardContent>
            </Card>
        </>
    );
};


export default DoctorCard