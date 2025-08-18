import React from 'react';
import { Button } from '@/components/ui/button';

interface FormActionsProps {
    onSaveDraft: () => void;
    isSubmitting: boolean;
}

const FormActions: React.FC<FormActionsProps> = ({
    onSaveDraft,
    isSubmitting,
}) => {
    return (
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                    e.preventDefault();
                    onSaveDraft();
                }}
                disabled={isSubmitting}
            >
                Save as Draft
            </Button>
            <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
            >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
        </div>
    );
};

export default FormActions