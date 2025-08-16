"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import ToastNotifications, {
  Toast,
  ToastType,
} from "@/components/common/ToastNotifications";

interface ToastContextType {
  showToast: (
    type: ToastType,
    title: string,
    message?: string,
    duration?: number
  ) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (
      type: ToastType,
      title: string,
      message?: string,
      duration: number = 5000
    ) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      // Auto-remove toast after duration
      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value: ToastContextType = {
    showToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastNotifications toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};
