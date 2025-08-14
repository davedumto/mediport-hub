"use client"
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Mail, Phone, User, Users } from 'lucide-react';
import { handleViewDetails } from '@/utils/handleViewDetails';
import { useRouter } from 'next/navigation';
const PatientCard = ({ patient }) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const age = new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear();
    const router = useRouter()
    return (
        <>
            <Card className="w-full max-w-sm hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.firstName}`} />
                            <AvatarFallback className="bg-purple-100 text-purple-700">
                                {patient.firstName[0]}{patient.lastName[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <CardTitle className="text-lg">{patient.firstName} {patient.lastName}</CardTitle>
                            <p className="text-sm text-gray-600">Age: {age} • {patient.gender}</p>
                            <Badge variant="outline" className="mt-1">
                                <User className="w-3 h-3 mr-1" />
                                Patient
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-gray-500" />
                            {patient.email}
                        </div>
                        <div className="flex items-center">
                            <CalendarDays className="w-4 h-4 mr-2 text-gray-500" />
                            {patient.appointments?.length || 0} Appointments
                        </div>
                    </div>
                    <Button
                        onClick={() => {


                            router.push(`dashboard/patient-details/${patient.id}`);
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


export default PatientCard