import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
