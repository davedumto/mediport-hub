"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "DOCTOR" | "NURSE" | "PATIENT";
  permissions: string[];
  isActive: boolean;
  mfaEnabled: boolean;
  lastLogin?: string;
  specialty?: string;
  medicalLicenseNumber?: string;
  verificationStatus?: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    mfaCode?: string,
    rememberMe?: boolean
  ) => Promise<{ success: boolean; message: string; requiresMFA?: boolean }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
  handleAPIError: (response: Response) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Hook for making authenticated API calls with automatic session expiry handling
export const useAPIWithAuth = () => {
  const { tokens, handleAPIError } = useAuth();

  const apiCall = async (url: string, options: RequestInit = {}) => {
    if (!tokens?.accessToken) {
      throw new Error("No access token available");
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });

    // Check for session expiry
    if (handleAPIError(response)) {
      throw new Error("Session expired");
    }

    return response;
  };

  return { apiCall };
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Handle session expiry
  const handleSessionExpiry = () => {
    console.log("Session expired, redirecting to login");
    // Clear local state
    setUser(null);
    setTokens(null);
    localStorage.removeItem("auth_tokens");

    // Show session expired message
    toast.error("Session expired", {
      description: "Please log in again to continue",
      duration: 5000,
    });

    // Redirect to login
    router.replace("/login");
  };

  // Global API error handler
  const handleAPIError = (response: Response) => {
    if (response.status === 401 || response.status === 403) {
      // Unauthorized or Forbidden - session expired
      handleSessionExpiry();
      return true; // Error was handled
    }
    return false; // Error was not handled
  };

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      // Check for existing tokens in localStorage
      const storedTokens = localStorage.getItem("auth_tokens");
      if (storedTokens) {
        const parsedTokens = JSON.parse(storedTokens);

        // Validate tokens first
        const isValid = await validateTokens(parsedTokens);
        if (isValid) {
          // Set tokens first, then fetch profile
          setTokens(parsedTokens);
          await fetchUserProfile(parsedTokens.accessToken);
        } else {
          // Clear invalid tokens
          localStorage.removeItem("auth_tokens");
          setTokens(null);
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateTokens = async (tokens: AuthTokens): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/validate", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (!response.ok) {
        // Token is invalid, handle session expiry
        handleSessionExpiry();
        return false;
      }

      return true;
    } catch {
      // Network error or other issue, handle session expiry
      handleSessionExpiry();
      return false;
    }
  };

  const fetchUserProfile = async (accessToken?: string) => {
    try {
      // Use passed accessToken or fall back to state tokens
      const token = accessToken || tokens?.accessToken;
      if (!token) {
        console.error("No access token available for profile fetch");
        return;
      }

      const response = await fetch("/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.data.user);

        // Show welcome toast only if not during initialization
        if (tokens) {
          toast.success(`Welcome back, ${userData.data.user.firstName}!`, {
            description: `You're logged in as a ${userData.data.user.role.toLowerCase()}`,
            duration: 4000,
          });
        }
      } else {
        console.error(
          "Profile fetch failed:",
          response.status,
          response.statusText
        );
        // If profile fetch fails, handle session expiry
        handleSessionExpiry();
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      // If profile fetch fails, handle session expiry
      handleSessionExpiry();
    }
  };

  const login = async (
    email: string,
    password: string,
    mfaCode?: string,
    rememberMe: boolean = false
  ): Promise<{ success: boolean; message: string; requiresMFA?: boolean }> => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          mfaCode,
          rememberMe,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.requiresMFA) {
          return { success: false, message: data.message, requiresMFA: true };
        }

        // Store tokens
        const authTokens = {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || "",
        };

        console.log("Storing tokens:", authTokens);
        setTokens(authTokens);
        localStorage.setItem("auth_tokens", JSON.stringify(authTokens));

        // Fetch user profile using the new tokens
        console.log("Fetching user profile...");
        try {
          const profileResponse = await fetch("/api/auth/profile", {
            headers: {
              Authorization: `Bearer ${data.accessToken}`,
            },
          });

          if (profileResponse.ok) {
            const userData = await profileResponse.json();
            setUser(userData.data.user);

            // Show welcome toast
            toast.success(`Welcome back, ${userData.data.user.firstName}!`, {
              description: `You're logged in as a ${userData.data.user.role.toLowerCase()}`,
              duration: 4000,
            });
          }
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }

        // Redirect based on role
        console.log("Redirecting to role:", data.user.role);
        console.log("About to call redirectBasedOnRole...");
        const redirectResult = await redirectBasedOnRole(data.user.role);
        console.log(
          "redirectBasedOnRole completed with result:",
          redirectResult
        );

        // Force a page reload if redirect didn't work
        setTimeout(() => {
          if (window.location.pathname === "/login") {
            console.log(
              "Still on login page, forcing redirect with window.location"
            );
            const targetPath = `/dashboard/${data.user.role.toLowerCase()}`;
            window.location.href = targetPath;
          }
        }, 2000);

        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "An unexpected error occurred" };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (tokens?.accessToken) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local state
      setUser(null);
      setTokens(null);
      localStorage.removeItem("auth_tokens");

      // Redirect to login
      router.push("/login");
    }
  };

  const refreshAuth = async (): Promise<boolean> => {
    try {
      if (!tokens?.refreshToken) return false;

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken: tokens.refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newTokens = {
          accessToken: data.data.accessToken,
          refreshToken: tokens.refreshToken, // Keep the same refresh token
        };

        setTokens(newTokens);
        localStorage.setItem("auth_tokens", JSON.stringify(newTokens));
        return true;
      } else {
        // Refresh failed, handle session expiry
        handleSessionExpiry();
        return false;
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      // Refresh failed, handle session expiry
      handleSessionExpiry();
      return false;
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const redirectBasedOnRole = async (role: string) => {
    if (!router) {
      const targetPath = `/dashboard/${role.toLowerCase()}`;
      window.location.href = targetPath;
      return;
    }

    try {
      switch (role.toLowerCase()) {
        case "doctor":
          router.replace("/dashboard/doctor");
          break;
        case "patient":
          router.replace("/dashboard/patient");
          break;
        case "nurse":
          router.replace("/dashboard/nurse");
          break;
        case "super_admin":
          router.replace("/super-admin/dashboard");
          break;
        case "admin":
          router.replace("/dashboard/admin");
          break;
        default:
          router.replace("/dashboard");
      }

      // Fallback: if router doesn't work, use window.location
      setTimeout(() => {
        if (window.location.pathname === "/login") {
          const targetPath = `/dashboard/${role.toLowerCase()}`;
          window.location.href = targetPath;
        }
      }, 1000);
    } catch (error) {
      console.error("Error in redirectBasedOnRole:", error);
      // Fallback to window.location
      const targetPath = `/dashboard/${role.toLowerCase()}`;
      window.location.href = targetPath;
    }
  };

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!tokens?.accessToken) return;

    const tokenExpiry = getTokenExpiry(tokens.accessToken);
    const timeUntilExpiry = tokenExpiry - Date.now();
    const refreshTime = Math.max(timeUntilExpiry - 60000, 0); // Refresh 1 minute before expiry

    const refreshTimer = setTimeout(() => {
      refreshAuth();
    }, refreshTime);

    return () => clearTimeout(refreshTimer);
  }, [tokens]);

  const getTokenExpiry = (token: string): number => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000;
    } catch {
      return Date.now() + 60000; // Default to 1 minute if parsing fails
    }
  };

  const value: AuthContextType = {
    user,
    tokens,
    isAuthenticated: !!user && !!tokens,
    isLoading,
    login,
    logout,
    refreshAuth,
    updateUser,
    handleAPIError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
