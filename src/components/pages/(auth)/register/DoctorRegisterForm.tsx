"use client";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Lock,
  Mail,
  User,
  Stethoscope,
  FileText,
  Eye,
  EyeOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import OTPVerificationModal from "@/components/common/modals/OTPVerificationModal";

// Doctor registration schema
const doctorRegisterSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    specialty: z.string().min(1, "Please select a specialty"),
    medicalLicenseNumber: z
      .string()
      .min(1, "Medical license number is required"),
    agreeToTerms: z
      .boolean()
      .refine(
        (val) => val === true,
        "You must agree to the terms and conditions"
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type DoctorRegisterFormData = z.infer<typeof doctorRegisterSchema>;

const DoctorRegisterForm = () => {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<DoctorRegisterFormData>({
    resolver: zodResolver(doctorRegisterSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      specialty: "",
      medicalLicenseNumber: "",
      agreeToTerms: false,
    },
  });

  const router = useRouter();
  const agreeToTerms = watch("agreeToTerms");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<{
    email: string;
    firstName: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmit = async (data: DoctorRegisterFormData) => {
    try {
      console.log("Doctor registration form submitted:", data);

      // Transform the data to match what the backend expects
      const formData = {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        specialty: data.specialty,
        medicalLicenseNumber: data.medicalLicenseNumber,
        gdprConsent: data.agreeToTerms, // Map agreeToTerms to gdprConsent for API
      };

      console.log("Sending to API:", formData); // Debug log

      const response = await fetch("/api/auth/register/doctor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success) {
        reset();

        // Show success toast
        toast.success("🎉 Doctor registration successful!", {
          description:
            "Your account has been created. Please verify your email to continue.",
          duration: 6000,
        });

        // Store user info and show verification modal
        setRegisteredUser({
          email: data.email,
          firstName: data.fullName.split(" ")[0], // Extract first name
        });
        setShowVerificationModal(true);
      } else {
        // Handle error response
        const errorMessage =
          responseData.message || responseData.error || "Registration failed";
        const errorDetails = responseData.details
          ? `\n\nDetails:\n${responseData.details.join("\n")}`
          : "";

        toast.error("Registration Failed", {
          description: `${errorMessage}${errorDetails}`,
          duration: 6000,
        });
      }
    } catch (error: any) {
      console.error("Doctor registration error:", error);
      toast.error("Registration Failed", {
        description: "An unexpected error occurred. Please try again later.",
        duration: 5000,
      });
    }
  };

  const handleVerificationSuccess = () => {
    // Redirect to login after successful verification
    router.push("/login");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const specialties = [
    "Cardiology",
    "Dermatology",
    "Endocrinology",
    "Family Medicine",
    "Gastroenterology",
    "General Surgery",
    "Internal Medicine",
    "Neurology",
    "Obstetrics & Gynecology",
    "Oncology",
    "Ophthalmology",
    "Orthopedics",
    "Pediatrics",
    "Psychiatry",
    "Radiology",
    "Urology",
    "Other",
  ];

  return (
    <>
      <div className="w-3/5 self-center flex items-stretch justify-between m-auto bg-white shadow-gray-300 shadow-2xl rounded-lg">
        {/* Left Side - Blue Background */}
        <div className="w-1/2 bg-blue-500 py-10 px-20">
          <p className="text-center text-white text-base">Mediport Hub</p>

          <p className="text-center text-white mt-6 text-3xl">Welcome!</p>
          <p className="text-center text-white mt-3 text-sm">
            Join as a healthcare provider to manage patients, appointments and
            medical records with ease
          </p>

          <div className="w-full gap-10 flex flex-col mt-12">
            <div className="w-full flex items-start justify-start gap-2">
              <div className="w-7 h-7 flex items-center justify-center bg-blue-400 rounded-full p-1.5">
                <Stethoscope color="white" size={24} />
              </div>
              <div className="flex-1 gap-4">
                <p className="text-white text-sm">Medical Expertise</p>
                <p className="text-gray-300 text-xs">
                  Specialized healthcare services
                </p>
              </div>
            </div>
            <div className="w-full flex items-start justify-start gap-2">
              <div className="w-7 h-7 flex items-center justify-center bg-blue-400 rounded-full p-1.5">
                <FileText color="white" size={24} />
              </div>
              <div className="flex-1 gap-4">
                <p className="text-white text-sm">Licensed Practice</p>
                <p className="text-gray-300 text-xs">
                  Verified medical credentials
                </p>
              </div>
            </div>
            <div className="w-full flex items-start justify-start gap-2">
              <div className="w-7 h-7 flex items-center justify-center bg-blue-400 rounded-full p-1.5">
                <User color="white" size={24} />
              </div>
              <div className="flex-1 gap-4">
                <p className="text-white text-sm">Patient Care</p>
                <p className="text-gray-300 text-xs">
                  Manage appointments & records
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-1/2 py-10 px-10 relative">
          {/* Loading overlay */}
          {isSubmitting && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-blue-600 font-medium">
                  Creating your account...
                </p>
                <p className="text-gray-500 text-sm">Please wait</p>
              </div>
            </div>
          )}

          <div className="w-full mb-4">
            <h1 className="text-left text-blue-600 font-medium text-3xl">
              Doctor Registration
            </h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Full Name Field */}
            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Full Name
              </label>
              <Controller
                name="fullName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="text"
                    placeholder="Enter your full name"
                    icon={<User size={16} />}
                    containerClassName="w-full"
                    error={errors.fullName?.message}
                  />
                )}
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="email"
                    placeholder="Enter your email"
                    icon={<Mail size={16} />}
                    containerClassName="w-full"
                    error={errors.email?.message}
                  />
                )}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Specialty Field */}
            <div>
              <label
                htmlFor="specialty"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Medical Specialty
              </label>
              <Controller
                name="specialty"
                control={control}
                render={({ field }) => (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Stethoscope size={16} className="text-gray-400" />
                    </div>
                    <select
                      {...field}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a specialty</option>
                      {specialties.map((specialty) => (
                        <option key={specialty} value={specialty}>
                          {specialty}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              />
              {errors.specialty && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.specialty.message}
                </p>
              )}
            </div>

            {/* Medical License Number Field */}
            <div>
              <label
                htmlFor="medicalLicenseNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Medical License Number
              </label>
              <Controller
                name="medicalLicenseNumber"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="text"
                    placeholder="Enter your license number"
                    icon={<FileText size={16} />}
                    containerClassName="w-full"
                    error={errors.medicalLicenseNumber?.message}
                  />
                )}
              />
              {errors.medicalLicenseNumber && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.medicalLicenseNumber.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      icon={<Lock size={16} />}
                      containerClassName="w-full"
                      error={errors.password?.message}
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      icon={<Lock size={16} />}
                      containerClassName="w-full"
                      error={errors.confirmPassword?.message}
                    />
                  )}
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Terms and Conditions Checkbox */}
            <div className="flex items-center">
              <input
                id="agreeToTerms"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => {
                  const newValue = e.target.checked;
                  setValue("agreeToTerms", newValue);
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="agreeToTerms"
                className="ml-2 block text-sm text-gray-900"
              >
                I agree to the{" "}
                <a
                  href="/terms"
                  className="text-blue-600 hover:text-blue-500 hover:underline"
                >
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  className="text-blue-600 hover:text-blue-500 hover:underline"
                >
                  Privacy Policy
                </a>
                . I consent to the processing of my personal data in accordance
                with GDPR regulations for account creation and medical practice
                management.
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="mt-1 text-sm text-red-600">
                {errors.agreeToTerms.message}
              </p>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
              btnTitle={
                isSubmitting ? "Creating Account..." : "Create Doctor Account"
              }
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            />

            {/* Login Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-blue-600 hover:text-blue-500 hover:underline font-medium"
                >
                  Sign in here
                </a>
              </p>
            </div>

            {/* Patient Registration Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Are you a patient?{" "}
                <a
                  href="/register/patient"
                  className="text-blue-600 hover:text-blue-500 hover:underline font-medium"
                >
                  Register as a patient
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showVerificationModal && registeredUser && (
        <OTPVerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          email={registeredUser.email}
          firstName={registeredUser.firstName}
          onVerificationSuccess={handleVerificationSuccess}
        />
      )}
    </>
  );
};

export default DoctorRegisterForm;
