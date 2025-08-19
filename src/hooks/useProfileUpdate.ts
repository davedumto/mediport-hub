/**
 * Hook for handling secure profile updates with encryption
 */

import { useState } from "react";
import { toast } from "sonner";
import {
  ProfileUpdateService,
  ProfileUpdateData,
} from "@/services/profileUpdateService";
import { useAuth } from "@/contexts/AuthContext";

interface UseProfileUpdateResult {
  updateProfile: (
    data: ProfileUpdateData,
    avatarFile?: File | null
  ) => Promise<boolean>;
  isUpdating: boolean;
  error: string | null;
}

export function useProfileUpdate(): UseProfileUpdateResult {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { tokens, fetchUserProfile } = useAuth();

  const updateProfile = async (
    profileData: ProfileUpdateData,
    avatarFile?: File | null
  ): Promise<boolean> => {
    setIsUpdating(true);
    setError(null);

    try {
      // Validate profile data before submission
      const validation = ProfileUpdateService.validateProfileData(profileData);
      if (!validation.valid) {
        setError(validation.errors.join(". "));
        toast.error("Validation Error", {
          description: validation.errors.join(". "),
        });
        return false;
      }

      // Validate avatar file if provided
      if (avatarFile) {
        const fileValidation =
          ProfileUpdateService.validateAvatarFile(avatarFile);
        if (!fileValidation.valid) {
          setError(fileValidation.errors.join(". "));
          toast.error("File Validation Error", {
            description: fileValidation.errors.join(". "),
          });
          return false;
        }
      }

      console.log("🔄 Starting secure profile update...");

      // Attempt encrypted update first
      let result = await ProfileUpdateService.updateProfile(
        profileData,
        avatarFile,
        tokens?.accessToken
      );

      // Fallback to legacy mode if encryption fails
      if (!result.success && result.error?.includes("decrypt")) {
        console.log("🔄 Encryption failed, falling back to legacy mode...");
        result = await ProfileUpdateService.updateProfileLegacy(
          profileData,
          avatarFile,
          tokens?.accessToken
        );
      }

      if (result.success) {
        toast.success("Profile Updated", {
          description: "Your profile has been updated successfully.",
          duration: 4000,
        });

        // Refresh user profile data in AuthContext
        try {
          await fetchUserProfile();
        } catch (refreshError) {
          console.warn(
            "Failed to refresh user profile after update:",
            refreshError
          );
        }

        return true;
      } else {
        setError(result.message);
        toast.error("Update Failed", {
          description: result.message,
          duration: 5000,
        });
        return false;
      }
    } catch (error: any) {
      const errorMessage = error.message || "An unexpected error occurred";
      setError(errorMessage);

      toast.error("Update Failed", {
        description: errorMessage,
        duration: 5000,
      });

      console.error("Profile update error:", error);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateProfile,
    isUpdating,
    error,
  };
}
