import type { Metadata } from "next";
export const metadata: Metadata = {
    title: "MediPort Hub",
    description: "Secure healthcare platform with GDPR compliance",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (

        <div className="w-full min-h-screen bg-white" >
            {children}
        </div>
    );
}
