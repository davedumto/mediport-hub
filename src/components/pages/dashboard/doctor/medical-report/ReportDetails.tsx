"use client"
import React, { useRef, useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Bold, Italic, List, ListOrdered, Underline } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/common/forms/Form';

interface ReportDetailsProps {
    form: UseFormReturn<MedicalReportFormData>;
}

export const ReportDetails: React.FC<ReportDetailsProps> = ({ form }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

    const applyFormat = (format: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        if (selectedText) {
            let formattedText = '';

            switch (format) {
                case 'bold':
                    formattedText = `**${selectedText}**`;
                    break;
                case 'italic':
                    formattedText = `*${selectedText}*`;
                    break;
                case 'underline':
                    formattedText = `<u>${selectedText}</u>`;
                    break;
                case 'list':
                    formattedText = selectedText.split('\n').map(line => line.trim() ? `• ${line}` : line).join('\n');
                    break;
                case 'numbered':
                    formattedText = selectedText.split('\n').map((line, index) => line.trim() ? `${index + 1}. ${line}` : line).join('\n');
                    break;
                default:
                    formattedText = selectedText;
            }

            const newValue = textarea.value.substring(0, start) + formattedText + textarea.value.substring(end);
            form.setValue('reportDetails', newValue);

            // Update active formats (simple toggle for demo)
            setActiveFormats(prev => {
                const newSet = new Set(prev);
                if (newSet.has(format)) {
                    newSet.delete(format);
                } else {
                    newSet.add(format);
                }
                return newSet;
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="reportTitle"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                                Report Title / Subject
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="e.g., Annual Check-up, Post-Surgery Follow-up"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="primaryDiagnosis"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                                Primary Diagnosis
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="e.g., Hypertension, Type 2 Diabetes"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="reportDetails"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                            Report Details
                        </FormLabel>
                        <div className="border rounded-md">
                            <div className="flex items-center space-x-2 p-3 border-b bg-gray-50">
                                <Button
                                    type="button"
                                    variant={activeFormats.has('bold') ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        applyFormat('bold');
                                    }}
                                >
                                    <Bold className="w-4 h-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant={activeFormats.has('italic') ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        applyFormat('italic');
                                    }}
                                >
                                    <Italic className="w-4 h-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant={activeFormats.has('underline') ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        applyFormat('underline');
                                    }}
                                >
                                    <Underline className="w-4 h-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant={activeFormats.has('list') ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        applyFormat('list');
                                    }}
                                >
                                    <List className="w-4 h-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant={activeFormats.has('numbered') ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        applyFormat('numbered');
                                    }}
                                >
                                    <ListOrdered className="w-4 h-4" />
                                </Button>
                            </div>
                            <FormControl>
                                <Textarea
                                    ref={textareaRef}
                                    className="border-0 min-h-[200px] resize-none focus-visible:ring-0"
                                    placeholder="Enter detailed report information..."
                                    {...field}
                                />
                            </FormControl>
                        </div>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    );
};

