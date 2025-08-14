"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Call, PenAdd, Trash } from "iconsax-reactjs";
import { Mail, MapPin, PenBox } from "lucide-react";
import Button from "../Button";
import { useState } from "react";
import EditProfileDialog from "../modals/EditProfileModal.component";


const ProfileCard = () => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <div className="w-full p-10 bg-white rounded-lg shadow shadow-gray-50" >



                <div className="w-full flex items-center justify-between" >
                    <div className="flex-1 gap-5 flex items-start justify-between" >
                        <div className="w-[10%]" >
                            <Avatar style={{
                                width: 100,
                                height: 100
                            }} >
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                        </div>

                        <div className="w-[90%]" >
                            <h2 className="text-2xl font-semibold text-black" >John Micheal</h2>
                            <div className="w-full flex items-center justify-start gap-3 mt-1" >
                                <div className="w-auto bg-blue-200 min-w-14 min-h-5 items-center justify-center flex   rounded-full" >
                                    <p className="text-center text-xs text-blue-500 font-medium" >Male</p>
                                </div>
                                <p className="text-center text-xs text-gray-500 font-medium" >40 years</p>
                                <p className="text-center text-xs text-gray-500 font-medium" >P-2007</p>
                            </div>

                            <div className="w-full mt-4" >
                                <div className="w-full flex items-center justify-between " >
                                    <div className=" flex items-center justify-start gap-2" >
                                        <Call variant="Bold" className="text-blue-500" size={16} />
                                        <p className="text-center text-sm text-gray-500 font-medium" >P-2007</p>
                                    </div>


                                </div>
                                <div className="w-full flex items-center justify-start gap-2 mt-1.5" >
                                    <Mail className="text-blue-500" size={16} />
                                    <p className="text-center text-sm text-gray-500 font-medium" >johnmicheal@gmail.com</p>
                                </div>
                                <div className="w-full flex items-center justify-start gap-2 mt-1.5" >
                                    <MapPin className="text-blue-500" size={16} />
                                    <p className="text-center text-sm text-gray-500 font-medium" >P-2007</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-5" >
                        <Button btnTitle="Edit profile" onClick={() => { setOpen(true) }} className="h-7 w-44 rounded-none" icon={<PenBox size={14} color="white" />} />
                        <Button btnTitle="Delete account" onClick={() => { }} className="h-7 w-44 rounded-none bg-white border-red-500 border-1 hover:bg-white  text-red-500" textClassName="text-xs" textColor="red" icon={<Trash size={14} color="red" />} />
                    </div>
                </div>
            </div>
            <EditProfileDialog isOpen={open} onClose={() => {
                setOpen(false)
            }} />
        </>
    );
}

export default ProfileCard;