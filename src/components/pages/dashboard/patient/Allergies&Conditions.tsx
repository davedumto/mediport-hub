import { Health } from "iconsax-reactjs";
import { FC } from "react";

const AllergiesAndConditions = () => {
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
                    <Health variant="Bold" className="text-blue-500" size={16} />
                    <p className="text-sm text-black font-semibold" >Allergies & Conditions</p>
                </div>
                <div className="w-full  mt-6 bg-white shadow-gray-100 p-5 shadow-sm " >
                    {allergies.map((item, index) => (
                        <AllergiesAndConditionsItem {...item} key={index} />
                    ))}
                </div>

            </div>
        </>
    );
}

export default AllergiesAndConditions;


const AllergiesAndConditionsItem: FC<{ name: string }> = ({ name }) => {
    return (
        <>
            <div className="w-full mb-2" >
                <p className="text-sm font-medium text-black text-left" >{name}</p>
            </div>
        </>
    )
}