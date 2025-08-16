"use client";
import React, { useState } from "react";
import Input from "./Input";
import Button from "./Button";
import { Textarea } from "../ui/textarea";
import StarRating from "./StarRating";

interface SystemFeedbackFormProps {
  onSubmit: (feedback: {
    title: string;
    message: string;
    rating: number;
  }) => void;
  isLoading?: boolean;
}

const SystemFeedbackForm: React.FC<SystemFeedbackFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!message.trim()) {
      newErrors.message = "Message is required";
    }

    if (rating === 0) {
      newErrors.rating = "Please select a rating";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit({ title: title.trim(), message: message.trim(), rating });
    }
  };

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    if (errors.rating) {
      setErrors((prev) => ({ ...prev, rating: "" }));
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          System Feedback
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Input
              label="Feedback Title"
              placeholder="Brief summary of your feedback"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) {
                  setErrors((prev) => ({ ...prev, title: "" }));
                }
              }}
              error={!!errors.title}
              errorMessage={errors.title}
              info="Keep it concise and descriptive"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 text-left mb-2">
              Detailed Feedback
            </label>
            <Textarea
              placeholder="Please describe your experience, suggestions, or any issues you've encountered..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (errors.message) {
                  setErrors((prev) => ({ ...prev, message: "" }));
                }
              }}
              className={`min-h-32 resize-none ${
                errors.message ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.message && (
              <p className="mt-2 text-xs text-red-500">{errors.message}</p>
            )}
            <p className="mt-2 text-xs text-gray-400">
              Be specific about what you liked, what could be improved, or any
              problems you encountered.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 text-left mb-3">
              Overall Rating
            </label>
            <div className="flex items-center gap-4">
              <StarRating
                rating={rating}
                onRatingChange={handleRatingChange}
                size="lg"
              />
              <span className="text-sm text-gray-600">
                {rating > 0 ? `${rating} out of 5 stars` : "Select rating"}
              </span>
            </div>
            {errors.rating && (
              <p className="mt-2 text-xs text-red-500">{errors.rating}</p>
            )}
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              btnTitle="Submit Feedback"
              loading={isLoading}
              className="w-full"
              disabled={isLoading}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default SystemFeedbackForm;
