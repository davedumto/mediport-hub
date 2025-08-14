"use client"
import Header from "@/components/pages/dashboard/Header";
import { useRouter } from "next/navigation";
import React, { useLayoutEffect } from "react";
type UserRole = "patient" | "doctor" | "nurse"
const DashboardLayout = ({
    children,
}: {
    children: React.ReactNode;
}) => {

    const userRole = "doctor" as UserRole;
    const router = useRouter();
    useLayoutEffect(() => {
        switch (userRole) {
            case "patient":
                router.push("/dashboard/patient");
                break;
            case "doctor":
                router.push("/dashboard/doctor");
                break;
            case "nurse":
                router.push("/dashboard/nurse");
                break;
            default:
                break;
        }
    }, [userRole]);
    return (
        <>
            <div className="w-full min-h-screen  bg-gray-100 " >
                <Header />
                <div className="w-full top-26 relative px-8" >
                    {children}
                </div>

            </div>
        </>
    );
}

export default DashboardLayout;