"use client";
import React, { useState } from "react";
import SystemFeedbackForm from "@/components/common/SystemFeedbackForm";
import { useAuth } from "@/contexts/AuthContext";

const FeedbackSection = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);

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
        setShowForm(false);
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="text-center py-8">
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
          <p className="text-sm text-gray-500 mb-4">
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

  if (showForm) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            System Feedback
          </h3>
          <button
            onClick={() => setShowForm(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <SystemFeedbackForm
          onSubmit={handleSubmitFeedback}
          isLoading={isSubmitting}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          System Feedback
        </h3>
        <p className="text-gray-600 mb-4">
          Help us improve the EHR system by sharing your experience and
          suggestions.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Submit Feedback
        </button>
      </div>
    </div>
  );
};

export default FeedbackSection;
