"use client";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { LoginFormData, loginSchema } from "@/schema/login.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, User } from "iconsax-reactjs";
import { ClipboardPlus, Lock, Mail, UserLock, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";

const LoginForm = () => {
  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { login, isLoading } = useAuth();
  const router = useRouter();
  const [mfaCode, setMfaCode] = useState("");
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: LoginFormData) => {
    // Prevent multiple submissions
    if (isLoading || isSubmitting) {
      return;
    }

    try {
      console.log("Form submitted:", data);

      const formData = {
        email: data.email,
        password: data.password,
        mfaCode: mfaCode || undefined,
        rememberMe,
      };

      const response = await login(
        formData.email,
        formData.password,
        formData.mfaCode,
        formData.rememberMe
      );

      console.log("Login response:", response);

      if (response.success) {
        reset();
        setMfaCode("");
        setRequiresMFA(false);

        // Success toast
        toast.success("🎉 Login successful!", {
          description: "Welcome to MediPort Hub!",
          duration: 4000,
        });

        // Redirect will be handled by the AuthContext
      } else {
        if (response.requiresMFA) {
          setRequiresMFA(true);
          toast.info("MFA Required", {
            description: "Please enter your MFA code to complete login.",
            duration: 5000,
          });
        } else {
          toast.error("Login Failed", {
            description: response.message,
            duration: 5000,
          });
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);

      // Handle specific error cases with user-friendly messages
      if (error?.data?.details && error.data.details.length > 0) {
        const errorDetails = error.data.details.join("\n");
        toast.error("Login Failed", {
          description: errorDetails,
          duration: 6000,
        });
      } else if (error?.data?.message) {
        toast.error("Login Failed", {
          description: error.data.message,
          duration: 5000,
        });
      } else if (error?.message) {
        toast.error("Login Failed", {
          description: error.message,
          duration: 5000,
        });
      } else {
        toast.error("Login Failed", {
          description: "Please try again.",
          duration: 5000,
        });
      }
    }
  };

  const handleMFAChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMfaCode(e.target.value);
  };

  const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRememberMe(e.target.checked);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-3/5 self-center flex items-stretch justify-between m-auto bg-white shadow-gray-300 shadow-2xl rounded-lg">
      {/* Left Side - Blue Background */}
      <div className="w-1/2 bg-blue-500 py-10 px-20">
        <p className="text-center text-white text-base">Mediport Hub</p>

        <p className="text-center text-white mt-6 text-3xl">Welcome Back!</p>
        <p className="text-center text-white mt-3 text-sm">
          Sign in to access your healthcare platform and manage your medical
          services with ease
        </p>

        <div className="w-full gap-10 flex flex-col mt-12">
          <div className="w-full flex items-start justify-start gap-2">
            <div className="w-7 h-7 flex items-center justify-center bg-blue-400 rounded-full p-1.5">
              <UserLock color="white" size={24} />
            </div>
            <div className="flex-1 gap-4">
              <p className="text-white text-sm">Secure Access</p>
              <p className="text-gray-300 text-xs">
                Multi-factor authentication
              </p>
            </div>
          </div>
          <div className="w-full flex items-start justify-start gap-2">
            <div className="w-7 h-7 flex items-center justify-center bg-blue-400 rounded-full p-1.5">
              <Calendar color="white" size={24} />
            </div>
            <div className="flex-1 gap-4">
              <p className="text-white text-sm">Quick Access</p>
              <p className="text-gray-300 text-xs">
                Manage appointments & records
              </p>
            </div>
          </div>
          <div className="w-full flex items-start justify-start gap-2">
            <div className="w-7 h-7 flex items-center justify-center bg-blue-400 rounded-full p-1.5">
              <ClipboardPlus color="white" size={24} />
            </div>
            <div className="flex-1 gap-4">
              <p className="text-white text-sm">Medical Dashboard</p>
              <p className="text-gray-300 text-xs">
                Complete healthcare management
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-1/2 py-10 px-10 relative">
        {/* Loading overlay */}
        {(isLoading || isSubmitting) && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-blue-600 font-medium">Signing you in...</p>
              <p className="text-gray-500 text-sm">Please wait</p>
            </div>
          </div>
        )}

        <div className="w-full mb-4">
          <h1 className="text-left text-blue-600 font-medium text-3xl">
            Sign In
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  error={!!errors.email?.message}
                  errorMessage={errors.email?.message}
                />
              )}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
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
                    placeholder="Enter your password"
                    icon={<Lock size={16} />}
                    containerClassName="w-full"
                    error={!!errors.password?.message}
                    errorMessage={errors.password?.message}
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

          {/* MFA Code Field (shown when required) */}
          {requiresMFA && (
            <div>
              <label
                htmlFor="mfaCode"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                MFA Code
              </label>
              <Input
                type="text"
                placeholder="Enter 6-digit MFA code"
                icon={<UserLock size={16} />}
                containerClassName="w-full"
                value={mfaCode}
                onChange={handleMFAChange}
              />
              <p className="mt-1 text-sm text-gray-500">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
          )}

          {/* Remember Me Checkbox */}
          <div className="flex items-center">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={handleRememberMeChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label
              htmlFor="rememberMe"
              className="ml-2 block text-sm text-gray-900"
            >
              Remember me for 30 days
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || isSubmitting}
            loading={isLoading || isSubmitting}
            btnTitle={isLoading || isSubmitting ? "Signing In..." : "Sign In"}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          />

          {/* Forgot Password Link */}
          <div className="text-center">
            <a
              href="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-500 hover:underline"
            >
              Forgot your password?
            </a>
          </div>

          {/* Register Link */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">
              Don&apos;t have an account? Choose your registration type:
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center mb-4">
              <a
                href="/register/patient"
                className="inline-block px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                Register as Patient
              </a>
              <a
                href="/register/doctor"
                className="inline-block px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Register as Doctor
              </a>
            </div>

            {/* Super Admin Login Link */}
            <div className="text-center pt-2 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                System Administrator?
              </p>
              <a
                href="/super-admin-login"
                className="inline-block px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
              >
                Super Admin Login
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
