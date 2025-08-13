import Input from "@/components/common/Input";
import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
const Header = () => {
    return (
        <>
            <div className="w-[95%] mx-auto fixed right-0 left-0 rounded-sm px-4 py-1.5 min-h-12 bg-white shadow-gray-300 shadow-2xl top-3 z-10 " >
                <div className="w-full h-full flex items-center justify-between " >
                    <div className="w-90" >
                        <Input containerClassName=" rounded-full h-4 border-gray-400 border" placeholder="Search appointments..." icon={<Search color="grey" size={16} />} />
                    </div>

                    <div className="w-auto flex items-center justify-between gap-3" >
                        <Avatar>
                            <AvatarImage src="https://github.com/shadcn.png" />
                            <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                        <div className="flex-1" >
                            <p className="text-sm text-black font-medium leading-4" >Dr Sarah Johnson</p>
                            <p className=" text-xs font-semibold text-gray-400 " >Chief Physician</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Header;