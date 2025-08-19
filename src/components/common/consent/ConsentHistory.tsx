"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle, X, AlertTriangle, Filter, Search, FileText } from "lucide-react";
import { ConsentRecord, ConsentType, ConsentStatus, ConsentAuditAction } from "../../../types/consent";

interface ConsentHistoryProps {
  userId: string;
  className?: string;
  maxItems?: number;
  showFilter?: boolean;
}

interface ConsentHistoryItem extends ConsentRecord {
  status: ConsentStatus;
  auditEvents?: {
    action: ConsentAuditAction;
    timestamp: Date;
    details: Record<string, any>;
  }[];
}

interface FilterOptions {
  consentType?: ConsentType;
  status?: ConsentStatus;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

export default function ConsentHistory({
  userId,
  className = "",
  maxItems,
  showFilter = true,
}: ConsentHistoryProps) {
  const [consents, setConsents] = useState<ConsentHistoryItem[]>([]);
  const [filteredConsents, setFilteredConsents] = useState<ConsentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({});
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchConsentHistory();
  }, [userId]);

  useEffect(() => {
    applyFilters();
  }, [consents, searchTerm, filters]);

  const fetchConsentHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/consent/manage?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch consent history");
      }
      
      const data = await response.json();
      
      const historyItems = data.consentHistory?.map((consent: ConsentRecord) => ({
        ...consent,
        status: getConsentStatus(consent),
        grantedAt: consent.grantedAt ? new Date(consent.grantedAt) : undefined,
        withdrawnAt: consent.withdrawnAt ? new Date(consent.withdrawnAt) : undefined,
        expiresAt: consent.expiresAt ? new Date(consent.expiresAt) : undefined,
        createdAt: new Date(consent.createdAt),
        updatedAt: new Date(consent.updatedAt),
      })) || [];
      
      setConsents(historyItems);
    } catch (err) {
      console.error("Error fetching consent history:", err);
      setError(err instanceof Error ? err.message : "Failed to load consent history");
    } finally {
      setLoading(false);
    }
  };

  const getConsentStatus = (consent: ConsentRecord): ConsentStatus => {
    if (consent.withdrawnAt) return ConsentStatus.WITHDRAWN;
    if (consent.expiresAt && new Date(consent.expiresAt) < new Date()) return ConsentStatus.EXPIRED;
    if (consent.granted) return ConsentStatus.GRANTED;
    return ConsentStatus.PENDING;
  };

  const applyFilters = () => {
    let filtered = [...consents];

    // Apply search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(consent =>
        consent.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatConsentType(consent.consentType).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply consent type filter
    if (filters.consentType) {
      filtered = filtered.filter(consent => consent.consentType === filters.consentType);
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(consent => consent.status === filters.status);
    }

    // Apply date range filter
    if (filters.dateRange?.start) {
      filtered = filtered.filter(consent => new Date(consent.createdAt) >= filters.dateRange!.start!);
    }
    if (filters.dateRange?.end) {
      filtered = filtered.filter(consent => new Date(consent.createdAt) <= filters.dateRange!.end!);
    }

    // Apply max items limit
    if (maxItems && maxItems > 0) {
      filtered = filtered.slice(0, maxItems);
    }

    setFilteredConsents(filtered);
  };

  const getStatusIcon = (status: ConsentStatus) => {
    switch (status) {
      case ConsentStatus.GRANTED:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case ConsentStatus.WITHDRAWN:
        return <X className="w-4 h-4 text-red-500" />;
      case ConsentStatus.EXPIRED:
        return <Clock className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: ConsentStatus) => {
    switch (status) {
      case ConsentStatus.GRANTED:
        return "bg-green-100 text-green-800";
      case ConsentStatus.WITHDRAWN:
        return "bg-red-100 text-red-800";
      case ConsentStatus.EXPIRED:
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const formatConsentType = (type: ConsentType) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(dateObj);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm("");
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading consent history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Consent History</h3>
          <p className="text-sm text-gray-600 mt-1">
            View and manage your consent preferences over time
          </p>
        </div>
        {showFilter && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilter && showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search by purpose or type..."
                />
              </div>
            </div>

            {/* Consent Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consent Type</label>
              <select
                value={filters.consentType || ""}
                onChange={(e) => setFilters({ ...filters, consentType: e.target.value as ConsentType || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                {Object.values(ConsentType).map(type => (
                  <option key={type} value={type}>
                    {formatConsentType(type)}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status || ""}
                onChange={(e) => setFilters({ ...filters, status: e.target.value as ConsentStatus || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                {Object.values(ConsentStatus).map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {filteredConsents.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Consent Records</h3>
          <p className="text-gray-600">
            {consents.length === 0 
              ? "No consent records found for this user."
              : "No records match your current filters."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConsents.map((consent) => (
            <div
              key={consent.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusIcon(consent.status)}
                    <h4 className="font-medium text-gray-900">
                      {formatConsentType(consent.consentType)}
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(consent.status)}`}>
                      {consent.status}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{consent.purpose}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="font-medium text-gray-500">Legal Basis:</span>
                      <p className="text-gray-900">{consent.legalBasis}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Granted:</span>
                      <p className="text-gray-900">{formatDate(consent.grantedAt)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">
                        {consent.status === ConsentStatus.WITHDRAWN ? "Withdrawn:" : "Expires:"}
                      </span>
                      <p className="text-gray-900">
                        {consent.status === ConsentStatus.WITHDRAWN 
                          ? formatDate(consent.withdrawnAt)
                          : formatDate(consent.expiresAt)
                        }
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Version:</span>
                      <p className="text-gray-900">{consent.consentVersion}</p>
                    </div>
                  </div>
                </div>
                
                <div className="ml-4 text-xs text-gray-500">
                  <div>Created: {formatDate(consent.createdAt)}</div>
                  {consent.updatedAt && consent.updatedAt !== consent.createdAt && (
                    <div>Updated: {formatDate(consent.updatedAt)}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {filteredConsents.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          Showing {filteredConsents.length} of {consents.length} consent records
        </div>
      )}
    </div>
  );
}