"use client";
import React, { useState, useEffect, useRef } from "react";
import { X, Mail, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  firstName: string;
  onVerificationSuccess: () => void;
}

const OTPVerificationModal: React.FC<OTPVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
  firstName,
  onVerificationSuccess,
}) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(900); // 15 minutes in seconds
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      // Focus first input
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp: otpString,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("🎉 Account verified successfully!", {
          description: "Welcome to MediPort Hub!",
          duration: 4000,
        });
        onVerificationSuccess();
        onClose();
      } else {
        toast.error("Verification Failed", {
          description: data.message || "Invalid OTP code. Please try again.",
          duration: 5000,
        });
        // Clear OTP on error
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      toast.error("Verification Failed", {
        description: "An error occurred. Please try again.",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("OTP sent successfully!", {
          description: "Check your email for the new verification code",
          duration: 4000,
        });
        setTimeLeft(900); // Reset timer
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        toast.error("Failed to resend OTP", {
          description: data.message || "Please try again later",
          duration: 5000,
        });
      }
    } catch (error) {
      toast.error("Failed to resend OTP", {
        description: "An error occurred. Please try again.",
        duration: 5000,
      });
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Verify Your Account
              </h2>
              <p className="text-sm text-gray-500">
                Enter the 6-digit code sent to your email
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Email Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Code sent to:
              </span>
            </div>
            <p className="text-blue-800 font-medium mt-1">{email}</p>
          </div>

          {/* OTP Input Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Enter 6-digit verification code
              </label>
              <div className="flex space-x-2 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                    placeholder="0"
                  />
                ))}
              </div>
            </div>

            {/* Timer and Resend */}
            <div className="text-center">
              {timeLeft > 0 ? (
                <p className="text-sm text-gray-500">
                  Code expires in{" "}
                  <span className="font-mono font-medium text-orange-600">
                    {formatTime(timeLeft)}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-red-500 font-medium">
                  Code has expired
                </p>
              )}

              <button
                type="button"
                onClick={handleResendOTP}
                disabled={!canResend || isResending}
                className={`mt-2 text-sm font-medium transition-colors ${
                  canResend
                    ? "text-blue-600 hover:text-blue-700"
                    : "text-gray-400 cursor-not-allowed"
                }`}
              >
                {isResending ? (
                  <span className="flex items-center space-x-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Resending...</span>
                  </span>
                ) : (
                  "Resend code"
                )}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || otp.join("").length !== 6}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                otp.join("").length === 6 && !isLoading
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </span>
              ) : (
                "Verify Account"
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Didn&apos;t receive the code? Check your spam folder or{" "}
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={!canResend || isResending}
                className={`font-medium underline ${
                  canResend
                    ? "text-blue-600 hover:text-blue-700"
                    : "text-gray-400"
                }`}
              >
                request a new one
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default OTPVerificationModal;
