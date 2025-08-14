const AppointmentItem = () => {
    return (
        <>
            <div className="flex items-center justify-between bg-white shadow-gray-100 p-3 shadow-sm" >
                <div className=" flex-1 flex justify-start items-center gap-2" >
                    <p className="text-xs text-gray-400 font-regular" >Aug 14, 2025, 13:00AM</p>
                    <p className="text-xs text-black font-medium">Routine Checkup</p>
                    <p className="text-xs text-gray-400 font-regular">With Dr Mike</p>
                </div>

                <div className="" >
                    <div className={`w-auto bg-green-200 min-w-14 min-h-5 items-center justify-center flex  px-4 py-1  rounded-full`} >
                        <p className="text-center text-xs text-green-500 font-medium uppercase" >Confirmed</p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default AppointmentItem;