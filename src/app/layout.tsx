"use client";
import "./globals.css";
import { Provider } from "react-redux";
import { store } from "@/state-management/store";
import AuthProvider from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          <AuthProvider>
            <ToastProvider>
              {children}
              <Toaster
                position="bottom-left"
                richColors
                closeButton
                duration={5000}
              />
            </ToastProvider>
          </AuthProvider>
        </Provider>
      </body>
    </html>
  );
}
