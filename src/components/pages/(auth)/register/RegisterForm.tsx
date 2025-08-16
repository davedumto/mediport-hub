"use client";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import {
  RegisterFormData,
  registerSchema,
} from "@/schema/registeration.schema";
import { useRegisterMutation } from "@/services/api/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, User } from "iconsax-reactjs";
import { ClipboardPlus, Lock, Mail, UserLock, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState } from "react";
import OTPVerificationModal from "@/components/common/modals/OTPVerificationModal";

const RegisterForm = () => {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
  });

  const [registerUser, { isLoading }] = useRegisterMutation();
  const router = useRouter();
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<{
    email: string;
    firstName: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Watch the agreeToTerms checkbox
  const agreeToTerms = watch("agreeToTerms");

  const onSubmit = async (data: RegisterFormData) => {
    // Prevent multiple submissions
    if (isLoading || isSubmitting) {
      return;
    }

    try {
      console.log("Form submitted:", data);

      // Transform the data to match what the backend expects
      const formData = {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        gdprConsent: data.agreeToTerms, // Map agreeToTerms to gdprConsent
      };

      const response = await registerUser(formData).unwrap();

      console.log("Registration response:", response);
      console.log("Response success:", response.success);
      console.log("Response data:", response.data);

      if (response.success) {
        reset();

        // Show success message
        toast.success("🎉 Registration successful!", {
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
        // Fallback: if response doesn't have success field but has user/patient data, treat as success
        if (response.data?.user || response.data?.patient) {
          reset();

          let successMessage =
            "🎉 Registration successful!\n\nYour account has been created";

          if (response.data?.patient) {
            successMessage += `\nPatient record created: ${response.data.patient.firstName} ${response.data.patient.lastName}`;
            successMessage += `\nPatient ID: ${response.data.patient.id}`;
          }

          successMessage += "\nPlease check your email for verification";
          successMessage += "\nYou can now log in with your credentials";

          toast.success("🎉 Registration successful!", {
            description: successMessage,
            duration: 6000,
          });

          // Store user info and show verification modal
          setRegisteredUser({
            email: data.email,
            firstName: data.fullName.split(" ")[0],
          });
          setShowVerificationModal(true);
        } else {
          console.error("Unexpected response structure:", response);
          toast.error("Registration Issue", {
            description:
              "Registration completed, but response format was unexpected. Please check the console for details.",
            duration: 6000,
          });
        }
      }
    } catch (error: any) {
      console.error("Registration error:", error);

      // Handle specific error cases with user-friendly messages
      if (error?.data?.details && error.data.details.length > 0) {
        const errorDetails = error.data.details;

        // Check for specific error types
        if (
          errorDetails.some((detail: string) =>
            detail.includes("already exists")
          )
        ) {
          toast.error("Registration Failed", {
            description:
              "This email is already registered! Please try logging in instead, or use a different email address.",
            duration: 6000,
          });
        } else if (
          errorDetails.some((detail: string) => detail.includes("GDPR consent"))
        ) {
          toast.error("Registration Failed", {
            description:
              "Please accept the GDPR consent to continue with registration.",
            duration: 6000,
          });
        } else if (
          errorDetails.some((detail: string) => detail.includes("Full name"))
        ) {
          toast.error("Registration Failed", {
            description: "👤 Please provide both your first and last name.",
            duration: 6000,
          });
        } else {
          const errorMessage = errorDetails.join(", ");
          toast.error("Registration Failed", {
            description: errorMessage,
            duration: 6000,
          });
        }
      } else if (error?.data?.message) {
        // Handle general error messages
        if (error.data.message.includes("already exists")) {
          toast.error("Registration Failed", {
            description:
              "This email is already registered! Please try logging in instead, or use a different email address.",
            duration: 6000,
          });
        } else {
          toast.error("Registration Failed", {
            description: error.data.message,
            duration: 6000,
          });
        }
      } else if (error?.status === 400) {
        toast.error("Registration Failed", {
          description: "Please check your information and try again.",
          duration: 5000,
        });
      } else if (error?.status === 500) {
        toast.error("Registration Failed", {
          description:
            "🔧 Server error. Please try again later or contact support.",
          duration: 5000,
        });
      } else {
        toast.error("Registration Failed", {
          description: "Please try again.",
          duration: 5000,
        });
      }
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

  return (
    <>
      <div className="w-3/5 self-center flex items-stretch justify-between m-auto bg-white shadow-gray-300 shadow-2xl rounded-lg ">
        <div className="w-1/2 bg-blue-500 py-10 px-20">
          <p className="text-center text-white text-base">Mediport Hub</p>

          <p className="text-center text-white mt-6 text-3xl">Welcome!</p>
          <p className="text-center text-white mt-3 text-sm">
            Create your account to manage patients, appointments and medical
            records with ease
          </p>

          <div className="w-full gap-10 flex flex-col mt-12 ">
            <div className="w-full flex items-start justify-start gap-2">
              <div className="w-7 h-7 flex items-center justify-center bg-blue-400 rounded-full p-1.5">
                <UserLock color="white" size={24} />
              </div>
              <div className="flex-1 gap-4 ">
                <p className=" text-white text-sm">Secure Registration</p>
                <p className=" text-gray-300 text-xs">
                  GDPR compliant data protection
                </p>
              </div>
            </div>
            <div className="w-full flex items-start justify-start gap-2">
              <div className="w-7 h-7 flex items-center justify-center bg-blue-400 rounded-full p-1.5">
                <Calendar color="white" size={24} />
              </div>
              <div className="flex-1 gap-4 ">
                <p className=" text-white text-sm">Easy Appointment</p>
                <p className=" text-gray-300 text-xs">
                  Book doctors in seconds
                </p>
              </div>
            </div>
            <div className="w-full flex items-start justify-start gap-2">
              <div className="w-7 h-7 flex items-center justify-center bg-blue-400 rounded-full p-1.5">
                <ClipboardPlus color="white" size={24} />
              </div>
              <div className="flex-1 gap-4 ">
                <p className=" text-white text-sm">Medical Records</p>
                <p className=" text-gray-300 text-xs">
                  Access your history anytime
                </p>
              </div>
            </div>
          </div>
        </div>
        <form className="w-1/2 py-10 px-10 relative">
          {/* Loading overlay */}
          {(isLoading || isSubmitting) && (
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
              Register
            </h1>
          </div>
          <div className="w-full gap-5 flex flex-col">
            <div>
              <Controller
                control={control}
                name="fullName"
                render={({ field: { value, onChange } }) => (
                  <Input
                    label="Full Name"
                    type="text"
                    value={value}
                    icon={<User size={18} color={"gray"} />}
                    onChange={onChange}
                    error={!!errors.fullName?.message}
                    errorMessage={errors.fullName?.message}
                    disabled={isLoading || isSubmitting}
                  />
                )}
              />
            </div>

            <div>
              <Controller
                control={control}
                name="email"
                render={({ field: { value, onChange } }) => (
                  <Input
                    label="Email Address"
                    type="email"
                    value={value}
                    icon={<Mail size={18} color={"gray"} />}
                    onChange={onChange}
                    error={!!errors.email?.message}
                    errorMessage={errors.email?.message}
                    disabled={isLoading || isSubmitting}
                  />
                )}
              />
            </div>

            <div>
              <Controller
                control={control}
                name="password"
                render={({ field: { value, onChange } }) => (
                  <div className="relative">
                    <Input
                      onChange={onChange}
                      value={value}
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      icon={<Lock color="gray" size={18} />}
                      error={!!errors.password?.message}
                      errorMessage={errors.password?.message}
                      disabled={isLoading || isSubmitting}
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
                )}
              />
            </div>

            <div>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { value, onChange } }) => (
                  <div className="relative">
                    <Input
                      onChange={onChange}
                      value={value}
                      label="Confirm Password"
                      type={showConfirmPassword ? "text" : "password"}
                      icon={<Lock color="gray" size={18} />}
                      error={!!errors.confirmPassword?.message}
                      errorMessage={errors.confirmPassword?.message}
                      disabled={isLoading || isSubmitting}
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
                )}
              />
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
                with GDPR regulations for account creation and healthcare
                services.
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="mt-1 text-sm text-red-600">
                {errors.agreeToTerms.message}
              </p>
            )}

            <Button
              btnTitle={
                isLoading || isSubmitting
                  ? "Creating Account..."
                  : "Create Account"
              }
              loading={isLoading || isSubmitting}
              disabled={isLoading || isSubmitting}
              onClick={handleSubmit(onSubmit)}
            />

            {/* Form submission status */}
            {(isLoading || isSubmitting) && (
              <div className="text-center text-sm text-blue-600 mt-2">
                Creating Account...
              </div>
            )}
          </div>

          <div className="w-full mt-5">
            <p className="text-center text-gray-600 mt-3 text-sm">
              Already have account?{" "}
              <span
                onClick={() => {
                  router.push("/login");
                }}
                className="text-blue-500 font-medium text-sm cursor-pointer"
              >
                Sign in
              </span>{" "}
            </p>
          </div>
        </form>
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

export default RegisterForm;
