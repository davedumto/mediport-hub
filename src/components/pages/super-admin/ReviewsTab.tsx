"use client";
import React, { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import StarRating from "@/components/common/StarRating";
import { useAuth } from "@/contexts/AuthContext";

interface Review {
  id: string;
  title: string;
  message: string;
  rating: number;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    email: string;
  };
}

const ReviewsTab = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<string>("all");

  useEffect(() => {
    fetchReviews();
  }, [currentPage, filterRole, filterRating]);

  const fetchReviews = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth_tokens")
        ? JSON.parse(localStorage.getItem("auth_tokens")!).accessToken
        : "";

      let url = `/api/system-reviews?page=${currentPage}&limit=20`;
      if (filterRole !== "all") {
        url += `&role=${filterRole}`;
      }
      if (filterRating !== "all") {
        url += `&rating=${filterRating}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.data.reviews);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch reviews");
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setError("An error occurred while fetching reviews");
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "DOCTOR":
        return "bg-blue-100 text-blue-800";
      case "PATIENT":
        return "bg-green-100 text-green-800";
      case "NURSE":
        return "bg-purple-100 text-purple-800";
      case "ADMIN":
        return "bg-orange-100 text-orange-800";
      case "SUPER_ADMIN":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading && reviews.length === 0) {
    return (
      <div className="w-full px-6 py-10 bg-white rounded-lg shadow shadow-gray-50 mt-10">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-6 py-10 bg-white rounded-lg shadow shadow-gray-50 mt-10">
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Reviews
          </h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchReviews}
            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-10 bg-white rounded-lg shadow shadow-gray-50 mt-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          User Reviews & Feedback
        </h2>
        <p className="text-gray-600">
          Monitor user feedback to identify areas for system improvement and
          user satisfaction.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Role
          </label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="DOCTOR">Doctors</option>
            <option value="PATIENT">Patients</option>
            <option value="NURSE">Nurses</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Rating
          </label>
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
            <option value="1">1+ Stars</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id} className="hover:bg-gray-50">
                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">
                      {review.user.firstName} {review.user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {review.user.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                      review.user.role
                    )}`}
                  >
                    {review.user.role}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <div className="font-medium text-gray-900">
                      {review.title}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {review.message}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <StarRating
                      rating={review.rating}
                      onRatingChange={() => {}}
                      readonly={true}
                      size="sm"
                    />
                    <span className="text-sm text-gray-600">
                      ({review.rating})
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600">
                    {formatDate(review.createdAt)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {reviews.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Reviews Found
          </h3>
          <p className="text-sm text-gray-500">
            {filterRole !== "all" || filterRating !== "all"
              ? "Try adjusting your filters to see more results."
              : "No user reviews have been submitted yet."}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewsTab;
