import { Heart } from "iconsax-reactjs";
import { FC } from "react";

const HealthSummary = () => {
    const summaryData = [
        {
            title: "Blood Pressue",
            stat: "120/80"
        },
        {
            title: "Heart rate",
            stat: "7bpm"
        },
        {
            title: "Temperature",
            stat: "98.6c"
        },
        {
            title: "Weight",
            stat: "172 lb"
        },
    ]
    return (
        <>
            <div className="w-1/2" >
                <div className="w-full flex items-center justify-start gap-1.5" >
                    <Heart variant="Bulk" className="text-blue-500" size={16} />
                    <p className="text-sm text-black font-semibold" >Health Summary</p>
                </div>

                <div className="w-full flex items-center justify-between flex-wrap space-y-2.5 mt-6" >
                    {summaryData.map((item, index) => (
                        <HealthSummaryStatCard {...item} key={index} />
                    ))}
                </div>
            </div>
        </>
    );
}

export default HealthSummary;


const HealthSummaryStatCard: FC<{ title: string; stat: string }> = ({ title, stat }) => {
    return (
        <>
            <div className="w-[45%] bg-gray-100 rounded-lg py-4" >
                <p className="text-sm font-medium text-gray-400 text-center" >{title}</p>
                <p className="text-base mt-1 font-bold text-black text-center">{stat}</p>
            </div>
        </>
    )
}