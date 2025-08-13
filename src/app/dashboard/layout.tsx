"use client"
import Header from "@/components/pages/dashboard/Header";
import React from "react";
type UserRole = "patient" | "doctor" | "nurse"
const DashboardLayout = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const userRole: UserRole = "patient"
    return (
        <>
            <div className="w-full min-h-screen bg-white" >
                <Header />
                {children}
            </div>
        </>
    );
}

export default DashboardLayout;