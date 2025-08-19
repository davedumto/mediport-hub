"use client"
import React, { useRef, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { File, X, UploadCloud } from 'lucide-react';
import {
    FormField,
    FormItem,
    FormControl,
    FormMessage,
} from '@/components/common/forms/Form';
import { Button } from '@/components/ui/button';

interface FileUploadProps {
    form: UseFormReturn<MedicalReportFormData>;
}

const FileUpload: React.FC<FileUploadProps> = ({ form }) => {
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = (files: FileList | null) => {
        if (files) {
            const newFiles = Array.from(files);
            setUploadedFiles(prev => [...prev, ...newFiles]);
            form.setValue('attachedFiles', files);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const openFileDialog = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        fileInputRef.current?.click();
    };

    const removeFile = (index: number, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">
                Attach Files (Lab Results, Scans, etc.)
            </h3>

            <FormField
                control={form.control}
                name="attachedFiles"
                render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <div
                                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                                        ? 'border-blue-400 bg-blue-50'
                                        : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <div className="space-y-2">
                                    <p className="text-gray-600">
                                        <span className="font-medium">Drag & Drop files here or</span>{' '}
                                        <button
                                            type="button"
                                            onClick={openFileDialog}
                                            className="text-blue-600 underline hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                                        >
                                            Click to Upload
                                        </button>
                                    </p>
                                    <p className="text-sm text-gray-400">Maximum file size: 10MB</p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                    className="hidden"
                                    onChange={(e) => handleFiles(e.target.files)}
                                />
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
                    {uploadedFiles.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                            <div className="flex items-center space-x-3">
                                <File className="w-5 h-5 text-gray-400" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => removeFile(index, e)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FileUpload