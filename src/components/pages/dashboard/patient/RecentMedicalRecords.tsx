import { Document } from "iconsax-reactjs";
const RecentMedicalRecords = () => {
    return (
        <>
            <div className="w-1/2 " >
                <div className="w-full flex items-center justify-start gap-1.5" >
                    <Document variant="Bold" className="text-blue-500" size={16} />
                    <p className="text-sm text-black font-semibold" >Recent Medical Records</p>
                </div>
                <div className="w-full  mt-6  items-center justify-center " >
                    <p className="text-xs text-gray-500 text-left font-medium" >No medical records found</p>
                </div>

            </div>
        </>
    );
}

export default RecentMedicalRecords;

