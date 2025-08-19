"use client"
import React from 'react';
import { Eye, Download, Trash2 } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';


interface ReportsTableProps {
    reports: MedicalReport[];
    onViewReport?: (report: MedicalReport) => void;
    onDownloadReport?: (reportId: string) => void;
    onDeleteReport?: (reportId: string) => void;
}

const ReportsTable: React.FC<ReportsTableProps> = ({
    reports,
    onViewReport,
    onDownloadReport,
    onDeleteReport,
}) => {
    const router = useRouter()
    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Reviewed':
                return 'success';
            case 'Submitted':
                return 'info';
            case 'Draft':
                return 'secondary';
            case 'Pending Review':
                return 'warning';
            default:
                return 'default';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className='w-full flex items-center justify-between px-5' >
                <div className=" py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">All Submitted Reports</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {reports.length} report{reports.length !== 1 ? 's' : ''} found
                    </p>
                </div>

                <Button
                    onClick={() => {
                        router.push("/dashboard/doctor/medical-report/create")
                    }}
                    className=' bg-blue-500 hover:bg-blue-500' >
                    Create New Report
                </Button>
            </div>

            <div className="overflow-x-auto px-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="font-semibold">REPORT ID</TableHead>
                            <TableHead className="font-semibold">PATIENT</TableHead>
                            <TableHead className="font-semibold">DOCTOR</TableHead>
                            <TableHead className="font-semibold">DATE</TableHead>
                            <TableHead className="font-semibold">SUBJECT</TableHead>
                            <TableHead className="font-semibold">STATUS</TableHead>
                            <TableHead className="font-semibold text-center">ACTIONS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                                    No reports found matching your criteria
                                </TableCell>
                            </TableRow>
                        ) : (
                            reports.map((report) => (
                                <TableRow key={report.id} className="hover:bg-gray-50">
                                    <TableCell className="font-mono text-sm">{report.id}</TableCell>
                                    <TableCell className="font-medium">
                                        {report.patient?.firstName} {report.patient?.lastName}
                                    </TableCell>
                                    <TableCell>
                                        Dr. {report.provider?.firstName} {report.provider?.lastName}
                                    </TableCell>
                                    <TableCell>{formatDate(report.recordDate || report.createdAt)}</TableCell>
                                    <TableCell className="max-w-xs truncate">{report.title}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(report.status)}>
                                            {report.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onViewReport?.(report)}
                                                className="h-8 w-8 p-0"
                                                title="View Report"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDownloadReport?.(report.id)}
                                                className="h-8 w-8 p-0"
                                                title="Download Report"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDeleteReport?.(report.id)}
                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                                title="Delete Report"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default ReportsTable