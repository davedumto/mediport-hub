"use client";

import { useState, useEffect } from "react";
import { X, FileText, Clock, CheckCircle, AlertTriangle, Eye } from "lucide-react";
import { ConsentRecord, ConsentType, ConsentStatus } from "../../../types/consent";

interface ConsentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

interface ConsentSummary {
  id: string;
  consentType: ConsentType;
  purpose: string;
  granted: boolean;
  status: ConsentStatus;
  grantedAt?: Date;
  withdrawnAt?: Date;
  expiresAt?: Date;
  consentVersion: string;
  legalBasis: string;
}

export default function ConsentManagementModal({
  isOpen,
  onClose,
  userId,
}: ConsentManagementModalProps) {
  const [consents, setConsents] = useState<ConsentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConsent, setSelectedConsent] = useState<ConsentSummary | null>(null);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawalReason, setWithdrawalReason] = useState("");
  const [processingWithdrawal, setProcessingWithdrawal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchConsents();
    }
  }, [isOpen, userId]);

  const fetchConsents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/consent/manage?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch consent history");
      }
      
      const data = await response.json();
      
      // Transform consent history to summary format
      const consentSummaries = data.consentHistory?.map((consent: ConsentRecord) => ({
        id: consent.id,
        consentType: consent.consentType,
        purpose: consent.purpose,
        granted: consent.granted,
        status: getConsentStatus(consent),
        grantedAt: consent.grantedAt ? new Date(consent.grantedAt) : undefined,
        withdrawnAt: consent.withdrawnAt ? new Date(consent.withdrawnAt) : undefined,
        expiresAt: consent.expiresAt ? new Date(consent.expiresAt) : undefined,
        consentVersion: consent.consentVersion,
        legalBasis: consent.legalBasis,
      })) || [];
      
      setConsents(consentSummaries);
    } catch (err) {
      console.error("Error fetching consents:", err);
      setError(err instanceof Error ? err.message : "Failed to load consent data");
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

  const handleWithdrawConsent = async () => {
    if (!selectedConsent || !withdrawalReason.trim()) return;

    try {
      setProcessingWithdrawal(true);
      
      const response = await fetch("/api/consent/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          consentType: selectedConsent.consentType,
          reason: withdrawalReason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to withdraw consent");
      }

      // Refresh consents and close dialog
      await fetchConsents();
      setShowWithdrawDialog(false);
      setSelectedConsent(null);
      setWithdrawalReason("");
    } catch (err) {
      console.error("Error withdrawing consent:", err);
      setError(err instanceof Error ? err.message : "Failed to withdraw consent");
    } finally {
      setProcessingWithdrawal(false);
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return "N/A";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Consent Management</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading consent data...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && consents.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Consent Records</h3>
              <p className="text-gray-600">No consent records found for this user.</p>
            </div>
          )}

          {!loading && !error && consents.length > 0 && (
            <div className="space-y-4">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Active Consents</h3>
                <p className="text-sm text-gray-600">
                  Manage your data processing consents. You can view details and withdraw consent at any time.
                </p>
              </div>

              <div className="grid gap-4">
                {consents.map((consent) => (
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
                            <span className="font-medium text-gray-500">Expires:</span>
                            <p className="text-gray-900">{formatDate(consent.expiresAt)}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Version:</span>
                            <p className="text-gray-900">{consent.consentVersion}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => setSelectedConsent(consent)}
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {consent.status === ConsentStatus.GRANTED && (
                          <button
                            onClick={() => {
                              setSelectedConsent(consent);
                              setShowWithdrawDialog(true);
                            }}
                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                          >
                            Withdraw
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Withdrawal Confirmation Dialog */}
      {showWithdrawDialog && selectedConsent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Withdraw Consent</h3>
              <p className="text-sm text-gray-600 mb-4">
                You are about to withdraw your consent for "{formatConsentType(selectedConsent.consentType)}". 
                This action cannot be undone and may affect the services you receive.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for withdrawal (required):
                </label>
                <textarea
                  value={withdrawalReason}
                  onChange={(e) => setWithdrawalReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Please provide a reason for withdrawing this consent..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowWithdrawDialog(false);
                    setSelectedConsent(null);
                    setWithdrawalReason("");
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={processingWithdrawal}
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdrawConsent}
                  disabled={!withdrawalReason.trim() || processingWithdrawal}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {processingWithdrawal ? "Withdrawing..." : "Withdraw Consent"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}