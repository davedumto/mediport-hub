/**
 * Profile Update Service with PII Encryption
 * Handles secure profile updates with encrypted data transmission
 */

import { ClientSideEncryption } from "@/lib/clientSideEncryption";

export interface ProfileUpdateData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
}

export interface ProfileUpdateResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      avatarUrl?: string;
      role: string;
      updatedAt: Date;
    };
  };
  error?: string;
}

export class ProfileUpdateService {
  /**
   * Update user profile with encrypted transmission
   */
  static async updateProfile(
    profileData: ProfileUpdateData,
    avatarFile?: File | null,
    accessToken?: string
  ): Promise<ProfileUpdateResponse> {
    try {
      console.log("🔐 Encrypting profile data...");
      const encryptedProfilePayload = await ClientSideEncryption.encryptPayload(profileData);

      // Prepare form data for file upload
      const formData = new FormData();
      
      // Add encrypted profile data
      formData.append('profileData', JSON.stringify({
        encryptedPayload: encryptedProfilePayload
      }));

      // Add avatar file if provided
      if (avatarFile) {
        formData.append('avatar', avatarFile);
        console.log("📸 Including avatar file in upload...");
      }

      // Get auth token
      const token = accessToken || getStoredAuthToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      console.log("🚀 Sending encrypted profile update request...");

      // Send request
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Note: Don't set Content-Type for FormData, browser will set it with boundary
        },
        body: formData,
      });

      const responseData = await response.json();

      if (response.ok) {
        console.log("✅ Profile updated successfully with encrypted data");
        return {
          success: true,
          message: responseData.message || "Profile updated successfully",
          data: responseData.data,
        };
      } else {
        console.error("❌ Profile update failed:", responseData);
        return {
          success: false,
          message: responseData.message || "Failed to update profile",
          error: responseData.error,
        };
      }

    } catch (error: any) {
      console.error("💥 Profile update error:", error);
      return {
        success: false,
        message: "An unexpected error occurred while updating profile",
        error: error.message,
      };
    }
  }

  /**
   * Update profile without encryption (fallback mode)
   */
  static async updateProfileLegacy(
    profileData: ProfileUpdateData,
    avatarFile?: File | null,
    accessToken?: string
  ): Promise<ProfileUpdateResponse> {
    try {
      console.log("⚠️ Using legacy unencrypted profile update...");

      const formData = new FormData();
      
      // Add profile data (unencrypted)
      formData.append('profileData', JSON.stringify(profileData));

      // Add avatar file if provided
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      // Get auth token
      const token = accessToken || getStoredAuthToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Send request
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const responseData = await response.json();

      if (response.ok) {
        return {
          success: true,
          message: responseData.message || "Profile updated successfully",
          data: responseData.data,
        };
      } else {
        return {
          success: false,
          message: responseData.message || "Failed to update profile",
          error: responseData.error,
        };
      }

    } catch (error: any) {
      console.error("Profile update error:", error);
      return {
        success: false,
        message: "An unexpected error occurred while updating profile",
        error: error.message,
      };
    }
  }

  /**
   * Validate profile data before submission
   */
  static validateProfileData(data: Partial<ProfileUpdateData>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.firstName && (data.firstName.length < 1 || data.firstName.length > 50)) {
      errors.push("First name must be between 1 and 50 characters");
    }

    if (data.lastName && (data.lastName.length < 1 || data.lastName.length > 50)) {
      errors.push("Last name must be between 1 and 50 characters");
    }

    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push("Invalid email address format");
      }
    }

    if (data.phone) {
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,15}$/;
      if (!phoneRegex.test(data.phone)) {
        errors.push("Invalid phone number format");
      }
    }

    if (data.gender && !["MALE", "FEMALE", "OTHER"].includes(data.gender)) {
      errors.push("Invalid gender value");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate avatar file
   */
  static validateAvatarFile(file: File): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      errors.push("Invalid file type. Only JPEG, PNG, and WebP are allowed.");
    }

    // Check file size (5MB limit to match Cloudinary)
    if (file.size > 5 * 1024 * 1024) {
      errors.push("File size too large. Maximum size is 5MB.");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Helper function to get stored auth token
 */
function getStoredAuthToken(): string | null {
  try {
    const tokens = localStorage.getItem('auth_tokens');
    if (tokens) {
      const parsedTokens = JSON.parse(tokens);
      return parsedTokens.accessToken || null;
    }
    return null;
  } catch (error) {
    console.error("Error retrieving auth token:", error);
    return null;
  }
}