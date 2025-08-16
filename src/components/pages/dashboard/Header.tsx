"use client";
import Input from "@/components/common/Input";
import { Search, LogOut, User, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";

const Header = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully", {
        description: "You have been logged out of your account",
        duration: 3000,
      });
    } catch (error) {
      toast.error("Logout failed", {
        description: "There was an issue logging you out",
        duration: 4000,
      });
    }
  };

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleDisplayName = (role: string) => {
    switch (role.toLowerCase()) {
      case "doctor":
        return "Physician";
      case "nurse":
        return "Nurse";
      case "patient":
        return "Patient";
      case "admin":
        return "Administrator";
      case "super_admin":
        return "System Administrator";
      default:
        return role;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <>
      <div className="w-[95%] mx-auto fixed right-0 left-0 rounded-sm px-4 py-1.5 min-h-12 bg-white shadow-gray-300 shadow-2xl top-3 z-10">
        <div className="w-full h-full flex items-center justify-between">
          <div className="w-90">
            <Input
              onChange={() => {}}
              containerClassName="rounded-full h-4 border-gray-400 border"
              placeholder="Search appointments..."
              icon={<Search color="grey" size={16} />}
            />
          </div>

          <div className="w-auto flex items-center justify-between gap-3 relative">
            <div
              className="flex items-center justify-between gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {getUserInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm text-black font-medium leading-4">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs font-semibold text-gray-400">
                  {getRoleDisplayName(user.role)}
                  {user.role === "DOCTOR" &&
                    user.specialty &&
                    ` • ${user.specialty}`}
                </p>
                {user.verificationStatus && (
                  <p className="text-xs text-gray-500 mt-1">
                    {user.verificationStatus === "VERIFIED"
                      ? "✅ Verified"
                      : "⏳ Pending Verification"}
                  </p>
                )}
              </div>
            </div>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user.email}
                  </p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                  {user.role === "DOCTOR" && user.specialty && (
                    <p className="text-xs text-gray-500 mt-1">
                      Specialty: {user.specialty}
                    </p>
                  )}
                  {user.medicalLicenseNumber && (
                    <p className="text-xs text-gray-500 mt-1">
                      License: {user.medicalLicenseNumber}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Status:{" "}
                    {user.verificationStatus === "VERIFIED"
                      ? "✅ Verified"
                      : "⏳ Pending"}
                  </p>
                </div>

                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => setShowUserMenu(false)}
                >
                  <User size={16} />
                  Profile
                </button>

                <button
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => setShowUserMenu(false)}
                >
                  <Settings size={16} />
                  Settings
                </button>

                <div className="border-t border-gray-100 mt-2 pt-2">
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay to close menu when clicking outside */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
};

export default Header;
