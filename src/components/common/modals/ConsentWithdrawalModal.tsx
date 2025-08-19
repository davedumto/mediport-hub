"use client";

import { useState } from "react";
import { X, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { ConsentType } from "../../../types/consent";

interface ConsentWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  consentType: ConsentType;
  consentPurpose?: string;
  loading?: boolean;
}

const WITHDRAWAL_REASONS = [
  "I no longer need these services",
  "I found a better alternative",
  "Privacy concerns",
  "Data security concerns",
  "Changed my mind about sharing data",
  "Service not meeting expectations",
  "Moving to a different provider",
  "Other (please specify)",
];

const CONSEQUENCES = {
  [ConsentType.DATA_PROCESSING]: [
    "Your account may be deactivated",
    "You will lose access to personalized features",
    "Historical data may be anonymized or deleted",
    "You may not receive important notifications",
  ],
  [ConsentType.MEDICAL_TREATMENT]: [
    "Healthcare providers may not be able to share your records",
    "Treatment coordination may be impacted",
    "Emergency access to your medical history may be limited",
    "Some medical services may become unavailable",
  ],
  [ConsentType.MARKETING]: [
    "You will stop receiving promotional communications",
    "Personalized offers and recommendations will cease",
    "Your preferences will not be used for marketing",
  ],
  [ConsentType.THIRD_PARTY_SHARING]: [
    "Data sharing with partners will stop",
    "Integrated services may stop working",
    "Cross-platform features may be disabled",
  ],
  [ConsentType.MEDICAL_RESEARCH]: [
    "Your data will be removed from research datasets",
    "You will not contribute to medical advancement",
    "Research-based insights will not be available",
  ],
} as const;

export default function ConsentWithdrawalModal({
  isOpen,
  onClose,
  onConfirm,
  consentType,
  consentPurpose = "",
  loading = false,
}: ConsentWithdrawalModalProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [step, setStep] = useState<"reason" | "consequences" | "confirmation">("reason");

  const formatConsentType = (type: ConsentType) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getFinalReason = () => {
    return selectedReason === "Other (please specify)" ? customReason : selectedReason;
  };

  const handleNext = () => {
    if (step === "reason" && (selectedReason && (selectedReason !== "Other (please specify)" || customReason.trim()))) {
      setStep("consequences");
    } else if (step === "consequences") {
      setStep("confirmation");
    }
  };

  const handleBack = () => {
    if (step === "consequences") {
      setStep("reason");
    } else if (step === "confirmation") {
      setStep("consequences");
    }
  };

  const handleConfirm = async () => {
    if (!confirmationChecked) return;
    
    try {
      await onConfirm(getFinalReason());
      handleClose();
    } catch (error) {
      console.error("Error withdrawing consent:", error);
    }
  };

  const handleClose = () => {
    setSelectedReason("");
    setCustomReason("");
    setConfirmationChecked(false);
    setStep("reason");
    onClose();
  };

  const consequences = CONSEQUENCES[consentType] || [
    "Some features may become unavailable",
    "Your user experience may be affected",
    "Data processing for this purpose will stop",
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900">Withdraw Consent</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Progress Indicators */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === "reason" ? "bg-blue-600 text-white" : "bg-green-500 text-white"
              }`}>
                {step === "reason" ? "1" : <CheckCircle className="w-4 h-4" />}
              </div>
              <div className={`h-0.5 w-16 ${step === "reason" ? "bg-gray-300" : "bg-green-500"}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === "consequences" ? "bg-blue-600 text-white" : 
                step === "confirmation" ? "bg-green-500 text-white" : "bg-gray-300 text-gray-600"
              }`}>
                {step === "confirmation" ? <CheckCircle className="w-4 h-4" /> : "2"}
              </div>
              <div className={`h-0.5 w-16 ${step === "confirmation" ? "bg-green-500" : "bg-gray-300"}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step === "confirmation" ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Step 1: Reason Selection */}
          {step === "reason" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Why are you withdrawing consent?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  You are withdrawing consent for "{formatConsentType(consentType)}"
                  {consentPurpose && (
                    <span> - {consentPurpose}</span>
                  )}
                </p>
              </div>

              <div className="space-y-3">
                {WITHDRAWAL_REASONS.map((reason) => (
                  <label
                    key={reason}
                    className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-900">{reason}</span>
                  </label>
                ))}
              </div>

              {selectedReason === "Other (please specify)" && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Please specify your reason:
                  </label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Please provide your specific reason for withdrawing consent..."
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Consequences */}
          {step === "consequences" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Important: What this means
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Withdrawing your consent for "{formatConsentType(consentType)}" will have the following consequences:
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-orange-800 mb-2">
                      Consequences of withdrawal:
                    </h4>
                    <ul className="space-y-1 text-sm text-orange-700">
                      {consequences.map((consequence, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{consequence}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <Clock className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-1">
                      When does this take effect?
                    </h4>
                    <p className="text-sm text-blue-700">
                      Your consent withdrawal will take effect immediately. However, some changes may take up to 30 days to fully process across all systems.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p className="mb-2">
                  <strong>Your reason:</strong> {getFinalReason()}
                </p>
                <p>
                  You can re-grant consent at any time by visiting your consent management settings.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Final Confirmation */}
          {step === "confirmation" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Final Confirmation
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Please confirm that you want to withdraw your consent. This action cannot be undone.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Consent Type:</span>
                  <span className="ml-2 text-gray-900">{formatConsentType(consentType)}</span>
                </div>
                {consentPurpose && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Purpose:</span>
                    <span className="ml-2 text-gray-900">{consentPurpose}</span>
                  </div>
                )}
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Reason:</span>
                  <span className="ml-2 text-gray-900">{getFinalReason()}</span>
                </div>
              </div>

              <div className="border border-red-200 rounded-lg p-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmationChecked}
                    onChange={(e) => setConfirmationChecked(e.target.checked)}
                    className="mt-1 text-red-600 focus:ring-red-500"
                  />
                  <div className="text-sm">
                    <p className="text-red-800 font-medium">
                      I understand the consequences and want to proceed
                    </p>
                    <p className="text-red-700 mt-1">
                      By checking this box, I confirm that I understand the impact of withdrawing this consent 
                      and want to proceed with the withdrawal.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 bg-gray-50 border-t border-gray-200">
          <div>
            {step !== "reason" && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Back
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            
            {step === "confirmation" ? (
              <button
                onClick={handleConfirm}
                disabled={!confirmationChecked || loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                <span>{loading ? "Withdrawing..." : "Withdraw Consent"}</span>
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={
                  (step === "reason" && (!selectedReason || (selectedReason === "Other (please specify)" && !customReason.trim())))
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}