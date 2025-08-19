"use client"
import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface ReportsFilterProps {
    filters: FilterOptions;
    onFilterChange: (key: keyof FilterOptions, value: string) => void;
    onClearFilters: () => void;
}

const ReportsFilter: React.FC<ReportsFilterProps> = ({
    filters,
    onFilterChange,
    onClearFilters,
}) => {
    const doctors = [
        'All Doctors',
        'Dr. Sarah Johnson',
        'Dr. Michael Chen',
        'Dr. Emily Rodriguez',
        'Dr. James Wilson',
    ];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
                <div className="flex-1 min-w-0">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search by Patient Name or Report ID
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search reports..."
                            className="pl-10"
                            value={filters.patientSearch}
                            onChange={(e) => onFilterChange('patientSearch', e.target.value)}
                        />
                    </div>
                </div>

                <div className="w-full lg:w-48">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filter by Doctor
                    </label>
                    <Select
                        value={filters.doctorFilter}
                        onValueChange={(value) => onFilterChange('doctorFilter', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                        <SelectContent>
                            {doctors.map((doctor) => (
                                <SelectItem key={doctor} value={doctor}>
                                    {doctor}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full lg:w-40">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        From Date
                    </label>
                    <Input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => onFilterChange('dateFrom', e.target.value)}
                    />
                </div>

                <div className="w-full lg:w-40">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        To Date
                    </label>
                    <Input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => onFilterChange('dateTo', e.target.value)}
                    />
                </div>

                <Button
                    variant="outline"
                    onClick={onClearFilters}
                    className="w-full lg:w-auto"
                >
                    <Filter className="w-4 h-4 mr-2" />
                    Clear Filters
                </Button>
            </div>
        </div>
    );
};


export default ReportsFilter