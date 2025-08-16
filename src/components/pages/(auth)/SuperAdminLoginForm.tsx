"use client";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { LoginFormData, loginSchema } from "@/schema/login.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, User, Shield, Crown, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";

const SuperAdminLoginForm = () => {
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
      console.log("Super Admin login form submitted:", data);

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

      console.log("Super Admin login response:", response);

      if (response.success) {
        reset();
        setMfaCode("");
        setRequiresMFA(false);

        // Success toast
        toast.success("🎉 Super Admin Login successful!", {
          description: "Welcome to MediPort Hub Super Admin Panel!",
          duration: 4000,
        });

        // Redirect to super admin dashboard
        router.push("/super-admin/dashboard");
      } else {
        if (response.requiresMFA) {
          setRequiresMFA(true);
          toast.info("MFA Required", {
            description: "Please enter your MFA code to complete login.",
            duration: 5000,
          });
        } else {
          toast.error("Super Admin Login Failed", {
            description: response.message,
            duration: 5000,
          });
        }
      }
    } catch (error: any) {
      console.error("Super Admin login error:", error);

      // Handle specific error cases with user-friendly messages
      if (error?.data?.details && error.data.details.length > 0) {
        const errorDetails = error.data.details.join("\n");
        toast.error("Super Admin Login Failed", {
          description: errorDetails,
          duration: 6000,
        });
      } else if (error?.data?.message) {
        toast.error("Super Admin Login Failed", {
          description: error.data.message,
          duration: 5000,
        });
      } else if (error?.message) {
        toast.error("Super Admin Login Failed", {
          description: error.message,
          duration: 5000,
        });
      } else {
        toast.error("Super Admin Login Failed", {
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
      {/* Left Side - Purple Background (Super Admin Theme) */}
      <div className="w-1/2 bg-purple-600 py-10 px-20">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Crown className="text-white" size={32} />
          <p className="text-center text-white text-xl font-bold">
            Super Admin
          </p>
        </div>
        <p className="text-center text-white mt-6 text-3xl">System Control</p>
        <p className="text-center text-white mt-3 text-sm">
          Access the administrative panel to manage users, roles, and
          system-wide configurations
        </p>

        <div className="w-full gap-10 flex flex-col mt-12">
          <div className="w-full flex items-start justify-start gap-2">
            <div className="w-7 h-7 flex items-center justify-center bg-purple-400 rounded-full p-1.5">
              <Shield color="white" size={24} />
            </div>
            <div className="flex-1 gap-4">
              <p className="text-white text-sm">System Administration</p>
              <p className="text-gray-200 text-xs">
                Full system access and control
              </p>
            </div>
          </div>
          <div className="w-full flex items-start justify-start gap-2">
            <div className="w-7 h-7 flex items-center justify-center bg-purple-400 rounded-full p-1.5">
              <User color="white" size={24} />
            </div>
            <div className="flex-1 gap-4">
              <p className="text-white text-sm">User Management</p>
              <p className="text-gray-200 text-xs">
                Manage all users and roles
              </p>
            </div>
          </div>
          <div className="w-full flex items-start justify-start gap-2">
            <div className="w-7 h-7 flex items-center justify-center bg-purple-400 rounded-full p-1.5">
              <Calendar color="white" size={24} />
            </div>
            <div className="flex-1 gap-4">
              <p className="text-white text-sm">System Monitoring</p>
              <p className="text-gray-200 text-xs">
                Monitor system health and performance
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-3"></div>
              <p className="text-purple-600 font-medium">Signing you in...</p>
              <p className="text-gray-500 text-sm">Please wait</p>
            </div>
          </div>
        )}

        <div className="w-full mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="text-purple-600" size={24} />
            <h1 className="text-left text-purple-600 font-medium text-3xl">
              Super Admin Login
            </h1>
          </div>
          <p className="text-gray-600 text-sm">
            Access the administrative control panel
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Super Admin Email
            </label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="email"
                  placeholder="Enter super admin email"
                  icon={<User size={16} />}
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
                    icon={<Shield size={16} />}
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
                icon={<Shield size={16} />}
                containerClassName="w-full"
                value={mfaCode}
                onChange={handleMFAChange}
              />
              <p className="text-sm text-gray-500">
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
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
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
            btnTitle={
              isLoading || isSubmitting
                ? "Signing In..."
                : "Access Super Admin Panel"
            }
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          />

          {/* Forgot Password Link */}
          <div className="text-center">
            <a
              href="/forgot-password"
              className="text-sm text-purple-600 hover:text-purple-500 hover:underline"
            >
              Forgot your password?
            </a>
          </div>

          {/* Back to Regular Login Link */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Not a super admin?</p>
            <a
              href="/login"
              className="inline-block px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
            >
              Regular User Login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuperAdminLoginForm;
