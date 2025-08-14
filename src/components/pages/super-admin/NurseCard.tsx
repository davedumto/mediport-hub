"use client"
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, Phone, User, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
interface Nurse {
    firstName: string;
    lastName: string;
    specialty: string;
    email: string;
    phone: string;
    assignedPatients?: any[];
}

interface NurseCardProps {
    nurse: Nurse;
}

const NurseCard: React.FC<NurseCardProps> = ({ nurse }) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const router = useRouter()

    return (
        <>
            <Card className="w-full max-w-sm hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${nurse.firstName}`} />
                            <AvatarFallback className="bg-green-100 text-green-700">
                                {nurse.firstName[0]}{nurse.lastName[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <CardTitle className="text-lg">{nurse.firstName} {nurse.lastName}</CardTitle>
                            <p className="text-sm text-gray-600">{nurse.specialty}</p>
                            <Badge variant="outline" className="mt-1">
                                <User className="w-3 h-3 mr-1" />
                                Nurse
                            </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                            <Mail className="w-4 h-4 mr-2 text-gray-500" />
                            {nurse.email}
                        </div>
                        <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2 text-gray-500" />
                            {nurse.phone}
                        </div>
                        <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2 text-gray-500" />
                            {nurse.assignedPatients?.length || 0} Patients
                        </div>
                    </div>
                    <Button
                        onClick={() => {
                            router.push(`dashboard/staff-details/${nurse.firstName}`);
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


export default NurseCard