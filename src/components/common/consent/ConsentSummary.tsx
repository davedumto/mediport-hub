"use client";

import { useState, useEffect } from "react";
import { Shield, CheckCircle, X, Clock, AlertTriangle, Eye, Settings } from "lucide-react";
import { ConsentRecord, ConsentType, ConsentStatus, ComplianceRiskLevel } from "../../../types/consent";

interface ConsentSummaryProps {
  userId: string;
  className?: string;
  onManageConsents?: () => void;
  showActions?: boolean;
}

interface ConsentSummaryData {
  totalConsents: number;
  activeConsents: number;
  expiredConsents: number;
  withdrawnConsents: number;
  complianceScore: number;
  riskLevel: ComplianceRiskLevel;
  upcomingExpirations: Array<{
    consentType: ConsentType;
    expiresAt: Date;
    daysUntilExpiry: number;
  }>;
  missingConsents: ConsentType[];
  recentActivity: ConsentRecord[];
}

export default function ConsentSummary({
  userId,
  className = "",
  onManageConsents,
  showActions = true,
}: ConsentSummaryProps) {
  const [summary, setSummary] = useState<ConsentSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConsentSummary();
  }, [userId]);

  const fetchConsentSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/consent/manage?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch consent data");
      }
      
      const data = await response.json();
      const consents = data.consentHistory || [];
      
      // Calculate summary data
      const summaryData = calculateSummaryData(consents);
      setSummary(summaryData);
    } catch (err) {
      console.error("Error fetching consent summary:", err);
      setError(err instanceof Error ? err.message : "Failed to load consent summary");
    } finally {
      setLoading(false);
    }
  };

  const calculateSummaryData = (consents: ConsentRecord[]): ConsentSummaryData => {
    const now = new Date();
    
    let activeCount = 0;
    let expiredCount = 0;
    let withdrawnCount = 0;
    const upcomingExpirations: Array<{
      consentType: ConsentType;
      expiresAt: Date;
      daysUntilExpiry: number;
    }> = [];

    consents.forEach(consent => {
      if (consent.withdrawnAt) {
        withdrawnCount++;
      } else if (consent.expiresAt && new Date(consent.expiresAt) < now) {
        expiredCount++;
      } else if (consent.granted) {
        activeCount++;
        
        // Check for upcoming expirations (within 30 days)
        if (consent.expiresAt) {
          const expiresAt = new Date(consent.expiresAt);
          const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
            upcomingExpirations.push({
              consentType: consent.consentType,
              expiresAt,
              daysUntilExpiry,
            });
          }
        }
      }
    });

    // Calculate compliance score (0-100)
    const totalRequiredConsents = Object.keys(ConsentType).length;
    const grantedRequiredConsents = new Set(
      consents
        .filter(c => c.granted && !c.withdrawnAt && (!c.expiresAt || new Date(c.expiresAt) > now))
        .map(c => c.consentType)
    ).size;
    
    const complianceScore = Math.round((grantedRequiredConsents / Math.max(totalRequiredConsents, 1)) * 100);

    // Determine risk level
    let riskLevel: ComplianceRiskLevel;
    if (complianceScore >= 90) riskLevel = ComplianceRiskLevel.LOW;
    else if (complianceScore >= 70) riskLevel = ComplianceRiskLevel.MEDIUM;
    else if (complianceScore >= 50) riskLevel = ComplianceRiskLevel.HIGH;
    else riskLevel = ComplianceRiskLevel.CRITICAL;

    // Find missing consents (this is simplified - in real implementation, you'd check required consents based on user role/features)
    const grantedTypes = new Set(
      consents
        .filter(c => c.granted && !c.withdrawnAt && (!c.expiresAt || new Date(c.expiresAt) > now))
        .map(c => c.consentType)
    );
    
    const criticalConsents = [ConsentType.DATA_PROCESSING, ConsentType.PRIVACY_POLICY];
    const missingConsents = criticalConsents.filter(type => !grantedTypes.has(type));

    // Recent activity (last 5 activities)
    const recentActivity = consents
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);

    return {
      totalConsents: consents.length,
      activeConsents: activeCount,
      expiredConsents: expiredCount,
      withdrawnConsents: withdrawnCount,
      complianceScore,
      riskLevel,
      upcomingExpirations,
      missingConsents,
      recentActivity,
    };
  };

  const formatConsentType = (type: ConsentType) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getRiskLevelColor = (level: ComplianceRiskLevel) => {
    switch (level) {
      case ComplianceRiskLevel.LOW:
        return "text-green-700 bg-green-100";
      case ComplianceRiskLevel.MEDIUM:
        return "text-yellow-700 bg-yellow-100";
      case ComplianceRiskLevel.HIGH:
        return "text-orange-700 bg-orange-100";
      case ComplianceRiskLevel.CRITICAL:
        return "text-red-700 bg-red-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 50) return "text-orange-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className={`p-6 bg-white rounded-lg border border-gray-200 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading consent summary...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 bg-white rounded-lg border border-gray-200 ${className}`}>
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

  if (!summary) return null;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">Consent Summary</h3>
            <p className="text-sm text-gray-600">Overview of your data consent preferences</p>
          </div>
        </div>
        {showActions && onManageConsents && (
          <button
            onClick={onManageConsents}
            className="flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Manage</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Compliance Score */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Compliance Score</span>
            <span className={`text-lg font-bold ${getScoreColor(summary.complianceScore)}`}>
              {summary.complianceScore}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                summary.complianceScore >= 90 ? 'bg-green-500' :
                summary.complianceScore >= 70 ? 'bg-yellow-500' :
                summary.complianceScore >= 50 ? 'bg-orange-500' : 'bg-red-500'
              }`}
              style={{ width: `${summary.complianceScore}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Risk Level</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRiskLevelColor(summary.riskLevel)}`}>
              {summary.riskLevel}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-lg font-bold text-green-700">{summary.activeConsents}</div>
            <div className="text-xs text-green-600">Active</div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-lg font-bold text-orange-700">{summary.expiredConsents}</div>
            <div className="text-xs text-orange-600">Expired</div>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <X className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-lg font-bold text-red-700">{summary.withdrawnConsents}</div>
            <div className="text-xs text-red-600">Withdrawn</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Eye className="w-5 h-5 text-gray-500" />
            </div>
            <div className="text-lg font-bold text-gray-700">{summary.totalConsents}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>

        {/* Alerts */}
        {(summary.missingConsents.length > 0 || summary.upcomingExpirations.length > 0) && (
          <div className="space-y-3">
            {/* Missing Consents Alert */}
            {summary.missingConsents.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800 mb-1">
                      Missing Required Consents
                    </h4>
                    <p className="text-sm text-red-700 mb-2">
                      The following consents are required for full service access:
                    </p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {summary.missingConsents.map(type => (
                        <li key={type} className="flex items-center">
                          <span className="mr-2">•</span>
                          <span>{formatConsentType(type)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming Expirations Alert */}
            {summary.upcomingExpirations.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex">
                  <Clock className="w-5 h-5 text-orange-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-orange-800 mb-1">
                      Upcoming Expirations
                    </h4>
                    <p className="text-sm text-orange-700 mb-2">
                      The following consents will expire soon:
                    </p>
                    <ul className="text-sm text-orange-700 space-y-1">
                      {summary.upcomingExpirations.map((item, index) => (
                        <li key={index} className="flex items-center justify-between">
                          <span className="flex items-center">
                            <span className="mr-2">•</span>
                            <span>{formatConsentType(item.consentType)}</span>
                          </span>
                          <span className="text-xs font-medium">
                            {item.daysUntilExpiry} day{item.daysUntilExpiry !== 1 ? 's' : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Recent Activity */}
        {summary.recentActivity.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h4>
            <div className="space-y-2">
              {summary.recentActivity.slice(0, 3).map((consent, index) => (
                <div key={consent.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      consent.granted ? 'bg-green-400' : 
                      consent.withdrawnAt ? 'bg-red-400' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-sm text-gray-900">
                      {formatConsentType(consent.consentType)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(consent.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <p className="text-xs text-gray-600 text-center">
          Last updated: {new Date().toLocaleDateString()} • 
          You have control over your data and can modify these consents at any time
        </p>
      </div>
    </div>
  );
}