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
import { ClipboardPlus, Lock, Mail, UserLock } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

const RegisterForm = () => {
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
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

        // Show detailed success message with patient info if available
        let successMessage =
          " Registration successful!\n\n Your account has been created";

        if (response.data?.patient) {
          successMessage += `\n Patient record created: ${response.data.patient.firstName} ${response.data.patient.lastName}`;
          successMessage += `\n Patient ID: ${response.data.patient.id}`;
        }

        successMessage += "\nPlease check your email for verification";
        successMessage += "\n You can now log in with your credentials";
        successMessage += "\n\nWelcome to MediPort Hub!";

        alert(successMessage);
        // You can redirect to login page here
        // router.push('/login');
      } else {
        // Fallback: if response doesn't have success field but has user/patient data, treat as success
        if (response.data?.user || response.data?.patient) {
          reset();

          let successMessage =
            "🎉 Registration successful!\n\n Your account has been created";

          if (response.data?.patient) {
            successMessage += `\n Patient record created: ${response.data.patient.firstName} ${response.data.patient.lastName}`;
            successMessage += `\n Patient ID: ${response.data.patient.id}`;
          }

          successMessage += "\n Please check your email for verification";
          successMessage += "\n You can now log in with your credentials";
          successMessage += "\n\nWelcome to MediPort Hub!";

          alert(successMessage);
        } else {
          console.error("Unexpected response structure:", response);
          alert(
            "Registration completed, but response format was unexpected. Please check the console for details."
          );
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
          alert(
            " This email is already registered! Please try logging in instead, or use a different email address."
          );
        } else if (
          errorDetails.some((detail: string) => detail.includes("GDPR consent"))
        ) {
          alert(
            " Please accept the GDPR consent to continue with registration."
          );
        } else if (
          errorDetails.some((detail: string) => detail.includes("Full name"))
        ) {
          alert("👤 Please provide both your first and last name.");
        } else {
          const errorMessage = errorDetails.join(", ");
          alert(` Registration failed: ${errorMessage}`);
        }
      } else if (error?.data?.message) {
        // Handle general error messages
        if (error.data.message.includes("already exists")) {
          alert(
            " This email is already registered! Please try logging in instead, or use a different email address."
          );
        } else {
          alert(` Registration failed: ${error.data.message}`);
        }
      } else if (error?.status === 400) {
        alert(" Please check your information and try again.");
      } else if (error?.status === 500) {
        alert("🔧 Server error. Please try again later or contact support.");
      } else {
        alert(" Registration failed. Please try again.");
      }
    }
  };
  return (
    <>
      <div className="w-3/5 self-center flex items-stretch justify-between m-auto bg-white shadow-gray-300 shadow-2xl rounded-lg ">
        <div className="w-1/2 bg-blue-500 py-10 px-20">
          <p className="text-center text-white text-base">Mediport Hub</p>

          <p className="text-center text-white mt-6 text-3xl">Join Us Today</p>
          <p className="text-center text-white mt-3 text-sm">
            Create your account to access our comprehensive healthcare
            management platorm
          </p>

          <div className="w-full gap-10 flex flex-col mt-12 ">
            <div className="w-full flex items-start justify-start gap-2">
              <div className="w-7 h-7 flex items-center justify-center bg-blue-400 rounded-full p-1.5">
                <UserLock color="white" size={24} />
              </div>
              <div className="flex-1 gap-4 ">
                <p className=" text-white text-sm">Secure Registeration</p>
                <p className=" text-gray-300 text-xs">
                  Your data is always protected
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
              Create Account
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
                    value={value}
                    icon={<User color="gray" variant="Bold" size={18} />}
                    onChange={onChange}
                    error={!!errors.fullName}
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
                  <Input
                    onChange={onChange}
                    value={value}
                    label="Password"
                    type="password"
                    info="Use 8+ characters with a mix of letters, numbers & symbols"
                    icon={<Lock color="gray" size={18} />}
                    error={!!errors.password?.message}
                    errorMessage={errors.password?.message}
                    disabled={isLoading || isSubmitting}
                  />
                )}
              />
              {/* Password requirements tip */}
              <div className="text-xs text-gray-500 mt-1 ml-1">
                Password must contain: uppercase, lowercase, number, and special
                character
              </div>
            </div>

            <div>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { value, onChange } }) => (
                  <Input
                    onChange={onChange}
                    value={value}
                    label="Confirm Password"
                    type="password"
                    icon={<Lock color="gray" size={18} />}
                    error={!!errors.confirmPassword?.message}
                    errorMessage={errors.confirmPassword?.message}
                    disabled={isLoading || isSubmitting}
                  />
                )}
              />
            </div>

            <div className="w-full">
              <div className="flex items-start justify-start gap-2 leading-5">
                <input
                  type="checkbox"
                  {...register("agreeToTerms")}
                  className="mt-1"
                  disabled={isLoading || isSubmitting}
                />
                <p className="text-gray-400 text-xs">
                  I agree to the processing of my data in accordance with the{" "}
                  <span className="text-blue-500 font-medium text-xs">
                    GDPR Policy
                  </span>{" "}
                  and{" "}
                  <span className="text-blue-500 font-medium text-xs">
                    Privacy Policy
                  </span>
                  <span className="text-red-500 ml-1">*</span>
                </p>
              </div>
              {errors.agreeToTerms && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.agreeToTerms.message}
                </p>
              )}
              {!errors.agreeToTerms && agreeToTerms && (
                <p className="text-green-500 text-xs mt-1">
                  GDPR consent accepted
                </p>
              )}
            </div>

            <Button
              btnTitle={
                isLoading || isSubmitting ? "Creating Account..." : "Sign Up"
              }
              loading={isLoading || isSubmitting}
              disabled={isLoading || isSubmitting}
              onClick={handleSubmit(onSubmit)}
            />

            {/* Form submission status */}
            {(isLoading || isSubmitting) && (
              <div className="text-center text-sm text-blue-600 mt-2">
                Please wait while we create your account...
              </div>
            )}
          </div>

          <div className="w-full mt-5">
            <p className="text-center text-gray-600 mt-3 text-sm">
              Already have account?{" "}
              <span className="text-blue-500 font-medium text-sm">Log in</span>{" "}
            </p>
          </div>
        </form>
      </div>
    </>
  );
};

export default RegisterForm;
