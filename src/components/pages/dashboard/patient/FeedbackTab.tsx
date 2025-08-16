"use client";
import React, { useState } from "react";
import SystemFeedbackForm from "@/components/common/SystemFeedbackForm";
import { useAuth } from "@/contexts/AuthContext";

const FeedbackTab = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmitFeedback = async (feedback: {
    title: string;
    message: string;
    rating: number;
  }) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("auth_tokens")
        ? JSON.parse(localStorage.getItem("auth_tokens")!).accessToken
        : "";

      const response = await fetch("/api/system-reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(feedback),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        // Reset form after successful submission
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        const errorData = await response.json();
        console.error("Failed to submit feedback:", errorData);
        alert("Failed to submit feedback. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("An error occurred while submitting feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="w-full px-6 py-10 bg-white rounded-lg shadow shadow-gray-50 mt-10">
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Feedback Submitted Successfully!
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Thank you for your feedback. We appreciate you taking the time to
            help us improve our system.
          </p>
          <button
            onClick={() => setSubmitSuccess(false)}
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            Submit Another Review
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-10 bg-white rounded-lg shadow shadow-gray-50 mt-10">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            System Feedback
          </h2>
          <p className="text-gray-600">
            Help us improve the EHR system by sharing your experience,
            suggestions, or reporting any issues you've encountered.
          </p>
        </div>

        <SystemFeedbackForm
          onSubmit={handleSubmitFeedback}
          isLoading={isSubmitting}
        />

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Your feedback helps us make the system better for everyone. We
            review all submissions and use them to prioritize improvements.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeedbackTab;
