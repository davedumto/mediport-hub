"use client"
import React from 'react';
import { X, Download, FileText, Image, File } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';


interface ReportModalProps {
    report: MedicalReport | null;
    isOpen: boolean;
    onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ report, isOpen, onClose }) => {
    if (!report) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getFileIcon = (fileType: string) => {
        if (fileType.includes('image')) return <Image className="w-4 h-4" />;
        if (fileType.includes('pdf')) return <FileText className="w-4 h-4" />;
        return <File className="w-4 h-4" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}  >
            <DialogContent className=" max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-xl font-semibold">
                                Report: {report.id} - {report.subject}
                            </DialogTitle>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                <span><strong>Patient:</strong> {report.patient.name}</span>
                                <span><strong>Doctor:</strong> {report.doctor.name}</span>
                                <span><strong>Date:</strong> {formatDate(report.date)}</span>
                            </div>
                        </div>
                        <Badge variant={getStatusVariant(report.status)}>
                            {report.status}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Primary Diagnosis */}
                    {report.primaryDiagnosis && (
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Primary Diagnosis</h4>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded-md">
                                {report.primaryDiagnosis}
                            </p>
                        </div>
                    )}

                    {/* Report Details */}
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Report Details</h4>
                        <div className="prose prose-sm max-w-none">
                            <div className="bg-gray-50 p-4 rounded-md border">
                                <div
                                    className="whitespace-pre-wrap text-gray-700"
                                    dangerouslySetInnerHTML={{
                                        __html: report.reportDetails
                                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                            .replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
                                            .replace(/^• (.+)$/gm, '<li>$1</li>')
                                            .replace(/^(\d+)\. (.+)$/gm, '<ol><li>$2</li></ol>')
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Attached Files */}
                    {report.attachedFiles && report.attachedFiles.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Attached Scanned Documents</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {report.attachedFiles.map((file) => (
                                    <div
                                        key={file.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="text-gray-500">
                                                {getFileIcon(file.type)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                                    {file.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {formatFileSize(file.size)}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            title="Download file"
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Download className="w-4 h-4 mr-2" />
                        Download Report
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ReportModal