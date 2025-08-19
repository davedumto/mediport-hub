"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import ConsentSummary from "@/components/common/consent/ConsentSummary";
import ConsentHistory from "@/components/common/consent/ConsentHistory";
import ConsentManagementModal from "@/components/common/modals/ConsentManagementModal";
import ConsentWithdrawalModal from "@/components/common/modals/ConsentWithdrawalModal";
import { ConsentType } from "@/types/consent";
import { Shield, FileText, Settings, Info } from "lucide-react";

export default function PrivacyConsentTab() {
  const { user } = useAuth();
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedConsentType, setSelectedConsentType] = useState<ConsentType | null>(null);

  const handleWithdrawConsent = async (reason: string) => {
    if (!selectedConsentType || !user?.id) return;

    try {
      const response = await fetch("/api/consent/manage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          consentType: selectedConsentType,
          reason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to withdraw consent");
      }

      // Refresh the page or trigger a refresh of the consent components
      window.location.reload();
    } catch (error) {
      console.error("Error withdrawing consent:", error);
      throw error;
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Please log in to view your privacy settings.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Privacy & Consent Management</h2>
        </div>
        <p className="text-gray-700 mb-4">
          Manage your data processing consents and privacy preferences. You have full control over how your personal and medical data is used.
        </p>
        
        <div className="bg-white rounded-lg p-4 border border-blue-100">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">Your Rights</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• View and manage all your consents</li>
                <li>• Withdraw consent at any time</li>
                <li>• Request data deletion (subject to legal requirements)</li>
                <li>• Access your complete consent history</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Consent Summary */}
      <ConsentSummary
        userId={user.id}
        onManageConsents={() => setShowManagementModal(true)}
        showActions={true}
        className="shadow-md"
      />

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setShowManagementModal(true)}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <Settings className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-gray-900">Manage All Consents</h4>
              <p className="text-sm text-gray-600">View and modify all your consent preferences</p>
            </div>
          </button>

          <button
            onClick={() => {
              setSelectedConsentType(ConsentType.MARKETING);
              setShowWithdrawalModal(true);
            }}
            className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <FileText className="w-5 h-5 text-orange-600" />
            <div>
              <h4 className="font-medium text-gray-900">Withdraw Marketing</h4>
              <p className="text-sm text-gray-600">Stop receiving marketing communications</p>
            </div>
          </button>

          <div className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg bg-gray-50 text-left opacity-75">
            <Shield className="w-5 h-5 text-gray-500" />
            <div>
              <h4 className="font-medium text-gray-700">Request Data Export</h4>
              <p className="text-sm text-gray-500">Download your personal data (Coming Soon)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Consent History */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ConsentHistory
          userId={user.id}
          showFilter={true}
          maxItems={10}
        />
      </div>

      {/* Educational Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-yellow-900 mb-3">Why We Need Your Consent</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800">
          <div>
            <h4 className="font-medium mb-2">Medical Data Processing</h4>
            <p>We process your health information to provide medical care, coordinate with healthcare providers, and maintain your medical records securely.</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">General Data Processing</h4>
            <p>Your personal information helps us maintain your account, provide customer support, and improve our services while ensuring your privacy.</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-yellow-200">
          <p className="text-xs text-yellow-700">
            <strong>Note:</strong> Some consents are required for essential services and cannot be withdrawn without affecting your access to healthcare services. 
            We will always inform you of the consequences before processing any consent changes.
          </p>
        </div>
      </div>

      {/* Modals */}
      <ConsentManagementModal
        isOpen={showManagementModal}
        onClose={() => setShowManagementModal(false)}
        userId={user.id}
      />

      {selectedConsentType && (
        <ConsentWithdrawalModal
          isOpen={showWithdrawalModal}
          onClose={() => {
            setShowWithdrawalModal(false);
            setSelectedConsentType(null);
          }}
          onConfirm={handleWithdrawConsent}
          consentType={selectedConsentType}
          consentPurpose="Marketing communications and promotional offers"
        />
      )}
    </div>
  );
}