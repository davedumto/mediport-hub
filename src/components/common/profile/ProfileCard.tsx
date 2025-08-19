"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Call, PenAdd, Trash } from "iconsax-reactjs";
import { Mail, MapPin, PenBox } from "lucide-react";
import Button from "../Button";
import { useState } from "react";
import EditProfileDialog from "../modals/EditProfileModal.component";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileUpdate } from "@/hooks/useProfileUpdate";

const ProfileCard = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { updateProfile, isUpdating } = useProfileUpdate();

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "U";
    return `${user.firstName?.charAt(0) || ""}${
      user.lastName?.charAt(0) || ""
    }`.toUpperCase();
  };

  // Calculate age from date of birth
  const calculateAge = () => {
    if (!user?.dateOfBirth) return "N/A";
    const birthDate = new Date(user.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      return age - 1;
    }
    return age;
  };

  // Get gender display
  const getGenderDisplay = () => {
    if (!user?.gender) return "Not specified";
    return (
      user.gender.charAt(0).toUpperCase() + user.gender.slice(1).toLowerCase()
    );
  };

  if (!user) {
    return (
      <div className="w-full p-10 bg-white rounded-lg shadow shadow-gray-50">
        <div className="text-center text-gray-500">Loading user profile...</div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full p-10 bg-white rounded-lg shadow shadow-gray-50">
        <div className="w-full flex items-center justify-between">
          <div className="flex-1 gap-5 flex items-start justify-between">
            <div className="w-[10%]">
              <Avatar
                style={{
                  width: 100,
                  height: 100,
                }}
              >
                <AvatarImage
                  src={user.avatarUrl || "https://github.com/shadcn.png"}
                />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl font-semibold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="w-[90%]">
              <div className="w-full flex items-center justify-start gap-3 mb-1">
                <div className="w-auto bg-blue-200 min-w-14 min-h-5 items-center justify-center flex rounded-full">
                  <p className="text-center text-xs text-blue-500 font-medium">
                    {getGenderDisplay()}
                  </p>
                </div>
                <p className="text-center text-xs text-gray-500 font-medium">
                  {calculateAge()} years
                </p>
                <p className="text-center text-xs text-gray-500 font-medium">
                  {user.role}
                </p>
              </div>

              <div className="w-full mt-4">
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center justify-start gap-2">
                    <Call variant="Bold" className="text-blue-500" size={16} />
                    <p className="text-center text-sm text-gray-500 font-medium">
                      {user.phone || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="w-full flex items-center justify-start gap-2 mt-1.5">
                  <Mail className="text-blue-500" size={16} />
                  <p className="text-center text-sm text-gray-500 font-medium">
                    {user.email}
                  </p>
                </div>
                <div className="w-full flex items-center justify-start gap-2 mt-1.5">
                  <MapPin className="text-blue-500" size={16} />
                  <p className="text-center text-sm text-gray-500 font-medium">
                    {user.verificationStatus === "VERIFIED"
                      ? "✅ Verified"
                      : "⏳ Pending Verification"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-5">
            <Button
              btnTitle="Edit profile"
              onClick={() => {
                setOpen(true);
              }}
              className="h-7 w-44 rounded-none"
              icon={<PenBox size={14} color="white" />}
            />
            <Button
              btnTitle="Delete account"
              onClick={() => {}}
              className="h-7 w-44 rounded-none bg-white border-red-500 border-1 hover:bg-white text-red-500"
              textClassName="text-xs"
              textColor="red"
              icon={<Trash size={14} color="red" />}
            />
          </div>
        </div>
      </div>
      <EditProfileDialog
        isOpen={open}
        onClose={() => {
          setOpen(false);
        }}
        defaultValues={{
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          gender: user.gender?.toLowerCase() as any,
          avatarUrl: user.avatarUrl,
        }}
        onSave={async (data) => {
          const profileData = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            gender: data.gender?.toUpperCase() as
              | "MALE"
              | "FEMALE"
              | "OTHER"
              | undefined,
          };

          const success = await updateProfile(profileData, data.avatarFile);
          if (success) {
            setOpen(false);
          }
        }}
      />
    </>
  );
};

export default ProfileCard;
