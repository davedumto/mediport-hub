import { Calendar, Health } from "iconsax-reactjs";
import { FC } from "react";
import AppointmentItem from "./AppointmentItem";

const UpcomingAppointments = () => {
    const allergies = [
        {
            name: "Precllin"
        },
        {
            name: "Shemmail"
        },
    ]
    return (
        <>
            <div className="w-1/2 " >
                <div className="w-full flex items-center justify-start gap-1.5" >
                    <Calendar variant="Bold" className="text-blue-500" size={16} />
                    <p className="text-sm text-black font-semibold" >Upcoming Appointments</p>
                </div>
                <div className="w-full  mt-6 space-y-3 " >
                    {allergies.map((item, index) => (
                        <AppointmentItem {...item} key={index} />
                    ))}
                </div>

            </div>
        </>
    );
}

export default UpcomingAppointments;


